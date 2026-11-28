import express from "express";
import request from "supertest";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../src/middleware/auth.middleware";
import { AI_RATE_LIMIT_PER_USER, aiRateLimiter } from "../src/middleware/aiRateLimiter";

function createApp() {
  const app = express();
  app.use((req, _res, next) => {
    (req as AuthenticatedRequest).user = {
      id: req.header("x-user-id") ?? "unknown-user",
      role: Role.Agent,
    };
    next();
  });
  app.post("/ai", aiRateLimiter, (_req, res) => {
    res.sendStatus(204);
  });
  return app;
}

function createUnauthenticatedIpApp() {
  const app = express();
  app.use((req, _res, next) => {
    const clientIp = req.header("x-test-client-ip");
    if (clientIp) {
      Object.defineProperty(req, "ip", {
        configurable: true,
        value: clientIp,
      });
    }
    next();
  });
  app.post("/ai", aiRateLimiter, (_req, res) => {
    res.sendStatus(204);
  });
  return app;
}

describe("AI per-user rate limit", () => {
  it("limits each authenticated user independently", async () => {
    const app = createApp();
    const userA = `agent-a-${Date.now()}`;
    const userB = `agent-b-${Date.now()}`;

    for (let attempt = 0; attempt < AI_RATE_LIMIT_PER_USER; attempt += 1) {
      await request(app).post("/ai").set("x-user-id", userA).expect(204);
    }

    const limited = await request(app)
      .post("/ai")
      .set("x-user-id", userA)
      .expect(429);
    expect(limited.body.error.code).toBe("AI_RATE_LIMITED");

    await request(app).post("/ai").set("x-user-id", userB).expect(204);
  });

  it("groups unauthenticated IPv6 addresses by their normalized subnet", async () => {
    const app = createUnauthenticatedIpApp();
    const addressA = "2001:db8:abcd:1201::1";
    const addressB = "2001:db8:abcd:12ff::1";
    const otherSubnetAddress = "2001:db8:abcd:1301::1";

    for (let attempt = 0; attempt < AI_RATE_LIMIT_PER_USER; attempt += 1) {
      const address = attempt % 2 === 0 ? addressA : addressB;
      await request(app)
        .post("/ai")
        .set("x-test-client-ip", address)
        .expect(204);
    }

    const limited = await request(app)
      .post("/ai")
      .set("x-test-client-ip", addressB)
      .expect(429);
    expect(limited.body.error.code).toBe("AI_RATE_LIMITED");

    await request(app)
      .post("/ai")
      .set("x-test-client-ip", otherSubnetAddress)
      .expect(204);
  });

  it("does not emit the express-rate-limit IPv6 key-generator warning", () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    try {
      jest.isolateModules(() => {
        require("../src/middleware/aiRateLimiter");
      });

      const logged = [
        ...errorSpy.mock.calls.flat(),
        ...warnSpy.mock.calls.flat(),
      ];
      expect(
        logged.some(
          (entry) =>
            typeof entry === "object" &&
            entry !== null &&
            "code" in entry &&
            entry.code === "ERR_ERL_KEY_GEN_IPV6"
        )
      ).toBe(false);
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});

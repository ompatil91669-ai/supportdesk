import request from "supertest";
import app from "../src/app";

describe("Swagger documentation", () => {
  it("serves the interactive UI at /docs", async () => {
    const response = await request(app).get("/docs").redirects(1).expect(200);
    expect(response.text).toContain("swagger-ui");
  });

  it("serves the actual OpenAPI document", async () => {
    const response = await request(app).get("/docs/openapi.json").expect(200);

    expect(Object.keys(response.body.paths).sort()).toEqual([
      "/auth/login",
      "/auth/register",
      "/health",
      "/tickets",
      "/tickets/{id}",
      "/tickets/{id}/ai/categorise",
      "/tickets/{id}/ai/suggest-reply",
      "/tickets/{id}/comments",
      "/users",
      "/users/agents",
      "/users/{id}",
    ]);
  });
});

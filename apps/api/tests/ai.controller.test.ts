import express from "express";
import request from "supertest";
import { Role } from "@prisma/client";
import { logAiUsage } from "../src/ai/diagnostics";
import { AI_LIMITS } from "../src/ai/guardrails";
import { AuthenticatedRequest } from "../src/middleware/auth.middleware";
import {
  postAiSuggestReply,
} from "../src/controllers/ai.controller";
import * as aiService from "../src/services/ai.service";

jest.mock("../src/config/env", () => ({
  env: { GEMINI_MODEL: "gemini-3.5-flash-lite" },
}));

jest.mock("../src/ai/diagnostics", () => ({
  logAiUsage: jest.fn(),
}));

jest.mock("../src/services/ai.service", () => ({
  prepareTicketAiContext: jest.fn(),
  createSuggestReplyStream: jest.fn(),
  categoriseTicket: jest.fn(),
  getSafeProviderErrorCode: jest.fn(() => "AI_PROVIDER_ERROR"),
  mapProviderError: jest.fn(),
}));

async function* makeStream(events: unknown[]) {
  for (const event of events) yield event;
}

function createApp() {
  const app = express();
  app.post("/tickets/:id/ai/suggest-reply", (req, res, next) => {
    (req as AuthenticatedRequest).user = {
      id: "agent-1",
      role: Role.Agent,
    };
    void postAiSuggestReply(req as AuthenticatedRequest, res, next);
  });
  return app;
}

describe("AI reply controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(aiService.prepareTicketAiContext).mockResolvedValue({
      ticket: {
        id: "TKT-101",
        name: "[REDACTED CUSTOMER NAME]",
        status: "Open",
        priority: "High",
      },
      publicComments: [],
    });
  });

  it("redacts sensitive text before returning a completed stream", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: { type: "text", text: "Contact me at private@example.test" },
        },
        { event_type: "interaction.completed" },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("[REDACTED_EMAIL]");
    expect(response.text).not.toContain("private@example.test");
    expect(response.text).toContain("event: complete");
    expect(logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" })
    );
  });

  it("discards valid thought-signature metadata without exposing it", async () => {
    const signature = "private-signature-data";
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: { type: "thought_signature", signature },
        },
        {
          event_type: "step.delta",
          delta: { type: "thought_signature" },
        },
        {
          event_type: "step.delta",
          delta: { type: "text", text: "Thanks for reaching out." },
        },
        { event_type: "interaction.completed" },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("Thanks for reaching out.");
    expect(response.text).not.toContain(signature);
    expect(JSON.stringify(jest.mocked(logAiUsage).mock.calls)).not.toContain(
      signature
    );
    expect(response.text).toContain("event: complete");
  });

  it("rejects malformed thought-signature metadata", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: { type: "thought_signature", signature: 123 },
        },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("AI_INVALID_STREAM");
    expect(response.text).toContain("AI unavailable — reply manually.");
    expect(response.text).not.toContain("123");
  });

  it("rejects malformed text deltas", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: { type: "text", text: 123 },
        },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("AI_INVALID_STREAM");
    expect(response.text).toContain("AI unavailable — reply manually.");
  });

  it("rejects unsupported non-text deltas", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: { type: "audio", data: "unsupported-payload" },
        },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("AI_INVALID_STREAM");
    expect(response.text).toContain("AI unavailable — reply manually.");
    expect(response.text).not.toContain("unsupported-payload");
  });

  it("rejects text deltas larger than the per-delta limit", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: {
            type: "text",
            text: "x".repeat(AI_LIMITS.maxDeltaChars + 1),
          },
        },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("AI_INVALID_STREAM");
    expect(response.text).toContain("AI unavailable — reply manually.");
    expect(response.text).not.toContain("x".repeat(100));
  });

  it("uses the exact manual fallback if a provider stream fails", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: { type: "text", text: "A partial draft" },
        },
        { event_type: "error", error: { message: "provider detail" } },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("AI unavailable — reply manually.");
    expect(response.text).not.toContain("provider detail");
    expect(logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" })
    );
  });

  it("does not mark an incomplete provider stream as successful", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream([
        {
          event_type: "step.delta",
          delta: { type: "text", text: "Partial text" },
        },
      ]) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("AI_STREAM_INTERRUPTED");
    expect(response.text).toContain("AI unavailable — reply manually.");
    expect(response.text).not.toContain("event: complete");
  });

  it("stops oversized drafts and returns the manual fallback", async () => {
    jest.mocked(aiService.createSuggestReplyStream).mockResolvedValue(
      makeStream(
        Array.from({ length: 5 }, () => ({
          event_type: "step.delta",
          delta: { type: "text", text: "x".repeat(1_000) },
        }))
      ) as never
    );

    const response = await request(createApp())
      .post("/tickets/TKT-101/ai/suggest-reply")
      .expect(200);

    expect(response.text).toContain("AI_OUTPUT_TOO_LONG");
    expect(response.text).toContain("AI unavailable — reply manually.");
    expect(response.text).not.toContain("event: complete");
  });
});

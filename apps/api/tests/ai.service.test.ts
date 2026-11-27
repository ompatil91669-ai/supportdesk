import { Role, TicketPriority, TicketStatus } from "database";
import * as ticketRepository from "../src/repositories/ticket.repository";
import * as commentRepository from "../src/repositories/comment.repository";
import { createGeminiClient } from "../src/ai/gemini";
import * as aiService from "../src/services/ai.service";

jest.mock("../src/repositories/ticket.repository", () => ({
  findTicketById: jest.fn(),
}));

jest.mock("../src/repositories/comment.repository", () => ({
  findCommentsByTicketId: jest.fn(),
}));

jest.mock("../src/ai/gemini", () => ({
  createGeminiClient: jest.fn(),
}));

const ticket = {
  id: "TKT-AI-1",
  name: "Cannot update account",
  email: "customer@example.test",
  status: TicketStatus.Open,
  priority: TicketPriority.High,
  userId: "customer-1",
  assigneeId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("AI service", () => {
  const tickets = jest.mocked(ticketRepository);
  const comments = jest.mocked(commentRepository);
  const gemini = jest.mocked(createGeminiClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prepares only public comment context for an accessible ticket", async () => {
    tickets.findTicketById.mockResolvedValue(ticket);
    comments.findCommentsByTicketId.mockResolvedValue([
      {
        id: "comment-1",
        content: "My account settings are missing",
        isInternal: false,
        ticketId: ticket.id,
        authorId: "customer-1",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        id: "comment-2",
        content: "Reset password steps",
        isInternal: true,
        ticketId: ticket.id,
        authorId: "agent-1",
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
        updatedAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);
    gemini.mockResolvedValue({} as never);

    const context = await aiService.prepareTicketAiContext(
      ticket.id,
      { id: "agent-1", role: Role.Agent }
    );

    expect(context.publicComments).toHaveLength(1);
    expect(context.publicComments[0].content).toBe(
      "My account settings are missing"
    );
  });

  it("returns a missing ticket in the existing error convention", async () => {
    tickets.findTicketById.mockResolvedValue(null);
    gemini.mockResolvedValue({} as never);

    await expect(
      aiService.prepareTicketAiContext(
        "missing",
        { id: "agent-1", role: Role.Agent }
      )
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "TICKET_NOT_FOUND",
    });
  });

  it("rejects insufficient ticket context", async () => {
    tickets.findTicketById.mockResolvedValue({
      ...ticket,
      name: "  ",
    });
    comments.findCommentsByTicketId.mockResolvedValue([]);
    gemini.mockResolvedValue({} as never);

    await expect(
      aiService.prepareTicketAiContext(
        ticket.id,
        { id: "agent-1", role: Role.Agent }
      )
    ).rejects.toMatchObject({
      statusCode: 422,
      code: "INSUFFICIENT_TICKET_CONTEXT",
    });
  });

  it("validates categorisation JSON strictly", async () => {
    gemini.mockResolvedValue({
      interactions: {
        create: jest.fn().mockResolvedValue({
          output_text: '{"category":"Account","priority":"High","extra":true}',
          usage: {
            total_input_tokens: 100,
            total_output_tokens: 20,
            total_tokens: 120,
          },
        }),
      },
    } as never);

    await expect(
      aiService.categoriseTicket({
        ticket: { id: ticket.id, name: ticket.name, status: "Open", priority: "High" },
        publicComments: [],
      })
    ).rejects.toMatchObject({
      statusCode: 502,
      code: "AI_INVALID_OUTPUT",
    });
  });

  it("returns a validated categorisation", async () => {
    gemini.mockResolvedValue({
      interactions: {
        create: jest.fn().mockResolvedValue({
          output_text: '{"category":"Account","priority":"High"}',
          usage: {
            total_input_tokens: 100,
            total_output_tokens: 20,
            total_tokens: 120,
          },
        }),
      },
    } as never);

    await expect(
      aiService.categoriseTicket({
        ticket: { id: ticket.id, name: ticket.name, status: "Open", priority: "High" },
        publicComments: [],
      })
    ).resolves.toEqual({
      category: "Account",
      priority: "High",
    });
  });

  it("maps quota exhaustion to a safe 429 error", () => {
    expect(aiService.mapProviderError({ status: 429 }).code).toBe(
      "AI_QUOTA_EXHAUSTED"
    );
  });
});

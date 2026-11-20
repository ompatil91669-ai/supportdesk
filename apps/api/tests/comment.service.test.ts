import { Comment, Role, Ticket, TicketPriority, TicketStatus } from "database";
import * as commentRepository from "../src/repositories/comment.repository";
import * as ticketRepository from "../src/repositories/ticket.repository";
import * as commentService from "../src/services/comment.service";

jest.mock("../src/repositories/comment.repository", () => ({
  createComment: jest.fn(),
  findCommentsByTicketId: jest.fn(),
}));
jest.mock("../src/repositories/ticket.repository", () => ({
  findTicketById: jest.fn(),
}));

const customer = { id: "customer-1", role: Role.Customer };
const agent = { id: "agent-1", role: Role.Agent };
const ticket: Ticket = {
  id: "TKT-1001",
  name: "Jamie Example",
  email: "jamie@example.test",
  status: TicketStatus.Open,
  priority: TicketPriority.Medium,
  userId: customer.id,
  assigneeId: agent.id,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};
const comment: Comment = {
  id: "00000000-0000-4000-8000-000000000001",
  content: "We are looking into this.",
  isInternal: false,
  ticketId: ticket.id,
  authorId: customer.id,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("comment service", () => {
  const comments = jest.mocked(commentRepository);
  const tickets = jest.mocked(ticketRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    tickets.findTicketById.mockResolvedValue(ticket);
  });

  it("creates a public comment on an accessible ticket", async () => {
    comments.createComment.mockResolvedValue(comment);

    await expect(
      commentService.addComment(ticket.id, { content: comment.content, isInternal: false }, customer)
    ).resolves.toBe(comment);
    expect(comments.createComment).toHaveBeenCalledWith(
      ticket.id,
      { content: comment.content, isInternal: false },
      customer
    );
  });

  it("allows an agent to create an internal comment", async () => {
    const internalComment = { ...comment, isInternal: true, authorId: agent.id };
    comments.createComment.mockResolvedValue(internalComment);

    await expect(
      commentService.addComment(
        ticket.id,
        { content: "Internal note", isInternal: true },
        agent
      )
    ).resolves.toBe(internalComment);
  });

  it("rejects internal comments from customers", async () => {
    await expect(
      commentService.addComment(
        ticket.id,
        { content: "Internal note", isInternal: true },
        customer
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
    expect(comments.createComment).not.toHaveBeenCalled();
  });

  it("does not create a comment for a missing or inaccessible ticket", async () => {
    tickets.findTicketById.mockResolvedValue(null);

    await expect(
      commentService.addComment(
        ticket.id,
        { content: "Hello", isInternal: false },
        customer
      )
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "TICKET_NOT_FOUND",
    });
    expect(comments.createComment).not.toHaveBeenCalled();
  });

  it("lists comments only after confirming ticket access", async () => {
    comments.findCommentsByTicketId.mockResolvedValue([comment]);

    await expect(commentService.getComments(ticket.id, customer)).resolves.toEqual([
      comment,
    ]);
    expect(tickets.findTicketById).toHaveBeenCalledWith(ticket.id, customer);
    expect(comments.findCommentsByTicketId).toHaveBeenCalledWith(
      ticket.id,
      customer
    );
  });

  it("does not list comments for a missing or inaccessible ticket", async () => {
    tickets.findTicketById.mockResolvedValue(null);

    await expect(
      commentService.getComments(ticket.id, customer)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "TICKET_NOT_FOUND",
    });
    expect(comments.findCommentsByTicketId).not.toHaveBeenCalled();
  });

  it("propagates repository failures", async () => {
    const failure = new Error("storage unavailable");
    comments.findCommentsByTicketId.mockRejectedValue(failure);

    await expect(commentService.getComments(ticket.id, customer)).rejects.toBe(
      failure
    );
  });
});

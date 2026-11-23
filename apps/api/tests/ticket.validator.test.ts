import {
  ticketQuerySchema,
  updateTicketSchema,
} from "../src/validators/ticket.validator";

describe("ticketQuerySchema", () => {
  it("uses safe defaults when pagination and sorting are omitted", () => {
    expect(ticketQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("rejects pagination values that cannot be represented safely", () => {
    expect(
      ticketQuerySchema.safeParse({ page: "9007199254740992" }).success
    ).toBe(false);
  });

  it("accepts assigning a ticket to an agent or clearing its assignment", () => {
    const agentId = "00000000-0000-4000-8000-000000000001";

    expect(updateTicketSchema.safeParse({ assigneeId: agentId }).success).toBe(true);
    expect(updateTicketSchema.safeParse({ assigneeId: null }).success).toBe(true);
    expect(updateTicketSchema.safeParse({ assigneeId: "not-a-uuid" }).success).toBe(false);
  });
});

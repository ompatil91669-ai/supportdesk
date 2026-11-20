import { ticketQuerySchema } from "../src/validators/ticket.validator";

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
});

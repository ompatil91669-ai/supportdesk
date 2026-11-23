const { createSeedTickets } = require("../database/prisma/seed") as {
  createSeedTickets: (
    customers: Array<{ id: string; email: string }>
  ) => Array<{ id: string; email: string; userId: string | null }>;
};

describe("sample ticket seed ownership", () => {
  it("assigns matching seeded tickets to existing customers", () => {
    const tickets = createSeedTickets([
      { id: "customer-1", email: "customer1@example.com" },
      { id: "customer-3", email: "customer3@example.com" },
    ]);

    expect(tickets).toHaveLength(50);
    expect(tickets[0]).toMatchObject({
      id: "TKT-SEED-001",
      userId: "customer-1",
    });
    expect(tickets[2]).toMatchObject({
      id: "TKT-SEED-003",
      userId: "customer-3",
    });
    expect(tickets[1].userId).toBeNull();
  });
});

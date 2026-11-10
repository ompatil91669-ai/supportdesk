import { generateTicketId } from "../src/ticketId";

describe("generateTicketId", () => {
  test("should generate a ticket ID starting with TKT", () => {
    const id = generateTicketId();
    expect(id.startsWith("TKT-")).toBe(true);
  });

  test("should contain today's date", () => {
    const id = generateTicketId();
    const today = new Date();
    const date = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    expect(id).toContain(date);
  });

  test("should contain a six-digit random number", () => {
    const id = generateTicketId();
    expect(id).toMatch(/TKT-\d{8}-\d{6}/);
  });

  test("should generate a string", () => {
    const id = generateTicketId();
    expect(typeof id).toBe("string");
  });
    test("should generate unique ticket IDs across multiple calls", () => {
    const ids = Array.from({ length: 20 }, () => generateTicketId());

    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(20);
  });
});
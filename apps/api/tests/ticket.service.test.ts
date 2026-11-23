import { Role, Ticket, TicketPriority, TicketStatus } from "database";
import * as ticketRepository from "../src/repositories/ticket.repository";
import * as userRepository from "../src/repositories/user.repository";
import * as ticketService from "../src/services/ticket.service";

jest.mock("../src/repositories/ticket.repository", () => ({
  findAllTickets: jest.fn(),
  findTicketById: jest.fn(),
  createTicket: jest.fn(),
  updateTicket: jest.fn(),
}));
jest.mock("../src/repositories/user.repository", () => ({
  findAgentById: jest.fn(),
}));

const customer = { id: "customer-1", role: Role.Customer };
const agent = { id: "agent-1", role: Role.Agent };
const admin = { id: "admin-1", role: Role.Admin };
const ticket: Ticket = {
  id: "TKT-1001",
  name: "Jamie Example",
  email: "jamie@example.test",
  status: TicketStatus.Open,
  priority: TicketPriority.High,
  userId: customer.id,
  assigneeId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("ticket service", () => {
  const repository = jest.mocked(ticketRepository);
  const users = jest.mocked(userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the default query arguments for ticket listings", async () => {
    const result = {
      tickets: [ticket],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    repository.findAllTickets.mockResolvedValue(result);

    await expect(ticketService.getAllTickets(customer)).resolves.toEqual(result);
    expect(repository.findAllTickets).toHaveBeenCalledWith(
      customer,
      1,
      10,
      undefined,
      undefined,
      undefined,
      undefined,
      "createdAt",
      "desc"
    );
  });

  it("forwards every validated filter and sort option", async () => {
    repository.findAllTickets.mockResolvedValue({
      tickets: [ticket],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });

    await ticketService.getAllTickets(
      customer,
      2,
      5,
      TicketStatus.Open,
      TicketPriority.High,
      "00000000-0000-4000-8000-000000000001",
      "jamie",
      "updatedAt",
      "asc"
    );

    expect(repository.findAllTickets).toHaveBeenCalledWith(
      customer,
      2,
      5,
      TicketStatus.Open,
      TicketPriority.High,
      "00000000-0000-4000-8000-000000000001",
      "jamie",
      "updatedAt",
      "asc"
    );
  });

  it("returns an accessible ticket", async () => {
    repository.findTicketById.mockResolvedValue(ticket);

    await expect(
      ticketService.getTicketById(ticket.id, customer)
    ).resolves.toBe(ticket);
    expect(repository.findTicketById).toHaveBeenCalledWith(ticket.id, customer);
  });

  it("reports an inaccessible or missing ticket as not found", async () => {
    repository.findTicketById.mockResolvedValue(null);

    await expect(
      ticketService.getTicketById(ticket.id, customer)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "TICKET_NOT_FOUND",
    });
  });

  it("creates a ticket for the authenticated owner", async () => {
    const input = {
      id: "TKT-1002",
      name: "Taylor Example",
      email: "taylor@example.test",
    };
    repository.createTicket.mockResolvedValue(ticket);

    await expect(ticketService.addTicket(input, customer)).resolves.toBe(ticket);
    expect(repository.createTicket).toHaveBeenCalledWith(input, customer);
  });

  it("lets a customer update non-status fields on an owned ticket", async () => {
    const update = { name: "Updated name" };
    repository.updateTicket.mockResolvedValue(ticket);

    await expect(
      ticketService.editTicket(ticket.id, update, customer)
    ).resolves.toBe(ticket);
    expect(repository.updateTicket).toHaveBeenCalledWith(
      ticket.id,
      update,
      customer
    );
  });

  it("lets an agent change ticket status", async () => {
    const update = { status: TicketStatus.Closed };
    repository.updateTicket.mockResolvedValue(ticket);

    await expect(
      ticketService.editTicket(ticket.id, update, agent)
    ).resolves.toBe(ticket);
    expect(repository.updateTicket).toHaveBeenCalledWith(
      ticket.id,
      update,
      agent
    );
  });

  it("lets an admin assign a ticket to an existing agent", async () => {
    const assignedTicket = { ...ticket, assigneeId: agent.id };
    users.findAgentById.mockResolvedValue({
      id: agent.id,
      name: "Support Agent",
      email: "agent@example.test",
      passwordHash: "unused-test-hash",
      role: Role.Agent,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    repository.updateTicket.mockResolvedValue(assignedTicket);

    await expect(
      ticketService.editTicket(ticket.id, { assigneeId: agent.id }, admin)
    ).resolves.toBe(assignedTicket);
    expect(users.findAgentById).toHaveBeenCalledWith(agent.id);
    expect(repository.updateTicket).toHaveBeenCalledWith(
      ticket.id,
      { assigneeId: agent.id },
      admin
    );
  });

  it("rejects assigning a ticket to a non-agent", async () => {
    users.findAgentById.mockResolvedValue(null);

    await expect(
      ticketService.editTicket(ticket.id, { assigneeId: "customer-1" }, admin)
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_ASSIGNEE",
    });
    expect(repository.updateTicket).not.toHaveBeenCalled();
  });

  it("prevents agents from assigning tickets", async () => {
    await expect(
      ticketService.editTicket(ticket.id, { assigneeId: "agent-2" }, agent)
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
    expect(users.findAgentById).not.toHaveBeenCalled();
    expect(repository.updateTicket).not.toHaveBeenCalled();
  });

  it("prevents customers from changing ticket status", async () => {
    await expect(
      ticketService.editTicket(
        ticket.id,
        { status: TicketStatus.Closed },
        customer
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
    expect(repository.updateTicket).not.toHaveBeenCalled();
  });

  it("reports an inaccessible or missing ticket on update", async () => {
    repository.updateTicket.mockResolvedValue(null);

    await expect(
      ticketService.editTicket(ticket.id, { name: "Updated" }, customer)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "TICKET_NOT_FOUND",
    });
  });
});

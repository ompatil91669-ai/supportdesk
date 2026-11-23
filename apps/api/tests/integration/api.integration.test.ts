import { randomUUID } from "crypto";
import type { Express } from "express";
import request from "supertest";
import { PrismaClient, Role, TicketPriority, TicketStatus } from "database";
import { getIsolatedTestDatabaseUrl } from "../helpers/testDatabase";

const describeWithTestDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithTestDatabase("SupportDesk API integration", () => {
  let app!: Express;
  let prisma!: PrismaClient;
  let customerId: string;
  let otherCustomerId: string;
  let agentId: string;
  let customerToken: string;
  let otherCustomerToken: string;
  let agentToken: string;
  let ticketIds: string[] = [];
  let fixtureUserIds: string[] = [];
  const prefix = `D11-${randomUUID()}`;
  const ticketOne = `${prefix}-1`;
  const ticketTwo = `${prefix}-2`;
  const ticketOther = `${prefix}-3`;

  beforeAll(async () => {
    process.env.DATABASE_URL = getIsolatedTestDatabaseUrl(
      process.env.TEST_DATABASE_URL
    );
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "supportdesk-test-secret-only-not-for-production";

    const database = await import("database");
    const jwt = await import("../../src/utils/jwt");
    const appModule = await import("../../src/app");

    prisma = new database.PrismaClient();
    app = appModule.default;
    await prisma.$connect();

    const customer = await prisma.user.create({
      data: {
        name: "Day 11 Customer",
        email: `${randomUUID()}@example.test`,
        passwordHash: "integration-test-only",
        role: Role.Customer,
      },
    });
    const otherCustomer = await prisma.user.create({
      data: {
        name: "Day 11 Other Customer",
        email: `${randomUUID()}@example.test`,
        passwordHash: "integration-test-only",
        role: Role.Customer,
      },
    });
    const agent = await prisma.user.create({
      data: {
        name: "Day 11 Agent",
        email: `${randomUUID()}@example.test`,
        passwordHash: "integration-test-only",
        role: Role.Agent,
      },
    });
    customerId = customer.id;
    fixtureUserIds.push(customer.id);
    otherCustomerId = otherCustomer.id;
    fixtureUserIds.push(otherCustomer.id);
    agentId = agent.id;
    fixtureUserIds.push(agent.id);
    customerToken = jwt.generateToken({
      userId: customer.id,
      role: Role.Customer,
    });
    otherCustomerToken = jwt.generateToken({
      userId: otherCustomer.id,
      role: Role.Customer,
    });
    agentToken = jwt.generateToken({ userId: agent.id, role: Role.Agent });

    const createdTickets = await Promise.all([
      prisma.ticket.create({
        data: {
          id: ticketOne,
          name: "Needle payment issue",
          email: "needle-one@example.test",
          status: TicketStatus.Open,
          priority: TicketPriority.High,
          userId: customer.id,
          assigneeId: agent.id,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      }),
      prisma.ticket.create({
        data: {
          id: ticketTwo,
          name: "Shipping question",
          email: "shipping@example.test",
          status: TicketStatus.Pending,
          priority: TicketPriority.Low,
          userId: customer.id,
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      }),
      prisma.ticket.create({
        data: {
          id: ticketOther,
          name: "Other customer's ticket",
          email: "other@example.test",
          status: TicketStatus.Open,
          priority: TicketPriority.Medium,
          userId: otherCustomer.id,
          assigneeId: agent.id,
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
          updatedAt: new Date("2026-01-03T00:00:00.000Z"),
        },
      }),
    ]);
    ticketIds = createdTickets.map(({ id }) => id);
  });

  afterAll(async () => {
    if (prisma) {
      if (ticketIds.length) {
        await prisma.comment.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
        await prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } });
      }
      if (fixtureUserIds.length) {
        await prisma.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
      }
      await prisma.$disconnect();
    }
  });

  it("serves health", async () => {
    await request(app).get("/health").expect(200);
  });

  it("rejects requests without a JWT", async () => {
    const response = await request(app).get("/tickets").expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns page data and pagination metadata", async () => {
    const response = await request(app)
      .get("/tickets?page=1&limit=1")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it("filters tickets by status", async () => {
    const response = await request(app)
      .get("/tickets?status=Open")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.map((ticket: { id: string }) => ticket.id)).toEqual([
      ticketOne,
    ]);
  });

  it("filters tickets by priority", async () => {
    const response = await request(app)
      .get("/tickets?priority=High")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.map((ticket: { id: string }) => ticket.id)).toEqual([
      ticketOne,
    ]);
  });

  it("filters tickets by assignee", async () => {
    const response = await request(app)
      .get(`/tickets?assigneeId=${agentId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.map((ticket: { id: string }) => ticket.id)).toEqual([
      ticketOne,
    ]);
  });

  it("searches only the fixture name and email fields", async () => {
    const response = await request(app)
      .get("/tickets?search=needle")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.map((ticket: { id: string }) => ticket.id)).toEqual([
      ticketOne,
    ]);
  });

  it("sorts results by the requested allowed field and direction", async () => {
    const response = await request(app)
      .get("/tickets?sortBy=createdAt&sortOrder=asc")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.map((ticket: { id: string }) => ticket.id)).toEqual([
      ticketOne,
      ticketTwo,
    ]);
  });

  it("rejects invalid query parameters", async () => {
    const response = await request(app)
      .get("/tickets?limit=101")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("scopes customer listing to owned tickets", async () => {
    const response = await request(app)
      .get("/tickets")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body.data.map((ticket: { userId: string }) => ticket.userId))
      .toEqual([customerId, customerId]);
  });

  it("does not expose another customer's ticket by ID", async () => {
    const response = await request(app)
      .get(`/tickets/${ticketOther}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("TICKET_NOT_FOUND");
  });

  it("allows agents to list tickets across customer accounts", async () => {
    const response = await request(app)
      .get("/tickets")
      .set("Authorization", `Bearer ${agentToken}`)
      .expect(200);

    expect(response.body.meta.total).toBe(3);
  });

  it("allows agents to change ticket status and forbids customers", async () => {
    const customerResponse = await request(app)
      .patch(`/tickets/${ticketOne}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: TicketStatus.Closed })
      .expect(403);

    expect(customerResponse.body.error.code).toBe("FORBIDDEN");
    expect(
      (await prisma.ticket.findUniqueOrThrow({ where: { id: ticketOne } }))
        .status
    ).toBe(TicketStatus.Open);

    const agentResponse = await request(app)
      .patch(`/tickets/${ticketOne}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ status: TicketStatus.Pending })
      .expect(200);

    expect(agentResponse.body.data.status).toBe(TicketStatus.Pending);
  });

  it("creates comments with the authenticated author, not the supplied author", async () => {
    const response = await request(app)
      .post(`/tickets/${ticketOne}/comments`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        content: "Public reply",
        authorId: otherCustomerId,
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      content: "Public reply",
      isInternal: false,
      ticketId: ticketOne,
      authorId: customerId,
    });
  });

  it("prevents customers from creating internal comments", async () => {
    const response = await request(app)
      .post(`/tickets/${ticketOne}/comments`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ content: "Private", isInternal: true })
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("allows agents to create internal comments", async () => {
    const response = await request(app)
      .post(`/tickets/${ticketOne}/comments`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ content: "Internal note", isInternal: true })
      .expect(201);

    expect(response.body.data).toMatchObject({
      isInternal: true,
      authorId: agentId,
    });
  });

  it("hides internal comments from customers and returns them to agents", async () => {
    await prisma.comment.create({
      data: {
        content: "Internal fixture",
        isInternal: true,
        ticketId: ticketOne,
        authorId: agentId,
      },
    });

    const customerComments = await request(app)
      .get(`/tickets/${ticketOne}/comments`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    const agentComments = await request(app)
      .get(`/tickets/${ticketOne}/comments`)
      .set("Authorization", `Bearer ${agentToken}`)
      .expect(200);

    expect(customerComments.body.data.every(
      (comment: { isInternal: boolean }) => !comment.isInternal
    )).toBe(true);
    expect(agentComments.body.data.some(
      (comment: { isInternal: boolean }) => comment.isInternal
    )).toBe(true);
  });

  it("rejects invalid comments and comments on missing tickets", async () => {
    const invalid = await request(app)
      .post(`/tickets/${ticketOne}/comments`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ content: " " })
      .expect(400);
    const missing = await request(app)
      .post(`/tickets/${prefix}-missing/comments`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ content: "Hello" })
      .expect(404);

    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");
    expect(missing.body.error.code).toBe("TICKET_NOT_FOUND");
  });
});

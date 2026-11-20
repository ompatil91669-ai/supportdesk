const errorResponse = {
  description: "Error response",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
      example: {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
        },
        meta: {},
      },
    },
  },
};

const ticketSuccessResponse = {
  description: "Ticket response",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/TicketEnvelope" },
    },
  },
};

const security = [{ bearerAuth: [] }];

export function createSwaggerDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "SupportDesk API",
      version: "1.0.0",
      description:
        "Ticket management API. Customer accounts can access their own tickets; Agents can access all tickets.",
    },
    servers: [{ url: "/", description: "Current API host" }],
    tags: [
      { name: "Health" },
      { name: "Authentication" },
      { name: "Tickets" },
      { name: "Comments" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Supply the access token returned by /auth/login.",
        },
      },
      schemas: {
        ErrorEnvelope: {
          type: "object",
          required: ["data", "error", "meta"],
          properties: {
            data: { nullable: true, type: "object", example: null },
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string", example: "TICKET_NOT_FOUND" },
                message: { type: "string", example: "Ticket not found" },
              },
            },
            meta: { type: "object", example: {} },
          },
        },
        Ticket: {
          type: "object",
          required: [
            "id",
            "name",
            "email",
            "status",
            "priority",
            "userId",
            "assigneeId",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { type: "string", example: "TKT-1001" },
            name: { type: "string", example: "Jamie Example" },
            email: { type: "string", format: "email", example: "jamie@example.test" },
            status: { type: "string", enum: ["Open", "Closed", "Pending"] },
            priority: { type: "string", enum: ["Low", "Medium", "High"] },
            userId: { type: "string", format: "uuid", nullable: true },
            assigneeId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TicketEnvelope: {
          type: "object",
          required: ["data", "error", "meta"],
          properties: {
            data: { $ref: "#/components/schemas/Ticket" },
            error: { nullable: true, example: null },
            meta: { type: "object", example: {} },
          },
        },
        TicketListEnvelope: {
          type: "object",
          required: ["data", "error", "meta"],
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Ticket" },
            },
            error: { nullable: true, example: null },
            meta: {
              type: "object",
              required: ["page", "limit", "total", "totalPages"],
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                total: { type: "integer", example: 23 },
                totalPages: { type: "integer", example: 3 },
              },
            },
          },
        },
        Comment: {
          type: "object",
          required: [
            "id",
            "content",
            "isInternal",
            "ticketId",
            "authorId",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            content: { type: "string", example: "I can help with that." },
            isInternal: { type: "boolean", example: false },
            ticketId: { type: "string", example: "TKT-1001" },
            authorId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CommentEnvelope: {
          type: "object",
          required: ["data", "error", "meta"],
          properties: {
            data: { $ref: "#/components/schemas/Comment" },
            error: { nullable: true, example: null },
            meta: { type: "object", example: {} },
          },
        },
        CommentListEnvelope: {
          type: "object",
          required: ["data", "error", "meta"],
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Comment" },
            },
            error: { nullable: true, example: null },
            meta: { type: "object", example: {} },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Check API health",
          responses: {
            "200": {
              description: "API is available",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: { status: { type: "string", example: "ok" } },
                      },
                      error: { nullable: true, example: null },
                      meta: { type: "object", example: {} },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a customer",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8, maxLength: 128 },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Customer registered",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          role: { type: "string", enum: ["Customer"] },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                      error: { nullable: true, example: null },
                      meta: { type: "object", example: {} },
                    },
                  },
                },
              },
            },
            "400": errorResponse,
            "409": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 1 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "JWT access token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          token: { type: "string" },
                          tokenType: { type: "string", example: "Bearer" },
                          expiresIn: { type: "integer", example: 3600 },
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              role: { type: "string", enum: ["Customer", "Agent"] },
                            },
                          },
                        },
                      },
                      error: { nullable: true, example: null },
                      meta: { type: "object", example: {} },
                    },
                  },
                },
              },
            },
            "400": errorResponse,
            "401": errorResponse,
            "429": { description: "Too many login attempts" },
            "500": errorResponse,
          },
        },
      },
      "/tickets": {
        get: {
          tags: ["Tickets"],
          summary: "List tickets",
          description:
            "Customers see only their own tickets. Agents see all tickets. Search checks name and email.",
          security,
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["Open", "Closed", "Pending"] },
            },
            {
              name: "priority",
              in: "query",
              schema: { type: "string", enum: ["Low", "Medium", "High"] },
            },
            {
              name: "assigneeId",
              in: "query",
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "search",
              in: "query",
              description: "Case-insensitive match against ticket name or email.",
              schema: { type: "string", minLength: 1, maxLength: 100 },
            },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["createdAt", "updatedAt", "name", "status", "priority"],
                default: "createdAt",
              },
            },
            {
              name: "sortOrder",
              in: "query",
              schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            },
          ],
          responses: {
            "200": {
              description: "Paginated tickets",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TicketListEnvelope" },
                },
              },
            },
            "400": errorResponse,
            "401": errorResponse,
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Tickets"],
          summary: "Create a ticket",
          description:
            "The authenticated user becomes the ticket owner. Status and priority use the schema defaults when omitted.",
          security,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "name", "email"],
                  properties: {
                    id: { type: "string", minLength: 1, example: "TKT-1001" },
                    name: { type: "string", minLength: 1 },
                    email: { type: "string", format: "email" },
                    status: { type: "string", enum: ["Open", "Closed", "Pending"] },
                    priority: { type: "string", enum: ["Low", "Medium", "High"] },
                  },
                },
              },
            },
          },
          responses: {
            "201": ticketSuccessResponse,
            "400": errorResponse,
            "401": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/tickets/{id}": {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1 },
          },
        ],
        get: {
          tags: ["Tickets"],
          summary: "Get a ticket",
          description: "Customers can access their own tickets; Agents can access any ticket.",
          security,
          responses: {
            "200": ticketSuccessResponse,
            "400": errorResponse,
            "401": errorResponse,
            "404": errorResponse,
            "500": errorResponse,
          },
        },
        patch: {
          tags: ["Tickets"],
          summary: "Update a ticket",
          description: "Only supplied fields are updated; at least one field is required.",
          security,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  minProperties: 1,
                  properties: {
                    name: { type: "string", minLength: 1 },
                    email: { type: "string", format: "email" },
                    status: { type: "string", enum: ["Open", "Closed", "Pending"] },
                    priority: { type: "string", enum: ["Low", "Medium", "High"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": ticketSuccessResponse,
            "400": errorResponse,
            "401": errorResponse,
            "404": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/tickets/{id}/comments": {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1 },
          },
        ],
        get: {
          tags: ["Comments"],
          summary: "List ticket comments",
          description:
            "Customers receive public comments only. Agents can see public and internal comments.",
          security,
          responses: {
            "200": {
              description: "Comments visible to the authenticated user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CommentListEnvelope" },
                },
              },
            },
            "400": errorResponse,
            "401": errorResponse,
            "404": errorResponse,
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Comments"],
          summary: "Create a ticket comment",
          description:
            "Author identity is taken from the JWT. Customers may create public comments; only Agents may create internal comments.",
          security,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content"],
                  properties: {
                    content: { type: "string", minLength: 1, maxLength: 2000 },
                    isInternal: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Comment created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CommentEnvelope" },
                },
              },
            },
            "400": errorResponse,
            "401": errorResponse,
            "403": errorResponse,
            "404": errorResponse,
            "500": errorResponse,
          },
        },
      },
    },
  } as const;
}

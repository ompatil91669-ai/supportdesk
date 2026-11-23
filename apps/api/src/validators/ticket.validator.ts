
import { z } from "zod";

export const createTicketSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  status: z.enum(["Open", "Closed", "Pending"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
});

export const updateTicketSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    status: z.enum(["Open", "Closed", "Pending"]).optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(),
    assigneeId: z.uuid().nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required for update"
  );

// Day 11: Pagination, Filtering, Search and Sorting
export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z.enum(["Open", "Closed", "Pending"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  assigneeId: z.string().uuid().optional(),

  search: z.string().trim().min(1).max(100).optional(),

  sortBy: z
    .enum(["createdAt", "updatedAt", "name", "status", "priority"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;

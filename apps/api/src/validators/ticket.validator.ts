import { z } from "zod";

export const createTicketSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  status: z.enum(["Open", "Closed", "Pending"]).optional(),
});

export const updateTicketSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    status: z.enum(["Open", "Closed", "Pending"]).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required for update"
  );

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

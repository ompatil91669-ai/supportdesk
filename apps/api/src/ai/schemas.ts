import { z } from "zod";

export const categoriseTicketResultSchema = z
  .object({
    category: z.enum(["Technical", "Billing", "Account", "General", "Other"]),
    priority: z.enum(["Low", "Medium", "High"]),
  })
  .strict();

export type CategoriseTicketResult = z.infer<
  typeof categoriseTicketResultSchema
>;

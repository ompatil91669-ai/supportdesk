import { z } from "zod";
import { Role } from "database";

const userRoleSchema = z.enum(Role);

export const createManagedUserSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  role: userRoleSchema,
});

export const updateManagedUserSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.email().trim().toLowerCase().optional(),
    role: userRoleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type CreateManagedUserInput = z.infer<typeof createManagedUserSchema>;
export type UpdateManagedUserInput = z.infer<typeof updateManagedUserSchema>;

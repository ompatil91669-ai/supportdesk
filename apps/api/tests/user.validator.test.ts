import { Role } from "database";
import {
  createManagedUserSchema,
  updateManagedUserSchema,
} from "../src/validators/user.validator";

describe("managed user validation", () => {
  it("accepts each supported role on account creation", () => {
    for (const role of [Role.Customer, Role.Agent, Role.Admin]) {
      expect(
        createManagedUserSchema.safeParse({
          name: "Support User",
          email: "support@example.test",
          password: "long-password",
          role,
        }).success
      ).toBe(true);
    }
  });

  it("rejects password hashes and unsupported fields", () => {
    expect(
      createManagedUserSchema.safeParse({
        name: "Support User",
        email: "support@example.test",
        password: "long-password",
        role: Role.Agent,
        passwordHash: "must-not-be-accepted",
      }).success
    ).toBe(false);
  });

  it("requires a non-empty update and validates partial edits", () => {
    expect(updateManagedUserSchema.safeParse({}).success).toBe(false);
    expect(updateManagedUserSchema.safeParse({ role: Role.Agent }).success).toBe(true);
    expect(updateManagedUserSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

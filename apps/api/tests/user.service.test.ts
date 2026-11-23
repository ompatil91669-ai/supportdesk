import bcrypt from "bcryptjs";
import { Role } from "database";
import * as userRepository from "../src/repositories/user.repository";
import * as userService from "../src/services/user.service";

jest.mock("../src/repositories/user.repository", () => ({
  findAssignableAgents: jest.fn(),
  findManagedUsers: jest.fn(),
  findManagedUserById: jest.fn(),
  createManagedUser: jest.fn(),
  updateManagedUser: jest.fn(),
  deleteManagedUser: jest.fn(),
  countAdmins: jest.fn(),
}));

const adminUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Support Admin",
  email: "admin@example.test",
  role: Role.Admin,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("user service", () => {
  const users = jest.mocked(userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates managed accounts with a bcrypt password hash", async () => {
    users.createManagedUser.mockResolvedValue(adminUser);

    await expect(
      userService.createManagedUser({
        name: adminUser.name,
        email: adminUser.email,
        password: "example-password",
        role: Role.Admin,
      })
    ).resolves.toBe(adminUser);

    const [createInput] = users.createManagedUser.mock.calls[0];
    expect(createInput).toMatchObject({
      name: adminUser.name,
      email: adminUser.email,
      role: Role.Admin,
    });
    expect(await bcrypt.compare("example-password", createInput.passwordHash)).toBe(true);
    expect(createInput.passwordHash).not.toBe("example-password");
  });

  it("prevents demoting the last Admin", async () => {
    users.findManagedUserById.mockResolvedValue(adminUser);
    users.countAdmins.mockResolvedValue(1);

    await expect(
      userService.updateManagedUser(adminUser.id, "another-admin", {
        role: Role.Agent,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "LAST_ADMIN",
    });
    expect(users.updateManagedUser).not.toHaveBeenCalled();
  });

  it("prevents deleting the last Admin", async () => {
    users.findManagedUserById.mockResolvedValue(adminUser);
    users.countAdmins.mockResolvedValue(1);

    await expect(
      userService.deleteManagedUser(adminUser.id, "another-admin")
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "LAST_ADMIN",
    });
    expect(users.deleteManagedUser).not.toHaveBeenCalled();
  });

  it("prevents an Admin from deleting their own account", async () => {
    await expect(
      userService.deleteManagedUser(adminUser.id, adminUser.id)
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
    expect(users.findManagedUserById).not.toHaveBeenCalled();
  });

  it("deletes an account while preserving related history through the repository", async () => {
    const customer = { ...adminUser, role: Role.Customer };
    users.findManagedUserById.mockResolvedValue(customer);
    users.deleteManagedUser.mockResolvedValue({ count: 1 });

    await expect(
      userService.deleteManagedUser(customer.id, "admin-2")
    ).resolves.toEqual({ id: customer.id });
    expect(users.deleteManagedUser).toHaveBeenCalledWith(customer.id);
  });
});

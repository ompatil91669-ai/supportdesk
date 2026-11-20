import bcrypt from "bcryptjs";
import { Role } from "database";
import * as userRepository from "../src/repositories/user.repository";
import * as authService from "../src/services/auth.service";
import { generateToken } from "../src/utils/jwt";

jest.mock("../src/repositories/user.repository", () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));
jest.mock("../src/utils/jwt", () => ({
  generateToken: jest.fn(),
}));

const user = {
  id: "user-1",
  name: "Jamie Example",
  email: "jamie@example.test",
  passwordHash: "hashed-password",
  role: Role.Customer,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("authentication service", () => {
  const users = jest.mocked(userRepository);
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash("correct-password", 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers a customer without returning the password hash", async () => {
    users.findUserByEmail.mockResolvedValue(null);
    users.createUser.mockResolvedValue(user);

    await expect(
      authService.registerUser({
        name: user.name,
        email: user.email,
        password: "password-123",
      })
    ).resolves.toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
    expect(users.createUser).toHaveBeenCalledWith(expect.objectContaining({
      name: user.name,
      email: user.email,
      passwordHash: expect.any(String),
    }));
  });

  it("rejects an already registered email", async () => {
    users.findUserByEmail.mockResolvedValue(user);

    await expect(
      authService.registerUser({
        name: user.name,
        email: user.email,
        password: "password-123",
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it("maps a duplicate-email race from the repository to a conflict", async () => {
    users.findUserByEmail.mockResolvedValue(null);
    users.createUser.mockRejectedValue(
      Object.assign(new Error("unique violation"), { code: "P2002" })
    );

    await expect(
      authService.registerUser({
        name: user.name,
        email: user.email,
        password: "password-123",
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });
  });

  it("propagates non-duplicate registration failures", async () => {
    const failure = new Error("storage unavailable");
    users.findUserByEmail.mockResolvedValue(null);
    users.createUser.mockRejectedValue(failure);

    await expect(
      authService.registerUser({
        name: user.name,
        email: user.email,
        password: "password-123",
      })
    ).rejects.toBe(failure);
  });

  it("rejects login when the account does not exist", async () => {
    users.findUserByEmail.mockResolvedValue(null);

    await expect(
      authService.loginUser({ email: user.email, password: "wrong" })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("rejects login when the password does not match", async () => {
    users.findUserByEmail.mockResolvedValue({
      ...user,
      passwordHash: validPasswordHash,
    });

    await expect(
      authService.loginUser({ email: user.email, password: "wrong-password" })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("returns a bearer token and safe user fields on successful login", async () => {
    users.findUserByEmail.mockResolvedValue({
      ...user,
      passwordHash: validPasswordHash,
    });
    jest.mocked(generateToken).mockReturnValue("test.jwt.token");

    await expect(
      authService.loginUser({
        email: user.email,
        password: "correct-password",
      })
    ).resolves.toEqual({
      token: "test.jwt.token",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: Role.Customer,
      },
    });
  });
});

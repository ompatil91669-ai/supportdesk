
import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/user.repository";
import {
  RegisterInput,
  LoginInput,
} from "../validators/auth.validator";
import { AppError } from "../middleware/errorHandler";
import { generateToken } from "../utils/jwt";

// Register new customer
export async function registerUser(data: RegisterInput) {
  const existingUser = await userRepository.findUserByEmail(data.email);

  if (existingUser) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "Email is already registered"
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await userRepository.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  } catch (error) {
    // Handle duplicate email race conditions
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "Email is already registered"
      );
    }

    throw error;
  }
}

// Login existing user
export async function loginUser(data: LoginInput) {
  const user = await userRepository.findUserByEmail(data.email);

  if (!user) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password"
    );
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password"
    );
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

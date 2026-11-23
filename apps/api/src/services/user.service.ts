import bcrypt from "bcryptjs";
import { Role } from "database";
import { AppError } from "../middleware/errorHandler";
import * as userRepository from "../repositories/user.repository";
import {
  CreateManagedUserInput,
  UpdateManagedUserInput,
} from "../validators/user.validator";

export function getAssignableAgents() {
  return userRepository.findAssignableAgents();
}

export function getManagedUsers() {
  return userRepository.findManagedUsers();
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function ensureAnotherAdminRemains(): Promise<void> {
  if ((await userRepository.countAdmins()) <= 1) {
    throw new AppError(
      409,
      "LAST_ADMIN",
      "The last Admin account cannot be demoted or deleted"
    );
  }
}

export async function createManagedUser(data: CreateManagedUserInput) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    return await userRepository.createManagedUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
    }

    throw error;
  }
}

export async function updateManagedUser(
  id: string,
  actorId: string,
  data: UpdateManagedUserInput
) {
  const currentUser = await userRepository.findManagedUserById(id);

  if (!currentUser) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  if (id === actorId && data.role && data.role !== Role.Admin) {
    throw new AppError(403, "FORBIDDEN", "You cannot change your own Admin role");
  }

  if (
    currentUser.role === Role.Admin &&
    data.role !== undefined &&
    data.role !== Role.Admin
  ) {
    await ensureAnotherAdminRemains();
  }

  try {
    return await userRepository.updateManagedUser(id, data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
    }

    throw error;
  }
}

export async function deleteManagedUser(id: string, actorId: string) {
  if (id === actorId) {
    throw new AppError(403, "FORBIDDEN", "You cannot delete your own account");
  }

  const user = await userRepository.findManagedUserById(id);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  if (user.role === Role.Admin) {
    await ensureAnotherAdminRemains();
  }

  const result = await userRepository.deleteManagedUser(id);

  if (result.count === 0) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return { id };
}

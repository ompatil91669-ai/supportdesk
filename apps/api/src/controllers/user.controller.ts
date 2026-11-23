import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler";
import * as userService from "../services/user.service";
import { successResponse } from "../utils/response";
import {
  createManagedUserSchema,
  updateManagedUserSchema,
} from "../validators/user.validator";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

function getUserId(req: Request): string {
  const { id } = req.params;

  if (typeof id !== "string" || !id.trim()) {
    throw new AppError(400, "INVALID_USER_ID", "Invalid user ID");
  }

  return id;
}

function getAdminId(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  return req.user.id;
}

export async function getAssignableAgents(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const agents = await userService.getAssignableAgents();
    successResponse(res, agents);
  } catch (error) {
    next(error);
  }
}

export async function getManagedUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    successResponse(res, await userService.getManagedUsers());
  } catch (error) {
    next(error);
  }
}

export async function createManagedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createManagedUserSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid user data");
    }

    successResponse(res, await userService.createManagedUser(parsed.data), 201);
  } catch (error) {
    next(error);
  }
}

export async function updateManagedUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateManagedUserSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid user data");
    }

    const user = await userService.updateManagedUser(
      getUserId(req),
      getAdminId(req),
      parsed.data
    );
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function deleteManagedUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await userService.deleteManagedUser(
      getUserId(req),
      getAdminId(req)
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

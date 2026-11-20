import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import * as userRepository from "../repositories/user.repository";
import { AppError } from "./errorHandler";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

// Verify JWT and authenticate user
export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication token is required"
      );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication token is required"
      );
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(
        401,
        "INVALID_TOKEN",
        "Invalid or expired authentication token"
      );
    }

    const user = await userRepository.findUserById(payload.userId);

    if (!user) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "User account not found"
      );
    }

    // Use the current database role instead of trusting an old token role.
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Allow access only to specified roles
export function requireRole(...allowedRoles: Role[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(
        new AppError(
          401,
          "UNAUTHORIZED",
          "Authentication required"
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "FORBIDDEN",
          "You do not have permission to access this resource"
        )
      );
    }

    next();
  };
}
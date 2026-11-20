import { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator";
import {
  registerUser,
  loginUser,
} from "../services/auth.service";
import { successResponse } from "../utils/response";
import { AppError } from "../middleware/errorHandler";

// Register Controller
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid registration data"
      );
    }

    const user = await registerUser(result.data);
    successResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
}

// Login Controller
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid login data"
      );
    }

    const loginResult = await loginUser(result.data);
    successResponse(res, loginResult, 200);
  } catch (error) {
    next(error);
  }
}
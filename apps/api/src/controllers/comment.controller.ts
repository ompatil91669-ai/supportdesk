
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/errorHandler";
import { createCommentSchema } from "../validators/comment.validator";
import * as commentService from "../services/comment.service";
import { successResponse } from "../utils/response";

function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication required"
    );
  }

  return req.user;
}

function getTicketId(req: AuthenticatedRequest): string {
  const ticketId = req.params.id;

  if (typeof ticketId !== "string" || !ticketId.trim()) {
    throw new AppError(
      400,
      "INVALID_TICKET_ID",
      "Invalid ticket ID"
    );
  }

  return ticketId;
}

// POST /tickets/:id/comments
export async function postComment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);
    const ticketId = getTicketId(req);

    const parsed = createCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid comment data"
      );
    }

    const comment = await commentService.addComment(
      ticketId,
      parsed.data,
      user
    );

    successResponse(res, comment, 201);
  } catch (error) {
    next(error);
  }
}

// GET /tickets/:id/comments
export async function getComments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);
    const ticketId = getTicketId(req);

    const comments = await commentService.getComments(
      ticketId,
      user
    );

    successResponse(res, comments);
  } catch (error) {
    next(error);
  }
}

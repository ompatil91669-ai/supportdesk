import { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticket.service";
import { successResponse } from "../utils/response";
import {
  createTicketSchema,
  updateTicketSchema,
} from "../validators/ticket.validator";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

function getTicketId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    throw new AppError(
      400,
      "INVALID_TICKET_ID",
      "Invalid ticket ID"
    );
  }

  return id;
}

// Get authenticated user
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

// GET /tickets
export async function getTickets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);

    const tickets = await ticketService.getAllTickets(user);

    successResponse(res, tickets);
  } catch (error) {
    next(error);
  }
}

// GET /tickets/:id
export async function getTicket(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);

    const ticket = await ticketService.getTicketById(
      getTicketId(req),
      user
    );

    successResponse(res, ticket);
  } catch (error) {
    next(error);
  }
}

// POST /tickets
export async function postTicket(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);

    const result = createTicketSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid ticket data"
      );
    }

    const ticket = await ticketService.addTicket(
      result.data,
      user
    );

    successResponse(res, ticket, 201);
  } catch (error) {
    next(error);
  }
}

// PATCH /tickets/:id
export async function patchTicket(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);

    const result = updateTicketSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid ticket data"
      );
    }

    const ticket = await ticketService.editTicket(
      getTicketId(req),
      result.data,
      user
    );

    successResponse(res, ticket);
  } catch (error) {
    next(error);
  }
}
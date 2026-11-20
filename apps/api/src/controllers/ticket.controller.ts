
import { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticket.service";
import { successResponse } from "../utils/response";
import {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
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

export async function getTickets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);

    const parsed = ticketQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid ticket query parameters"
      );
    }

    const {
      page,
      limit,
      status,
      priority,
      assigneeId,
      search,
      sortBy,
      sortOrder,
    } = parsed.data;

    const result = await ticketService.getAllTickets(
      user,
      page,
      limit,
      status,
      priority,
      assigneeId,
      search,
      sortBy,
      sortOrder
    );

    res.status(200).json({
      data: result.tickets,
      error: null,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

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
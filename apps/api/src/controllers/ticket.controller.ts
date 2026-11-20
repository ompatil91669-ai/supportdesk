import { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticket.service";
import { successResponse } from "../utils/response";
import {
  createTicketSchema,
  updateTicketSchema,
} from "../validators/ticket.validator";
import { AppError } from "../middleware/errorHandler";

function getTicketId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    throw new AppError(400, "INVALID_TICKET_ID", "Invalid ticket ID");
  }

  return id;
}

export async function getTickets(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tickets = await ticketService.getAllTickets();
    successResponse(res, tickets);
  } catch (error) {
    next(error);
  }
}

export async function getTicket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ticket = await ticketService.getTicketById(getTicketId(req));
    successResponse(res, ticket);
  } catch (error) {
    next(error);
  }
}

export async function postTicket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = createTicketSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid ticket data");
    }

    const ticket = await ticketService.addTicket(result.data);
    successResponse(res, ticket, 201);
  } catch (error) {
    next(error);
  }
}

export async function patchTicket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = updateTicketSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid ticket data");
    }

    const ticket = await ticketService.editTicket(
      getTicketId(req),
      result.data
    );

    successResponse(res, ticket);
  } catch (error) {
    next(error);
  }
}

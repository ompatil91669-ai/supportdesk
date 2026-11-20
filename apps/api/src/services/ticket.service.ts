import * as ticketRepository from "../repositories/ticket.repository";
import { AppError } from "../middleware/errorHandler";
import { Role } from "@prisma/client";
import {
  CreateTicketInput,
  UpdateTicketInput,
} from "../validators/ticket.validator";

interface TicketAccess {
  id: string;
  role: Role;
}

// Agent: all tickets | Customer: own tickets
export async function getAllTickets(user: TicketAccess) {
  return ticketRepository.findAllTickets(user);
}

// Get ticket only if user has permission
export async function getTicketById(
  id: string,
  user: TicketAccess
) {
  const ticket = await ticketRepository.findTicketById(id, user);

  if (!ticket) {
    throw new AppError(
      404,
      "TICKET_NOT_FOUND",
      "Ticket not found"
    );
  }

  return ticket;
}

// Create ticket for authenticated user
export async function addTicket(
  data: CreateTicketInput,
  user: TicketAccess
) {
  return ticketRepository.createTicket(data, user);
}

// Update ticket only if user has permission
export async function editTicket(
  id: string,
  data: UpdateTicketInput,
  user: TicketAccess
) {
  const ticket = await ticketRepository.updateTicket(id, data, user);

  if (!ticket) {
    throw new AppError(
      404,
      "TICKET_NOT_FOUND",
      "Ticket not found"
    );
  }

  return ticket;
}
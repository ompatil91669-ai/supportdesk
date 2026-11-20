
import * as ticketRepository from "../repositories/ticket.repository";
import { AppError } from "../middleware/errorHandler";
import { Role } from "@prisma/client";
import {
  CreateTicketInput,
  UpdateTicketInput,
  TicketQueryInput,
} from "../validators/ticket.validator";

interface TicketAccess {
  id: string;
  role: Role;
}

// Day 11: Pagination, Filtering, Search and Sorting
export async function getAllTickets(
  user: TicketAccess,
  page = 1,
  limit = 10,
  status?: TicketQueryInput["status"],
  priority?: TicketQueryInput["priority"],
  assigneeId?: TicketQueryInput["assigneeId"],
  search?: TicketQueryInput["search"],
  sortBy: TicketQueryInput["sortBy"] = "createdAt",
  sortOrder: TicketQueryInput["sortOrder"] = "desc"
) {
  return ticketRepository.findAllTickets(
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
}

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

export async function addTicket(
  data: CreateTicketInput,
  user: TicketAccess
) {
  return ticketRepository.createTicket(data, user);
}

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

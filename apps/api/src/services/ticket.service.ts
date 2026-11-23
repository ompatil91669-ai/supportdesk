
import * as ticketRepository from "../repositories/ticket.repository";
import { AppError } from "../middleware/errorHandler";
import { Role } from "@prisma/client";
import * as userRepository from "../repositories/user.repository";
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
  if (
    data.status !== undefined &&
    user.role !== Role.Agent &&
    user.role !== Role.Admin
  ) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Only agents and admins can change ticket status"
    );
  }

  if ("assigneeId" in data) {
    if (user.role !== Role.Admin) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Only admins can assign tickets"
      );
    }

    if (
      data.assigneeId !== null &&
      data.assigneeId !== undefined &&
      !(await userRepository.findAgentById(data.assigneeId))
    ) {
      throw new AppError(
        400,
        "INVALID_ASSIGNEE",
        "Tickets can only be assigned to an existing agent"
      );
    }
  }

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

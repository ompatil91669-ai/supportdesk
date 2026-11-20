import * as ticketRepository from "../repositories/ticket.repository";
import { AppError } from "../middleware/errorHandler";
import {
  CreateTicketInput,
  UpdateTicketInput,
} from "../validators/ticket.validator";

export async function getAllTickets() {
  return ticketRepository.findAllTickets();
}

export async function getTicketById(id: string) {
  const ticket = await ticketRepository.findTicketById(id);

  if (!ticket) {
    throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  return ticket;
}

export async function addTicket(data: CreateTicketInput) {
  return ticketRepository.createTicket(data);
}

export async function editTicket(
  id: string,
  data: UpdateTicketInput
) {
  const ticket = await ticketRepository.updateTicket(id, data);

  if (!ticket) {
    throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  return ticket;
}

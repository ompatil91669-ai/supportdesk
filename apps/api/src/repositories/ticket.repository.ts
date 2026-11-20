import { PrismaClient } from "database";
import { CreateTicketInput, UpdateTicketInput } from "../validators/ticket.validator";

const prisma = new PrismaClient();

export async function findAllTickets() {
  return prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function findTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
  });
}

export async function createTicket(data: CreateTicketInput) {
  return prisma.ticket.create({
    data,
  });
}

export async function updateTicket(
  id: string,
  data: UpdateTicketInput
) {
  const existingTicket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!existingTicket) {
    return null;
  }

  return prisma.ticket.update({
    where: { id },
    data,
  });
}

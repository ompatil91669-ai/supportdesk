import { PrismaClient, Role, Prisma } from "database";
import {
  CreateTicketInput,
  UpdateTicketInput,
} from "../validators/ticket.validator";

const prisma = new PrismaClient();

interface TicketAccess {
  id: string;
  role: Role;
}

function ownershipFilter(user: TicketAccess): Prisma.TicketWhereInput {
  return user.role === Role.Agent ? {} : { userId: user.id };
}

// Agent: all tickets | Customer: own tickets only
export async function findAllTickets(user: TicketAccess) {
  return prisma.ticket.findMany({
    where: ownershipFilter(user),
    orderBy: { createdAt: "desc" },
  });
}

// Prevent customers from reading other users' tickets
export async function findTicketById(id: string, user: TicketAccess) {
  return prisma.ticket.findFirst({
    where: {
      id,
      ...ownershipFilter(user),
    },
  });
}

// Assign new tickets to the authenticated user
export async function createTicket(
  data: CreateTicketInput,
  user: TicketAccess
) {
  return prisma.ticket.create({
    data: {
      ...data,
      userId: user.id,
    },
  });
}

// Enforce ownership directly in the database update condition
export async function updateTicket(
  id: string,
  data: UpdateTicketInput,
  user: TicketAccess
) {
  const where: Prisma.TicketWhereInput = {
    id,
    ...ownershipFilter(user),
  };

  const result = await prisma.ticket.updateMany({
    where,
    data,
  });

  if (result.count === 0) {
    return null;
  }

  return prisma.ticket.findFirst({ where });
}
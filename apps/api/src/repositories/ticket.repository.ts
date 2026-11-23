
import { PrismaClient, Role, Prisma } from "database";
import {
  CreateTicketInput,
  UpdateTicketInput,
  TicketQueryInput,
} from "../validators/ticket.validator";

const prisma = new PrismaClient();

interface TicketAccess {
  id: string;
  role: Role;
}

function ownershipFilter(
  user: TicketAccess
): Prisma.TicketWhereInput {
  return user.role === Role.Agent || user.role === Role.Admin
    ? {}
    : { userId: user.id };
}

// Day 11: Pagination, Filtering, Search and Sorting
export async function findAllTickets(
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
  const where: Prisma.TicketWhereInput = {
    ...ownershipFilter(user),

    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assigneeId ? { assigneeId } : {}),

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findTicketById(
  id: string,
  user: TicketAccess
) {
  return prisma.ticket.findFirst({
    where: {
      id,
      ...ownershipFilter(user),
    },
  });
}

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

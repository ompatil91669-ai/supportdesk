
import { PrismaClient, Role } from "database";
import { CreateCommentInput } from "../validators/comment.validator";

const prisma = new PrismaClient();

interface CommentAccess {
  id: string;
  role: Role;
}

// Save a new comment
export async function createComment(
  ticketId: string,
  data: CreateCommentInput,
  user: CommentAccess
) {
  return prisma.comment.create({
    data: {
      content: data.content,
      isInternal: data.isInternal,
      ticketId,
      authorId: user.id,
    },
  });
}

// Get comments for a ticket
export async function findCommentsByTicketId(
  ticketId: string,
  user: CommentAccess
) {
  return prisma.comment.findMany({
    where: {
      ticketId,
      ...(user.role === Role.Agent
        ? {}
        : { isInternal: false }),
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

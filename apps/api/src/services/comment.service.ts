
import { Role } from "database";
import * as commentRepository from "../repositories/comment.repository";
import * as ticketRepository from "../repositories/ticket.repository";
import { AppError } from "../middleware/errorHandler";
import { CreateCommentInput } from "../validators/comment.validator";

interface CommentAccess {
  id: string;
  role: Role;
}

// Create a comment on a ticket
export async function addComment(
  ticketId: string,
  data: CreateCommentInput,
  user: CommentAccess
) {
  const ticket = await ticketRepository.findTicketById(
    ticketId,
    user
  );

  if (!ticket) {
    throw new AppError(
      404,
      "TICKET_NOT_FOUND",
      "Ticket not found"
    );
  }

  if (
    data.isInternal &&
    user.role !== Role.Agent &&
    user.role !== Role.Admin
  ) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Only agents and admins can create internal comments"
    );
  }

  return commentRepository.createComment(
    ticketId,
    data,
    user
  );
}

// Get comments for a ticket
export async function getComments(
  ticketId: string,
  user: CommentAccess
) {
  const ticket = await ticketRepository.findTicketById(
    ticketId,
    user
  );

  if (!ticket) {
    throw new AppError(
      404,
      "TICKET_NOT_FOUND",
      "Ticket not found"
    );
  }

  return commentRepository.findCommentsByTicketId(
    ticketId,
    user
  );
}

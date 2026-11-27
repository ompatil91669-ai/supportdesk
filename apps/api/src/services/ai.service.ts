import { Role } from "database";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import * as ticketRepository from "../repositories/ticket.repository";
import * as commentRepository from "../repositories/comment.repository";
import { createGeminiClient } from "../ai/gemini";
import {
  CATEGORISE_TICKET_PROMPT_VERSION,
  CATEGORISE_TICKET_SYSTEM_PROMPT,
} from "../ai/prompts/categorise-ticket.v1";
import {
  SUGGEST_REPLY_PROMPT_VERSION,
  SUGGEST_REPLY_SYSTEM_PROMPT,
} from "../ai/prompts/suggest-reply.v1";
import {
  categoriseTicketResultSchema,
  CategoriseTicketResult,
} from "../ai/schemas";
import { logAiUsage } from "../ai/diagnostics";

interface AiAccess {
  id: string;
  role: Role;
}

interface PublicCommentContext {
  content: string;
  createdAt: Date;
}

export interface TicketAiContext {
  ticket: {
    id: string;
    name: string;
    status: string;
    priority: string;
  };
  publicComments: PublicCommentContext[];
}

export async function prepareTicketAiContext(
  ticketId: string,
  user: AiAccess
): Promise<TicketAiContext> {
  await createGeminiClient();

  const ticket = await ticketRepository.findTicketById(ticketId, user);
  if (!ticket) {
    throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  const comments = await commentRepository.findCommentsByTicketId(
    ticketId,
    user
  );
  const publicComments = comments
    .filter((comment) => !comment.isInternal)
    .sort(
      (left, right) =>
        right.createdAt.getTime() - left.createdAt.getTime()
    )
    .slice(0, 8)
    .map((comment) => ({
      content: comment.content.slice(0, 800).trim(),
      createdAt: comment.createdAt,
    }))
    .filter((comment) => comment.content.length > 0);

  const name = ticket.name.trim();
  if (name.length < 3 && publicComments.length === 0) {
    throw new AppError(
      422,
      "INSUFFICIENT_TICKET_CONTEXT",
      "There is not enough ticket context for an AI response."
    );
  }

  return {
    ticket: {
      id: ticket.id,
      name,
      status: ticket.status,
      priority: ticket.priority,
    },
    publicComments,
  };
}

function formatSuggestReplyInput(context: TicketAiContext): string {
  const comments = context.publicComments
    .map(
      (comment, index) =>
        `[Public comment ${index + 1}] ${comment.content}`
    )
    .join("\n");

  return [
    "Generate a draft reply for this support ticket.",
    `[Ticket ID] ${context.ticket.id}`,
    `[Ticket name] ${context.ticket.name}`,
    `[Status] ${context.ticket.status}`,
    `[Priority] ${context.ticket.priority}`,
    comments ? "[Recent public comments]\n" + comments : "[Recent public comments] None",
  ].join("\n");
}

export async function createSuggestReplyStream(
  context: TicketAiContext
) {
  const startedAt = Date.now();
  const ai = await createGeminiClient();

  try {
    return await ai.interactions.create({
      model: env.GEMINI_MODEL,
      system_instruction: SUGGEST_REPLY_SYSTEM_PROMPT,
      input: formatSuggestReplyInput(context),
      stream: true,
    });
  } catch (error) {
    logAiUsage({
      feature: "suggest-reply",
      promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
      model: env.GEMINI_MODEL,
      status: "error",
      durationMs: Date.now() - startedAt,
      errorCode: getSafeProviderErrorCode(error),
    });
    throw error;
  }
}

export async function categoriseTicket(
  context: TicketAiContext
): Promise<CategoriseTicketResult> {
  const startedAt = Date.now();
  const ai = await createGeminiClient();
  const input = [
    "Categorise this support ticket.",
    `[Ticket name] ${context.ticket.name}`,
    `[Status] ${context.ticket.status}`,
    `[Priority] ${context.ticket.priority}`,
    context.publicComments.length
      ? "[Recent public comments]\n" +
        context.publicComments
          .map((comment, index) =>
            `[Public comment ${index + 1}] ${comment.content}`
          )
          .join("\n")
      : "[Recent public comments] None",
  ].join("\n");

  try {
    const response = await ai.interactions.create({
      model: env.GEMINI_MODEL,
      system_instruction: CATEGORISE_TICKET_SYSTEM_PROMPT,
      input,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["Technical", "Billing", "Account", "General", "Other"],
            },
            priority: {
              type: "string",
              enum: ["Low", "Medium", "High"],
            },
          },
          required: ["category", "priority"],
          additionalProperties: false,
        },
      },
      stream: false,
    });

    if (!("output_text" in response) || !response.output_text?.trim()) {
      throw new AppError(
        502,
        "AI_EMPTY_OUTPUT",
        "The AI provider returned an empty response."
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(response.output_text);
    } catch {
      throw new AppError(
        502,
        "AI_INVALID_OUTPUT",
        "The AI provider returned invalid JSON."
      );
    }

    const parsed = categoriseTicketResultSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new AppError(
        502,
        "AI_INVALID_OUTPUT",
        "The AI provider returned an unsupported categorisation."
      );
    }

    const usage = "usage" in response ? response.usage : undefined;
    logAiUsage({
      feature: "categorise",
      promptVersion: CATEGORISE_TICKET_PROMPT_VERSION,
      model: env.GEMINI_MODEL,
      usage,
      status: "success",
      durationMs: Date.now() - startedAt,
    });

    return parsed.data;
  } catch (error) {
    if (error instanceof AppError) {
      logAiUsage({
        feature: "categorise",
        promptVersion: CATEGORISE_TICKET_PROMPT_VERSION,
        model: env.GEMINI_MODEL,
        status: "error",
        durationMs: Date.now() - startedAt,
        errorCode: error.code,
      });
      throw error;
    }

    logAiUsage({
      feature: "categorise",
      promptVersion: CATEGORISE_TICKET_PROMPT_VERSION,
      model: env.GEMINI_MODEL,
      status: "error",
      durationMs: Date.now() - startedAt,
      errorCode: getSafeProviderErrorCode(error),
    });
    throw mapProviderError(error);
  }
}

export function getSafeProviderErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "PROVIDER_ERROR";
  const candidate = error as {
    status?: number;
    code?: string | number;
    message?: string;
  };
  if (
    candidate.status === 429 ||
    String(candidate.code).toUpperCase().includes("429") ||
    String(candidate.code).toUpperCase().includes("RESOURCE_EXHAUSTED") ||
    String(candidate.message).toUpperCase().includes("RESOURCE_EXHAUSTED")
  ) {
    return "AI_QUOTA_EXHAUSTED";
  }
  return "AI_PROVIDER_ERROR";
}

export function mapProviderError(error: unknown): AppError {
  const code = getSafeProviderErrorCode(error);
  if (code === "AI_QUOTA_EXHAUSTED") {
    return new AppError(
      429,
      code,
      "The AI service quota is temporarily exhausted."
    );
  }
  return new AppError(
    502,
    code,
    "The AI service is temporarily unavailable."
  );
}

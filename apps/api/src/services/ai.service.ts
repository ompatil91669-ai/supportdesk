import { Role } from "database";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import * as ticketRepository from "../repositories/ticket.repository";
import * as commentRepository from "../repositories/comment.repository";
import { createGeminiClient } from "../ai/gemini";
import {
  AI_LIMITS,
  GEMINI_SAFETY_SETTINGS,
  maskSensitiveData,
} from "../ai/guardrails";
import {
  CATEGORISE_TICKET_PROMPT_VERSION,
  CATEGORISE_TICKET_SYSTEM_PROMPT,
} from "../ai/prompts/categorise-ticket.v2";
import {
  SUGGEST_REPLY_PROMPT_VERSION,
  SUGGEST_REPLY_SYSTEM_PROMPT,
} from "../ai/prompts/suggest-reply.v2";
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
    .slice(0, AI_LIMITS.maxComments)
    .map((comment) => ({
      content: maskSensitiveData(
        comment.content.slice(0, AI_LIMITS.maxCommentChars).trim()
      ),
      createdAt: comment.createdAt,
    }))
    .filter((comment) => comment.content.length > 0);

  if (publicComments.length === 0) {
    throw new AppError(
      422,
      "INSUFFICIENT_TICKET_CONTEXT",
      "There is not enough ticket context for an AI response."
    );
  }
  return {
    ticket: {
      id: ticket.id,
      name: "[REDACTED CUSTOMER NAME]",
      status: ticket.status,
      priority: ticket.priority,
    },
    publicComments,
  };
}

export function formatTicketPromptInput(
  task: "categorise" | "suggest-reply",
  context: TicketAiContext
): string {
  const data = {
    task,
    ticket: {
      id: context.ticket.id.slice(0, 100),
      name: "[REDACTED CUSTOMER NAME]",
      status: context.ticket.status,
      priority: context.ticket.priority,
    },
    publicComments: context.publicComments
      .slice(0, AI_LIMITS.maxComments)
      .map((comment) =>
        maskSensitiveData(
          comment.content.slice(0, AI_LIMITS.maxCommentChars)
        )
      ),
  };
  const serialized = JSON.stringify(data);

  if (serialized.length > AI_LIMITS.maxContextChars) {
    throw new AppError(
      413,
      "AI_CONTEXT_TOO_LARGE",
      "The ticket context is too long to process safely."
    );
  }

  return `UNTRUSTED_TICKET_JSON\n${serialized}`;
}

export async function createSuggestReplyStream(
  context: TicketAiContext,
  abortSignal?: AbortSignal
) {
  const startedAt = Date.now();

  try {
    const input = formatTicketPromptInput("suggest-reply", context);
    const ai = await createGeminiClient();
    return await ai.interactions.create({
      model: env.GEMINI_MODEL,
      system_instruction: SUGGEST_REPLY_SYSTEM_PROMPT,
      input,
      safety_settings: [...GEMINI_SAFETY_SETTINGS],
      generation_config: { max_output_tokens: 1_024 },
      stream: true,
    }, {
      timeout_ms: 60_000,
      ...(abortSignal
        ? { fetch_options: { signal: abortSignal } }
        : {}),
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
  context: TicketAiContext,
  abortSignal?: AbortSignal
): Promise<CategoriseTicketResult> {
  const startedAt = Date.now();
  const input = formatTicketPromptInput("categorise", context);

  try {
    const ai = await createGeminiClient();
    const response = await ai.interactions.create({
      model: env.GEMINI_MODEL,
      system_instruction: CATEGORISE_TICKET_SYSTEM_PROMPT,
      input,
      safety_settings: [...GEMINI_SAFETY_SETTINGS],
      generation_config: { max_output_tokens: 256 },
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
    }, {
      timeout_ms: 60_000,
      ...(abortSignal
        ? { fetch_options: { signal: abortSignal } }
        : {}),
    });

    if (!("output_text" in response) || !response.output_text?.trim()) {
      throw new AppError(
        502,
        "AI_EMPTY_OUTPUT",
        "The AI provider returned an empty response."
      );
    }
    if (response.output_text.length > AI_LIMITS.maxCategoryOutputChars) {
      throw new AppError(
        502,
        "AI_INVALID_OUTPUT",
        "The AI provider returned an unsupported categorisation."
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
  const providerCode = String(candidate.code ?? "").toUpperCase();
  const providerMessage = String(candidate.message ?? "").toUpperCase();
  if (
    providerCode.includes("SAFETY") ||
    (providerMessage.includes("SAFETY") &&
      providerMessage.includes("BLOCK"))
  ) {
    return "AI_SAFETY_BLOCKED";
  }
  if (
    candidate.status === 429 ||
    providerCode.includes("429") ||
    providerCode.includes("RESOURCE_EXHAUSTED") ||
    providerMessage.includes("RESOURCE_EXHAUSTED")
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

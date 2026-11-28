import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/errorHandler";
import { successResponse } from "../utils/response";
import { env } from "../config/env";
import { logAiUsage } from "../ai/diagnostics";
import { AI_LIMITS, AI_MANUAL_FALLBACK_MESSAGE, getSafeStreamPrefix } from "../ai/guardrails";
import {
  CATEGORISE_TICKET_PROMPT_VERSION,
} from "../ai/prompts/categorise-ticket.v2";
import {
  SUGGEST_REPLY_PROMPT_VERSION,
} from "../ai/prompts/suggest-reply.v2";
import {
  categoriseTicket,
  createSuggestReplyStream,
  getSafeProviderErrorCode,
  mapProviderError,
  prepareTicketAiContext,
} from "../services/ai.service";

const AI_REQUEST_TIMEOUT_MS = 60_000;

interface ProviderUsage {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_thought_tokens?: number;
  total_tokens?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getProviderUsage(record: Record<string, unknown>): ProviderUsage | undefined {
  const metadata = isRecord(record.metadata) ? record.metadata : undefined;
  const interaction = isRecord(record.interaction) ? record.interaction : undefined;
  const candidate =
    metadata && isRecord(metadata.total_usage)
      ? metadata.total_usage
      : interaction && isRecord(interaction.usage)
        ? interaction.usage
        : undefined;

  if (!candidate) return undefined;

  const usage: ProviderUsage = {};
  for (const key of [
    "total_input_tokens",
    "total_output_tokens",
    "total_thought_tokens",
    "total_tokens",
  ] as const) {
    const value = candidate[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      usage[key] = value;
    }
  }
  return usage;
}

function getTicketId(req: AuthenticatedRequest): string {
  const id = req.params.id;
  if (typeof id !== "string" || !id.trim()) {
    throw new AppError(400, "INVALID_TICKET_ID", "Invalid ticket ID");
  }
  return id;
}

function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return req.user;
}

function writeSse(
  res: Response,
  event: "delta" | "complete" | "error",
  data: Record<string, string>
): void {
  if (!res.writableEnded) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

function writeSseFailure(res: Response, code: string): void {
  writeSse(res, "error", {
    code,
    message: AI_MANUAL_FALLBACK_MESSAGE,
  });
  if (!res.writableEnded) res.end();
}

function logStreamFailure(
  startedAt: number,
  usage: ProviderUsage | undefined,
  errorCode: string
): void {
  logAiUsage({
    feature: "suggest-reply",
    promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
    model: env.GEMINI_MODEL,
    usage,
    status: "error",
    durationMs: Date.now() - startedAt,
    errorCode,
  });
}

export async function postAiCategorise(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const abortController = new AbortController();
  let clientDisconnected = false;
  let requestTimedOut = false;
  const timeout = setTimeout(() => {
    requestTimedOut = true;
    abortController.abort();
  }, AI_REQUEST_TIMEOUT_MS);
  const handleClose = () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
      abortController.abort();
    }
  };
  res.once("close", handleClose);

  try {
    const user = getAuthenticatedUser(req);
    const context = await prepareTicketAiContext(getTicketId(req), user);
    const result = await categoriseTicket(context, abortController.signal);
    if (!clientDisconnected && !res.writableEnded) {
      successResponse(res, result);
    }
  } catch (error) {
    if (clientDisconnected) return;
    if (requestTimedOut) {
      next(
        new AppError(
          504,
          "AI_REQUEST_TIMEOUT",
          "The AI request timed out. Please try again."
        )
      );
    } else {
      next(error instanceof AppError ? error : mapProviderError(error));
    }
  } finally {
    clearTimeout(timeout);
    res.off("close", handleClose);
  }
}

export async function postAiSuggestReply(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const startedAt = Date.now();
  const abortController = new AbortController();
  let clientDisconnected = false;
  let requestTimedOut = false;
  let usage: ProviderUsage | undefined;
  let textReceived = false;
  let streamCompleted = false;
  let providerText = "";
  let sentSafeTextLength = 0;

  const timeout = setTimeout(() => {
    requestTimedOut = true;
    abortController.abort();
  }, AI_REQUEST_TIMEOUT_MS);
  const handleClose = () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
      abortController.abort();
    }
  };
  res.once("close", handleClose);

  try {
    const user = getAuthenticatedUser(req);
    const context = await prepareTicketAiContext(getTicketId(req), user);
    const stream = await createSuggestReplyStream(
      context,
      abortController.signal
    );

    if (clientDisconnected) return;

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    for await (const event of stream) {
      if (clientDisconnected || res.writableEnded) return;
      if (!isRecord(event) || typeof event.event_type !== "string") {
        throw new AppError(
          502,
          "AI_INVALID_STREAM",
          "The AI provider returned an invalid stream."
        );
      }

      const eventUsage = getProviderUsage(event);
      if (eventUsage) usage = eventUsage;

      if (event.event_type === "step.delta") {
        if (!isRecord(event.delta)) {
          throw new AppError(
            502,
            "AI_INVALID_STREAM",
            "The AI provider returned an invalid stream delta."
          );
        }

        if (event.delta.type === "thought_signature") {
          if (
            event.delta.signature !== undefined &&
            typeof event.delta.signature !== "string"
          ) {
            throw new AppError(
              502,
              "AI_INVALID_STREAM",
              "The AI provider returned invalid stream metadata."
            );
          }
          continue;
        }

        if (
          event.delta.type !== "text" ||
          typeof event.delta.text !== "string" ||
          event.delta.text.length > AI_LIMITS.maxDeltaChars
        ) {
          throw new AppError(
            502,
            "AI_INVALID_STREAM",
            "The AI provider returned an invalid text chunk."
          );
        }

        providerText += event.delta.text;
        if (providerText.length > AI_LIMITS.maxReplyChars) {
          throw new AppError(
            502,
            "AI_OUTPUT_TOO_LONG",
            "The AI provider returned an oversized draft."
          );
        }

        textReceived ||= event.delta.text.length > 0;
        const { safeText, safePrefixLength } = getSafeStreamPrefix(providerText);
        if (safePrefixLength > sentSafeTextLength) {
          writeSse(res, "delta", {
            text: safeText.slice(sentSafeTextLength, safePrefixLength),
          });
          sentSafeTextLength = safePrefixLength;
        }
      } else if (event.event_type === "error") {
        const code = getSafeProviderErrorCode(event.error);
        abortController.abort();
        writeSseFailure(res, code);
        logStreamFailure(startedAt, usage, code);
        return;
      } else if (event.event_type === "interaction.completed") {
        streamCompleted = true;
        if (!textReceived) {
          writeSseFailure(res, "AI_EMPTY_OUTPUT");
          logStreamFailure(startedAt, usage, "AI_EMPTY_OUTPUT");
          return;
        }

        const { safeText } = getSafeStreamPrefix(providerText);
        const remainingText = safeText.slice(sentSafeTextLength);
        if (remainingText) writeSse(res, "delta", { text: remainingText });
        writeSse(res, "complete", {
          promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
        });
        if (!res.writableEnded) res.end();
        logAiUsage({
          feature: "suggest-reply",
          promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
          model: env.GEMINI_MODEL,
          usage,
          status: "success",
          durationMs: Date.now() - startedAt,
        });
        return;
      }
    }

    if (!clientDisconnected && !res.writableEnded && !streamCompleted) {
      const code = requestTimedOut
        ? "AI_REQUEST_TIMEOUT"
        : "AI_STREAM_INTERRUPTED";
      writeSseFailure(res, code);
      logStreamFailure(startedAt, usage, code);
    }
  } catch (error) {
    if (clientDisconnected) return;

    const code = requestTimedOut
      ? "AI_REQUEST_TIMEOUT"
      : error instanceof AppError
        ? error.code
        : getSafeProviderErrorCode(error);

    if (res.headersSent) {
      writeSseFailure(res, code);
      logStreamFailure(startedAt, usage, code);
      return;
    }

    next(
      requestTimedOut
        ? new AppError(
            504,
            code,
            "The AI request timed out. Please try again."
          )
        : error instanceof AppError
          ? error
          : mapProviderError(error)
    );
  } finally {
    clearTimeout(timeout);
    res.off("close", handleClose);
  }
}

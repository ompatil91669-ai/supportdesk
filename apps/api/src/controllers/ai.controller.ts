import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/errorHandler";
import { successResponse } from "../utils/response";
import { env } from "../config/env";
import { logAiUsage } from "../ai/diagnostics";
import {
  CATEGORISE_TICKET_PROMPT_VERSION,
} from "../ai/prompts/categorise-ticket.v1";
import {
  SUGGEST_REPLY_PROMPT_VERSION,
} from "../ai/prompts/suggest-reply.v1";
import {
  categoriseTicket,
  createSuggestReplyStream,
  getSafeProviderErrorCode,
  mapProviderError,
  prepareTicketAiContext,
} from "../services/ai.service";

function getTicketId(req: AuthenticatedRequest): string {
  const id = req.params.id;
  if (typeof id !== "string" || !id.trim()) {
    throw new AppError(400, "INVALID_TICKET_ID", "Invalid ticket ID");
  }
  return id;
}

function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication required"
    );
  }
  return req.user;
}

export async function postAiCategorise(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = getAuthenticatedUser(req);
    const context = await prepareTicketAiContext(
      getTicketId(req),
      user
    );
    const result = await categoriseTicket(context);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function postAiSuggestReply(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const startedAt = Date.now();
  let clientDisconnected = false;
  let usage:
    | {
        total_input_tokens?: number;
        total_output_tokens?: number;
        total_thought_tokens?: number;
        total_tokens?: number;
      }
    | undefined;

  try {
    const user = getAuthenticatedUser(req);
    const context = await prepareTicketAiContext(
      getTicketId(req),
      user
    );
    const stream = await createSuggestReplyStream(context);

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    req.on("close", () => {
      clientDisconnected = true;
    });

    const timeout = setTimeout(() => {
      if (clientDisconnected || res.writableEnded) return;
      res.write(
        `event: error\ndata: ${JSON.stringify({
          code: "AI_REQUEST_TIMEOUT",
          message: "The AI reply request timed out.",
        })}\n\n`
      );
      res.end();
      logAiUsage({
        feature: "suggest-reply",
        promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
        model: env.GEMINI_MODEL,
        usage,
        status: "error",
        durationMs: Date.now() - startedAt,
        errorCode: "AI_REQUEST_TIMEOUT",
      });
    }, 60_000);

    let textReceived = false;

    for await (const event of stream) {
      if (clientDisconnected || res.writableEnded) break;

      const record = event as {
        event_type?: string;
        delta?: { type?: string; text?: string };
        metadata?: {
          total_usage?: {
            total_input_tokens?: number;
            total_output_tokens?: number;
            total_thought_tokens?: number;
            total_tokens?: number;
          };
        };
        interaction?: {
          usage?: {
            total_input_tokens?: number;
            total_output_tokens?: number;
            total_thought_tokens?: number;
            total_tokens?: number;
          };
        };
        error?: unknown;
      };

      if (record.metadata?.total_usage) {
        usage = record.metadata.total_usage;
      }
      if (record.interaction?.usage) {
        usage = record.interaction.usage;
      }

      if (
        record.event_type === "step.delta" &&
        record.delta?.type === "text" &&
        typeof record.delta.text === "string"
      ) {
        if (record.delta.text.length > 0) {
          textReceived = true;
          res.write(
            `event: delta\ndata: ${JSON.stringify({
              text: record.delta.text,
            })}\n\n`
          );
        }
      }

      if (record.event_type === "error") {
        clearTimeout(timeout);
        const code = getSafeProviderErrorCode(record.error);
        res.write(
          `event: error\ndata: ${JSON.stringify({
            code,
            message: code === "AI_QUOTA_EXHAUSTED"
              ? "The AI service quota is temporarily exhausted."
              : "The AI service is temporarily unavailable.",
          })}\n\n`
        );
        logAiUsage({
          feature: "suggest-reply",
          promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
          model: env.GEMINI_MODEL,
          usage,
          status: "error",
          durationMs: Date.now() - startedAt,
          errorCode: code,
        });
        res.end();
        return;
      }

      if (record.event_type === "interaction.completed") {
        clearTimeout(timeout);
        if (!textReceived) {
          res.write(
            `event: error\ndata: ${JSON.stringify({
              code: "AI_EMPTY_OUTPUT",
              message: "The AI provider returned an empty draft.",
            })}\n\n`
          );
          logAiUsage({
            feature: "suggest-reply",
            promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
            model: env.GEMINI_MODEL,
            usage,
            status: "error",
            durationMs: Date.now() - startedAt,
            errorCode: "AI_EMPTY_OUTPUT",
          });
        } else {
          res.write(
            `event: complete\ndata: ${JSON.stringify({
              promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
            })}\n\n`
          );
          logAiUsage({
            feature: "suggest-reply",
            promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
            model: env.GEMINI_MODEL,
            usage,
            status: "success",
            durationMs: Date.now() - startedAt,
          });
        }
        res.end();
      }
    }

    clearTimeout(timeout);
  } catch (error) {
    if (res.headersSent) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          code: getSafeProviderErrorCode(error),
          message: "The AI service is temporarily unavailable.",
        })}\n\n`
      );
      res.end();
      logAiUsage({
        feature: "suggest-reply",
        promptVersion: SUGGEST_REPLY_PROMPT_VERSION,
        model: env.GEMINI_MODEL,
        usage,
        status: "error",
        durationMs: Date.now() - startedAt,
        errorCode: getSafeProviderErrorCode(error),
      });
      return;
    }

    next(
      error instanceof AppError
        ? error
        : mapProviderError(error)
    );
  }
}

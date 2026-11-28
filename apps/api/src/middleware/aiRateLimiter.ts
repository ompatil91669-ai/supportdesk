import { Request, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { AuthenticatedRequest } from "./auth.middleware";

export const AI_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AI_RATE_LIMIT_PER_USER = 10;

function getUserRateLimitKey(req: Request): string {
  const user = (req as AuthenticatedRequest).user;
  return user
    ? `user:${user.id}`
    : `unauthenticated:${ipKeyGenerator(req.ip ?? "unknown")}`;
}

export const aiRateLimiter = rateLimit({
  windowMs: AI_RATE_LIMIT_WINDOW_MS,
  limit: AI_RATE_LIMIT_PER_USER,
  keyGenerator: getUserRateLimitKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      data: null,
      error: {
        code: "AI_RATE_LIMITED",
        message: "Too many AI requests. Please try again later.",
      },
      meta: {},
    });
  },
});

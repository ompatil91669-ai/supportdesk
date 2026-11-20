import { rateLimit } from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many login attempts. Please try again later.",
    },
    meta: {},
  },
});
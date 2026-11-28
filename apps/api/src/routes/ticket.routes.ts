
import { Router } from "express";

import {
  getTickets,
  getTicket,
  postTicket,
  patchTicket,
} from "../controllers/ticket.controller";

import {
  getComments,
  postComment,
} from "../controllers/comment.controller";
import {
  postAiCategorise,
  postAiSuggestReply,
} from "../controllers/ai.controller";

import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { aiRateLimiter } from "../middleware/aiRateLimiter";
import { Role } from "database";

const router = Router();

// All ticket and comment routes require authentication
router.use(requireAuth);

// Ticket routes
router.get("/", getTickets);
router.post("/", postTicket);
router.get("/:id", getTicket);
router.patch("/:id", patchTicket);
router.post(
  "/:id/ai/suggest-reply",
  requireRole(Role.Agent, Role.Admin),
  aiRateLimiter,
  postAiSuggestReply
);
router.post(
  "/:id/ai/categorise",
  requireRole(Role.Agent, Role.Admin),
  aiRateLimiter,
  postAiCategorise
);

// Comment routes
router.get("/:id/comments", getComments);
router.post("/:id/comments", postComment);

export default router;

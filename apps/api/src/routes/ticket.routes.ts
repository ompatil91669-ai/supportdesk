
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

import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// All ticket and comment routes require authentication
router.use(requireAuth);

// Ticket routes
router.get("/", getTickets);
router.post("/", postTicket);
router.get("/:id", getTicket);
router.patch("/:id", patchTicket);

// Comment routes
router.get("/:id/comments", getComments);
router.post("/:id/comments", postComment);

export default router;

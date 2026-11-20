import { Router } from "express";
import {
  getTickets,
  getTicket,
  postTicket,
  patchTicket,
} from "../controllers/ticket.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// All ticket routes require JWT authentication
router.use(requireAuth);

router.get("/", getTickets);
router.get("/:id", getTicket);
router.post("/", postTicket);
router.patch("/:id", patchTicket);

export default router;
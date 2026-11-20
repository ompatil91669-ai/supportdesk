import { Router } from "express";
import {
  getTickets,
  getTicket,
  postTicket,
  patchTicket,
} from "../controllers/ticket.controller";

const router = Router();

router.get("/", getTickets);
router.get("/:id", getTicket);
router.post("/", postTicket);
router.patch("/:id", patchTicket);

export default router;

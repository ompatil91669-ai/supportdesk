import { Router } from "express";
import { Role } from "database";
import {
  createManagedUser,
  deleteManagedUser,
  getAssignableAgents,
  getManagedUsers,
  updateManagedUser,
} from "../controllers/user.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.Admin));
router.get("/agents", getAssignableAgents);
router.get("/", getManagedUsers);
router.post("/", createManagedUser);
router.patch("/:id", updateManagedUser);
router.delete("/:id", deleteManagedUser);

export default router;

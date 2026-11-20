import { Router } from "express";
import {
  register,
  login,
} from "../controllers/auth.controller";

import { loginRateLimiter } from "../middleware/loginRateLimiter";

const router = Router();

// Register new customer
router.post("/register", register);

// Login with rate limiting
router.post("/login", loginRateLimiter, login);

export default router;
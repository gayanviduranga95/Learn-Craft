import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  googleAuth,
  getMe,
  logout,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.get("/me", requireAuth, getMe);
router.post("/logout", logout);

// Browser GET helper: returns descriptive 405 Method Not Allowed instead of 404
router.get("/login", (req, res) => {
  res.status(405).json({
    success: false,
    message: "HTTP GET is not supported for /api/auth/login. Please send an HTTP POST request with JSON { email, password }.",
  });
});

router.get("/register", (req, res) => {
  res.status(405).json({
    success: false,
    message: "HTTP GET is not supported for /api/auth/register. Please send an HTTP POST request with JSON { name, email, password, role }.",
  });
});

export default router;

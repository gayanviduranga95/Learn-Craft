import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  googleAuth,
  getMe,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
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

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password recovery requests. Please try again after 15 minutes.",
  },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please try again after 15 minutes.",
  },
});

// Authentication routes
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.get("/me", requireAuth, getMe);
router.post("/logout", logout);

// Profile & Account Settings routes (Protected)
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);

// Email Verification routes
router.post("/verify-email", verificationLimiter, verifyEmail);
router.post("/resend-verification", verificationLimiter, resendVerification);

// Forgot & Reset Password routes
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

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

router.get("/forgot-password", (req, res) => {
  res.status(405).json({
    success: false,
    message: "HTTP GET is not supported for /api/auth/forgot-password. Please send an HTTP POST request with JSON { email }.",
  });
});

router.get("/reset-password", (req, res) => {
  res.status(405).json({
    success: false,
    message: "HTTP GET is not supported for /api/auth/reset-password. Please send an HTTP POST request with JSON { token, password }.",
  });
});

router.get("/verify-email", (req, res) => {
  res.status(405).json({
    success: false,
    message: "HTTP GET is not supported for /api/auth/verify-email. Please send an HTTP POST request with JSON { token }.",
  });
});

export default router;

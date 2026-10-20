
import { Router } from "express";
import {
  register,
  login,
  getMe,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);

router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const secureCookie =
    isProduction || process.env.COOKIE_SECURE === "true";

  res.clearCookie("learncraft_token", {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getGamificationProfile } from "../controllers/gamification.controller.js";

const router = Router();

router.get("/profile", requireAuth, getGamificationProfile);

export default router;

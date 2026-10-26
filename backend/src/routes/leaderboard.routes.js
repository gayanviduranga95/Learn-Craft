import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/", requireAuth, getLeaderboard);

export default router;

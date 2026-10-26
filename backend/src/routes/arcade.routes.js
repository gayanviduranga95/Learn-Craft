import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  startQuizRush,
  submitQuizRush,
  startMemoryMatch,
  submitMemoryMatch,
} from "../controllers/arcade.controller.js";

const router = Router();

router.get("/quiz-rush/start", requireAuth, startQuizRush);
router.post("/quiz-rush/submit", requireAuth, submitQuizRush);

router.get("/memory-match/start", requireAuth, startMemoryMatch);
router.post("/memory-match/submit", requireAuth, submitMemoryMatch);

export default router;

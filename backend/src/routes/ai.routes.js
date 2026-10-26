import { Router } from "express";
import { askAITutor } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/chat", askAITutor);

export default router;

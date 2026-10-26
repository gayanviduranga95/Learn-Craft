import { Router } from "express";
import {
  getCourseQuizzes,
  getQuizById,
  submitQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizStats,
} from "../controllers/quiz.controller.js";
import { requireAuth, requireInstructor } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/courses/:courseId", getCourseQuizzes);
router.get("/:quizId", getQuizById);
router.post("/:quizId/submit", submitQuiz);

router.post("/", requireInstructor, createQuiz);
router.put("/:quizId", requireInstructor, updateQuiz);
router.delete("/:quizId", requireInstructor, deleteQuiz);
router.get("/:quizId/stats", requireInstructor, getQuizStats);

export default router;

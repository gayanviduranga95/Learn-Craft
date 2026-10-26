
import { Router } from "express";
import {
  getCourseLessons,
  completeLesson,
} from "../controllers/lesson.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/courses/:courseId", getCourseLessons);

router.post(
  "/courses/:courseId/lessons/:lessonId/complete",
  completeLesson
);

export default router;

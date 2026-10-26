import { Router } from "express";
import {
  getCourseLessons,
  completeLesson,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lesson.controller.js";
import { requireAuth, requireInstructor } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/courses/:courseId", getCourseLessons);
router.post("/courses/:courseId", requireInstructor, createLesson);
router.put("/:lessonId", requireInstructor, updateLesson);
router.delete("/:lessonId", requireInstructor, deleteLesson);

router.post(
  "/courses/:courseId/lessons/:lessonId/complete",
  completeLesson
);

export default router;

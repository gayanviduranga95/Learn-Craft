
import { Router } from "express";
import {
  getCourses,
  updateCourseProgress,
} from "../controllers/course.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCourses);
router.put("/:courseId/progress", updateCourseProgress);

export default router;

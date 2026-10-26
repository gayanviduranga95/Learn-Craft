import { Router } from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  getCourseStats,
  updateCourseProgress,
  enrolInCourse,
} from "../controllers/course.controller.js";
import { requireAuth, requireInstructor } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCourses);
router.get("/instructor/my-courses", requireInstructor, getInstructorCourses);
router.get("/:courseId", getCourseById);
router.post("/:courseId/enrol", enrolInCourse);
router.post("/", requireInstructor, createCourse);
router.put("/:courseId", requireInstructor, updateCourse);
router.delete("/:courseId", requireInstructor, deleteCourse);
router.get("/:courseId/stats", requireInstructor, getCourseStats);
router.put("/:courseId/progress", updateCourseProgress);

export default router;

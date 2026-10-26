
import mongoose from "mongoose";
import Course from "../models/course.model.js";
import CourseProgress from "../models/course-progress.model.js";

export async function getCourses(req, res, next) {
  try {
    const courses = await Course.find({ isPublished: true })
      .sort({ createdAt: 1 })
      .lean();

    const progressRecords = await CourseProgress.find({
      student: req.auth.userId,
      course: { $in: courses.map((course) => course._id) },
    }).lean();

    const progressByCourse = new Map(
      progressRecords.map((record) => [
        String(record.course),
        record,
      ])
    );

    const result = courses.map((course) => {
      const progress = progressByCourse.get(String(course._id));
      const completedLessons = Math.min(
        progress?.completedLessons ?? 0,
        course.totalLessons
      );

      return {
        ...course,
        progress: course.totalLessons
          ? Math.round((completedLessons / course.totalLessons) * 100)
          : 0,
        completedLessons,
        completedLessonIds: progress?.completedLessonIds ?? [],
        lastAccessedAt: progress?.lastAccessedAt ?? null,
      };
    });

    res.json({ courses: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCourseProgress(req, res, next) {
  try {
    const { courseId } = req.params;
    const { completedLessonIds } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    if (
      !Array.isArray(completedLessonIds) ||
      completedLessonIds.some(
        (id) => typeof id !== "string" || id.trim() === ""
      )
    ) {
      return res.status(400).json({
        message: "completedLessonIds must be an array of non-empty strings.",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const uniqueLessonIds = [...new Set(completedLessonIds)];

    if (uniqueLessonIds.length > course.totalLessons) {
      return res.status(400).json({
        message: "Completed lessons cannot exceed the course lesson count.",
      });
    }

    const progress = await CourseProgress.findOneAndUpdate(
      {
        student: req.auth.userId,
        course: course._id,
      },
      {
        $set: {
          completedLessonIds: uniqueLessonIds,
          completedLessons: uniqueLessonIds.length,
          lastAccessedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      message: "Course progress updated.",
      progress: {
        courseId: String(course._id),
        completedLessons: progress.completedLessons,
        totalLessons: course.totalLessons,
        percentage: Math.round(
          (progress.completedLessons / course.totalLessons) * 100
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}


import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import CourseProgress from "../models/course-progress.model.js";

export async function getCourseLessons(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    }).lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const lessons = await Lesson.find({
      course: courseId,
      isPublished: true,
    })
      .sort({ order: 1 })
      .lean();

    const progress = await CourseProgress.findOne({
      student: req.auth.userId,
      course: courseId,
    }).lean();

    const completedIds = new Set(
      progress?.completedLessonIds ?? []
    );

    res.json({
      course: {
        id: String(course._id),
        title: course.title,
        totalLessons: lessons.length,
      },
      lessons: lessons.map((lesson) => ({
        id: String(lesson._id),
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        content: lesson.content,
        completed: completedIds.has(String(lesson._id)),
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function completeLesson(req, res, next) {
  try {
    const { courseId, lessonId } = req.params;

    if (
      !mongoose.isValidObjectId(courseId) ||
      !mongoose.isValidObjectId(lessonId)
    ) {
      return res.status(400).json({
        message: "Invalid course or lesson ID.",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      course: courseId,
      isPublished: true,
    });

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found in this course.",
      });
    }

    const studentId = req.auth.userId;
    const lessonIdString = String(lesson._id);

    const progress = await CourseProgress.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $addToSet: { completedLessonIds: lessonIdString },
        $set: { lastAccessedAt: new Date() },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Derive the count from the unique completed lesson IDs.
    progress.completedLessons = progress.completedLessonIds.length;
    await progress.save();

    const totalLessons = await Lesson.countDocuments({
      course: courseId,
      isPublished: true,
    });

    res.json({
      message: "Lesson marked as completed.",
      progress: {
        completedLessons: progress.completedLessons,
        totalLessons,
        percentage: totalLessons
          ? Math.round(
              (progress.completedLessons / totalLessons) * 100
            )
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

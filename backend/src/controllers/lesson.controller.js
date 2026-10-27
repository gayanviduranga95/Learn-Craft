import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import CourseProgress from "../models/course-progress.model.js";
import { awardReward } from "../services/reward.service.js";
import { REWARD_CONFIG } from "../config/gamification.config.js";

export async function getCourseLessons(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId).lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Instructors viewing their course should see all lessons; students see published only
    const isInstructor =
      req.auth.role === "admin" ||
      (course.instructor && String(course.instructor) === req.auth.userId);

    const query = { course: courseId };
    if (!isInstructor) {
      query.isPublished = true;
    }

    const lessons = await Lesson.find(query)
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
        description: course.description,
        totalLessons: lessons.length,
        isInstructor,
      },
      lessons: lessons.map((lesson) => ({
        id: String(lesson._id),
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        videoUrl: lesson.videoUrl || "",
        content: lesson.content,
        isPublished: lesson.isPublished,
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

    const previousProgress = await CourseProgress.findOne({
      student: studentId,
      course: courseId,
    }).lean();

    const alreadyCompleted = previousProgress?.completedLessonIds?.includes(lessonIdString);

    const progress = await CourseProgress.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $addToSet: { completedLessonIds: lessonIdString },
        $set: { lastAccessedAt: new Date() },
      },
      {
        upsert: true,
        returnDocument: "after",
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

    let reward = null;
    let courseReward = null;

    if (!alreadyCompleted) {
      reward = await awardReward({
        studentId,
        eventType: "lesson_complete",
        targetId: lessonIdString,
        xp: REWARD_CONFIG.LESSON_COMPLETION.xp,
        coins: REWARD_CONFIG.LESSON_COMPLETION.coins,
        description: `Completed lesson: ${lesson.title}`,
      });

      // Check if course is now 100% completed
      if (totalLessons > 0 && progress.completedLessons >= totalLessons) {
        courseReward = await awardReward({
          studentId,
          eventType: "course_complete",
          targetId: String(courseId),
          xp: REWARD_CONFIG.COURSE_COMPLETION.xp,
          coins: REWARD_CONFIG.COURSE_COMPLETION.coins,
          description: `Completed course curriculum: ${course.title}`,
        });
      }
    }

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
      reward,
      courseReward,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLesson(req, res, next) {
  try {
    const { courseId } = req.params;
    const { title, description, content, durationMinutes, order, isPublished, videoUrl } = req.body ?? {};

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Lesson title is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Ownership check
    if (
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to add lessons to this course.",
      });
    }

    let lessonOrder = Number(order);
    if (!lessonOrder || lessonOrder < 1) {
      const highestLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
      lessonOrder = highestLesson ? highestLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      course: courseId,
      title: title.trim(),
      description: (description || "").trim(),
      content: (content || "").trim(),
      videoUrl: (videoUrl || "").trim(),
      durationMinutes: Math.max(1, Number(durationMinutes) || 10),
      order: lessonOrder,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    // Update totalLessons in Course
    const count = await Lesson.countDocuments({ course: courseId, isPublished: true });
    course.totalLessons = count;
    await course.save();

    res.status(201).json({
      message: "Lesson created successfully.",
      lesson: {
        ...lesson.toObject(),
        id: String(lesson._id),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLesson(req, res, next) {
  try {
    const { lessonId } = req.params;
    const { title, description, content, durationMinutes, order, isPublished, videoUrl } = req.body ?? {};

    if (!mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson ID." });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const course = await Course.findById(lesson.course);
    if (
      course &&
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to modify this lesson.",
      });
    }

    if (title !== undefined) lesson.title = title.trim();
    if (description !== undefined) lesson.description = description.trim();
    if (content !== undefined) lesson.content = content.trim();
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl.trim();
    if (durationMinutes !== undefined) lesson.durationMinutes = Math.max(1, Number(durationMinutes) || 10);
    if (order !== undefined) lesson.order = Number(order);
    if (isPublished !== undefined) lesson.isPublished = Boolean(isPublished);

    await lesson.save();

    if (course) {
      const count = await Lesson.countDocuments({ course: course._id, isPublished: true });
      course.totalLessons = count;
      await course.save();
    }

    res.json({
      message: "Lesson updated successfully.",
      lesson: {
        ...lesson.toObject(),
        id: String(lesson._id),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLesson(req, res, next) {
  try {
    const { lessonId } = req.params;

    if (!mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson ID." });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const course = await Course.findById(lesson.course);
    if (
      course &&
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to delete this lesson.",
      });
    }

    await Lesson.findByIdAndDelete(lessonId);

    if (course) {
      const count = await Lesson.countDocuments({ course: course._id, isPublished: true });
      course.totalLessons = count;
      await course.save();
    }

    res.json({ message: "Lesson deleted successfully." });
  } catch (error) {
    next(error);
  }
}

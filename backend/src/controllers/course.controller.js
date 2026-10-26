import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import CourseProgress from "../models/course-progress.model.js";
import Quiz from "../models/quiz.model.js";

export async function getCourses(req, res, next) {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate("instructor", "name email")
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
        id: String(course._id),
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

export async function getCourseById(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId)
      .populate("instructor", "name email")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const progress = await CourseProgress.findOne({
      student: req.auth.userId,
      course: course._id,
    }).lean();

    const completedLessons = Math.min(
      progress?.completedLessons ?? 0,
      course.totalLessons
    );

    res.json({
      course: {
        ...course,
        id: String(course._id),
        progress: course.totalLessons
          ? Math.round((completedLessons / course.totalLessons) * 100)
          : 0,
        completedLessons,
        completedLessonIds: progress?.completedLessonIds ?? [],
        lastAccessedAt: progress?.lastAccessedAt ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCourse(req, res, next) {
  try {
    const { title, description, category, thumbnail } = req.body ?? {};

    if (!title || !category) {
      return res.status(400).json({
        message: "Course title and category are required.",
      });
    }

    const existing = await Course.findOne({ title: title.trim() });
    if (existing) {
      return res.status(409).json({
        message: "A course with this title already exists.",
      });
    }

    const course = await Course.create({
      title: title.trim(),
      description: (description || "").trim(),
      category: category.trim(),
      thumbnail: (thumbnail || "").trim(),
      instructor: req.auth.userId,
      totalLessons: 0,
      isPublished: true,
    });

    res.status(201).json({
      message: "Course created successfully.",
      course: {
        ...course.toObject(),
        id: String(course._id),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const { title, description, category, thumbnail, isPublished } = req.body ?? {};

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Enforce ownership: only the instructor who created it or admin can edit
    if (
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to modify this course.",
      });
    }

    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    if (category !== undefined) course.category = category.trim();
    if (thumbnail !== undefined) course.thumbnail = thumbnail.trim();
    if (isPublished !== undefined) course.isPublished = Boolean(isPublished);

    await course.save();

    res.json({
      message: "Course updated successfully.",
      course: {
        ...course.toObject(),
        id: String(course._id),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to delete this course.",
      });
    }

    await Lesson.deleteMany({ course: course._id });
    await CourseProgress.deleteMany({ course: course._id });
    await Quiz.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(course._id);

    res.json({ message: "Course and related lessons deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function getInstructorCourses(req, res, next) {
  try {
    // If admin, return all courses. If instructor, return courses they own, or unassigned seeded courses
    const filter =
      req.auth.role === "admin"
        ? {}
        : {
            $or: [
              { instructor: req.auth.userId },
              { instructor: null },
            ],
          };

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const courseIds = courses.map((c) => c._id);

    // Aggregate statistics for instructor dashboard
    const progressStats = await CourseProgress.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: "$course",
          totalStudents: { $sum: 1 },
          completedStudents: {
            $sum: {
              $cond: [{ $gte: ["$completedLessons", 1] }, 1, 0],
            },
          },
          avgCompletedLessons: { $avg: "$completedLessons" },
        },
      },
    ]);

    const statsMap = new Map(
      progressStats.map((stat) => [String(stat._id), stat])
    );

    const result = courses.map((course) => {
      const stats = statsMap.get(String(course._id));
      return {
        ...course,
        id: String(course._id),
        enrolledStudents: stats?.totalStudents ?? 0,
        activeStudents: stats?.completedStudents ?? 0,
        avgCompletedLessons: Math.round(stats?.avgCompletedLessons ?? 0),
      };
    });

    res.json({ courses: result });
  } catch (error) {
    next(error);
  }
}

export async function getCourseStats(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to view stats for this course.",
      });
    }

    const progressRecords = await CourseProgress.find({ course: courseId })
      .populate("student", "name email")
      .lean();

    const totalStudents = progressRecords.length;
    const completedStudents = progressRecords.filter(
      (p) => course.totalLessons > 0 && p.completedLessons >= course.totalLessons
    ).length;

    const totalLessons = course.totalLessons;
    const studentList = progressRecords.map((p) => ({
      studentId: p.student?._id,
      name: p.student?.name || "Anonymous Student",
      email: p.student?.email || "",
      completedLessons: p.completedLessons,
      totalLessons,
      progressPercentage: totalLessons
        ? Math.round((p.completedLessons / totalLessons) * 100)
        : 0,
      lastAccessedAt: p.lastAccessedAt,
    }));

    res.json({
      course: {
        id: String(course._id),
        title: course.title,
        totalLessons,
      },
      stats: {
        totalStudents,
        completedStudents,
        completionRate: totalStudents
          ? Math.round((completedStudents / totalStudents) * 100)
          : 0,
        students: studentList,
      },
    });
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
        percentage: course.totalLessons
          ? Math.round((progress.completedLessons / course.totalLessons) * 100)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function enrolInCourse(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const progress = await CourseProgress.findOneAndUpdate(
      {
        student: req.auth.userId,
        course: course._id,
      },
      {
        $setOnInsert: {
          completedLessons: 0,
          completedLessonIds: [],
          lastAccessedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      message: "Enrolled in course successfully.",
      courseId: String(course._id),
      progress: {
        completedLessons: progress.completedLessons,
        totalLessons: course.totalLessons,
        percentage: course.totalLessons
          ? Math.round((progress.completedLessons / course.totalLessons) * 100)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

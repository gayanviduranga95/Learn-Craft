import mongoose from "mongoose";
import Quiz from "../models/quiz.model.js";
import QuizAttempt from "../models/quiz-attempt.model.js";
import Course from "../models/course.model.js";

export async function getCourseQuizzes(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const isInstructor =
      req.auth.role === "admin" ||
      (course.instructor && String(course.instructor) === req.auth.userId);

    const query = { course: courseId };
    if (!isInstructor) {
      query.isPublished = true;
    }

    const quizzes = await Quiz.find(query).sort({ createdAt: 1 }).lean();

    // Fetch user attempts to show completion/scores
    const attempts = await QuizAttempt.find({
      student: req.auth.userId,
      course: courseId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const attemptsByQuiz = new Map();
    for (const attempt of attempts) {
      const qId = String(attempt.quiz);
      if (!attemptsByQuiz.has(qId)) {
        attemptsByQuiz.set(qId, attempt);
      }
    }

    const sanitizedQuizzes = quizzes.map((quiz) => {
      const latestAttempt = attemptsByQuiz.get(String(quiz._id));

      let questions = quiz.questions;
      if (!isInstructor) {
        // Strip out correct answer indices so students cannot inspect client-side state
        questions = quiz.questions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
        }));
      }

      return {
        id: String(quiz._id),
        title: quiz.title,
        description: quiz.description,
        courseId: String(quiz.course),
        totalQuestions: quiz.questions.length,
        passingScorePercentage: quiz.passingScorePercentage,
        isPublished: quiz.isPublished,
        questions,
        latestAttempt: latestAttempt
          ? {
              score: latestAttempt.score,
              totalQuestions: latestAttempt.totalQuestions,
              percentage: latestAttempt.percentage,
              passed: latestAttempt.passed,
              attemptedAt: latestAttempt.attemptedAt,
            }
          : null,
      };
    });

    res.json({ quizzes: sanitizedQuizzes });
  } catch (error) {
    next(error);
  }
}

export async function getQuizById(req, res, next) {
  try {
    const { quizId } = req.params;

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    const quiz = await Quiz.findById(quizId).populate("course", "title instructor").lean();
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const isInstructor =
      req.auth.role === "admin" ||
      (quiz.course?.instructor && String(quiz.course.instructor) === req.auth.userId);

    const pastAttempts = await QuizAttempt.find({
      student: req.auth.userId,
      quiz: quizId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    let questions = quiz.questions;
    if (!isInstructor) {
      questions = quiz.questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
      }));
    }

    res.json({
      quiz: {
        id: String(quiz._id),
        title: quiz.title,
        description: quiz.description,
        courseId: String(quiz.course?._id || quiz.course),
        courseTitle: quiz.course?.title || "Course",
        passingScorePercentage: quiz.passingScorePercentage,
        totalQuestions: quiz.questions.length,
        questions,
        attempts: pastAttempts.map((a) => ({
          id: String(a._id),
          score: a.score,
          totalQuestions: a.totalQuestions,
          percentage: a.percentage,
          passed: a.passed,
          attemptedAt: a.attemptedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function submitQuiz(req, res, next) {
  try {
    const { quizId } = req.params;
    const { answers } = req.body ?? {};

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers array is required." });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    // Evaluated server-side to prevent tampering
    const evaluatedAnswers = quiz.questions.map((question, index) => {
      // Find student's submission for this question
      const submitted = answers.find((a) => a.questionIndex === index);
      const selectedOptionIndex =
        submitted !== undefined ? Number(submitted.selectedOptionIndex) : -1;

      const isCorrect = selectedOptionIndex === question.correctOptionIndex;
      if (isCorrect) {
        correctCount += 1;
      }

      return {
        questionIndex: index,
        questionText: question.questionText,
        options: question.options,
        selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation || "",
      };
    });

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= quiz.passingScorePercentage;

    const attempt = await QuizAttempt.create({
      student: req.auth.userId,
      quiz: quiz._id,
      course: quiz.course,
      answers: evaluatedAnswers.map((ea) => ({
        questionIndex: ea.questionIndex,
        selectedOptionIndex: ea.selectedOptionIndex,
        isCorrect: ea.isCorrect,
      })),
      score: correctCount,
      totalQuestions,
      percentage,
      passed,
    });

    res.json({
      message: passed ? "Congratulations! You passed the quiz." : "Keep studying and try again!",
      result: {
        attemptId: String(attempt._id),
        score: correctCount,
        totalQuestions,
        percentage,
        passingScorePercentage: quiz.passingScorePercentage,
        passed,
        evaluatedAnswers,
        attemptedAt: attempt.attemptedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createQuiz(req, res, next) {
  try {
    const { courseId, lessonId, title, description, passingScorePercentage, questions } =
      req.body ?? {};

    if (!courseId || !title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Course ID, quiz title, and at least one question are required.",
      });
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
        message: "You do not have permission to add quizzes to this course.",
      });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({
          message: `Question ${i + 1} must have question text and at least 2 options.`,
        });
      }
      if (
        typeof q.correctOptionIndex !== "number" ||
        q.correctOptionIndex < 0 ||
        q.correctOptionIndex >= q.options.length
      ) {
        return res.status(400).json({
          message: `Question ${i + 1} has an invalid correctOptionIndex.`,
        });
      }
    }

    const quiz = await Quiz.create({
      course: courseId,
      lesson: lessonId && mongoose.isValidObjectId(lessonId) ? lessonId : null,
      instructor: req.auth.userId,
      title: title.trim(),
      description: (description || "").trim(),
      passingScorePercentage: Number(passingScorePercentage) || 70,
      questions,
      isPublished: true,
    });

    res.status(201).json({
      message: "Quiz created successfully.",
      quiz: {
        ...quiz.toObject(),
        id: String(quiz._id),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const { quizId } = req.params;
    const { title, description, passingScorePercentage, questions, isPublished } = req.body ?? {};

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const course = await Course.findById(quiz.course);
    if (
      course &&
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to modify this quiz.",
      });
    }

    if (title !== undefined) quiz.title = title.trim();
    if (description !== undefined) quiz.description = description.trim();
    if (passingScorePercentage !== undefined)
      quiz.passingScorePercentage = Math.max(0, Math.min(100, Number(passingScorePercentage) || 70));
    if (isPublished !== undefined) quiz.isPublished = Boolean(isPublished);
    if (Array.isArray(questions)) {
      quiz.questions = questions;
    }

    await quiz.save();

    res.json({
      message: "Quiz updated successfully.",
      quiz: {
        ...quiz.toObject(),
        id: String(quiz._id),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const { quizId } = req.params;

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const course = await Course.findById(quiz.course);
    if (
      course &&
      course.instructor &&
      String(course.instructor) !== req.auth.userId &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have permission to delete this quiz.",
      });
    }

    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await Quiz.findByIdAndDelete(quiz._id);

    res.json({ message: "Quiz deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function getQuizStats(req, res, next) {
  try {
    const { quizId } = req.params;

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    const quiz = await Quiz.findById(quizId).populate("course", "title instructor").lean();
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const totalAttempts = attempts.length;
    const passedCount = attempts.filter((a) => a.passed).length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
        : 0;

    res.json({
      quiz: {
        id: String(quiz._id),
        title: quiz.title,
        courseTitle: quiz.course?.title,
      },
      stats: {
        totalAttempts,
        passedCount,
        passRate: totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0,
        averagePercentage: avgScore,
        recentAttempts: attempts.slice(0, 20).map((a) => ({
          id: String(a._id),
          studentName: a.student?.name || "Student",
          score: a.score,
          totalQuestions: a.totalQuestions,
          percentage: a.percentage,
          passed: a.passed,
          attemptedAt: a.attemptedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

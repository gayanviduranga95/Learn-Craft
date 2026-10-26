import mongoose from "mongoose";
import User from "../models/user.model.js";
import XPTransaction from "../models/xp-transaction.model.js";
import CoinTransaction from "../models/coin-transaction.model.js";
import UserAchievement from "../models/achievement.model.js";
import CourseProgress from "../models/course-progress.model.js";
import QuizAttempt from "../models/quiz-attempt.model.js";
import {
  ACHIEVEMENTS,
  calculateLevelDetails,
  SHOP_CATALOG,
} from "../config/gamification.config.js";

/**
 * Get the current student's full gamification profile:
 * XP, lifetime XP, level details, streak, coin balance, achievements, and transaction history.
 */
export async function getGamificationProfile(req, res, next) {
  try {
    const studentId = req.auth.userId;

    const user = await User.findById(studentId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const lifetimeXp = Math.max(user.lifetimeXp || 0, user.xp || 0);
    const levelInfo = calculateLevelDetails(lifetimeXp);

    // Fetch student's earned achievements
    const earnedAchievements = await UserAchievement.find({
      student: studentId,
    }).lean();

    const earnedMap = new Map();
    for (const ea of earnedAchievements) {
      earnedMap.set(ea.achievementId, ea.unlockedAt);
    }

    const achievementsList = ACHIEVEMENTS.map((ach) => ({
      ...ach,
      unlocked: earnedMap.has(ach.id),
      unlockedAt: earnedMap.get(ach.id) || null,
    }));

    // Fetch recent XP ledger entries
    const recentXpTransactions = await XPTransaction.find({
      student: studentId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Fetch recent Coin transactions
    const recentCoinTransactions = await CoinTransaction.find({
      student: studentId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Compute learning stats
    const [progressDocs, passedQuizzesCount] = await Promise.all([
      CourseProgress.find({ student: studentId }).lean(),
      QuizAttempt.countDocuments({ student: studentId, passed: true }),
    ]);

    let totalLessonsCompleted = 0;
    for (const p of progressDocs) {
      totalLessonsCompleted += p.completedLessonIds?.length || p.completedLessons || 0;
    }

    // Determine if student has completed an activity today
    const nowUtc = new Date().toISOString().slice(0, 10);
    const todayCompleted = user.streak?.lastActivityDate === nowUtc;

    res.json({
      success: true,
      data: {
        xp: user.xp || 0,
        lifetimeXp,
        coins: user.coins || 0,
        level: levelInfo.level,
        levelDetails: levelInfo,
        equippedFrame: user.equippedFrame || "default",
        equippedTheme: user.equippedTheme || "default",
        streak: {
          current: user.streak?.current || 0,
          longest: user.streak?.longest || 0,
          lastActivityDate: user.streak?.lastActivityDate || null,
          todayCompleted,
        },
        stats: {
          lessonsCompleted: totalLessonsCompleted,
          quizzesPassed: passedQuizzesCount,
          achievementsUnlocked: earnedAchievements.length,
          totalAchievements: ACHIEVEMENTS.length,
        },
        achievements: achievementsList,
        recentXpTransactions,
        recentCoinTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
}

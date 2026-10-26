import mongoose from "mongoose";
import User from "../models/user.model.js";
import XPTransaction from "../models/xp-transaction.model.js";
import CoinTransaction from "../models/coin-transaction.model.js";
import UserAchievement from "../models/achievement.model.js";
import CourseProgress from "../models/course-progress.model.js";
import QuizAttempt from "../models/quiz-attempt.model.js";
import {
  REWARD_CONFIG,
  ACHIEVEMENTS,
  calculateLevelDetails,
} from "../config/gamification.config.js";

/**
 * Core Reward Engine
 * Idempotently awards XP and coins, writes ledgers, updates level, and evaluates achievements.
 */
export async function awardReward({
  studentId,
  eventType,
  targetId,
  xp,
  coins = 0,
  description = "",
}) {
  if (!studentId || !eventType || !targetId) {
    throw new Error("Missing required parameters for awardReward.");
  }

  const safeXp = Math.max(0, Number(xp) || 0);
  const safeCoins = Math.max(0, Number(coins) || 0);
  const idempotencyKey = `${studentId}:${eventType}:${String(targetId)}`;

  // 1. Attempt to insert XP transaction with unique idempotencyKey
  let tx;
  try {
    tx = await XPTransaction.create({
      student: studentId,
      eventType,
      targetId: String(targetId),
      idempotencyKey,
      xpAwarded: safeXp,
      description,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate reward prevented by idempotency index
      return {
        awarded: false,
        reason: "already_awarded",
        idempotencyKey,
      };
    }
    throw err;
  }

  // 2. Atomically update User XP, lifetime XP, and Coins
  const user = await User.findById(studentId);
  if (!user) {
    throw new Error(`User not found: ${studentId}`);
  }

  // Preserve existing XP if lifetimeXp wasn't set yet
  const prevLifetimeXp = Math.max(user.lifetimeXp || 0, user.xp || 0);
  const newLifetimeXp = prevLifetimeXp + safeXp;
  const newXp = (user.xp || 0) + safeXp;
  const newCoins = (user.coins || 0) + safeCoins;

  const levelInfo = calculateLevelDetails(newLifetimeXp);

  user.xp = newXp;
  user.lifetimeXp = newLifetimeXp;
  user.coins = newCoins;
  user.level = levelInfo.level;
  await user.save();

  // 3. Record CoinTransaction if coins were earned
  if (safeCoins > 0) {
    await CoinTransaction.create({
      student: studentId,
      type: "earn",
      amount: safeCoins,
      balanceAfter: newCoins,
      source: eventType,
      referenceId: String(targetId),
      description: description || `Earned from ${eventType}`,
    });
  }

  // 4. Update learning streak and daily goal if applicable
  const streakResult = await updateStreak(studentId);

  // 5. Evaluate and award any newly unlocked achievements
  const newAchievements = await evaluateAchievements(studentId);

  return {
    awarded: true,
    xpAwarded: safeXp,
    coinsAwarded: safeCoins,
    totalXp: newXp,
    lifetimeXp: newLifetimeXp,
    coins: newCoins,
    level: levelInfo.level,
    levelDetails: levelInfo,
    streak: streakResult,
    newAchievements,
  };
}

/**
 * Evaluates and updates student's daily learning streak in UTC
 */
export async function updateStreak(studentId) {
  const user = await User.findById(studentId);
  if (!user) return null;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const streak = user.streak || { current: 0, longest: 0, lastActivityDate: null };
  const lastDate = streak.lastActivityDate;

  let streakUpdated = false;
  let isDailyGoalAwarded = false;

  if (lastDate !== todayStr) {
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastDate === yesterdayStr) {
      streak.current += 1;
    } else {
      streak.current = 1;
    }

    if (streak.current > (streak.longest || 0)) {
      streak.longest = streak.current;
    }

    streak.lastActivityDate = todayStr;
    user.streak = streak;
    await user.save();
    streakUpdated = true;

    // Daily learning goal reward (awarded once per UTC day)
    try {
      const dailyReward = await awardReward({
        studentId,
        eventType: "daily_goal",
        targetId: todayStr,
        xp: REWARD_CONFIG.DAILY_GOAL.xp,
        coins: REWARD_CONFIG.DAILY_GOAL.coins,
        description: `Daily learning goal: ${todayStr}`,
      });
      if (dailyReward.awarded) {
        isDailyGoalAwarded = true;
      }
    } catch (e) {
      // Ignore if already awarded or error in nested call
    }
  }

  return {
    current: user.streak?.current || 1,
    longest: user.streak?.longest || 1,
    lastActivityDate: user.streak?.lastActivityDate || todayStr,
    streakUpdated,
    isDailyGoalAwarded,
  };
}

/**
 * Checks all milestone rules and awards any unlocked achievements
 */
export async function evaluateAchievements(studentId) {
  const unlocked = [];

  // Gather student learning metrics
  const [progressDocs, quizAttempts, user] = await Promise.all([
    CourseProgress.find({ student: studentId }),
    QuizAttempt.find({ student: studentId, passed: true }),
    User.findById(studentId),
  ]);

  if (!user) return unlocked;

  // Compute lesson totals
  let totalLessonsCompleted = 0;
  for (const p of progressDocs) {
    totalLessonsCompleted += p.completedLessonIds?.length || p.completedLessons || 0;
  }

  const perfectQuizzes = quizAttempts.filter((q) => q.percentage === 100);
  const currentStreak = user.streak?.current || 0;

  // Check each achievement condition
  for (const ach of ACHIEVEMENTS) {
    let qualifies = false;

    switch (ach.id) {
      case "first_lesson":
        qualifies = totalLessonsCompleted >= 1;
        break;
      case "three_lessons":
        qualifies = totalLessonsCompleted >= 3;
        break;
      case "five_lessons":
        qualifies = totalLessonsCompleted >= 5;
        break;
      case "first_quiz":
        qualifies = quizAttempts.length >= 1;
        break;
      case "perfect_quiz":
        qualifies = perfectQuizzes.length >= 1;
        break;
      case "streak_3":
        qualifies = currentStreak >= 3;
        break;
      case "streak_7":
        qualifies = currentStreak >= 7;
        break;
      default:
        break;
    }

    if (qualifies) {
      try {
        const doc = await UserAchievement.create({
          student: studentId,
          achievementId: ach.id,
          title: ach.title,
          description: ach.description,
          xpAwarded: ach.xpReward,
          coinsAwarded: ach.coinReward,
        });

        // Award achievement rewards to student
        if (ach.xpReward > 0 || ach.coinReward > 0) {
          await awardReward({
            studentId,
            eventType: "achievement_reward",
            targetId: ach.id,
            xp: ach.xpReward,
            coins: ach.coinReward,
            description: `Achievement unlocked: ${ach.title}`,
          });
        }

        unlocked.push({
          id: ach.id,
          title: ach.title,
          description: ach.description,
          xpReward: ach.xpReward,
          coinReward: ach.coinReward,
          unlockedAt: doc.unlockedAt,
        });
      } catch (err) {
        // Duplicate key (E11000) means already unlocked - safely ignore
        if (err.code !== 11000) {
          console.warn(`Error unlocking achievement ${ach.id}:`, err);
        }
      }
    }
  }

  return unlocked;
}

import mongoose from "mongoose";
import GameSession from "../models/game-session.model.js";
import Quiz from "../models/quiz.model.js";
import UserAchievement from "../models/achievement.model.js";
import { awardReward } from "../services/reward.service.js";
import { REWARD_CONFIG } from "../config/gamification.config.js";

// Educational question bank for Quiz Rush
const EDUCATIONAL_QUESTION_BANK = [
  {
    questionText: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyper Transfer Markup Link",
      "Home Tool Management Language",
    ],
    correctOptionIndex: 0,
    explanation: "HTML stands for HyperText Markup Language, the standard markup language for documents designed to be displayed in a web browser.",
  },
  {
    questionText: "Which data structure follows a First-In, First-Out (FIFO) order?",
    options: ["Stack", "Queue", "Binary Tree", "Hash Map"],
    correctOptionIndex: 1,
    explanation: "A Queue operates on a FIFO basis, where the first element added is the first one to be removed.",
  },
  {
    questionText: "In JavaScript, which keyword declares a variable that cannot be reassigned?",
    options: ["var", "let", "const", "static"],
    correctOptionIndex: 2,
    explanation: "The const keyword creates a block-scoped variable whose reference cannot be reassigned.",
  },
  {
    questionText: "Which HTTP status code indicates that a new resource was created successfully?",
    options: ["200 OK", "201 Created", "204 No Content", "401 Unauthorized"],
    correctOptionIndex: 1,
    explanation: "HTTP 201 Created indicates that the request has succeeded and led to the creation of a new resource.",
  },
  {
    questionText: "What is an algorithm in computer science?",
    options: [
      "A computer brand",
      "A step-by-step procedure to solve a specific problem",
      "A hardware component",
      "A programming language syntax error",
    ],
    correctOptionIndex: 1,
    explanation: "An algorithm is a finite, well-defined sequence of instructions to solve a class of problems or perform a computation.",
  },
  {
    questionText: "Which data type has only two possible values: true or false?",
    options: ["Integer", "String", "Boolean", "Float"],
    correctOptionIndex: 2,
    explanation: "A Boolean represents truth values in logic and programming, evaluateable to true or false.",
  },
  {
    questionText: "What does CSS stand for in web development?",
    options: [
      "Cascading Style Sheets",
      "Computer Science Syntax",
      "Creative Styling System",
      "Code Sheet Styling",
    ],
    correctOptionIndex: 0,
    explanation: "CSS stands for Cascading Style Sheets, used to style the presentation of HTML documents.",
  },
  {
    questionText: "What is the primary purpose of a database index?",
    options: [
      "To store image thumbnails",
      "To significantly speed up data query and retrieval operations",
      "To compress data for storage saving",
      "To encrypt passwords",
    ],
    correctOptionIndex: 1,
    explanation: "A database index creates a fast lookup structure that drastically improves search query execution time.",
  },
  {
    questionText: "Which type of loop will always execute its body at least once before checking the condition?",
    options: ["for loop", "while loop", "do...while loop", "foreach loop"],
    correctOptionIndex: 2,
    explanation: "A do...while loop tests its condition at the end of the loop, ensuring the block runs at least once.",
  },
  {
    questionText: "In Git, which command records indexed changes permanently into the project history?",
    options: ["git push", "git status", "git commit", "git merge"],
    correctOptionIndex: 2,
    explanation: "git commit takes a snapshot of staged changes and records it in the repository history.",
  },
];

// Concept pairs for Memory Match
const MEMORY_CONCEPTS = [
  { term: "Algorithm", def: "A step-by-step set of instructions to solve a problem" },
  { term: "Variable", def: "A named memory container used to store dynamic data values" },
  { term: "Boolean", def: "A fundamental logic type holding either true or false" },
  { term: "Array", def: "An ordered collection of items accessible by numerical index" },
  { term: "Function", def: "A reusable block of code designed to perform a specific task" },
  { term: "API", def: "An interface allowing different software programs to communicate" },
  { term: "Database", def: "An organized collection of structured data stored electronically" },
  { term: "Loop", def: "A control structure that repeats instructions until a condition is met" },
  { term: "Debugging", def: "The systematic process of finding and fixing errors in code" },
  { term: "Syntax", def: "The grammar rules that dictate how computer code must be written" },
];

/**
 * 1. Start a Quiz Rush Session
 */
export async function startQuizRush(req, res, next) {
  try {
    const studentId = req.auth.userId;
    const difficulty = req.query.difficulty || "medium";

    let count = 5;
    if (difficulty === "medium") count = 7;
    if (difficulty === "hard") count = 10;

    // Pick random questions from bank
    const shuffled = [...EDUCATIONAL_QUESTION_BANK].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Create session in MongoDB
    const session = await GameSession.create({
      student: studentId,
      gameType: "quiz_rush",
      difficulty,
      questionData: selected, // Stored server-side only
      startedAt: new Date(),
      status: "active",
    });

    // Strip answers from response to prevent cheating
    const clientQuestions = selected.map((q, idx) => ({
      index: idx,
      questionText: q.questionText,
      options: q.options,
    }));

    res.json({
      success: true,
      sessionId: String(session._id),
      difficulty,
      timeLimitSeconds: 60,
      totalQuestions: clientQuestions.length,
      questions: clientQuestions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Submit Quiz Rush Session
 */
export async function submitQuizRush(req, res, next) {
  try {
    const studentId = req.auth.userId;
    const { sessionId, answers, timeElapsedSeconds } = req.body || {};

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID." });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers array is required." });
    }

    // Include questionData to grade
    const session = await GameSession.findOne({
      _id: sessionId,
      student: studentId,
    }).select("+questionData");

    if (!session) {
      return res.status(404).json({ message: "Game session not found." });
    }

    if (session.status !== "active") {
      return res.status(400).json({ message: "Game session already completed." });
    }

    const elapsed = Math.max(1, Number(timeElapsedSeconds) || 60);
    const questions = session.questionData || [];
    let correctCount = 0;

    const evaluated = questions.map((q, idx) => {
      const sub = answers.find((a) => a.index === idx);
      const selected = sub ? Number(sub.selectedOptionIndex) : -1;
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      return {
        index: idx,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: selected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const isPassing = percentage >= 60;

    // Check anti-farming: Max daily sessions per student
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const completedTodayCount = await GameSession.countDocuments({
      student: studentId,
      gameType: "quiz_rush",
      status: "completed",
      completedAt: { $gte: todayStart },
    });

    let reward = null;
    let earnedXp = 0;
    let earnedCoins = 0;

    if (isPassing && completedTodayCount < REWARD_CONFIG.QUIZ_RUSH.maxDailyRewardedSessions) {
      earnedXp =
        REWARD_CONFIG.QUIZ_RUSH.baseXp +
        correctCount * REWARD_CONFIG.QUIZ_RUSH.perCorrectXp;
      earnedCoins =
        REWARD_CONFIG.QUIZ_RUSH.baseCoins +
        correctCount * REWARD_CONFIG.QUIZ_RUSH.perCorrectCoins;

      if (percentage === 100) {
        earnedXp += REWARD_CONFIG.QUIZ_RUSH.perfectBonusXp;
        earnedCoins += REWARD_CONFIG.QUIZ_RUSH.perfectBonusCoins;
      }

      reward = await awardReward({
        studentId,
        eventType: "game_quiz_rush",
        targetId: String(session._id),
        xp: earnedXp,
        coins: earnedCoins,
        description: `Quiz Rush (${session.difficulty}): ${correctCount}/${total} correct (${percentage}%)`,
      });

      // Special achievement: Arcade Champion
      if (percentage >= 80) {
        try {
          await UserAchievement.create({
            student: studentId,
            achievementId: "arcade_champion",
            title: "Arcade Champion",
            description: "Score over 80% in Quiz Rush",
            xpAwarded: 40,
            coinsAwarded: 20,
          });
          await awardReward({
            studentId,
            eventType: "achievement_reward",
            targetId: "arcade_champion",
            xp: 40,
            coins: 20,
            description: "Unlocked Arcade Champion",
          });
        } catch (e) {
          // Already unlocked
        }
      }
    }

    session.status = "completed";
    session.score = percentage;
    session.timeSeconds = elapsed;
    session.xpAwarded = earnedXp;
    session.coinsAwarded = earnedCoins;
    session.completedAt = new Date();
    await session.save();

    res.json({
      success: true,
      result: {
        score: percentage,
        correctCount,
        totalQuestions: total,
        timeElapsedSeconds: elapsed,
        passed: isPassing,
        evaluated,
        reward,
        dailySessionsRemaining: Math.max(
          0,
          REWARD_CONFIG.QUIZ_RUSH.maxDailyRewardedSessions - (completedTodayCount + 1)
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Start a Memory Match Session
 */
export async function startMemoryMatch(req, res, next) {
  try {
    const studentId = req.auth.userId;
    const difficulty = req.query.difficulty || "medium";

    let pairCount = 6;
    if (difficulty === "medium") pairCount = 8;
    if (difficulty === "hard") pairCount = 10;

    const shuffledConcepts = [...MEMORY_CONCEPTS]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount);

    // Build cards deck
    const deck = [];
    shuffledConcepts.forEach((c, idx) => {
      const pairId = `pair_${idx + 1}`;
      deck.push({
        id: `card_${idx + 1}_term`,
        pairId,
        content: c.term,
        kind: "term",
      });
      deck.push({
        id: `card_${idx + 1}_def`,
        pairId,
        content: c.def,
        kind: "def",
      });
    });

    // Shuffle the deck
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);

    const session = await GameSession.create({
      student: studentId,
      gameType: "memory_match",
      difficulty,
      questionData: shuffledConcepts,
      startedAt: new Date(),
      status: "active",
    });

    res.json({
      success: true,
      sessionId: String(session._id),
      difficulty,
      pairCount,
      totalCards: shuffledDeck.length,
      cards: shuffledDeck,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Submit Memory Match Session
 */
export async function submitMemoryMatch(req, res, next) {
  try {
    const studentId = req.auth.userId;
    const { sessionId, moves, timeSeconds } = req.body || {};

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID." });
    }

    const session = await GameSession.findOne({
      _id: sessionId,
      student: studentId,
    });

    if (!session) {
      return res.status(404).json({ message: "Game session not found." });
    }

    if (session.status !== "active") {
      return res.status(400).json({ message: "Session already completed." });
    }

    const safeMoves = Math.max(1, Number(moves) || 12);
    const safeTime = Math.max(1, Number(timeSeconds) || 60);

    // Anti-cheat verification: humanly possible completion thresholds
    if (safeTime < 6) {
      return res.status(400).json({
        message: "Invalid completion metrics: Time elapsed is implausible.",
      });
    }

    // Check daily reward sessions limit
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const completedToday = await GameSession.countDocuments({
      student: studentId,
      gameType: "memory_match",
      status: "completed",
      completedAt: { $gte: todayStart },
    });

    let earnedXp = 0;
    let earnedCoins = 0;
    let reward = null;

    if (completedToday < REWARD_CONFIG.MEMORY_MATCH.maxDailyRewardedSessions) {
      earnedXp = REWARD_CONFIG.MEMORY_MATCH.baseXp;
      earnedCoins = REWARD_CONFIG.MEMORY_MATCH.baseCoins;

      if (safeTime <= 60) {
        earnedXp += REWARD_CONFIG.MEMORY_MATCH.perfectBonusXp;
        earnedCoins += REWARD_CONFIG.MEMORY_MATCH.perfectBonusCoins;
      }

      reward = await awardReward({
        studentId,
        eventType: "game_memory_match",
        targetId: String(session._id),
        xp: earnedXp,
        coins: earnedCoins,
        description: `Memory Match completed: ${safeMoves} moves in ${safeTime}s`,
      });

      // Special achievement: Memory Master (under 60s)
      if (safeTime <= 60) {
        try {
          await UserAchievement.create({
            student: studentId,
            achievementId: "memory_master",
            title: "Memory Master",
            description: "Complete Memory Match in under 60 seconds",
            xpAwarded: 40,
            coinsAwarded: 20,
          });
          await awardReward({
            studentId,
            eventType: "achievement_reward",
            targetId: "memory_master",
            xp: 40,
            coins: 20,
            description: "Unlocked Memory Master",
          });
        } catch (e) {
          // Already unlocked
        }
      }
    }

    session.status = "completed";
    session.score = Math.max(10, Math.round(100 - safeTime * 0.5 - safeMoves));
    session.timeSeconds = safeTime;
    session.xpAwarded = earnedXp;
    session.coinsAwarded = earnedCoins;
    session.completedAt = new Date();
    await session.save();

    res.json({
      success: true,
      result: {
        moves: safeMoves,
        timeSeconds: safeTime,
        reward,
        dailySessionsRemaining: Math.max(
          0,
          REWARD_CONFIG.MEMORY_MATCH.maxDailyRewardedSessions - (completedToday + 1)
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

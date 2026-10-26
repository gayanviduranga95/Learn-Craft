/**
 * LearnCraft Gamification System Configuration
 * Central source of truth for rewards, level calculations, and game economy.
 */

export const REWARD_CONFIG = {
  // Core Learning Rewards
  LESSON_COMPLETION: {
    xp: 20,
    coins: 5,
    description: "Verified lesson completion",
  },
  QUIZ_PASS: {
    xp: 50,
    coins: 15,
    description: "Passed course quiz",
  },
  QUIZ_PERFECT_BONUS: {
    xp: 20,
    coins: 10,
    description: "100% perfect quiz score bonus",
  },
  COURSE_COMPLETION: {
    xp: 200,
    coins: 50,
    description: "Completed full course curriculum",
  },
  DAILY_GOAL: {
    xp: 10,
    coins: 5,
    description: "Daily learning goal achieved",
  },

  // Arcade Rewards
  QUIZ_RUSH: {
    baseXp: 15,
    baseCoins: 10,
    perCorrectXp: 5,
    perCorrectCoins: 2,
    perfectBonusXp: 20,
    perfectBonusCoins: 15,
    maxDailyRewardedSessions: 5,
  },
  MEMORY_MATCH: {
    baseXp: 15,
    baseCoins: 10,
    perfectBonusXp: 15,
    perfectBonusCoins: 10,
    maxDailyRewardedSessions: 5,
  },
};

/**
 * Level curve progression thresholds:
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 250 XP
 * Level 4: 450 XP
 * Level 5: 700 XP
 * Level 6: 1000 XP
 * Level 7: 1400 XP
 * Level 8: 1900 XP
 * Level 9: 2500 XP
 * Level 10: 3200 XP
 */
export function getLevelThresholds() {
  const thresholds = [0];
  let current = 0;
  for (let lvl = 2; lvl <= 100; lvl++) {
    const step = 50 + (lvl - 1) * 50;
    current += step;
    thresholds.push(current);
  }
  return thresholds;
}

const THRESHOLDS = getLevelThresholds();

export const LEVEL_TITLES = [
  "Curious Novice",
  "Eager Explorer",
  "Knowledge Apprentice",
  "Skill Seeker",
  "Code Pathfinder",
  "Logic Crafter",
  "Concept Master",
  "Grand Scholar",
  "Master Thinker",
  "LearnCraft Legend",
];

export function calculateLevelDetails(lifetimeXp = 0) {
  const safeXp = Math.max(0, Number(lifetimeXp) || 0);

  let level = 1;
  for (let i = 1; i < THRESHOLDS.length; i++) {
    if (safeXp >= THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentLevelFloor = THRESHOLDS[level - 1] || 0;
  const nextLevelCeiling = THRESHOLDS[level] || currentLevelFloor + 1000;
  const xpInLevel = safeXp - currentLevelFloor;
  const xpNeeded = nextLevelCeiling - currentLevelFloor;
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpInLevel / xpNeeded) * 100))
  );

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    title,
    lifetimeXp: safeXp,
    currentLevelFloor,
    nextLevelCeiling,
    xpInLevel,
    xpNeeded,
    progressPercentage,
  };
}

export const ACHIEVEMENTS = [
  {
    id: "first_lesson",
    title: "First Steps",
    description: "Complete your first lesson",
    icon: "Star",
    category: "learning",
    badgeColor: "blue",
    xpReward: 25,
    coinReward: 10,
  },
  {
    id: "three_lessons",
    title: "Goal Getter",
    description: "Complete 3 lessons",
    icon: "Target",
    category: "learning",
    badgeColor: "green",
    xpReward: 50,
    coinReward: 20,
  },
  {
    id: "five_lessons",
    title: "Knowledge Seeker",
    description: "Complete 5 lessons",
    icon: "Medal",
    category: "learning",
    badgeColor: "purple",
    xpReward: 75,
    coinReward: 30,
  },
  {
    id: "first_quiz",
    title: "Quiz Novice",
    description: "Pass your first quiz",
    icon: "CheckCircle",
    category: "quiz",
    badgeColor: "cyan",
    xpReward: 50,
    coinReward: 20,
  },
  {
    id: "perfect_quiz",
    title: "Perfectionist",
    description: "Score 100% on any quiz",
    icon: "Sparkles",
    category: "quiz",
    badgeColor: "yellow",
    xpReward: 75,
    coinReward: 35,
  },
  {
    id: "course_complete",
    title: "Course Master",
    description: "Complete a full course curriculum",
    icon: "Trophy",
    category: "course",
    badgeColor: "orange",
    xpReward: 150,
    coinReward: 50,
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "Maintain a 3-day learning streak",
    icon: "Flame",
    category: "streak",
    badgeColor: "red",
    xpReward: 50,
    coinReward: 25,
  },
  {
    id: "streak_7",
    title: "Unstoppable",
    description: "Maintain a 7-day learning streak",
    icon: "Zap",
    category: "streak",
    badgeColor: "gold",
    xpReward: 100,
    coinReward: 50,
  },
  {
    id: "arcade_champion",
    title: "Arcade Champion",
    description: "Score over 80 points in Quiz Rush",
    icon: "Gamepad2",
    category: "arcade",
    badgeColor: "purple",
    xpReward: 40,
    coinReward: 20,
  },
  {
    id: "memory_master",
    title: "Memory Master",
    description: "Complete Memory Match in under 60 seconds",
    icon: "Brain",
    category: "arcade",
    badgeColor: "teal",
    xpReward: 40,
    coinReward: 20,
  },
  {
    id: "shop_shopper",
    title: "Style Icon",
    description: "Purchase your first cosmetic shop item",
    icon: "ShoppingBag",
    category: "shop",
    badgeColor: "pink",
    xpReward: 25,
    coinReward: 10,
  },
];

export const SHOP_CATALOG = [
  {
    id: "frame_neon_cyan",
    name: "Neon Cyber Frame",
    description: "A glowing futuristic cyan aura for your avatar.",
    type: "frame",
    price: 50,
    icon: "Zap",
    previewColor: "#00e5f5",
    cssClass: "avatar-frame-neon",
  },
  {
    id: "frame_gold_royale",
    name: "Golden Crown Frame",
    description: "A prestigious royal gold border for top achievers.",
    type: "frame",
    price: 100,
    icon: "Crown",
    previewColor: "#f59e0b",
    cssClass: "avatar-frame-gold",
  },
  {
    id: "frame_cosmic_nebula",
    name: "Cosmic Nebula Frame",
    description: "An animated galactic galaxy swirl for cosmic learners.",
    type: "frame",
    price: 150,
    icon: "Sparkles",
    previewColor: "#a855f7",
    cssClass: "avatar-frame-nebula",
  },
  {
    id: "theme_arcade_retro",
    name: "Retro Arcade Theme",
    description: "Classic 80s synthwave vaporwave card theme.",
    type: "theme",
    price: 80,
    icon: "Gamepad2",
    previewColor: "#ec4899",
    cssClass: "theme-retro-arcade",
  },
  {
    id: "theme_emerald_matrix",
    name: "Emerald Matrix Theme",
    description: "Hacker-green cyber matrix accents for your dashboard.",
    type: "theme",
    price: 80,
    icon: "Terminal",
    previewColor: "#10b981",
    cssClass: "theme-emerald-matrix",
  },
  {
    id: "accessory_ai_apprentice",
    name: "AI Spark Pin",
    description: "An exclusive digital badge pin showing your AI curiosity.",
    type: "accessory",
    price: 40,
    icon: "Bot",
    previewColor: "#3b82f6",
    cssClass: "accessory-ai-pin",
  },
];

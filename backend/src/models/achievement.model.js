import mongoose from "mongoose";

const userAchievementSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
    coinsAwarded: {
      type: Number,
      default: 0,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate achievement unlocks per student
userAchievementSchema.index(
  { student: 1, achievementId: 1 },
  { unique: true }
);

export const UserAchievement = mongoose.model(
  "UserAchievement",
  userAchievementSchema
);

export default UserAchievement;

import mongoose from "mongoose";

const xpTransactionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "lesson_complete",
        "quiz_pass",
        "quiz_perfect",
        "course_complete",
        "daily_goal",
        "game_quiz_rush",
        "game_memory_match",
        "achievement_reward",
      ],
    },
    targetId: {
      type: String,
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    xpAwarded: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user reward history and leaderboards
xpTransactionSchema.index({ student: 1, createdAt: -1 });
xpTransactionSchema.index({ createdAt: 1, xpAwarded: 1 });

export default mongoose.model("XPTransaction", xpTransactionSchema);

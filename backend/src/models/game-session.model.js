import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameType: {
      type: String,
      required: true,
      enum: ["quiz_rush", "memory_match"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    questionData: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
      select: false, // Hidden by default to prevent client viewing answers
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    score: {
      type: Number,
      default: 0,
    },
    timeSeconds: {
      type: Number,
      default: 0,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
    coinsAwarded: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

gameSessionSchema.index({ student: 1, gameType: 1, createdAt: -1 });

export default mongoose.model("GameSession", gameSessionSchema);

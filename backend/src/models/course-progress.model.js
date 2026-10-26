
import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    completedLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedLessonIds: {
      type: [String],
      default: [],
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

courseProgressSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

export default mongoose.model("CourseProgress", courseProgressSchema);

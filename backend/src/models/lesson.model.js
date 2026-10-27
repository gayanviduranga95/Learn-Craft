
import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    content: {
      type: String,
      default: "",
    },
    durationMinutes: {
      type: Number,
      default: 10,
      min: 1,
    },
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 }, { unique: true });

export default mongoose.model("Lesson", lessonSchema);

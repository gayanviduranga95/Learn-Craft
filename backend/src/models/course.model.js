
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    totalLessons: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);

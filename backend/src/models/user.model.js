
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatar: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    coins: {
      type: Number,
      default: 50,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    equippedFrame: {
      type: String,
      default: "default",
    },
    equippedTheme: {
      type: String,
      default: "default",
    },
    streak: {
      current: { type: Number, default: 0, min: 0 },
      longest: { type: Number, default: 0, min: 0 },
      lastActivityDate: { type: String, default: null },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationTokenHash: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordTokenExpires: {
      type: Date,
    },
    themePreference: {
      type: String,
      enum: ["system", "light", "dark"],
      default: "system",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model("User", userSchema);

export default User;

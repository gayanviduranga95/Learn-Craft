import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import courseRoutes from "./routes/course.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import gamificationRoutes from "./routes/gamification.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import arcadeRoutes from "./routes/arcade.routes.js";
import shopRoutes from "./routes/shop.routes.js";

const app = express();

// Safe proxy trust for Vercel / reverse proxy deployments.
// Trust 1 hop (the immediate front-facing reverse proxy).
// Express will derive req.ip from the client IP verified by the proxy,
// preventing ValidationError in express-rate-limit and stopping spoofing.
app.set("trust proxy", 1);

app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim().replace(/\/+$/, ""))
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      const cleanOrigin = origin ? origin.replace(/\/+$/, "") : null;
      if (!cleanOrigin || allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

// Serverless DB connection middleware (ensures Mongoose is connected on Vercel requests)
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();
    } catch (err) {
      console.warn("Serverless DB connection warning:", err.message);
    }
  }
  next();
});

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({
    name: "LearnCraft API",
    message: "Welcome to the LearnCraft backend.",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/arcade", arcadeRoutes);
app.use("/api/shop", shopRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected server error occurred.",
  });
});

export default app;
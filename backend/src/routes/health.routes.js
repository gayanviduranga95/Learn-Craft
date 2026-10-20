import { Router } from "express";
import { getDatabaseStatus } from "../config/database.js";

const router = Router();

router.get("/", (req, res) => {
  const database = getDatabaseStatus();
  const healthy = database === "connected";

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy
      ? "LearnCraft API is running."
      : "LearnCraft database is not connected.",
    data: {
      api: "running",
      database,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
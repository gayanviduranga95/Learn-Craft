
import dns from "node:dns";

// Use Google's public DNS for MongoDB Atlas SRV lookups.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`LearnCraft API: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start LearnCraft:", error.message);
    process.exit(1);
  }
}

startServer();

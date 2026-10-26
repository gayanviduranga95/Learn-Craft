
import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

let connectionPromise = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from the environment variables.");
  }

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((conn) => {
      console.log("MongoDB Atlas connected successfully.");
      connectionPromise = null;
      return conn;
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

export function getDatabaseStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] ?? "unknown";
}

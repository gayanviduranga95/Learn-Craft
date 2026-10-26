

import dns from "node:dns";

dns.setServers(["1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";
import Course from "../src/models/course.model.js";


const courses = [
  {
    title: "Mathematics",
    description: "Build mathematical knowledge and problem-solving skills.",
    category: "Mathematics",
    totalLessons: 12,
  },
  {
    title: "Science",
    description: "Explore scientific concepts and discoveries.",
    category: "Science",
    totalLessons: 10,
  },
  {
    title: "Computer Science",
    description: "Learn computing concepts and programming fundamentals.",
    category: "Technology",
    totalLessons: 8,
  },
  {
    title: "English",
    description: "Improve English language and communication skills.",
    category: "Languages",
    totalLessons: 10,
  },
  {
    title: "Creative Learning",
    description: "Develop creativity through practical learning activities.",
    category: "Creative Learning",
    totalLessons: 6,
  },
];

async function seedCourses() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from your backend environment.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const course of courses) {
    await Course.updateOne(
      { title: course.title },
      { $setOnInsert: course },
      { upsert: true }
    );
  }

  console.log("Course seed completed.");
}

try {
  await seedCourses();
} catch (error) {
  console.error("Course seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

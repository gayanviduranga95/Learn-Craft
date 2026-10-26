
import dns from "node:dns";

dns.setServers(["1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";
import Course from "../src/models/course.model.js";
import Lesson from "../src/models/lesson.model.js";

const lessonTemplates = {
  Mathematics: [
    "Introduction to Mathematics",
    "Understanding Variables",
    "Algebraic Expressions",
    "Solving Linear Equations",
    "Working with Equations",
    "Fractions and Ratios",
    "Percentages",
    "Powers and Exponents",
    "Problem-Solving Strategies",
    "Applied Mathematics",
    "Practice Exercises",
    "Course Review",
  ],
  Science: [
    "Introduction to Science",
    "Matter and Its Properties",
    "States of Matter",
    "Energy Fundamentals",
    "Forces and Motion",
    "Heat and Temperature",
    "Light and Sound",
    "Scientific Experiments",
    "Understanding Observations",
    "Science Review",
  ],
  "Computer Science": [
    "Introduction to Computing",
    "Algorithms and Logic",
    "Programming Fundamentals",
    "Variables and Data Types",
    "Conditions and Loops",
    "Functions",
    "Problem Solving",
    "Programming Practice",
  ],
  English: [
    "Reading Fundamentals",
    "Vocabulary Building",
    "Grammar Essentials",
    "Sentence Construction",
    "Reading Comprehension",
    "Writing Clearly",
    "Listening Skills",
    "Speaking with Confidence",
    "Communication Practice",
    "English Review",
  ],
  "Creative Learning": [
    "Introduction to Creative Thinking",
    "Finding and Developing Ideas",
    "Design Fundamentals",
    "Problem-Solving Methods",
    "Creative Challenge",
    "Project Review",
  ],
};

async function seedLessons() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the backend environment.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const [courseTitle, titles] of Object.entries(lessonTemplates)) {
    const course = await Course.findOne({ title: courseTitle });

    if (!course) {
      console.warn(`Skipping "${courseTitle}": course not found.`);
      continue;
    }

    for (let index = 0; index < titles.length; index += 1) {
      const title = titles[index];

      await Lesson.updateOne(
        { course: course._id, order: index + 1 },
        {
          $setOnInsert: {
            course: course._id,
            title,
            description: `Learn the fundamentals of ${title.toLowerCase()}.`,
            order: index + 1,
            durationMinutes: 10,
            content: `Welcome to ${title}. Study the key concepts and complete the lesson activities.`,
            isPublished: true,
          },
        },
        { upsert: true }
      );
    }

    // Keep the course's lesson count consistent with its lesson records.
    await Course.updateOne(
      { _id: course._id },
      { $set: { totalLessons: titles.length } }
    );

    console.log(`Seeded ${titles.length} lessons for ${courseTitle}.`);
  }
}

try {
  await seedLessons();
  console.log("Lesson seeding completed.");
} catch (error) {
  console.error("Lesson seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

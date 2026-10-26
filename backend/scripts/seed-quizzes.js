import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import "dotenv/config";
import mongoose from "mongoose";
import Course from "../src/models/course.model.js";
import Quiz from "../src/models/quiz.model.js";

const sampleQuizzes = {
  Mathematics: {
    title: "Mathematics Mastery Quiz",
    description: "Test your understanding of algebra, equations, and mathematical problem solving.",
    passingScorePercentage: 70,
    questions: [
      {
        questionText: "What is the value of x in the linear equation 2x + 6 = 14?",
        options: ["2", "4", "6", "8"],
        correctOptionIndex: 1,
        explanation: "Subtract 6 from both sides to get 2x = 8, then divide by 2 to get x = 4.",
      },
      {
        questionText: "Which of the following is equivalent to 3(2y - 4)?",
        options: ["6y - 4", "5y - 7", "6y - 12", "6y + 12"],
        correctOptionIndex: 2,
        explanation: "Distribute 3 to both terms: 3 * 2y = 6y and 3 * -4 = -12, yielding 6y - 12.",
      },
      {
        questionText: "What is 25% written as a simplified fraction?",
        options: ["1/2", "1/4", "1/5", "2/5"],
        correctOptionIndex: 1,
        explanation: "25% equals 25/100, which simplifies to 1/4 when dividing both numerator and denominator by 25.",
      },
      {
        questionText: "If a rectangle has length 8 cm and width 5 cm, what is its perimeter?",
        options: ["40 cm", "26 cm", "13 cm", "20 cm"],
        correctOptionIndex: 1,
        explanation: "Perimeter = 2 * (length + width) = 2 * (8 + 5) = 2 * 13 = 26 cm.",
      },
    ],
  },
  Science: {
    title: "Science & Discovery Quiz",
    description: "Demonstrate your knowledge of matter, energy, and scientific principles.",
    passingScorePercentage: 75,
    questions: [
      {
        questionText: "Which state of matter has a fixed volume but takes the shape of its container?",
        options: ["Solid", "Liquid", "Gas", "Plasma"],
        correctOptionIndex: 1,
        explanation: "Liquids have a definite volume but conform to the shape of whatever vessel holds them.",
      },
      {
        questionText: "What form of energy is stored within an object due to its position or state?",
        options: ["Kinetic energy", "Potential energy", "Thermal energy", "Sound energy"],
        correctOptionIndex: 1,
        explanation: "Potential energy is stored energy waiting to be released based on position or configuration.",
      },
      {
        questionText: "Which gas do plants absorb during the process of photosynthesis?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correctOptionIndex: 2,
        explanation: "Plants take in Carbon Dioxide (CO2) and release Oxygen during photosynthesis.",
      },
      {
        questionText: "What is the primary unit used to measure force in physics?",
        options: ["Joule", "Watt", "Newton", "Pascal"],
        correctOptionIndex: 2,
        explanation: "The Newton (N) is the SI unit of force named after Sir Isaac Newton.",
      },
    ],
  },
  "Computer Science": {
    title: "Programming Fundamentals Quiz",
    description: "Challenge your computing knowledge on algorithms, loops, and logic.",
    passingScorePercentage: 70,
    questions: [
      {
        questionText: "What is a finite, step-by-step procedure for solving a computational problem?",
        options: ["Algorithm", "Variable", "Compiler", "Bandwidth"],
        correctOptionIndex: 0,
        explanation: "An algorithm is a well-defined sequence of instructions designed to accomplish a specific task.",
      },
      {
        questionText: "Which data type would be best suited to store whether a user is logged in (true/false)?",
        options: ["String", "Integer", "Boolean", "Float"],
        correctOptionIndex: 2,
        explanation: "Boolean variables represent truth values: either true or false.",
      },
      {
        questionText: "What programming construct is used to execute a block of code repeatedly while a condition holds true?",
        options: ["Condition", "Loop", "Function return", "Comment"],
        correctOptionIndex: 1,
        explanation: "Loops (such as while loops and for loops) repeat code execution based on conditions.",
      },
      {
        questionText: "What is the index of the very first element in zero-indexed programming languages like JavaScript?",
        options: ["-1", "0", "1", "null"],
        correctOptionIndex: 1,
        explanation: "Zero-based indexing starts counting array positions from index 0.",
      },
    ],
  },
};

async function seedQuizzes() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const [courseTitle, quizData] of Object.entries(sampleQuizzes)) {
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      console.warn(`Course "${courseTitle}" not found, skipping quiz.`);
      continue;
    }

    await Quiz.updateOne(
      { course: course._id, title: quizData.title },
      {
        $set: {
          course: course._id,
          title: quizData.title,
          description: quizData.description,
          passingScorePercentage: quizData.passingScorePercentage,
          questions: quizData.questions,
          isPublished: true,
        },
      },
      { upsert: true }
    );

    console.log(`Seeded quiz for ${courseTitle}.`);
  }
}

try {
  await seedQuizzes();
  console.log("Quiz seeding completed successfully.");
} catch (err) {
  console.error("Quiz seeding error:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

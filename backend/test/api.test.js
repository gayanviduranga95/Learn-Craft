import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import "dotenv/config";
process.env.NODE_ENV = "test";
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "learncraft-test-client-id.apps.googleusercontent.com";
import http from "node:http";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";
import User from "../src/models/user.model.js";
import Course from "../src/models/course.model.js";
import Lesson from "../src/models/lesson.model.js";
import Quiz from "../src/models/quiz.model.js";
import XPTransaction from "../src/models/xp-transaction.model.js";
import CoinTransaction from "../src/models/coin-transaction.model.js";
import UserAchievement from "../src/models/achievement.model.js";
import GameSession from "../src/models/game-session.model.js";
import UserInventory from "../src/models/shop.model.js";
import { awardReward } from "../src/services/reward.service.js";
import bcrypt from "bcrypt";

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else if (contentType.includes("application/pdf")) {
    data = await res.arrayBuffer();
  } else {
    data = await res.text();
  }

  // Extract set-cookie
  const setCookie = res.headers.get("set-cookie") || "";

  return { status: res.status, ok: res.ok, data, headers: res.headers, setCookie };
}

function parseCookie(setCookieStr) {
  if (!setCookieStr) return "";
  const match = setCookieStr.match(/learncraft_token=([^;]+)/);
  return match ? `learncraft_token=${match[1]}` : "";
}

async function runTests() {
  console.log("==========================================");
  console.log("LearnCraft LMS - Automated Integration Test");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await connectDatabase();

    // Start server on an ephemeral port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on port ${port}\n`);

    // 1. Health check
    console.log("[1] Health Check & Root API");
    const healthRes = await request("/api/health");
    assert(healthRes.status === 200 && healthRes.data?.success === true && healthRes.data?.data?.database === "connected", "Health endpoint responds healthy with connected database");

    // 2. Authentication - Student Registration
    console.log("\n[2] Authentication - Student & Instructor Registration");
    const testStamp = Date.now();
    const studentEmail = `student_${testStamp}@test.local`;
    const instructorEmail = `instructor_${testStamp}@test.local`;
    const instructor2Email = `instructor2_${testStamp}@test.local`;

    const regStudentRes = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Student",
        email: studentEmail,
        password: "Password123!",
        role: "student",
      }),
    });
    assert(regStudentRes.status === 201, "Student account registered successfully");
    assert(regStudentRes.data?.data?.user?.role === "student", "Role defaults/assigned to student");

    const regInstructorRes = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Instructor",
        email: instructorEmail,
        password: "Password123!",
        role: "instructor",
      }),
    });
    assert(regInstructorRes.status === 201, "Instructor account registered successfully");
    assert(regInstructorRes.data?.data?.user?.role === "instructor", "Role assigned to instructor");

    const regInstructor2Res = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Second Instructor",
        email: instructor2Email,
        password: "Password123!",
        role: "instructor",
      }),
    });
    assert(regInstructor2Res.status === 201, "Second instructor account registered successfully");

    // 3. Login & HttpOnly Cookie
    console.log("\n[3] Login & HttpOnly Cookie Verification");
    const wrongLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: studentEmail, password: "WrongPassword!" }),
    });
    assert(wrongLogin.status === 401, "Invalid password rejected with 401");

    const studentLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: studentEmail, password: "Password123!" }),
    });
    assert(studentLogin.status === 200, "Student logged in successfully");
    const studentCookie = parseCookie(studentLogin.setCookie);
    assert(studentCookie.includes("learncraft_token="), "HttpOnly learncraft_token cookie received");

    const instructorLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: instructorEmail, password: "Password123!" }),
    });
    const instructorCookie = parseCookie(instructorLogin.setCookie);
    assert(instructorCookie.includes("learncraft_token="), "Instructor cookie received");

    const instructor2Login = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: instructor2Email, password: "Password123!" }),
    });
    const instructor2Cookie = parseCookie(instructor2Login.setCookie);
    assert(instructor2Cookie.includes("learncraft_token="), "Second instructor cookie received");

    // 4. Current User Session Check
    console.log("\n[4] Session Persistence & /api/auth/me");
    const meRes = await request("/api/auth/me", {
      headers: { Cookie: studentCookie },
    });
    assert(meRes.status === 200 && meRes.data?.data?.user?.email === studentEmail, "GET /api/auth/me returns valid user info");

    // 5. Role Authorization Check
    console.log("\n[5] Role-Based Authorization Enforcement");
    const studentCreateCourse = await request("/api/courses", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ title: `Course_${testStamp}`, category: "Tech" }),
    });
    assert(studentCreateCourse.status === 403, "Student blocked from creating course (403 Forbidden)");

    const instructorCreateCourse = await request("/api/courses", {
      method: "POST",
      headers: { Cookie: instructorCookie },
      body: JSON.stringify({
        title: `Advanced Web Dev ${testStamp}`,
        category: "Technology",
        description: "Modern full-stack engineering",
      }),
    });
    assert(instructorCreateCourse.status === 201, "Instructor can create course (201 Created)");
    const createdCourseId = instructorCreateCourse.data?.course?.id;

    // Course update permissions test
    const updateCourseRes = await request(`/api/courses/${createdCourseId}`, {
      method: "PUT",
      headers: { Cookie: instructorCookie },
      body: JSON.stringify({
        title: `Updated Advanced Web Dev ${testStamp}`,
      }),
    });
    assert(updateCourseRes.status === 200 && updateCourseRes.data?.course?.title.startsWith("Updated"), "Owner instructor can update course details");

    // Student cannot update course
    const studentUpdateRes = await request(`/api/courses/${createdCourseId}`, {
      method: "PUT",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ title: "Unauthorized Title" }),
    });
    assert(studentUpdateRes.status === 403, "Student blocked from modifying course (403 Forbidden)");

    // Non-owner instructor cannot update course
    const otherInstructorUpdateRes = await request(`/api/courses/${createdCourseId}`, {
      method: "PUT",
      headers: { Cookie: instructor2Cookie },
      body: JSON.stringify({ title: "Hijacked Title" }),
    });
    assert(otherInstructorUpdateRes.status === 403, "Non-owner instructor blocked from modifying other's course (403 Forbidden)");

    // 6. Instructor Lesson Management & Ownership
    console.log("\n[6] Lesson Management & Instructor Ownership");
    const createLessonRes = await request(`/api/lessons/courses/${createdCourseId}`, {
      method: "POST",
      headers: { Cookie: instructorCookie },
      body: JSON.stringify({
        title: "Introduction to Antigravity Agents",
        description: "Understanding full stack automated agents",
        content: "Detailed lesson reading material.",
        durationMinutes: 15,
      }),
    });
    assert(createLessonRes.status === 201, "Instructor can add lesson to their course");
    const createdLessonId = createLessonRes.data?.lesson?.id;

    // 7. Course & Lesson Catalog & Enrolment
    console.log("\n[7] Course Catalog, Enrolment & Progress Workflow");
    const coursesRes = await request("/api/courses", {
      headers: { Cookie: studentCookie },
    });
    assert(coursesRes.status === 200 && Array.isArray(coursesRes.data?.courses), "Courses catalog returned");

    // Student course enrolment
    const enrolRes = await request(`/api/courses/${createdCourseId}/enrol`, {
      method: "POST",
      headers: { Cookie: studentCookie },
    });
    assert(enrolRes.status === 200, "Student successfully enrols in course (200 OK)");

    // Duplicate enrolment idempotency
    const dupEnrolRes = await request(`/api/courses/${createdCourseId}/enrol`, {
      method: "POST",
      headers: { Cookie: studentCookie },
    });
    assert(dupEnrolRes.status === 200, "Duplicate enrolment is idempotent and preserves integrity");

    const lessonsRes = await request(`/api/lessons/courses/${createdCourseId}`, {
      headers: { Cookie: studentCookie },
    });
    assert(lessonsRes.status === 200 && lessonsRes.data?.lessons?.length >= 1, "Course lessons retrieved for student");

    // Mark lesson complete
    const completeRes = await request(`/api/lessons/courses/${createdCourseId}/lessons/${createdLessonId}/complete`, {
      method: "POST",
      headers: { Cookie: studentCookie },
    });
    assert(completeRes.status === 200 && completeRes.data?.progress?.completedLessons === 1, "Student marks lesson complete and progress updates");

    // 8. Quiz System & Server-Side Scoring
    console.log("\n[8] Quiz Creation, Sanitization & Tamper-Proof Evaluation");
    const createQuizRes = await request("/api/quizzes", {
      method: "POST",
      headers: { Cookie: instructorCookie },
      body: JSON.stringify({
        courseId: createdCourseId,
        title: "Agent Systems Knowledge Check",
        description: "Verify core concepts",
        passingScorePercentage: 50,
        questions: [
          {
            questionText: "What does LMS stand for?",
            options: ["Lightweight Modern Server", "Learning Management System", "Local Machine Store"],
            correctOptionIndex: 1,
            explanation: "LMS stands for Learning Management System.",
          },
          {
            questionText: "Which HTTP cookie attribute prevents client-side JavaScript access?",
            options: ["HttpOnly", "SameSite", "Secure"],
            correctOptionIndex: 0,
            explanation: "HttpOnly cookies cannot be read by document.cookie.",
          },
        ],
      }),
    });
    assert(createQuizRes.status === 201, "Instructor can create multi-choice quiz");
    const quizId = createQuizRes.data?.quiz?.id;

    // Student fetches quiz - verify answers are hidden
    const studentQuizRes = await request(`/api/quizzes/${quizId}`, {
      headers: { Cookie: studentCookie },
    });
    const studentQuestion = studentQuizRes.data?.quiz?.questions?.[0];
    assert(studentQuestion && studentQuestion.correctOptionIndex === undefined, "Student quiz hides correctOptionIndex to prevent cheating");

    // Submit answers
    const submitQuizRes = await request(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({
        answers: [
          { questionIndex: 0, selectedOptionIndex: 1 }, // correct
          { questionIndex: 1, selectedOptionIndex: 0 }, // correct
        ],
      }),
    });
    assert(submitQuizRes.status === 200 && submitQuizRes.data?.result?.score === 2, "Quiz answers scored server-side (Score: 2/2)");
    assert(submitQuizRes.data?.result?.passed === true, "Student passed quiz with 100%");

    // 9. Certificate Verification & PDF Generation
    console.log("\n[9] Certificate Verification & PDF Generation");
    const certEligibilityRes = await request(`/api/certificates/${createdCourseId}/eligibility`, {
      headers: { Cookie: studentCookie },
    });
    assert(certEligibilityRes.status === 200 && certEligibilityRes.data?.eligible === true, "Completed course student is verified eligible for certificate");

    const certDownloadRes = await request(`/api/certificates/${createdCourseId}/download`, {
      headers: { Cookie: studentCookie },
    });
    assert(certDownloadRes.status === 200, "Certificate PDF generated and downloaded");
    assert(certDownloadRes.headers.get("content-type") === "application/pdf", "Content-Type is application/pdf");
    assert(certDownloadRes.data.byteLength > 1000, "PDF binary size is valid (>1000 bytes)");

    // Unauthorized certificate rejection test
    const mathCourse = await Course.findOne({ title: "Mathematics" });
    if (mathCourse) {
      const incompleteDownload = await request(`/api/certificates/${mathCourse._id}/download`, {
        headers: { Cookie: studentCookie },
      });
      assert(incompleteDownload.status === 403, "Certificate rejected for course with incomplete requirements (403 Forbidden)");
    }

    // 10. AI Tutor Endpoint
    console.log("\n[10] AI Tutor Endpoint");
    const aiRes = await request("/api/ai/chat", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({
        message: "Can you explain variables in programming with a simple analogy?",
        history: [],
      }),
    });
    assert(aiRes.status === 200 && typeof aiRes.data?.data?.reply === "string", "AI Tutor endpoint provides educational guidance");

    // 11. Logout
    console.log("\n[11] Logout & Cookie Invalidation");
    const logoutRes = await request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: studentCookie },
    });
    assert(logoutRes.status === 200, "Logout endpoint succeeds");
    const clearCookieHeader = logoutRes.headers.get("set-cookie") || "";
    assert(clearCookieHeader.includes("learncraft_token=") && (clearCookieHeader.includes("Expires=") || clearCookieHeader.includes("Max-Age=0")), "Logout clears HttpOnly cookie");

    // 12. Google Authentication & Safe Account Linking
    console.log("\n[12] Google Sign-In, Token Validation & Account Linking");

    // 12.1 Missing ID token
    const missingTokenRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assert(missingTokenRes.status === 400, "Rejects request when Google ID token is missing (400 Bad Request)");

    // 12.2 Invalid / unverified token
    const invalidTokenRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: "invalid_gibberish_token" }),
    });
    assert(invalidTokenRes.status === 401, "Rejects invalid or unverified Google token (401 Unauthorized)");

    // 12.3 Expired token
    const expiredToken = "test_google_token:" + JSON.stringify({
      sub: "expired_sub_123",
      email: "expired@test.local",
      isExpired: true,
    });
    const expiredTokenRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: expiredToken }),
    });
    assert(expiredTokenRes.status === 401, "Rejects expired Google token (401 Unauthorized)");

    // 12.4 Audience mismatch
    const badAudienceToken = "test_google_token:" + JSON.stringify({
      sub: "mismatch_sub_123",
      email: "mismatch@test.local",
      aud: "wrong-client-id.apps.googleusercontent.com",
    });
    const badAudRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: badAudienceToken }),
    });
    assert(badAudRes.status === 401, "Rejects token with incorrect audience (401 Unauthorized)");

    // 12.5 Unverified email
    const unverifiedEmailToken = "test_google_token:" + JSON.stringify({
      sub: "unverified_sub_123",
      email: "unverified@test.local",
      email_verified: false,
    });
    const unverifiedRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: unverifiedEmailToken }),
    });
    assert(unverifiedRes.status === 403, "Rejects Google identity when email is not verified (403 Forbidden)");

    // 12.6 New Google user registration & role escalation prevention
    const googleStudentEmail = `google_student_${testStamp}@test.local`;
    const googleSub = `google_sub_${testStamp}`;
    const validNewUserToken = "test_google_token:" + JSON.stringify({
      sub: googleSub,
      email: googleStudentEmail,
      email_verified: true,
      name: "Google Learner",
      picture: "https://example.com/avatar.jpg",
    });

    const newGoogleUserRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({
        idToken: validNewUserToken,
        role: "admin", // Malicious attempt to escalate role
      }),
    });
    assert(newGoogleUserRes.status === 201, "Registers new LearnCraft user via verified Google token (201 Created)");
    assert(newGoogleUserRes.data?.data?.user?.role === "student", "Enforces safe default role 'student' (rejection of role escalation)");
    assert(newGoogleUserRes.data?.data?.user?.avatar === "https://example.com/avatar.jpg", "Google profile picture persisted as avatar");
    const googleUserCookie = parseCookie(newGoogleUserRes.setCookie);
    assert(googleUserCookie.includes("learncraft_token="), "HttpOnly session cookie issued on Google registration");

    // 12.7 Session persistence for Google authenticated user
    const googleMeRes = await request("/api/auth/me", {
      headers: { Cookie: googleUserCookie },
    });
    assert(googleMeRes.status === 200 && googleMeRes.data?.data?.user?.email === googleStudentEmail, "Session persists after Google sign-in via /api/auth/me");

    // 12.8 Returning Google user login
    const returningGoogleRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: validNewUserToken }),
    });
    assert(returningGoogleRes.status === 200, "Returning Google user signs in successfully (200 OK)");
    assert(returningGoogleRes.data?.data?.user?.email === googleStudentEmail, "Correct existing account returned without duplicating records");

    // 12.9 Safe account linking: existing email/password account collision
    const existingLocalEmail = `existing_instructor_${testStamp}@test.local`;
    await User.create({
      name: "Local Instructor",
      email: existingLocalEmail,
      passwordHash: await bcrypt.hash("SecurePass123!", 10),
      role: "instructor",
    });

    const matchingEmailGoogleToken = "test_google_token:" + JSON.stringify({
      sub: `google_instructor_sub_${testStamp}`,
      email: existingLocalEmail,
      email_verified: true,
      name: "Local Instructor Google",
    });

    // Attempting Google sign-in without password confirmation
    const unconfirmedLinkRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: matchingEmailGoogleToken }),
    });
    assert(unconfirmedLinkRes.status === 409 && unconfirmedLinkRes.data?.requiresLinking === true, "Requires explicit password verification when email matches existing local account (409 Conflict)");

    // Linking with wrong password
    const wrongPassLinkRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({
        idToken: matchingEmailGoogleToken,
        linkAccountPassword: "WrongPassword!",
      }),
    });
    assert(wrongPassLinkRes.status === 401, "Rejects account linking when password is incorrect (401 Unauthorized)");

    // Linking with correct password
    const validLinkRes = await request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({
        idToken: matchingEmailGoogleToken,
        linkAccountPassword: "SecurePass123!",
      }),
    });
    assert(validLinkRes.status === 200, "Successfully links Google identity upon correct password verification (200 OK)");
    assert(validLinkRes.data?.data?.user?.role === "instructor", "Preserves existing instructor role after account linking");

    const linkedUserInDb = await User.findOne({ email: existingLocalEmail });
    assert(linkedUserInDb?.googleId === `google_instructor_sub_${testStamp}`, "Google subject ID safely associated with existing MongoDB document");

    // ==========================================
    // 13. Gamification Engine: XP, Levels, Arcade & Shop
    // ==========================================
    console.log("\n[13] Gamification Engine: XP, Levels, Arcade & Shop");

    const studentUser = await User.findOne({ email: studentEmail });

    // 13.1 Gamification Profile
    const profileRes = await request("/api/gamification/profile", {
      headers: { Cookie: studentCookie },
    });
    assert(profileRes.status === 200, "Gamification profile endpoint returns 200 OK");
    assert(typeof profileRes.data?.data?.level === "number", "Profile contains numeric level");
    assert(typeof profileRes.data?.data?.coins === "number", "Profile contains Game Coins balance");
    assert(Array.isArray(profileRes.data?.data?.achievements), "Profile contains achievements list");

    // 13.2 Verified Lesson Completion Awards XP Once
    const createLesson2Res = await request(`/api/lessons/courses/${createdCourseId}`, {
      method: "POST",
      headers: { Cookie: instructorCookie },
      body: JSON.stringify({
        title: "Advanced Gamification Patterns",
        description: "Deep dive into reward ledgers",
        content: "Detailed reading on XP and ledgers.",
        durationMinutes: 20,
      }),
    });
    const lesson2Id = createLesson2Res.data?.lesson?.id;

    const lessonCompletionRes = await request(
      `/api/lessons/courses/${createdCourseId}/lessons/${lesson2Id}/complete`,
      {
        method: "POST",
        headers: { Cookie: studentCookie },
      }
    );
    assert(lessonCompletionRes.status === 200, "Lesson complete returns 200 OK");
    assert(
      lessonCompletionRes.data?.reward?.awarded === true &&
        lessonCompletionRes.data?.reward?.xpAwarded === 20,
      "Verified lesson completion awards 20 XP"
    );

    // 13.3 Repeated Lesson Completion Does Not Award Duplicate XP
    const repeatLessonRes = await request(
      `/api/lessons/courses/${createdCourseId}/lessons/${lesson2Id}/complete`,
      {
        method: "POST",
        headers: { Cookie: studentCookie },
      }
    );
    assert(repeatLessonRes.status === 200, "Repeat lesson complete returns 200 OK");
    assert(
      repeatLessonRes.data?.reward === null,
      "Repeated lesson completion does not award duplicate XP"
    );

    // 13.4 Concurrent Reward Requests Idempotency Protection
    const testTargetId = `concurrent_test_${testStamp}`;
    const [cRes1, cRes2] = await Promise.all([
      awardReward({
        studentId: studentUser._id,
        eventType: "lesson_complete",
        targetId: testTargetId,
        xp: 20,
        coins: 5,
        description: "Concurrent test 1",
      }),
      awardReward({
        studentId: studentUser._id,
        eventType: "lesson_complete",
        targetId: testTargetId,
        xp: 20,
        coins: 5,
        description: "Concurrent test 2",
      }),
    ]);
    const awards = [cRes1.awarded, cRes2.awarded];
    assert(
      awards.filter(Boolean).length === 1,
      "Concurrent reward requests with identical key cannot duplicate rewards"
    );

    // 13.5 Quiz Passing and Perfect Score Bonus Rewards
    // Duplicate submission of already-passed quiz does not re-award XP
    const repeatQuizSubmitRes = await request(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({
        answers: [
          { questionIndex: 0, selectedOptionIndex: 1 },
          { questionIndex: 1, selectedOptionIndex: 0 },
        ],
      }),
    });
    assert(
      repeatQuizSubmitRes.data?.result?.quizReward?.awarded === false,
      "Duplicate quiz submission does not award duplicate XP (idempotency enforced)"
    );

    // Create a new quiz to test first-time pass & 100% perfect bonus rewards
    const createQuiz2Res = await request("/api/quizzes", {
      method: "POST",
      headers: { Cookie: instructorCookie },
      body: JSON.stringify({
        courseId: createdCourseId,
        title: "Gamification Architecture Check",
        description: "Test reward engine understanding",
        passingScorePercentage: 50,
        questions: [
          {
            questionText: "What distinguishes Lifetime XP from Game Coins?",
            options: ["Coins determine level, XP is spent", "XP determines level, Coins are spent", "They are identical"],
            correctOptionIndex: 1,
            explanation: "Lifetime XP tracks level and rank, whereas Game Coins are spent in the shop.",
          },
        ],
      }),
    });
    const quiz2Id = createQuiz2Res.data?.quiz?.id;

    const quiz2SubmitRes = await request(`/api/quizzes/${quiz2Id}/submit`, {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({
        answers: [{ questionIndex: 0, selectedOptionIndex: 1 }],
      }),
    });
    assert(quiz2SubmitRes.status === 200, "Quiz 2 submit returns 200 OK");
    assert(
      quiz2SubmitRes.data?.result?.quizReward?.awarded === true &&
        quiz2SubmitRes.data?.result?.quizReward?.xpAwarded === 50,
      "Passing new quiz awards 50 XP"
    );
    assert(
      quiz2SubmitRes.data?.result?.perfectBonus?.awarded === true &&
        quiz2SubmitRes.data?.result?.perfectBonus?.xpAwarded === 20,
      "100% perfect quiz score awards 20 bonus XP"
    );

    // 13.6 Client Cannot Modify XP
    const fakeXpAttemptRes = await request("/api/gamification/profile", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ xp: 999999, coins: 888888 }),
    });
    // POST /api/gamification/profile does not exist or rejects
    assert(
      fakeXpAttemptRes.status === 404 || fakeXpAttemptRes.status === 405,
      "XP cannot be modified by client requests"
    );

    // 13.7 Arcade Game: Quiz Rush (Server-side validation)
    const quizRushStartRes = await request("/api/arcade/quiz-rush/start?difficulty=easy", {
      headers: { Cookie: studentCookie },
    });
    assert(quizRushStartRes.status === 200, "Quiz Rush start returns 200 OK");
    assert(
      Array.isArray(quizRushStartRes.data?.questions) &&
        quizRushStartRes.data.questions.length > 0,
      "Quiz Rush returns questions"
    );
    assert(
      quizRushStartRes.data.questions[0].correctOptionIndex === undefined,
      "Quiz Rush hides correct answers from client to prevent tampering"
    );

    const quizRushSessionId = quizRushStartRes.data.sessionId;
    const quizRushSubmitRes = await request("/api/arcade/quiz-rush/submit", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({
        sessionId: quizRushSessionId,
        answers: quizRushStartRes.data.questions.map((q) => ({
          index: q.index,
          selectedOptionIndex: 0,
        })),
        timeElapsedSeconds: 30,
      }),
    });
    assert(quizRushSubmitRes.status === 200, "Quiz Rush submit returns 200 OK");
    assert(
      typeof quizRushSubmitRes.data?.result?.score === "number",
      "Quiz Rush score is calculated and verified server-side"
    );

    // 13.8 Arcade Game: Memory Match
    const memoryMatchStartRes = await request("/api/arcade/memory-match/start?difficulty=easy", {
      headers: { Cookie: studentCookie },
    });
    assert(memoryMatchStartRes.status === 200, "Memory Match start returns 200 OK");
    assert(
      Array.isArray(memoryMatchStartRes.data?.cards) && memoryMatchStartRes.data.cards.length === 12,
      "Memory Match generates 12 cards for easy difficulty"
    );

    // Submitting with impossible bot time (<6s) rejected
    const botMemorySubmit = await request("/api/arcade/memory-match/submit", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({
        sessionId: memoryMatchStartRes.data.sessionId,
        moves: 6,
        timeSeconds: 2, // Implausible bot time
      }),
    });
    assert(botMemorySubmit.status === 400, "Memory Match rejects implausible bot completion times");

    const validMemorySubmit = await request("/api/arcade/memory-match/submit", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({
        sessionId: memoryMatchStartRes.data.sessionId,
        moves: 12,
        timeSeconds: 28,
      }),
    });
    assert(validMemorySubmit.status === 200, "Valid Memory Match completion awards reward");

    // 13.9 Reward Shop: Catalog and Negative Balance Prevention
    const shopCatalogRes = await request("/api/shop/items", {
      headers: { Cookie: studentCookie },
    });
    assert(shopCatalogRes.status === 200, "Shop catalog returns 200 OK");
    assert(Array.isArray(shopCatalogRes.data?.catalog), "Shop returns cosmetic items");

    // Attempting purchase with insufficient coins (e.g. 9999 coins)
    const expensivePurchaseRes = await request("/api/shop/buy", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ itemId: "frame_cosmic_nebula" }), // 150 coins
    });
    // If student has less than 150 coins, this rejects. Let's verify no negative balance can occur
    const updatedStudentAfterShop = await User.findById(studentUser._id);
    assert(
      updatedStudentAfterShop.coins >= 0,
      "Coin balance cannot become negative under any purchase attempt"
    );

    // Grant student enough coins for 1 purchase to test atomic deduction & duplicate protection
    await User.findByIdAndUpdate(studentUser._id, { $set: { coins: 100 } });
    const affordableBuyRes = await request("/api/shop/buy", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ itemId: "frame_neon_cyan" }), // 50 coins
    });
    assert(affordableBuyRes.status === 200, "Purchasing affordable cosmetic item succeeds");
    assert(affordableBuyRes.data?.remainingCoins === 50, "Coins deducted atomically");

    const duplicateBuyRes = await request("/api/shop/buy", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ itemId: "frame_neon_cyan" }),
    });
    assert(duplicateBuyRes.status === 400, "Duplicate cosmetic purchase rejected (400 Bad Request)");

    // 13.10 Equip Cosmetic Item
    const equipRes = await request("/api/shop/equip", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ itemId: "frame_neon_cyan", itemType: "frame" }),
    });
    assert(equipRes.status === 200, "Equipping owned cosmetic item succeeds");

    const unownedEquipRes = await request("/api/shop/equip", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: JSON.stringify({ itemId: "frame_gold_royale", itemType: "frame" }),
    });
    assert(unownedEquipRes.status === 403, "Equipping unowned item rejected (403 Forbidden)");

    // 13.11 Leaderboards: Global, Weekly, and Monthly
    const globalLeaderboardRes = await request("/api/leaderboard?period=global", {
      headers: { Cookie: studentCookie },
    });
    assert(globalLeaderboardRes.status === 200, "Global leaderboard returns 200 OK");
    assert(Array.isArray(globalLeaderboardRes.data?.leaderboard), "Leaderboard returns array");
    assert(globalLeaderboardRes.data?.currentUserRank?.userId === String(studentUser._id), "Current student rank calculated");
    if (globalLeaderboardRes.data.leaderboard.length > 0) {
      const topEntry = globalLeaderboardRes.data.leaderboard[0];
      assert(topEntry.email === undefined && topEntry.passwordHash === undefined, "Leaderboard never exposes email or passwordHash");
    }

    const weeklyLeaderboardRes = await request("/api/leaderboard?period=weekly", {
      headers: { Cookie: studentCookie },
    });
    assert(weeklyLeaderboardRes.status === 200, "Weekly leaderboard returns 200 OK");

    const monthlyLeaderboardRes = await request("/api/leaderboard?period=monthly", {
      headers: { Cookie: studentCookie },
    });
    assert(monthlyLeaderboardRes.status === 200, "Monthly leaderboard returns 200 OK");

    // Clean up test documents
    console.log("\nCleaning up test records...");
    await User.deleteMany({ email: { $in: [studentEmail, instructorEmail, instructor2Email, googleStudentEmail, existingLocalEmail] } });
    await XPTransaction.deleteMany({ student: studentUser._id });
    await CoinTransaction.deleteMany({ student: studentUser._id });
    await UserAchievement.deleteMany({ student: studentUser._id });
    await GameSession.deleteMany({ student: studentUser._id });
    await UserInventory.deleteMany({ student: studentUser._id });
    if (createdCourseId) {
      await Course.findByIdAndDelete(createdCourseId);
      await Lesson.deleteMany({ course: createdCourseId });
      await Quiz.deleteMany({ course: createdCourseId });
    }
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }

  console.log("\n==========================================");
  console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

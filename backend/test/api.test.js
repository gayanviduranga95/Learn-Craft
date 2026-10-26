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

    // Clean up test documents
    console.log("\nCleaning up test records...");
    await User.deleteMany({ email: { $in: [studentEmail, instructorEmail, instructor2Email, googleStudentEmail, existingLocalEmail] } });
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

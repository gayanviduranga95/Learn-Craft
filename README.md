# 🚀 LearnCraft LMS — Intelligent Full-Stack Learning Management System

<p align="center">
  <img src="learncraft/public/favicon.svg" alt="LearnCraft Logo" width="80" />
</p>

<p align="center">
  <strong>An AI-powered, role-based Learning Management System designed for engaging, verifiable education.</strong>
  <br />
  Featuring end-to-end curriculum management, server-scored assessments, real-time AI tutoring, and tamper-proof PDF certification.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/STATUS-PRODUCTION%20READY-10B981?style=for-the-badge" alt="Status: Ready" />
  <img src="https://img.shields.io/badge/BACKEND-EXPRESS%205-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/DATABASE-MONGODB%20ATLAS-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/FRONTEND-REACT%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/BUILD-VITE-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/AI-GOOGLE%20GEMINI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
</p>

---

## 📖 Executive Summary

**LearnCraft** is a complete, modern, full-stack Learning Management System (LMS) built with an enterprise-grade MERN architecture (MongoDB, Express, React, Node.js). It caters to both learners and educators by providing:

1. **For Students:** An interactive dashboard with real-time course progress tracking, sequential lessons, multiple-choice quizzes with instant explanations, a conversational AI tutor, and downloadable verified completion certificates.
2. **For Instructors:** An "Instructor Studio" dashboard to publish courses, compose lessons, design quizzes with passing thresholds, and inspect real-time student enrollment and completion analytics.

The entire platform enforces strict Role-Based Access Control (RBAC), HttpOnly JWT cookie sessions, server-evaluated assessment grading to prevent client-side answer tampering, and database-verified certificate issuance.

---

## 🛠️ Technology Stack & Architecture

### Frontend (`/learncraft`)
- **Core:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Routing:** [React Router DOM v7](https://reactrouter.com/) with protected route guards
- **Styling:** Vanilla CSS design system + modern dark-mode aesthetic with glassmorphism + [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API (`AuthContext`) with automatic session rehydration

### Backend (`/backend`)
- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules)
- **Framework:** [Express 5](https://expressjs.com/)
- **Database ORM:** [Mongoose 9](https://mongoosejs.com/)
- **Database:** MongoDB Atlas (Cloud Database)
- **Security:** `bcryptjs` (salt rounds: 12), `jsonwebtoken` (HttpOnly cookies), `cors`, `express-rate-limit`
- **AI Integration:** `@google/genai` (Google Gemini API) with structured educational system instructions
- **Document Generation:** `pdfkit` for high-resolution, landscape verified certificate generation

---

## ✨ Complete Feature Matrix

| Feature | Status | Description |
|---|---|---|
| **Student Registration & Login** | ✅ Complete | Secure onboarding with email validation, bcrypt password hashing, and HttpOnly JWT cookies. |
| **Instructor Provisioning** | ✅ Complete | Dedicated instructor account registration and role assignment. |
| **Session Persistence** | ✅ Complete | Rehydrates user session on refresh via `GET /api/auth/me` without exposing tokens to client script. |
| **Course Catalogue & Search** | ✅ Complete | Browse published courses, filter by categories (Tech, Math, Science, Languages), search by title. |
| **Course Enrolment** | ✅ Complete | Enrol in courses; initializes progress tracking idempotently without duplicate records. |
| **Lesson Progression Engine** | ✅ Complete | Sequence ordering, previous/next lesson controls, mark-complete action, persistent database progress. |
| **Student Dashboard** | ✅ Complete | Live calculation of enrolled courses, completed lessons, overall completion %, dynamic XP, level badges. |
| **Assessment & Quiz System** | ✅ Complete | Multi-choice quizzes. Correct answers are stripped on retrieval; scored strictly server-side. |
| **Instructor Studio** | ✅ Complete | Create and edit courses, add/delete lessons, create quizzes, view student enrollment and progress stats. |
| **Cross-Ownership Protection** | ✅ Complete | Instructors cannot edit, modify, or delete courses belonging to other instructors (403 Forbidden). |
| **AI Study Tutor** | ✅ Complete | Embedded AI tutor powered by Google Gemini with contextual course/lesson awareness and study prompts. |
| **Verified PDF Certificates** | ✅ Complete | Dynamically generated PDF certificates streamed to browser only after verifying 100% course completion. |
| **Google Sign-In & Account Linking** | ✅ Complete | Google Identity Services (GIS), backend token verification with Google Auth Library, and safe password-verified account linking. |

---

## 🔒 Security & Data Integrity Highlights

1. **HttpOnly JWT Authentication:**
   - Tokens are delivered via `Set-Cookie` with `HttpOnly: true`, `SameSite: Lax`, and `Path: /`. Client JavaScript cannot access `document.cookie`, neutralizing XSS token theft.
2. **Tamper-Proof Assessment Grading:**
   - When students fetch quizzes (`GET /api/quizzes/:id`), the backend strips `correctOptionIndex` from every question. Scoring is exclusively computed server-side in `POST /api/quizzes/:id/submit`.
3. **Database-Verified Certificates:**
   - Certificates cannot be forged by client parameters. The backend inspects `CourseProgress` against `Course.totalLessons` directly in MongoDB. Unauthorized attempts receive `403 Forbidden`.
4. **Strict Role-Based Access Control (RBAC):**
   - Protected endpoints utilize `requireAuth` and `requireRole("instructor", "admin")`. Course mutation endpoints enforce ownership (`course.instructor.equals(req.auth.userId)`).
5. **Rate Limiting:**
   - Authentication routes (`/login`, `/register`) are guarded by rate limiters (30 requests per 15 minutes) to protect against credential stuffing and brute-force attacks.
6. **Password Security:**
   - All passwords are encrypted with `bcryptjs` using 12 salt rounds before persisting to MongoDB.

---

## 🗄️ Database Models & Relationships

```mermaid
erDiagram
    USER ||--o{ COURSE : "instructs"
    USER ||--o{ COURSE_PROGRESS : "tracks"
    USER ||--o{ QUIZ_ATTEMPT : "submits"
    USER ||--o{ CERTIFICATE : "earns"
    COURSE ||--|{ LESSON : "contains"
    COURSE ||--o{ QUIZ : "assesses"
    COURSE ||--o{ COURSE_PROGRESS : "progress for"
    QUIZ ||--o{ QUIZ_ATTEMPT : "records"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role "student | instructor | admin"
        number xp
        number level
    }

    COURSE {
        ObjectId _id PK
        string title UK
        string category
        string description
        ObjectId instructor FK
        number totalLessons
        boolean isPublished
    }

    LESSON {
        ObjectId _id PK
        ObjectId course FK
        string title
        string content
        number sequenceOrder
        number durationMinutes
    }

    COURSE_PROGRESS {
        ObjectId _id PK
        ObjectId student FK
        ObjectId course FK
        number completedLessons
        Array completedLessonIds
        Date lastAccessedAt
    }

    QUIZ {
        ObjectId _id PK
        ObjectId course FK
        string title
        number passingScorePercentage
        Array questions
    }

    CERTIFICATE {
        ObjectId _id PK
        ObjectId student FK
        ObjectId course FK
        string certificateId UK
        Date issuedAt
    }
```

---

## 🌐 API Route Specification

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register student or instructor account | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue HttpOnly cookie | Public |
| `POST` | `/api/auth/google` | Authenticate / register / link account via Google ID token | Public |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate cookie session | Authenticated |

### Courses (`/api/courses`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/courses` | List published courses with user progress | Authenticated |
| `GET` | `/api/courses/:courseId` | Get detailed course overview & progress | Authenticated |
| `POST` | `/api/courses/:courseId/enrol` | Enrol in course (idempotent) | Authenticated |
| `GET` | `/api/courses/instructor/my-courses` | List courses owned by instructor | Instructor |
| `POST` | `/api/courses` | Create new course module | Instructor |
| `PUT` | `/api/courses/:courseId` | Update course details (ownership checked) | Instructor (Owner) |
| `DELETE` | `/api/courses/:courseId` | Delete course & cascade delete lessons/quizzes | Instructor (Owner) |
| `GET` | `/api/courses/:courseId/stats` | View course enrollment & completion metrics | Instructor (Owner) |

### Lessons (`/api/lessons`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/lessons/courses/:courseId` | List ordered course lessons | Authenticated |
| `POST` | `/api/lessons/courses/:courseId` | Add lesson to course | Instructor (Owner) |
| `POST` | `/api/lessons/courses/:courseId/lessons/:lessonId/complete` | Mark lesson complete & update progress | Authenticated |
| `PUT` | `/api/lessons/:lessonId` | Update lesson content | Instructor (Owner) |
| `DELETE` | `/api/lessons/:lessonId` | Delete lesson and update course lesson count | Instructor (Owner) |

### Quizzes (`/api/quizzes`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/quizzes/courses/:courseId` | Get course quizzes (answers masked) | Authenticated |
| `GET` | `/api/quizzes/:id` | Get single quiz (answers masked) | Authenticated |
| `POST` | `/api/quizzes/:id/submit` | Submit answers for server-side evaluation | Authenticated |
| `POST` | `/api/quizzes` | Create multi-choice quiz with answers | Instructor |
| `PUT` | `/api/quizzes/:id` | Update quiz questions and thresholds | Instructor (Owner) |
| `DELETE` | `/api/quizzes/:id` | Remove quiz | Instructor (Owner) |

### Certificates (`/api/certificates`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/certificates/:courseId/eligibility` | Check completion eligibility for certificate | Authenticated |
| `GET` | `/api/certificates/:courseId/download` | Download verifiable PDF certificate | Authenticated (Eligible) |
| `GET` | `/api/certificates/verify/:certId` | Verify certificate validity by ID | Public |

### AI Tutor (`/api/ai`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Send educational question to Gemini AI Tutor | Authenticated |

---

## 🚀 Setup & Execution Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm (v9 or later)
- MongoDB Atlas cluster or local MongoDB instance

---

### 1. Environment Configuration

#### Backend Configuration (`backend/.env`):
A template is provided in `backend/.env.example`:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_optional
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

#### Frontend Configuration (`learncraft/.env`):
A template is provided in `learncraft/.env.example`:

```dotenv
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

#### Configuring Google Cloud OAuth Credentials:
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project and configure the **OAuth consent screen** (User Type: External).
3. Under **Credentials**, click **Create Credentials** -> **OAuth client ID** -> Application type: **Web application**.
4. In **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:5000`
5. Copy the generated **Client ID** into `backend/.env` (`GOOGLE_CLIENT_ID`) and `learncraft/.env` (`VITE_GOOGLE_CLIENT_ID`).

> **Note on AI Tutor:** If `GEMINI_API_KEY` is configured, live responses from Google Gemini are used. If left blank, the built-in pedagogical fallback model provides structured educational guidance without crashing.

---

### 2. Starting the Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend starts on `http://localhost:5000`.

To seed the initial sample quizzes for courses:
```bash
npm run seed:quizzes
```

---

### 3. Starting the Frontend Client

In a separate terminal:

```bash
cd learncraft
npm install
npm run dev
```

The frontend client starts on `http://localhost:5173`.

---

## 🧪 Automated Testing & Verification

LearnCraft includes an automated end-to-end integration test suite covering the entire backend lifecycle, role-based authorization, quizzes, certificate issuance, and Google authentication:

```bash
cd backend
npm test
```

### Actual Integration Test Execution Results:

```text
==========================================
LearnCraft LMS - Automated Integration Test
==========================================
MongoDB Atlas connected successfully.
Test server running on port 1948

[1] Health Check & Root API
  ✓ PASS: Health endpoint responds healthy with connected database

[2] Authentication - Student & Instructor Registration
  ✓ PASS: Student account registered successfully
  ✓ PASS: Role defaults/assigned to student
  ✓ PASS: Instructor account registered successfully
  ✓ PASS: Role assigned to instructor
  ✓ PASS: Second instructor account registered successfully

[3] Login & HttpOnly Cookie Verification
  ✓ PASS: Invalid password rejected with 401
  ✓ PASS: Student logged in successfully
  ✓ PASS: HttpOnly learncraft_token cookie received
  ✓ PASS: Instructor cookie received
  ✓ PASS: Second instructor cookie received

[4] Session Persistence & /api/auth/me
  ✓ PASS: GET /api/auth/me returns valid user info

[5] Role-Based Authorization Enforcement
  ✓ PASS: Student blocked from creating course (403 Forbidden)
  ✓ PASS: Instructor can create course (201 Created)
  ✓ PASS: Owner instructor can update course details
  ✓ PASS: Student blocked from modifying course (403 Forbidden)
  ✓ PASS: Non-owner instructor blocked from modifying other's course (403 Forbidden)

[6] Lesson Management & Instructor Ownership
  ✓ PASS: Instructor can add lesson to their course

[7] Course Catalog, Enrolment & Progress Workflow
  ✓ PASS: Courses catalog returned
  ✓ PASS: Student successfully enrols in course (200 OK)
  ✓ PASS: Duplicate enrolment is idempotent and preserves integrity
  ✓ PASS: Course lessons retrieved for student
  ✓ PASS: Student marks lesson complete and progress updates

[8] Quiz Creation, Sanitization & Tamper-Proof Evaluation
  ✓ PASS: Instructor can create multi-choice quiz
  ✓ PASS: Student quiz hides correctOptionIndex to prevent cheating
  ✓ PASS: Quiz answers scored server-side (Score: 2/2)
  ✓ PASS: Student passed quiz with 100%

[9] Certificate Verification & PDF Generation
  ✓ PASS: Completed course student is verified eligible for certificate
  ✓ PASS: Certificate PDF generated and downloaded
  ✓ PASS: Content-Type is application/pdf
  ✓ PASS: PDF binary size is valid (>1000 bytes)
  ✓ PASS: Certificate rejected for course with incomplete requirements (403 Forbidden)

[10] AI Tutor Endpoint
  ✓ PASS: AI Tutor endpoint provides educational guidance

[11] Logout & Cookie Invalidation
  ✓ PASS: Logout endpoint succeeds
  ✓ PASS: Logout clears HttpOnly cookie

[12] Google Sign-In, Token Validation & Account Linking
  ✓ PASS: Rejects request when Google ID token is missing (400 Bad Request)
  ✓ PASS: Rejects invalid or unverified Google token (401 Unauthorized)
  ✓ PASS: Rejects expired Google token (401 Unauthorized)
  ✓ PASS: Rejects token with incorrect audience (401 Unauthorized)
  ✓ PASS: Rejects Google identity when email is not verified (403 Forbidden)
  ✓ PASS: Registers new LearnCraft user via verified Google token (201 Created)
  ✓ PASS: Enforces safe default role 'student' (rejection of role escalation)
  ✓ PASS: Google profile picture persisted as avatar
  ✓ PASS: HttpOnly session cookie issued on Google registration
  ✓ PASS: Session persists after Google sign-in via /api/auth/me
  ✓ PASS: Returning Google user signs in successfully (200 OK)
  ✓ PASS: Correct existing account returned without duplicating records
  ✓ PASS: Requires explicit password verification when email matches existing local account (409 Conflict)
  ✓ PASS: Rejects account linking when password is incorrect (401 Unauthorized)
  ✓ PASS: Successfully links Google identity upon correct password verification (200 OK)
  ✓ PASS: Preserves existing instructor role after account linking
  ✓ PASS: Google subject ID safely associated with existing MongoDB document

Cleaning up test records...

==========================================
Test Summary: Passed: 52, Failed: 0
==========================================
```

### Frontend Build & Code Quality Verification:

```bash
cd learncraft
npm run lint    # 0 errors
npm run build   # Production bundle built in 622ms
```

---

## 🎬 Live Demonstration Checklist

To perform a live evaluation or academic walkthrough:

1. **Student Journey:**
   - Navigate to `http://localhost:5173/login`.
   - Click **Create an account** -> Register as a student.
   - Land on the **Student Dashboard** (`/dashboard`). View live metrics (0% initial progress, Level 1, 0 XP).
   - In **Explore Subjects**, select **Mathematics** or **Computer Science**.
   - Navigate through lessons using the **Next Lesson** button; observe the progress bar update dynamically.
   - Click **Mark as Completed**; refresh the page to observe persistent progress from MongoDB.
   - Click **Take Assessment**; answer the multi-choice questions. Submit to view server-calculated percentage and explanations.
   - Once all lessons are finished, click **Download Certificate** to receive the generated landscape PDF.
   - Open the **AI Tutor** (floating widget at bottom right); ask `"Can you explain how variables work in programming?"` to receive an interactive response.

2. **Instructor Journey:**
   - Sign out and register a new account selecting **Role: Instructor**.
   - System automatically routes to the **Instructor Studio** (`/instructor`).
   - Click **Create New Course** -> Enter title, category, description -> Course appears immediately on dashboard.
   - Click **Edit** to modify course properties or publication status.
   - Click **Lessons** -> Add a new lesson with markdown reading content and duration.
   - Click **Quizzes** -> Create a new assessment with custom questions, options, and passing threshold.
   - Click **Stats** -> View total enrolled students, average completion rate, and pass percentage.
   - Click **Switch to Student View** to preview the learning experience.

---

## 📄 License & Academic Integrity

This project is developed for academic evaluation and demonstration purposes. All code conforms to secure coding principles, clean architecture guidelines, and academic software engineering standards.

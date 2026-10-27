import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Award,
  Plus,
  Trash2,
  Edit,
  ClipboardList,
  Sparkles,
  BarChart3,
  X,
  CheckCircle2,
  LogOut,
  Video as VideoIcon,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { courseApi, lessonApi, quizApi } from "../services/api";
import MarkdownViewer from "../components/common/MarkdownViewer";
import "./InstructorDashboard.css";

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "Technology",
    description: "",
    thumbnail: "",
  });

  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({
    title: "",
    category: "Technology",
    description: "",
    isPublished: true,
  });

  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    content: "",
    durationMinutes: 10,
    videoUrl: "",
  });
  const [lessonPreviewMode, setLessonPreviewMode] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({
    title: "",
    description: "",
    content: "",
    durationMinutes: 10,
    videoUrl: "",
  });
  const [editLessonPreviewMode, setEditLessonPreviewMode] = useState(false);

  const [selectedCourseForQuizzes, setSelectedCourseForQuizzes] = useState(null);
  const [courseQuizzes, setCourseQuizzes] = useState([]);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passingScorePercentage: 70,
    questions: [
      {
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: "",
      },
    ],
  });

  const [selectedCourseForStats, setSelectedCourseForStats] = useState(null);
  const [courseStats, setCourseStats] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");
      const data = await courseApi.getInstructorCourses();
      setCourses(data);
    } catch (err) {
      setError(err.message || "Failed to load instructor courses.");
    } finally {
      setLoading(false);
    }
  }

  // Course actions
  async function handleCreateCourse(e) {
    e.preventDefault();
    try {
      setError("");
      await courseApi.createCourse(courseForm);
      setSuccessMsg("Course created successfully!");
      setShowCourseModal(false);
      setCourseForm({ title: "", category: "Technology", description: "", thumbnail: "" });
      loadCourses();
    } catch (err) {
      setError(err.message || "Failed to create course.");
    }
  }

  async function handleDeleteCourse(courseId) {
    if (!window.confirm("Are you sure you want to delete this course and all associated lessons and quizzes?")) {
      return;
    }
    try {
      await courseApi.deleteCourse(courseId);
      setSuccessMsg("Course deleted.");
      loadCourses();
    } catch (err) {
      setError(err.message || "Failed to delete course.");
    }
  }

  function openEditCourseModal(course) {
    setEditingCourse(course);
    setEditCourseForm({
      title: course.title,
      category: course.category || "Technology",
      description: course.description || "",
      isPublished: course.isPublished !== false,
    });
  }

  async function handleUpdateCourse(e) {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      setError("");
      await courseApi.updateCourse(editingCourse.id, editCourseForm);
      setSuccessMsg("Course updated successfully!");
      setEditingCourse(null);
      loadCourses();
    } catch (err) {
      setError(err.message || "Failed to update course.");
    }
  }

  // Lesson management
  async function openLessonsModal(course) {
    setSelectedCourseForLessons(course);
    try {
      const data = await lessonApi.getCourseLessons(course.id);
      setCourseLessons(data.lessons || []);
    } catch (err) {
      setError(err.message || "Failed to load lessons.");
    }
  }

  async function handleAddLesson(e) {
    e.preventDefault();
    if (!selectedCourseForLessons) return;
    try {
      await lessonApi.createLesson(selectedCourseForLessons.id, lessonForm);
      setSuccessMsg("Lesson added successfully!");
      setLessonForm({
        title: "",
        description: "",
        content: "",
        durationMinutes: 10,
        videoUrl: "",
      });
      setLessonPreviewMode(false);
      // Refresh lessons
      const data = await lessonApi.getCourseLessons(selectedCourseForLessons.id);
      setCourseLessons(data.lessons || []);
      loadCourses();
    } catch (err) {
      setError(err.message || "Failed to add lesson.");
    }
  }

  function startEditLesson(lesson) {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      content: lesson.content || "",
      durationMinutes: lesson.durationMinutes || 10,
      videoUrl: lesson.videoUrl || "",
    });
    setEditLessonPreviewMode(false);
  }

  function cancelEditLesson() {
    setEditingLesson(null);
    setEditLessonPreviewMode(false);
  }

  async function handleUpdateLessonSubmit(e) {
    e.preventDefault();
    if (!editingLesson || !selectedCourseForLessons) return;
    try {
      await lessonApi.updateLesson(editingLesson.id, editLessonForm);
      setSuccessMsg("Lesson updated successfully!");
      setEditingLesson(null);
      // Refresh lessons
      const data = await lessonApi.getCourseLessons(selectedCourseForLessons.id);
      setCourseLessons(data.lessons || []);
      loadCourses();
    } catch (err) {
      setError(err.message || "Failed to update lesson.");
    }
  }

  async function handleDeleteLesson(lessonId) {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await lessonApi.deleteLesson(lessonId);
      const data = await lessonApi.getCourseLessons(selectedCourseForLessons.id);
      setCourseLessons(data.lessons || []);
      loadCourses();
    } catch (err) {
      setError(err.message || "Failed to delete lesson.");
    }
  }

  // Quiz management
  async function openQuizzesModal(course) {
    setSelectedCourseForQuizzes(course);
    try {
      const data = await quizApi.getCourseQuizzes(course.id);
      setCourseQuizzes(data);
    } catch (err) {
      setError(err.message || "Failed to load quizzes.");
    }
  }

  async function handleCreateQuiz(e) {
    e.preventDefault();
    if (!selectedCourseForQuizzes) return;
    try {
      await quizApi.createQuiz({
        courseId: selectedCourseForQuizzes.id,
        ...quizForm,
      });
      setSuccessMsg("Quiz created successfully!");
      setQuizForm({
        title: "",
        description: "",
        passingScorePercentage: 70,
        questions: [
          {
            questionText: "",
            options: ["", "", "", ""],
            correctOptionIndex: 0,
            explanation: "",
          },
        ],
      });
      const data = await quizApi.getCourseQuizzes(selectedCourseForQuizzes.id);
      setCourseQuizzes(data);
    } catch (err) {
      setError(err.message || "Failed to create quiz.");
    }
  }

  // Stats management
  async function openStatsModal(course) {
    setSelectedCourseForStats(course);
    try {
      const data = await courseApi.getCourseStats(course.id);
      setCourseStats(data);
    } catch (err) {
      setError(err.message || "Failed to load course statistics.");
    }
  }

  const totalCourses = courses.length;
  const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledStudents || 0), 0);
  const totalLessonsCount = courses.reduce((acc, c) => acc + (c.totalLessons || 0), 0);

  return (
    <div className="lc-inst-page">
      {/* Top Navbar */}
      <header className="lc-inst-header">
        <Link to="/instructor" className="lc-inst-brand">
          <Sparkles size={24} color="#6366f1" />
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
            Learn<span style={{ color: "#6366f1" }}>Craft</span>
          </span>
          <span className="lc-inst-brand-badge">Instructor Studio</span>
        </Link>

        <div className="lc-inst-nav-actions">
          <button
            type="button"
            className="lc-inst-btn lc-inst-btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Switch to Student View
          </button>
          <button
            type="button"
            className="lc-inst-btn lc-inst-btn-danger"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <main className="lc-inst-content">
        {/* Hero banner */}
        <div className="lc-inst-hero">
          <div>
            <h1>Welcome back, {user?.name || "Instructor"}!</h1>
            <p>Design lessons, manage assessments, and inspect student progress in real-time.</p>
          </div>
          <button
            type="button"
            className="lc-inst-btn lc-inst-btn-primary"
            style={{ padding: "12px 20px", fontSize: "0.95rem" }}
            onClick={() => setShowCourseModal(true)}
          >
            <Plus size={18} /> Create New Course
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
            {successMsg}
          </div>
        )}

        {/* Top metrics row */}
        <section className="lc-inst-stats">
          <div className="lc-inst-stat-card">
            <div className="lc-inst-stat-icon blue"><BookOpen size={24} /></div>
            <div className="lc-inst-stat-info">
              <strong>{totalCourses}</strong>
              <span>Courses Created</span>
            </div>
          </div>
          <div className="lc-inst-stat-card">
            <div className="lc-inst-stat-icon purple"><Users size={24} /></div>
            <div className="lc-inst-stat-info">
              <strong>{totalStudents}</strong>
              <span>Students Enrolled</span>
            </div>
          </div>
          <div className="lc-inst-stat-card">
            <div className="lc-inst-stat-icon green"><ClipboardList size={24} /></div>
            <div className="lc-inst-stat-info">
              <strong>{totalLessonsCount}</strong>
              <span>Curriculum Lessons</span>
            </div>
          </div>
          <div className="lc-inst-stat-card">
            <div className="lc-inst-stat-icon orange"><Award size={24} /></div>
            <div className="lc-inst-stat-info">
              <strong>100%</strong>
              <span>Accreditation Ready</span>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section>
          <div className="lc-inst-section-head">
            <h2>Your Courses & Curriculum</h2>
            <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>{courses.length} courses total</span>
          </div>

          {loading ? (
            <p>Loading your courses...</p>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", background: "#111827", borderRadius: "16px" }}>
              <BookOpen size={48} color="#6366f1" style={{ margin: "0 auto 16px" }} />
              <h3>No courses created yet</h3>
              <p style={{ color: "#94a3b8" }}>Click "Create New Course" above to build your first module.</p>
            </div>
          ) : (
            <div className="lc-inst-courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="lc-inst-course-card">
                  <div className="lc-inst-card-top">
                    <span className="lc-inst-card-cat">{course.category}</span>
                    <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Active</span>
                  </div>

                  <h3 className="lc-inst-card-title">{course.title}</h3>
                  <p className="lc-inst-card-desc">{course.description || "No description provided."}</p>

                  <div className="lc-inst-card-metrics">
                    <div>
                      <strong>{course.totalLessons}</strong>
                      <span>Lessons</span>
                    </div>
                    <div>
                      <strong>{course.enrolledStudents || 0}</strong>
                      <span>Students</span>
                    </div>
                    <div>
                      <strong>{course.avgCompletedLessons || 0}</strong>
                      <span>Avg Done</span>
                    </div>
                  </div>

                  <div className="lc-inst-card-actions">
                    <button
                      type="button"
                      className="lc-inst-btn lc-inst-btn-secondary"
                      onClick={() => openEditCourseModal(course)}
                      title="Edit Course Details"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      className="lc-inst-btn lc-inst-btn-secondary"
                      onClick={() => openLessonsModal(course)}
                    >
                      <BookOpen size={14} /> Lessons
                    </button>
                    <button
                      type="button"
                      className="lc-inst-btn lc-inst-btn-secondary"
                      onClick={() => openQuizzesModal(course)}
                    >
                      <ClipboardList size={14} /> Quizzes
                    </button>
                    <button
                      type="button"
                      className="lc-inst-btn lc-inst-btn-secondary"
                      onClick={() => openStatsModal(course)}
                    >
                      <BarChart3 size={14} /> Stats
                    </button>
                    <button
                      type="button"
                      className="lc-inst-btn lc-inst-btn-danger"
                      onClick={() => handleDeleteCourse(course.id)}
                      title="Delete Course"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* CREATE COURSE MODAL */}
      {showCourseModal && (
        <div className="lc-inst-modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="lc-inst-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lc-inst-modal-header">
              <h3>Create New Course</h3>
              <button className="lc-inst-btn" onClick={() => setShowCourseModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div className="lc-inst-modal-body">
                <div className="lc-inst-form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    className="lc-inst-input"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Artificial Intelligence"
                  />
                </div>
                <div className="lc-inst-form-group">
                  <label>Category *</label>
                  <select
                    className="lc-inst-select"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  >
                    <option value="Technology">Technology</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Languages">Languages</option>
                    <option value="Creative Learning">Creative Learning</option>
                  </select>
                </div>
                <div className="lc-inst-form-group">
                  <label>Description</label>
                  <textarea
                    className="lc-inst-textarea"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Describe what learners will achieve in this course..."
                  />
                </div>
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="lc-inst-btn lc-inst-btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
                <button type="submit" className="lc-inst-btn lc-inst-btn-primary">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {editingCourse && (
        <div className="lc-inst-modal-overlay" onClick={() => setEditingCourse(null)}>
          <div className="lc-inst-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lc-inst-modal-header">
              <h3>Edit Course: {editingCourse.title}</h3>
              <button className="lc-inst-btn" onClick={() => setEditingCourse(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateCourse}>
              <div className="lc-inst-modal-body">
                <div className="lc-inst-form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    className="lc-inst-input"
                    required
                    value={editCourseForm.title}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                  />
                </div>
                <div className="lc-inst-form-group">
                  <label>Category *</label>
                  <select
                    className="lc-inst-select"
                    value={editCourseForm.category}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, category: e.target.value })}
                  >
                    <option value="Technology">Technology</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Languages">Languages</option>
                    <option value="Creative Learning">Creative Learning</option>
                  </select>
                </div>
                <div className="lc-inst-form-group">
                  <label>Description</label>
                  <textarea
                    className="lc-inst-textarea"
                    value={editCourseForm.description}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                    placeholder="Course objectives, prerequisites, and learning outcomes..."
                  />
                </div>
                <div className="lc-inst-form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                  <input
                    type="checkbox"
                    id="isPublishedCheck"
                    checked={editCourseForm.isPublished}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, isPublished: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#6366f1", cursor: "pointer" }}
                  />
                  <label htmlFor="isPublishedCheck" style={{ margin: 0, cursor: "pointer", fontWeight: 500 }}>
                    Published (Visible in student course catalogue)
                  </label>
                </div>
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="lc-inst-btn lc-inst-btn-secondary" onClick={() => setEditingCourse(null)}>Cancel</button>
                <button type="submit" className="lc-inst-btn lc-inst-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE LESSONS MODAL */}
      {selectedCourseForLessons && (
        <div className="lc-inst-modal-overlay" onClick={() => setSelectedCourseForLessons(null)}>
          <div className="lc-inst-modal" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div className="lc-inst-modal-header">
              <h3>Manage Lessons: {selectedCourseForLessons.title}</h3>
              <button className="lc-inst-btn" onClick={() => setSelectedCourseForLessons(null)}><X size={18} /></button>
            </div>
            <div className="lc-inst-modal-body">
              {/* Edit Lesson Form OR Add Lesson Form */}
              {editingLesson ? (
                <form onSubmit={handleUpdateLessonSubmit} style={{ background: "rgba(99,102,241,0.06)", padding: "18px", borderRadius: "12px", marginBottom: "24px", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h4 style={{ margin: 0, color: "#818cf8", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Edit size={16} /> Edit Lesson: {editingLesson.title}
                    </h4>
                    <button type="button" className="lc-inst-btn lc-inst-btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={cancelEditLesson}>
                      Cancel Edit
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <input
                      type="text"
                      className="lc-inst-input"
                      required
                      placeholder="Lesson Title"
                      value={editLessonForm.title}
                      onChange={(e) => setEditLessonForm({ ...editLessonForm, title: e.target.value })}
                    />
                    <input
                      type="number"
                      className="lc-inst-input"
                      min="1"
                      placeholder="Duration (mins)"
                      value={editLessonForm.durationMinutes}
                      onChange={(e) => setEditLessonForm({ ...editLessonForm, durationMinutes: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <input
                      type="text"
                      className="lc-inst-input"
                      placeholder="Short summary/description"
                      value={editLessonForm.description}
                      onChange={(e) => setEditLessonForm({ ...editLessonForm, description: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <VideoIcon size={14} color="#818cf8" />
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", margin: 0 }}>
                        Video Lecture URL (YouTube, Vimeo, MP4 - optional)
                      </label>
                    </div>
                    <input
                      type="url"
                      className="lc-inst-input"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or Vimeo link"
                      value={editLessonForm.videoUrl}
                      onChange={(e) => setEditLessonForm({ ...editLessonForm, videoUrl: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", margin: 0 }}>
                        Lesson Content (Markdown & Code Supported)
                      </label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className={`lc-inst-btn ${!editLessonPreviewMode ? 'lc-inst-btn-primary' : 'lc-inst-btn-secondary'}`}
                          style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                          onClick={() => setEditLessonPreviewMode(false)}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          className={`lc-inst-btn ${editLessonPreviewMode ? 'lc-inst-btn-primary' : 'lc-inst-btn-secondary'}`}
                          style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                          onClick={() => setEditLessonPreviewMode(true)}
                        >
                          <Eye size={12} /> Preview
                        </button>
                      </div>
                    </div>
                    {!editLessonPreviewMode ? (
                      <textarea
                        className="lc-inst-textarea"
                        placeholder="Write lesson instructional text in Markdown (Headers, code blocks, lists, alerts)..."
                        rows={4}
                        value={editLessonForm.content}
                        onChange={(e) => setEditLessonForm({ ...editLessonForm, content: e.target.value })}
                      />
                    ) : (
                      <div style={{ background: "#090d16", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "220px", overflowY: "auto" }}>
                        <MarkdownViewer content={editLessonForm.content || "_No content entered._"} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" className="lc-inst-btn lc-inst-btn-primary">
                      Save Lesson Changes
                    </button>
                    <button type="button" className="lc-inst-btn lc-inst-btn-secondary" onClick={cancelEditLesson}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddLesson} style={{ background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: "12px", marginBottom: "24px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <h4 style={{ margin: "0 0 14px", color: "#818cf8" }}>+ Add New Lesson</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <input
                      type="text"
                      className="lc-inst-input"
                      required
                      placeholder="Lesson Title"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    />
                    <input
                      type="number"
                      className="lc-inst-input"
                      min="1"
                      placeholder="Duration (mins)"
                      value={lessonForm.durationMinutes}
                      onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <input
                      type="text"
                      className="lc-inst-input"
                      placeholder="Short summary/description"
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <VideoIcon size={14} color="#818cf8" />
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", margin: 0 }}>
                        Video Lecture URL (YouTube, Vimeo, MP4 - optional)
                      </label>
                    </div>
                    <input
                      type="url"
                      className="lc-inst-input"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or Vimeo link"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", margin: 0 }}>
                        Lesson Content (Markdown & Code Supported)
                      </label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className={`lc-inst-btn ${!lessonPreviewMode ? 'lc-inst-btn-primary' : 'lc-inst-btn-secondary'}`}
                          style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                          onClick={() => setLessonPreviewMode(false)}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          className={`lc-inst-btn ${lessonPreviewMode ? 'lc-inst-btn-primary' : 'lc-inst-btn-secondary'}`}
                          style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                          onClick={() => setLessonPreviewMode(true)}
                        >
                          <Eye size={12} /> Preview
                        </button>
                      </div>
                    </div>
                    {!lessonPreviewMode ? (
                      <textarea
                        className="lc-inst-textarea"
                        placeholder="Full lesson instructional text and study content in Markdown (# Heading, ```js code```, > [!NOTE])..."
                        rows={4}
                        value={lessonForm.content}
                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      />
                    ) : (
                      <div style={{ background: "#090d16", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "220px", overflowY: "auto" }}>
                        <MarkdownViewer content={lessonForm.content || "_No content entered yet._"} />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="lc-inst-btn lc-inst-btn-primary">
                    <Plus size={16} /> Save Lesson
                  </button>
                </form>
              )}

              {/* Existing lessons list */}
              <h4 style={{ margin: "0 0 12px" }}>Existing Lessons ({courseLessons.length})</h4>
              {courseLessons.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No lessons in this course yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {courseLessons.map((l, index) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong>{index + 1}. {l.title}</strong>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{l.durationMinutes} min</span>
                        {l.videoUrl && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#c7d2fe", fontSize: "0.7rem", fontWeight: 600 }}>
                            <VideoIcon size={11} /> Video
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className="lc-inst-btn lc-inst-btn-secondary"
                          style={{ padding: "6px 10px" }}
                          onClick={() => startEditLesson(l)}
                          title="Edit Lesson"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="lc-inst-btn lc-inst-btn-danger"
                          style={{ padding: "6px 10px" }}
                          onClick={() => handleDeleteLesson(l.id)}
                          title="Delete Lesson"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE QUIZZES MODAL */}
      {selectedCourseForQuizzes && (
        <div className="lc-inst-modal-overlay" onClick={() => setSelectedCourseForQuizzes(null)}>
          <div className="lc-inst-modal" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div className="lc-inst-modal-header">
              <h3>Quizzes: {selectedCourseForQuizzes.title}</h3>
              <button className="lc-inst-btn" onClick={() => setSelectedCourseForQuizzes(null)}><X size={18} /></button>
            </div>
            <div className="lc-inst-modal-body">
              {/* Create Quiz Form */}
              <form onSubmit={handleCreateQuiz} style={{ background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: "12px", marginBottom: "24px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ margin: "0 0 14px", color: "#818cf8" }}>+ Create New Multiple Choice Quiz</h4>
                <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <input
                    type="text"
                    className="lc-inst-input"
                    required
                    placeholder="Quiz Title (e.g. Chapter 1 Assessment)"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  />
                  <input
                    type="number"
                    className="lc-inst-input"
                    min="1"
                    max="100"
                    placeholder="Pass % (70)"
                    value={quizForm.passingScorePercentage}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScorePercentage: e.target.value })}
                  />
                </div>

                {/* Question 1 Builder */}
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "14px", borderRadius: "10px", marginBottom: "14px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>Question Text</label>
                  <input
                    type="text"
                    className="lc-inst-input"
                    required
                    placeholder="Enter question text..."
                    value={quizForm.questions[0].questionText}
                    onChange={(e) => {
                      const updated = [...quizForm.questions];
                      updated[0].questionText = e.target.value;
                      setQuizForm({ ...quizForm, questions: updated });
                    }}
                  />

                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", display: "block", margin: "12px 0 6px" }}>Options (select radio for correct answer)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {quizForm.questions[0].options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="radio"
                          name="correctOption"
                          checked={quizForm.questions[0].correctOptionIndex === oIdx}
                          onChange={() => {
                            const updated = [...quizForm.questions];
                            updated[0].correctOptionIndex = oIdx;
                            setQuizForm({ ...quizForm, questions: updated });
                          }}
                        />
                        <input
                          type="text"
                          className="lc-inst-input"
                          required
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...quizForm.questions];
                            updated[0].options[oIdx] = e.target.value;
                            setQuizForm({ ...quizForm, questions: updated });
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="lc-inst-input"
                    style={{ marginTop: "10px" }}
                    placeholder="Explanation for students (optional)"
                    value={quizForm.questions[0].explanation}
                    onChange={(e) => {
                      const updated = [...quizForm.questions];
                      updated[0].explanation = e.target.value;
                      setQuizForm({ ...quizForm, questions: updated });
                    }}
                  />
                </div>

                <button type="submit" className="lc-inst-btn lc-inst-btn-primary">
                  <Plus size={16} /> Save Quiz
                </button>
              </form>

              {/* Existing Quizzes */}
              <h4 style={{ margin: "0 0 12px" }}>Existing Quizzes</h4>
              {courseQuizzes.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No quizzes in this course yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {courseQuizzes.map((q) => (
                    <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                      <div>
                        <strong>{q.title}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
                          {q.totalQuestions} questions · Passing threshold: {q.passingScorePercentage}%
                        </div>
                      </div>
                      <CheckCircle2 size={18} color="#22c55e" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PROGRESS STATS MODAL */}
      {selectedCourseForStats && (
        <div className="lc-inst-modal-overlay" onClick={() => setSelectedCourseForStats(null)}>
          <div className="lc-inst-modal" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div className="lc-inst-modal-header">
              <h3>Student Progress: {selectedCourseForStats.title}</h3>
              <button className="lc-inst-btn" onClick={() => setSelectedCourseForStats(null)}><X size={18} /></button>
            </div>
            <div className="lc-inst-modal-body">
              {courseStats?.stats ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                      <strong style={{ fontSize: "1.4rem" }}>{courseStats.stats.totalStudents}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>ENROLLED STUDENTS</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                      <strong style={{ fontSize: "1.4rem" }}>{courseStats.stats.completedStudents}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>COMPLETED COURSE</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                      <strong style={{ fontSize: "1.4rem" }}>{courseStats.stats.completionRate}%</strong>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>COMPLETION RATE</div>
                    </div>
                  </div>

                  <h4 style={{ margin: "18px 0 8px" }}>Enrolled Student Roster</h4>
                  {courseStats.stats.students?.length === 0 ? (
                    <p style={{ color: "#94a3b8" }}>No students have started this course yet.</p>
                  ) : (
                    <table className="lc-inst-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Progress</th>
                          <th>Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseStats.stats.students.map((st, sIdx) => (
                          <tr key={sIdx}>
                            <td><strong>{st.name}</strong></td>
                            <td style={{ color: "#94a3b8" }}>{st.email}</td>
                            <td>
                              <span style={{ color: st.progressPercentage >= 100 ? "#22c55e" : "#60a5fa", fontWeight: 600 }}>
                                {st.completedLessons} / {st.totalLessons} ({st.progressPercentage}%)
                              </span>
                            </td>
                            <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
                              {st.lastAccessedAt ? new Date(st.lastAccessedAt).toLocaleDateString() : "Recently"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <p>Loading statistics...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import './CourseLessons.css'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Award,
  Download,
  ClipboardList,
} from 'lucide-react'
import { lessonApi, certificateApi } from '../../services/api'
import QuizModal from '../quiz/QuizModal'
import AITutorWidget from '../ai-tutor/AITutorWidget'
import VideoPlayer from '../common/VideoPlayer'
import MarkdownViewer from '../common/MarkdownViewer'

export default function CourseLessons({ course: propCourse, onBack, onProgressSaved } = {}) {
  const params = useParams()
  const courseId = propCourse?.id || propCourse?._id || params.courseId
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [downloadingCert, setDownloadingCert] = useState(false)
  const [certSuccess, setCertSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      try {
        setLoading(true)
        setError('')

        const lessonsData = await lessonApi.getCourseLessons(courseId)

        if (!lessonsData || !lessonsData.course) {
          throw new Error('Course not found.')
        }

        if (cancelled) return

        setCourse({
          id: String(lessonsData.course.id || lessonsData.course._id),
          title: lessonsData.course.title || 'Untitled course',
          description: lessonsData.course.description || '',
          totalLessons: lessonsData.course.totalLessons || 0,
        })

        const loadedLessons = (lessonsData.lessons ?? [])
          .map((lesson) => ({
            ...lesson,
            id: lesson._id ?? lesson.id,
          }))
          .sort((a, b) => a.order - b.order)

        setLessons(loadedLessons)

        setSelectedLessonId(
          loadedLessons.find((lesson) => !lesson.completed)?.id ??
            loadedLessons[0]?.id ??
            null
        )
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load this course.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCourse()

    return () => {
      cancelled = true
    }
  }, [courseId])

  const selectedLesson = lessons.find(
    (lesson) => lesson.id === selectedLessonId
  )

  const selectedIndex = lessons.findIndex(
    (lesson) => lesson.id === selectedLessonId
  )

  const completedCount = lessons.filter(
    (lesson) => lesson.completed
  ).length

  const progress = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0

  const allCompleted =
    lessons.length > 0 && completedCount === lessons.length

  function handleBack() {
    if (onBack) {
      onBack()
    } else {
      navigate('/dashboard')
    }
  }

  function goToPreviousLesson() {
    if (selectedIndex > 0) {
      setSelectedLessonId(lessons[selectedIndex - 1].id)
    }
  }

  function goToNextLesson() {
    if (selectedIndex >= 0 && selectedIndex < lessons.length - 1) {
      setSelectedLessonId(lessons[selectedIndex + 1].id)
    }
  }

  async function handleComplete(lesson) {
    if (lesson.completed || savingId !== null) return

    try {
      setSavingId(lesson.id)
      setError('')

      const res = await lessonApi.completeLesson(courseId, lesson.id)

      if (onProgressSaved) {
        onProgressSaved(res)
      }

      const updatedLessons = lessons.map((item) =>
        item.id === lesson.id
          ? { ...item, completed: true }
          : item
      )

      setLessons(updatedLessons)

      // Automatically select the next unfinished lesson.
      const nextLesson =
        updatedLessons.find(
          (item) => item.order > lesson.order && !item.completed
        ) ??
        updatedLessons.find((item) => !item.completed)

      if (nextLesson) {
        setSelectedLessonId(nextLesson.id)
      }
    } catch (err) {
      setError(err.message || 'Unable to save progress.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleDownloadCertificate() {
    try {
      setDownloadingCert(true)
      setError('')
      setCertSuccess('')
      await certificateApi.downloadCertificate(courseId, course?.title || 'Course')
      setCertSuccess('Your verified certificate has been downloaded successfully!')
    } catch (err) {
      setError(err.message || 'Unable to download certificate.')
    } finally {
      setDownloadingCert(false)
    }
  }

  if (loading) {
    return (
      <section className="lc-course-lessons">
        <p>Loading course...</p>
      </section>
    )
  }

  if (error && !course) {
    return (
      <section className="lc-course-lessons">
        <button
          className="lc-lessons-back"
          type="button"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>
        <p role="alert">{error}</p>
      </section>
    )
  }

  if (!course) return null

  return (
    <section className="lc-course-lessons">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="lc-lessons-back"
          type="button"
          onClick={handleBack}
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <button
          type="button"
          className="lc-inst-btn lc-inst-btn-secondary"
          style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => setShowQuizModal(true)}
        >
          <ClipboardList size={16} /> Take Course Quiz
        </button>
      </div>

      <header className="lc-lessons-header">
        <span className="lc-courses-eyebrow">YOUR CLASSROOM</span>
        <h2>{course.title}</h2>
        <p>{course.description}</p>

        <div className="lc-lessons-progress">
          <span>
            {completedCount} of {lessons.length} lessons completed
          </span>
          <span>{progress}%</span>

          <div
            className="lc-lessons-progress-track"
            role="progressbar"
            aria-label="Course completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="lc-lessons-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {error && <p role="alert" style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>}
      {certSuccess && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          {certSuccess}
        </div>
      )}

      {allCompleted && (
        <div className="lc-course-complete-banner" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="lc-course-complete-icon">
            <Trophy size={28} />
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h3>Congratulations! Course 100% Completed.</h3>
            <p>
              You've mastered every lesson in {course.title}.
              Your official completion credential is ready to download!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="lc-primary-button"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              disabled={downloadingCert}
              onClick={handleDownloadCertificate}
            >
              <Download size={18} />
              {downloadingCert ? 'Generating Certificate...' : 'Download PDF Certificate'}
            </button>
            <button
              type="button"
              className="lc-primary-button"
              style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              onClick={() => setShowQuizModal(true)}
            >
              <Award size={18} /> Test Knowledge
            </button>
          </div>
        </div>
      )}

      <div className="lc-lessons-layout">
        <aside className="lc-lessons-list">
          <h3>
            <BookOpen size={18} />
            Course lessons
          </h3>

          <div className="lc-lessons-count">
            {completedCount} / {lessons.length} completed
          </div>

          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              type="button"
              className={`lc-lesson-item ${
                selectedLessonId === lesson.id ? 'is-active' : ''
              } ${lesson.completed ? 'is-completed' : ''}`}
              onClick={() => setSelectedLessonId(lesson.id)}
              aria-current={
                selectedLessonId === lesson.id ? 'step' : undefined
              }
            >
              {lesson.completed ? (
                <CheckCircle2 size={19} />
              ) : (
                <PlayCircle size={19} />
              )}

              <span>
                <strong>
                  {index + 1}. {lesson.title}
                </strong>
                <small>
                  <Clock3 size={12} />
                  {lesson.durationMinutes ?? 10} min
                </small>
              </span>
            </button>
          ))}
        </aside>

        <article className="lc-lesson-content">
          {selectedLesson ? (
            <>
              <div className="lc-lesson-topline">
                <span className="lc-courses-eyebrow">
                  LESSON {selectedIndex + 1} OF {lessons.length}
                </span>

                {selectedLesson.completed && (
                  <span className="lc-lesson-completed-label">
                    <CheckCircle2 size={15} />
                    Completed
                  </span>
                )}
              </div>

              <h3>{selectedLesson.title}</h3>
              <p>{selectedLesson.description}</p>

              {selectedLesson.videoUrl && (
                <VideoPlayer
                  url={selectedLesson.videoUrl}
                  title={selectedLesson.title}
                />
              )}

              <div className="lc-lesson-reading">
                <MarkdownViewer
                  content={
                    selectedLesson.content ||
                    'Welcome to this lesson! Study the core principles and when ready, mark this lesson as completed to track your progress.'
                  }
                />
              </div>

              {!selectedLesson.completed && (
                <button
                  type="button"
                  className="lc-lesson-complete"
                  disabled={savingId !== null}
                  onClick={() => handleComplete(selectedLesson)}
                >
                  <CheckCircle2 size={17} />
                  {savingId === selectedLesson.id
                    ? 'Saving progress...'
                    : 'Mark as Completed'}
                </button>
              )}

              <div className="lc-lesson-navigation">
                <button
                  type="button"
                  className="lc-lesson-nav-button"
                  disabled={selectedIndex <= 0}
                  onClick={goToPreviousLesson}
                >
                  <ChevronLeft size={18} />
                  <span>
                    <small>PREVIOUS</small>
                    Previous lesson
                  </span>
                </button>

                <button
                  type="button"
                  className="lc-lesson-nav-button lc-lesson-nav-next"
                  disabled={selectedIndex >= lessons.length - 1}
                  onClick={goToNextLesson}
                >
                  <span>
                    <small>NEXT</small>
                    Next lesson
                  </span>
                  <ChevronRight size={18} />
                </button>
              </div>

              {allCompleted && (
                <button
                  type="button"
                  className="lc-course-finish-button"
                  onClick={handleBack}
                >
                  Return to dashboard
                  <ArrowRight size={17} />
                </button>
              )}
            </>
          ) : (
            <div className="lc-lessons-no-content">
              <BookOpen size={30} />
              <h3>No lessons available</h3>
              <p>
                There are no published lessons in this course yet.
              </p>
            </div>
          )}
        </article>
      </div>

      {/* Embedded contextual AI Tutor */}
      <AITutorWidget context={{ courseTitle: course.title, lessonTitle: selectedLesson?.title }} />

      {/* Interactive Assessment Quiz Modal */}
      <QuizModal
        courseId={courseId}
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />
    </section>
  )
}

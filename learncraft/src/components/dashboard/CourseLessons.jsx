
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
} from 'lucide-react'
import { courseApi } from '../../services/api'

const API_BASE_URL = 'http://localhost:5000/api'

async function fetchLessons(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/lessons/courses/${courseId}`,
    { credentials: 'include' }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load lessons.')
  }

  return data
}

async function completeLesson(courseId, lessonId) {
  const response = await fetch(
    `${API_BASE_URL}/lessons/courses/${courseId}/lessons/${lessonId}/complete`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Unable to complete lesson.')
  }

  return data
}

export default function CourseLessons() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      try {
        setLoading(true)
        setError('')

        const [coursesData, lessonsData] = await Promise.all([
          courseApi.getCourses(),
          fetchLessons(courseId),
        ])

        const currentCourse = coursesData.find(
          (item) =>
            String(item._id ?? item.id) === String(courseId)
        )

        if (!currentCourse) {
          throw new Error('Course not found.')
        }

        if (cancelled) return

        setCourse({
          ...currentCourse,
          id: currentCourse._id ?? currentCourse.id,
          title:
            currentCourse.title ??
            currentCourse.name ??
            'Untitled course',
          description: currentCourse.description ?? '',
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
    navigate('/dashboard')
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

      await completeLesson(courseId, lesson.id)

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

      // Refresh dashboard progress if this callback is provided.
      // The dedicated route can work without it.
    } catch (err) {
      setError(err.message || 'Unable to save progress.')
    } finally {
      setSavingId(null)
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
      <button
        className="lc-lessons-back"
        type="button"
        onClick={handleBack}
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </button>

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

      {error && <p role="alert">{error}</p>}

      {allCompleted && (
        <div className="lc-course-complete-banner">
          <div className="lc-course-complete-icon">
            <Trophy size={26} />
          </div>
          <div>
            <h3>Congratulations! Course completed.</h3>
            <p>
              You've finished every lesson in {course.title}.
              Great work!
            </p>
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

              <div className="lc-lesson-reading">
                {selectedLesson.content ||
                  'Lesson content coming soon.'}
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
    </section>
  )
}

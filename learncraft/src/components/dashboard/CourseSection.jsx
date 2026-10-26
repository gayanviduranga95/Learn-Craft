
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calculator,
  FlaskConical,
  Code2,
  Globe2,
  Palette,
  CheckCircle2,
} from 'lucide-react'
import { courseApi } from '../../services/api'
import CourseCard from './CourseCard'
import './CourseSection.css'

const COURSE_DISPLAY = {
  Mathematics: {
    subtitle: 'Algebra and Equations',
    category: 'CORE SUBJECT',
    icon: Calculator,
    theme: 'math',
    description:
      'Practice problem solving, algebra, and essential concepts.',
  },
  Science: {
    subtitle: 'Energy and Matter',
    category: 'CORE SUBJECT',
    icon: FlaskConical,
    theme: 'science',
    description:
      'Explore scientific ideas through experiments and discovery.',
  },
  'Computer Science': {
    subtitle: 'Introduction to Programming',
    category: 'TECHNOLOGY',
    icon: Code2,
    theme: 'coding',
    description:
      'Learn programming fundamentals and computational thinking.',
  },
  English: {
    subtitle: 'Reading and Communication',
    category: 'LANGUAGES',
    icon: Globe2,
    theme: 'english',
    description:
      'Build confidence in reading, writing, and communication.',
  },
  'Creative Learning': {
    subtitle: 'Design and Problem Solving',
    category: 'ELECTIVE',
    icon: Palette,
    theme: 'creative',
    description:
      'Develop creative thinking through fun challenges.',
  },
}

const FILTERS = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All Courses' },
]

function normalizeCourse(apiCourse) {
  const display = COURSE_DISPLAY[apiCourse.title] ?? {}
  const totalLessons = apiCourse.totalLessons ?? 0
  const completedLessons = apiCourse.completedLessons ?? 0

  const progress = Math.min(
    100,
    Math.max(
      0,
      apiCourse.progress ??
        (totalLessons > 0
          ? Math.round(
              (completedLessons / totalLessons) * 100
            )
          : 0)
    )
  )

  return {
    ...apiCourse,
    id: apiCourse._id ?? apiCourse.id,
    subtitle: display.subtitle ?? apiCourse.category ?? 'Course',
    category:
      display.category ??
      apiCourse.category?.toUpperCase() ??
      'COURSE',
    icon: display.icon ?? Code2,
    theme: display.theme ?? 'coding',
    description:
      apiCourse.description || display.description || '',
    totalLessons,
    completedLessons,
    progress,
    completedLessonIds: apiCourse.completedLessonIds ?? [],
    status:
      progress >= 100
        ? 'completed'
        : progress > 0
          ? 'ongoing'
          : 'not-started',
  }
}

function getStatus(course) {
  if (course.progress >= 100) return 'completed'
  if (course.progress > 0) return 'ongoing'
  return 'not-started'
}

export default function CourseSection() {
  const navigate = useNavigate()

  const [activeFilter, setActiveFilter] = useState('ongoing')
  const [showAll, setShowAll] = useState(false)
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      try {
        setLoading(true)
        setError('')

        const data = await courseApi.getCourses()

        if (!Array.isArray(data)) {
          throw new Error(
            'The server returned an invalid course list.'
          )
        }

        if (!cancelled) {
          setAllCourses(data.map(normalizeCourse))
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Unable to load your courses.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const courses = useMemo(() => {
    if (activeFilter === 'all') {
      return allCourses
    }

    if (activeFilter === 'ongoing') {
      // Include courses that can be started or are in progress.
      return allCourses.filter(
        (course) => getStatus(course) !== 'completed'
      )
    }

    return allCourses.filter(
      (course) => getStatus(course) === 'completed'
    )
  }, [activeFilter, allCourses])

  const counts = useMemo(
    () => ({
      ongoing: allCourses.filter(
        (course) => getStatus(course) !== 'completed'
      ).length,
      completed: allCourses.filter(
        (course) => getStatus(course) === 'completed'
      ).length,
      all: allCourses.length,
    }),
    [allCourses]
  )

  const visibleCourses = showAll
    ? courses
    : courses.slice(0, 3)

  function handleCourseAction(course) {
    if (!course.id) {
      setError('Unable to open this course: its ID is missing.')
      return
    }

    navigate(`/courses/${course.id}`)
  }

  return (
    <section className="lc-courses" id="my-courses">
      <div className="lc-courses-heading">
        <div>
          <span className="lc-courses-eyebrow">
            YOUR CLASSROOM
          </span>
          <h2>My Courses</h2>
          <p>
            Keep building your knowledge, one lesson at a time.
          </p>
        </div>

        <button
          className="lc-courses-view-all"
          type="button"
          onClick={() => {
            if (!showAll) {
              setActiveFilter('all')
              setShowAll(true)
            } else {
              setShowAll(false)
            }
          }}
          aria-expanded={showAll}
        >
          {showAll ? 'Show Less' : 'View All'}
          <ArrowRight
            size={16}
            className={showAll ? 'lc-courses-arrow-up' : ''}
          />
        </button>
      </div>

      <div className="lc-courses-toolbar">
        <div
          className="lc-courses-tabs"
          role="tablist"
          aria-label="Filter courses"
        >
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.id}
              className={`lc-courses-tab ${
                activeFilter === filter.id ? 'is-active' : ''
              }`}
              onClick={() => {
                setActiveFilter(filter.id)
                setShowAll(false)
              }}
            >
              {filter.label}
              <span className="lc-courses-tab-count">
                {counts[filter.id]}
              </span>
            </button>
          ))}
        </div>

        <span className="lc-courses-total">
          {courses.length}{' '}
          {courses.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      {loading ? (
        <div className="lc-courses-empty" role="status">
          <p>Loading your courses...</p>
        </div>
      ) : error ? (
        <div className="lc-courses-empty" role="alert">
          <h3>We couldn't load your courses</h3>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : visibleCourses.length > 0 ? (
        <div className="lc-courses-grid">
          {visibleCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onAction={() => handleCourseAction(course)}
            />
          ))}
        </div>
      ) : (
        <div className="lc-courses-empty">
          <CheckCircle2 size={30} />

          <h3>
            {activeFilter === 'completed'
              ? 'No completed courses yet'
              : activeFilter === 'ongoing'
                ? 'No available courses yet'
                : 'No courses available yet'}
          </h3>

          <p>
            Choose another filter to explore your courses.
          </p>

          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
            >
              Browse all courses
            </button>
          )}
        </div>
      )}
    </section>
  )
}

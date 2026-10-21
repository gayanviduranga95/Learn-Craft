
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Calculator,
  FlaskConical,
  Code2,
  Globe2,
  Palette,
  CheckCircle2,
  Play,
} from 'lucide-react'
import CourseCard from './CourseCard'
import './CourseSection.css'

const INITIAL_COURSES = [
  {
    id: 'mathematics',
    title: 'Mathematics',
    subtitle: 'Algebra and Equations',
    category: 'CORE SUBJECT',
    progress: 67,
    completedLessons: 8,
    totalLessons: 12,
    status: 'ongoing',
    icon: Calculator,
    theme: 'math',
    description: 'Practice problem solving, algebra, and essential concepts.',
  },
  {
    id: 'science',
    title: 'Science',
    subtitle: 'Energy and Matter',
    category: 'CORE SUBJECT',
    progress: 30,
    completedLessons: 3,
    totalLessons: 10,
    status: 'ongoing',
    icon: FlaskConical,
    theme: 'science',
    description: 'Explore scientific ideas through experiments and discovery.',
  },
  {
    id: 'computer-science',
    title: 'Computer Science',
    subtitle: 'Introduction to Programming',
    category: 'TECHNOLOGY',
    progress: 0,
    completedLessons: 0,
    totalLessons: 8,
    status: 'not-started',
    icon: Code2,
    theme: 'coding',
    description: 'Learn programming fundamentals and computational thinking.',
  },
  {
    id: 'english',
    title: 'English',
    subtitle: 'Reading and Communication',
    category: 'LANGUAGES',
    progress: 100,
    completedLessons: 10,
    totalLessons: 10,
    status: 'completed',
    icon: Globe2,
    theme: 'english',
    description: 'Build confidence in reading, writing, and communication.',
  },
  {
    id: 'creative-learning',
    title: 'Creative Learning',
    subtitle: 'Design and Problem Solving',
    category: 'ELECTIVE',
    progress: 0,
    completedLessons: 0,
    totalLessons: 6,
    status: 'not-started',
    icon: Palette,
    theme: 'creative',
    description: 'Develop creative thinking through fun challenges.',
  },
]

const FILTERS = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All Courses' },
]

function getStatus(course) {
  if (course.status === 'completed' || course.progress >= 100) {
    return 'completed'
  }

  if (course.progress > 0) {
    return 'ongoing'
  }

  return 'not-started'
}

export default function CourseSection() {
  const [activeFilter, setActiveFilter] = useState('ongoing')
  const [showAll, setShowAll] = useState(false)

  const courses = useMemo(() => {
    if (activeFilter === 'all') return INITIAL_COURSES

    return INITIAL_COURSES.filter(
      (course) => getStatus(course) === activeFilter
    )
  }, [activeFilter])

  const visibleCourses = showAll ? courses : courses.slice(0, 3)

  const handleCourseAction = (course) => {
    const continueSection = document.getElementById('continue-learning')

    if (continueSection) {
      continueSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    } else {
      window.dispatchEvent(
        new CustomEvent('learncraft:course-selected', {
          detail: { courseId: course.id, courseTitle: course.title },
        })
      )
    }
  }

  return (
    <section className="lc-courses" id="my-courses">
      <div className="lc-courses-heading">
        <div>
          <span className="lc-courses-eyebrow">YOUR CLASSROOM</span>
          <h2>My Courses</h2>
          <p>Keep building your knowledge, one lesson at a time.</p>
        </div>

        <button
          className="lc-courses-view-all"
          type="button"
          onClick={() => {
            setActiveFilter('all')
            setShowAll((current) => !current)
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
        <div className="lc-courses-tabs" role="tablist" aria-label="Filter courses">
          {FILTERS.map((filter) => {
            const count =
              filter.id === 'all'
                ? INITIAL_COURSES.length
                : INITIAL_COURSES.filter(
                    (course) => getStatus(course) === filter.id
                  ).length

            return (
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
                <span className="lc-courses-tab-count">{count}</span>
              </button>
            )
          })}
        </div>

        <span className="lc-courses-total">
          {courses.length} {courses.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      {visibleCourses.length > 0 ? (
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
          <h3>No courses in this section yet</h3>
          <p>Choose another filter to explore your courses.</p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
          >
            Browse all courses
          </button>
        </div>
      )}
    </section>
  )
}

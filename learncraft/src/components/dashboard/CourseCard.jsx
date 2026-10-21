
import {
  ArrowRight,
  CheckCircle2,
  Play,
} from 'lucide-react'

export default function CourseCard({ course, onAction }) {
  const Icon = course.icon

  const isCompleted =
    course.status === 'completed' || course.progress >= 100

  const isStarted = course.progress > 0 && !isCompleted

  const statusLabel = isCompleted
    ? 'Completed'
    : isStarted
      ? 'In Progress'
      : 'Not Started'

  const buttonLabel = isCompleted
    ? 'Review Course'
    : isStarted
      ? 'Continue Learning'
      : 'Start Course'

  return (
    <article className={`lc-course-card lc-course-${course.theme}`}>
      <div className={`lc-course-art lc-course-art-${course.theme}`}>
        <div className="lc-course-art-glow" />
        <div className="lc-course-art-orbit lc-course-art-orbit-one" />
        <div className="lc-course-art-orbit lc-course-art-orbit-two" />

        <div className="lc-course-art-symbol">
          <Icon size={62} strokeWidth={1.5} />
        </div>

        <span className="lc-course-art-sparkle lc-course-art-sparkle-one">
          ✦
        </span>
        <span className="lc-course-art-sparkle lc-course-art-sparkle-two">
          ✧
        </span>

        <span
          className={`lc-course-status ${
            isCompleted
              ? 'lc-course-status-completed'
              : isStarted
                ? 'lc-course-status-progress'
                : 'lc-course-status-new'
          }`}
        >
          {isCompleted && <CheckCircle2 size={12} />}
          {statusLabel}
        </span>

        <span className="lc-course-percent">
          {course.progress}%
        </span>
      </div>

      <div className="lc-course-body">
        <div className="lc-course-meta">
          <span className="lc-course-icon">
            <Icon size={22} />
          </span>

          <span className="lc-course-category">
            {course.category}
          </span>
        </div>

        <h3 className="lc-course-title">{course.title}</h3>
        <p className="lc-course-subtitle">{course.subtitle}</p>
        <p className="lc-course-description">{course.description}</p>

        <div
          className="lc-course-progress-track"
          role="progressbar"
          aria-label={`${course.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={course.progress}
        >
          <span
            className="lc-course-progress-value"
            style={{ width: `${course.progress}%` }}
          />
        </div>

        <div className="lc-course-lesson-count">
          <span>
            {course.completedLessons} of {course.totalLessons} lessons completed
          </span>

          {isCompleted && (
            <CheckCircle2 size={15} aria-label="Course completed" />
          )}
        </div>

        <button
          className={`lc-course-action ${
            isCompleted ? 'lc-course-action-completed' : ''
          } ${!isStarted && !isCompleted ? 'lc-course-action-start' : ''}`}
          type="button"
          onClick={onAction}
        >
          {isStarted ? <Play size={15} /> : null}
          {buttonLabel}
          <ArrowRight size={17} />
        </button>
      </div>
    </article>
  )
}

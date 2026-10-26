import { ArrowRight, Play, Clock3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ContinueLearning({ activeCourse }) {
  const navigate = useNavigate()

  if (!activeCourse) {
    return null
  }

  const courseId = activeCourse._id ?? activeCourse.id
  const progressPercent = activeCourse.progress ?? 0
  const completedCount = activeCourse.completedLessons ?? 0
  const totalCount = activeCourse.totalLessons ?? 1

  return (
    <section className="lc-panel lc-continue-panel">
      <div className="lc-panel-heading">
        <div>
          <span className="lc-eyebrow">PICK UP WHERE YOU LEFT OFF</span>
          <h2>Continue Learning</h2>
        </div>
        <span className="lc-soft-icon"><Play size={19} /></span>
      </div>

      <div className="lc-continue-content">
        <div className="lc-lesson-art">
          <span className="lc-lesson-art-symbol">✦</span>
          <span>MODULE {completedCount + 1}</span>
        </div>

        <div className="lc-lesson-details">
          <span className="lc-status-pill">
            {progressPercent >= 100 ? 'COMPLETED' : progressPercent > 0 ? 'IN PROGRESS' : 'READY TO START'}
          </span>
          <h3>{activeCourse.title}</h3>
          <p>{activeCourse.category} · {completedCount} of {totalCount} lessons completed</p>

          <div className="lc-lesson-meta">
            <span><Clock3 size={14} /> Active curriculum</span>
            <strong>{progressPercent}%</strong>
          </div>

          <div className="lc-progress-track">
            <div style={{ width: `${progressPercent}%` }} />
          </div>

          <button
            className="lc-primary-button lc-resume-button"
            onClick={() => navigate(`/courses/${courseId}`)}
          >
            <Play size={15} fill="currentColor" /> {progressPercent >= 100 ? 'Review course' : 'Resume lesson'}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  )
}
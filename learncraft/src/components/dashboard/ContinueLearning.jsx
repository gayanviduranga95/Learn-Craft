import { ArrowRight, Play, Clock3 } from 'lucide-react'

export default function ContinueLearning() {
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
          <span className="lc-lesson-art-symbol">∑</span>
          <span>LESSON 04</span>
        </div>

        <div className="lc-lesson-details">
          <span className="lc-status-pill">IN PROGRESS</span>
          <h3>Introduction to Algebra</h3>
          <p>Mathematics · Chapter 2</p>

          <div className="lc-lesson-meta">
            <span><Clock3 size={14} /> 18 min remaining</span>
            <strong>60%</strong>
          </div>

          <div className="lc-progress-track">
            <div style={{ width: '60%' }} />
          </div>

          <button
            className="lc-primary-button lc-resume-button"
            onClick={() => window.alert('Connect this action to your lesson page.')}
          >
            <Play size={15} fill="currentColor" /> Resume lesson
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  )
}

import {
  ArrowRight,
  Sparkles,
  Target,
  BookOpen,
  Check,
} from 'lucide-react'

import heroImage from '../../assets/hero.png'
import { useAuth } from '../../context/AuthContext'
import './WelcomeBanner.css'

export default function WelcomeBanner() {
  const { user } = useAuth()

  const handleStartLearning = () => {
    const coursesSection = document.getElementById('my-courses')

    if (coursesSection) {
      coursesSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } else {
      window.location.hash = 'my-courses'
    }
  }

  return (
    <section className="lc-hero" aria-labelledby="lc-hero-title">
      <div className="lc-hero-background-glow" aria-hidden="true" />

      {/* LEFT: Welcome content */}
      <div className="lc-hero-content">
        <div className="lc-hero-eyebrow">
          <Sparkles size={15} />
          <span>YOUR LEARNING SPACE</span>
        </div>

        <h1 id="lc-hero-title">
          Good Day,
          <br />
          <span className="lc-hero-name">{user?.name ? `${user.name}!` : 'Learner!'}</span>
        </h1>

        <p className="lc-hero-description">
          Keep learning, keep growing! Every day is a new
          opportunity to discover something amazing.
        </p>

        <div className="lc-hero-goal">
          <div className="lc-hero-goal-icon">
            <Target size={23} />
          </div>

          <div className="lc-hero-goal-copy">
            <strong>Today's Learning Goal</strong>

            <span>
              Complete 2 lessons to reach your daily target
            </span>

            <div
              className="lc-hero-progress"
              role="progressbar"
              aria-label="Daily learning goal"
              aria-valuemin={0}
              aria-valuemax={2}
              aria-valuenow={1}
            >
              <span />
            </div>
          </div>

          <span className="lc-hero-goal-count">1/2</span>
        </div>

        <button
          className="lc-hero-cta"
          type="button"
          onClick={handleStartLearning}
        >
          Start Learning
          <ArrowRight size={19} />
        </button>

        <div className="lc-hero-features">
          <div className="lc-hero-feature">
            <span className="lc-hero-feature-icon lc-hero-feature-blue">
              <BookOpen size={19} />
            </span>
            <span>Explore courses</span>
          </div>

          <div className="lc-hero-feature">
            <span className="lc-hero-feature-icon lc-hero-feature-purple">
              <Sparkles size={19} />
            </span>
            <span>Learn with AI</span>
          </div>

          <div className="lc-hero-feature">
            <span className="lc-hero-feature-icon lc-hero-feature-green">
              <Check size={19} />
            </span>
            <span>Reach your goals</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Student and AI robot artwork */}
      <div className="lc-hero-visual" aria-hidden="true">
        <div className="lc-hero-orbit lc-hero-orbit-one" />
        <div className="lc-hero-orbit lc-hero-orbit-two" />

        <span className="lc-hero-sparkle lc-hero-sparkle-one">
          ✦
        </span>

        <span className="lc-hero-sparkle lc-hero-sparkle-two">
          ✧
        </span>

        <span className="lc-hero-sparkle lc-hero-sparkle-three">
          ✦
        </span>

        <div className="lc-hero-image-frame">
          <img
            src={heroImage}
            alt=""
            className="lc-hero-student-image"
          />
        </div>

        <div className="lc-hero-quote">
          <Sparkles size={16} />
          <span>Small steps. Big achievements.</span>
        </div>
      </div>
    </section>
  )
}

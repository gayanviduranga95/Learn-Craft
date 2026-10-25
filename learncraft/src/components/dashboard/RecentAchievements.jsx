import { Trophy, Star, Target, Medal, ArrowRight } from 'lucide-react'

const achievements = [
  {
    title: 'First steps',
    description: 'Complete your first lesson',
    icon: Star,
    color: 'blue',
    earned: true,
  },
  {
    title: 'Goal getter',
    description: 'Work towards your daily goal',
    icon: Target,
    color: 'green',
    earned: true,
  },
  {
    title: 'Knowledge seeker',
    description: 'Complete five lessons',
    icon: Medal,
    color: 'purple',
    earned: false,
  },
]

export default function RecentAchievements() {
  return (
    <section className="lc-panel lc-achievements-panel">
      <div className="lc-panel-heading">
        <div>
          <span className="lc-eyebrow">SMALL WINS MATTER</span>
          <h2>Recent achievements</h2>
        </div>
        <span className="lc-soft-icon lc-trophy-icon"><Trophy size={19} /></span>
      </div>

      <div className="lc-achievement-list">
        {achievements.map(({ title, description, icon: Icon, color, earned }) => (
          <div className="lc-achievement" key={title}>
            <span className={`lc-achievement-icon lc-icon-${color}`}>
              <Icon size={18} />
            </span>
            <span className="lc-achievement-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            {earned && <span className="lc-earned-check">✓</span>}
          </div>
        ))}
      </div>

      <button
        className="lc-panel-link"
        onClick={() => window.alert('Connect this action to your achievements page.')}
      >
        View all achievements <ArrowRight size={15} />
      </button>
    </section>
  )
}
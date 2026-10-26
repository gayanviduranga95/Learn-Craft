import {
  Trophy,
  Star,
  Target,
  Medal,
  CheckCircle,
  Sparkles,
  Flame,
  Zap,
  Gamepad2,
  Brain,
  ShoppingBag,
} from 'lucide-react'

const ICON_MAP = {
  Star,
  Target,
  Medal,
  CheckCircle,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  Gamepad2,
  Brain,
  ShoppingBag,
}

export default function RecentAchievements({
  completedLessons = 0,
  completedCourses = 0,
  achievements = [],
}) {
  // If backend achievements provided, display top 4 (unlocked first)
  const displayAchievements = achievements.length > 0
    ? [...achievements]
        .sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0))
        .slice(0, 4)
    : [
        {
          title: 'First steps',
          description: 'Complete your first lesson',
          icon: 'Star',
          badgeColor: 'blue',
          unlocked: completedLessons >= 1,
        },
        {
          title: 'Goal getter',
          description: 'Complete three lessons',
          icon: 'Target',
          badgeColor: 'green',
          unlocked: completedLessons >= 3,
        },
        {
          title: 'Quiz Novice',
          description: 'Pass your first quiz',
          icon: 'CheckCircle',
          badgeColor: 'purple',
          unlocked: false,
        },
        {
          title: 'Course Master',
          description: 'Complete 100% of a course curriculum',
          icon: 'Trophy',
          badgeColor: 'orange',
          unlocked: completedCourses >= 1,
        },
      ]

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
        {displayAchievements.map(({ title, description, icon, badgeColor, unlocked }) => {
          const Icon = ICON_MAP[icon] || Trophy
          const colorClass = badgeColor || 'blue'

          return (
            <div className="lc-achievement" key={title}>
              <span className={`lc-achievement-icon lc-icon-${colorClass}`}>
                <Icon size={18} />
              </span>
              <span className="lc-achievement-copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              {unlocked ? (
                <span className="lc-earned-check" title="Earned">✓</span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Locked</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
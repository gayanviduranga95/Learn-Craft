import {
  Zap,
  BookOpenCheck,
  Coins,
  Target,
  TrendingUp,
} from 'lucide-react'

export default function StatsRow({
  completedLessons = 0,
  totalCourses = 0,
  completedCourses = 0,
  lifetimeXp = 0,
  coins = 0,
  level = 1,
}) {
  const displayXp = lifetimeXp || completedLessons * 50

  const stats = [
    {
      label: 'Total XP Earned',
      value: displayXp.toLocaleString(),
      note: `Level ${level} Achieved`,
      icon: Zap,
      color: 'blue',
    },
    {
      label: 'Game Coins',
      value: coins.toLocaleString(),
      note: 'Spend in Reward Shop',
      icon: Coins,
      color: 'orange',
    },
    {
      label: 'Lessons Completed',
      value: String(completedLessons),
      note: 'Verified in MongoDB',
      icon: BookOpenCheck,
      color: 'purple',
    },
    {
      label: 'Courses Completed',
      value: `${completedCourses} / ${totalCourses}`,
      note: completedCourses > 0 ? 'Certificates unlocked' : 'Working toward goal',
      icon: Target,
      color: 'green',
    },
  ]

  return (
    <section className="lc-stats-grid" aria-label="Learning statistics">
      {stats.map(({ label, value, note, icon: Icon, color }) => (
        <article className="lc-stat-card" key={label}>
          <div className={`lc-stat-icon ${color}`}>
            <Icon size={22} />
          </div>

          <div className="lc-stat-details">
            <span className="lc-stat-label">{label}</span>
            <strong className="lc-stat-value">{value}</strong>
            <span className={`lc-stat-note ${color}`}>
              {color === 'blue' && <TrendingUp size={13} />}
              {note}
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}

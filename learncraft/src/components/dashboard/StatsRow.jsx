import {
  Zap,
  BookOpenCheck,
  Clock3,
  Target,
  TrendingUp,
} from 'lucide-react'

export default function StatsRow({ completedLessons = 0, totalCourses = 0, completedCourses = 0 }) {
  const xp = completedLessons * 50
  const hours = (completedLessons * 0.25).toFixed(1)

  const stats = [
    {
      label: 'Total XP Earned',
      value: xp.toLocaleString(),
      note: `${completedLessons} lessons finished`,
      icon: Zap,
      color: 'blue',
    },
    {
      label: 'Lessons Completed',
      value: String(completedLessons),
      note: 'Verified in MongoDB',
      icon: BookOpenCheck,
      color: 'purple',
    },
    {
      label: 'Learning Time',
      value: `${hours}h`,
      note: 'Engaged study',
      icon: Clock3,
      color: 'green',
    },
    {
      label: 'Courses Completed',
      value: `${completedCourses} / ${totalCourses}`,
      note: completedCourses > 0 ? 'Certificates unlocked' : 'Working toward goal',
      icon: Target,
      color: 'orange',
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

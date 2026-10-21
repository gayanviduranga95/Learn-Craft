import {
  Zap,
  BookOpenCheck,
  Clock3,
  Target,
  TrendingUp,
} from 'lucide-react'

const stats = [
  {
    label: 'Total XP Earned',
    value: '1,250',
    note: '+150 this week',
    icon: Zap,
    color: 'blue',
  },
  {
    label: 'Lessons Completed',
    value: '24',
    note: 'Keep it up!',
    icon: BookOpenCheck,
    color: 'purple',
  },
  {
    label: 'Learning Time',
    value: '12.5h',
    note: 'This month',
    icon: Clock3,
    color: 'green',
  },
  {
    label: 'Daily Goal',
    value: '1 / 2',
    note: 'One more to go',
    icon: Target,
    color: 'orange',
  },
]

export default function StatsRow() {
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

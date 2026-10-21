import { Flame, CalendarDays } from 'lucide-react'

const days = [
  { label: 'M', active: true },
  { label: 'T', active: true },
  { label: 'W', active: true },
  { label: 'T', active: true },
  { label: 'F', active: false },
  { label: 'S', active: false },
  { label: 'S', active: false },
]

export default function LearningStreak() {
  return (
    <section className="lc-panel lc-streak-panel">
      <div className="lc-panel-heading">
        <div>
          <span className="lc-eyebrow">YOUR CONSISTENCY</span>
          <h2>Learning streak</h2>
        </div>
        <span className="lc-soft-icon lc-fire-icon"><Flame size={20} /></span>
      </div>

      <div className="lc-streak-number">
        <strong>4</strong>
        <span>days in a row</span>
      </div>

      <div className="lc-week-row">
        {days.map((day, index) => (
          <div className="lc-week-day" key={`${day.label}-${index}`}>
            <span className={day.active ? 'lc-day-dot is-active' : 'lc-day-dot'}>
              {day.active ? '✓' : <CalendarDays size={13} />}
            </span>
            <small>{day.label}</small>
          </div>
        ))}
      </div>

      <p className="lc-muted-copy">Keep learning daily to build your streak!</p>
    </section>
  )
}
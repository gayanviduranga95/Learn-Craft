import { Flame, CalendarDays, Check } from 'lucide-react'

export default function LearningStreak({ streak = { current: 1, longest: 1, todayCompleted: true } }) {
  const currentStreak = streak?.current || 0
  const longestStreak = streak?.longest || currentStreak
  const todayCompleted = streak?.todayCompleted || false

  // Build the 7 days of the current week (Mon-Sun)
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayDayIndex = (new Date().getUTCDay() + 6) % 7 // 0 for Monday ... 6 for Sunday

  const days = dayLabels.map((label, idx) => {
    let active = false
    if (idx < todayDayIndex) {
      active = true
    } else if (idx === todayDayIndex) {
      active = todayCompleted
    }
    return { label, active, isToday: idx === todayDayIndex }
  })

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
        <strong>{currentStreak}</strong>
        <span>{currentStreak === 1 ? 'day in a row' : 'days in a row'}</span>
      </div>

      <div className="lc-week-row">
        {days.map((day, index) => (
          <div className="lc-week-day" key={`${day.label}-${index}`}>
            <span
              className={`lc-day-dot ${day.active ? 'is-active' : ''}`}
              style={day.isToday ? { border: '2px solid #087bff' } : {}}
            >
              {day.active ? <Check size={12} strokeWidth={3} /> : <CalendarDays size={13} />}
            </span>
            <small style={day.isToday ? { color: '#087bff', fontWeight: '700' } : {}}>
              {day.label}
            </small>
          </div>
        ))}
      </div>

      <p className="lc-muted-copy">
        {todayCompleted
          ? `🔥 Great job! Daily goal complete (+10 XP). Best streak: ${longestStreak} days.`
          : 'Complete a lesson or quiz today to keep your streak burning!'}
      </p>
    </section>
  )
}
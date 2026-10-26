import { Trophy, Star, Target, Medal } from 'lucide-react'

export default function RecentAchievements({ completedLessons = 0, completedCourses = 0 }) {
  const achievements = [
    {
      title: 'First steps',
      description: 'Complete your first lesson',
      icon: Star,
      color: 'blue',
      earned: completedLessons >= 1,
    },
    {
      title: 'Goal getter',
      description: 'Complete three lessons',
      icon: Target,
      color: 'green',
      earned: completedLessons >= 3,
    },
    {
      title: 'Knowledge seeker',
      description: 'Complete five lessons',
      icon: Medal,
      color: 'purple',
      earned: completedLessons >= 5,
    },
    {
      title: 'Course Master',
      description: 'Complete 100% of a course curriculum',
      icon: Trophy,
      color: 'orange',
      earned: completedCourses >= 1,
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
        {achievements.map(({ title, description, icon: Icon, color, earned }) => (
          <div className="lc-achievement" key={title}>
            <span className={`lc-achievement-icon lc-icon-${color}`}>
              <Icon size={18} />
            </span>
            <span className="lc-achievement-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            {earned ? (
              <span className="lc-earned-check" title="Earned">✓</span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Locked</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
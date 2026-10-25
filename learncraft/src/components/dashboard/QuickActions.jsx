import {
  ClipboardCheck,
  Compass,
  Brain,
  Trophy,
  ArrowUpRight,
} from 'lucide-react'

const actions = [
  {
    title: 'Take a quiz',
    description: 'Test what you know',
    icon: ClipboardCheck,
    color: 'blue',
  },
  {
    title: 'Explore lessons',
    description: 'Discover something new',
    icon: Compass,
    color: 'purple',
  },
  {
    title: 'Practice skills',
    description: 'Sharpen your knowledge',
    icon: Brain,
    color: 'green',
  },
  {
    title: 'View achievements',
    description: 'Celebrate your progress',
    icon: Trophy,
    color: 'orange',
  },
]

export default function QuickActions() {
  return (
    <section className="lc-section">
      <div className="lc-section-heading">
        <div>
          <span className="lc-eyebrow">MAKE YOUR NEXT MOVE</span>
          <h2>Quick Actions</h2>
          <p>Shortcuts to your learning activities.</p>
        </div>
      </div>

      <div className="lc-quick-grid">
        {actions.map(({ title, description, icon: Icon, color }) => (
          <button
            className="lc-quick-card"
            key={title}
            onClick={() => window.alert(`${title}: connect this action to your app feature.`)}
          >
            <span className={`lc-quick-icon lc-icon-${color}`}>
              <Icon size={21} />
            </span>
            <span className="lc-quick-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ArrowUpRight size={17} className="lc-quick-arrow" />
          </button>
        ))}
      </div>
    </section>
  )
}
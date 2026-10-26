import {
  ClipboardCheck,
  Compass,
  Bot,
  Award,
  ArrowUpRight,
} from 'lucide-react'

export default function QuickActions({ onTakeQuiz, onExplore, onDownloadCert }) {
  const handleAction = (title) => {
    if (title === 'Take a quiz' && onTakeQuiz) {
      onTakeQuiz()
    } else if (title === 'Explore lessons' && onExplore) {
      onExplore()
    } else if (title === 'Claim Certificate' && onDownloadCert) {
      onDownloadCert()
    } else if (title === 'Ask AI Tutor') {
      const fab = document.querySelector('.lc-ai-fab')
      if (fab) fab.click()
    }
  }

  const actions = [
    {
      title: 'Take a quiz',
      description: 'Test your understanding',
      icon: ClipboardCheck,
      color: 'blue',
    },
    {
      title: 'Explore lessons',
      description: 'Jump to course catalogue',
      icon: Compass,
      color: 'purple',
    },
    {
      title: 'Ask AI Tutor',
      description: 'Get step-by-step assistance',
      icon: Bot,
      color: 'green',
    },
    {
      title: 'Claim Certificate',
      description: 'Download verified credentials',
      icon: Award,
      color: 'orange',
    },
  ]

  return (
    <section className="lc-section">
      <div className="lc-section-heading">
        <div>
          <span className="lc-eyebrow">MAKE YOUR NEXT MOVE</span>
          <h2>Quick Actions</h2>
          <p>Instant shortcuts to your learning activities.</p>
        </div>
      </div>

      <div className="lc-quick-grid">
        {actions.map(({ title, description, icon: Icon, color }) => (
          <button
            type="button"
            className="lc-quick-card"
            key={title}
            onClick={() => handleAction(title)}
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
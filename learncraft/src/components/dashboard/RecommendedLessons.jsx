import { ArrowUpRight, Clock3, Sparkles } from 'lucide-react'

const lessons = [
  {
    subject: 'MATHEMATICS',
    title: 'Fractions made simple',
    duration: '12 min',
    color: 'blue',
  },
  {
    subject: 'SCIENCE',
    title: 'Discover the solar system',
    duration: '15 min',
    color: 'purple',
  },
  {
    subject: 'ENGLISH',
    title: 'Build your vocabulary',
    duration: '10 min',
    color: 'orange',
  },
]

export default function RecommendedLessons() {
  return (
    <section className="lc-panel lc-recommended-panel">
      <div className="lc-panel-heading">
        <div>
          <span className="lc-eyebrow">PICKED FOR YOU</span>
          <h2>Recommended lessons</h2>
        </div>
        <span className="lc-soft-icon"><Sparkles size={19} /></span>
      </div>

      <div className="lc-recommended-list">
        {lessons.map((lesson) => (
          <button
            className="lc-recommended-item"
            key={lesson.title}
            onClick={() => window.alert(`Connect "${lesson.title}" to your lesson page.`)}
          >
            <span className={`lc-recommend-marker lc-marker-${lesson.color}`} />
            <span className="lc-recommend-copy">
              <small>{lesson.subject}</small>
              <strong>{lesson.title}</strong>
              <span><Clock3 size={13} /> {lesson.duration}</span>
            </span>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
    </section>
  )
}
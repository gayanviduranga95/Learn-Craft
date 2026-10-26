import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  LogOut,
  Zap,
  GraduationCap,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ totalLessonsDone = 0 }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, isInstructor } = useAuth()

  const xpEarned = totalLessonsDone * 50
  const level = Math.max(1, Math.floor(xpEarned / 200) + 1)
  const nextLevelXp = level * 200

  const navigation = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Courses', icon: BookOpen, path: '/dashboard' },
  ]

  if (isInstructor) {
    navigation.push({
      label: 'Instructor Studio',
      icon: GraduationCap,
      path: '/instructor',
    })
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="lc-sidebar">
      <a className="lc-brand" href="/dashboard">
        <span className="lc-brand-icon">
          <Sparkles size={25} />
        </span>
        <span>
          <strong>Learn<span>Craft</span></strong>
          <small>LEARN • GROW • SHINE</small>
        </span>
      </a>

      <div className="lc-sidebar-label">MENU</div>

      <nav className="lc-navigation" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path

          return (
            <button
              key={label}
              type="button"
              className={`lc-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {active && <span className="lc-nav-indicator" />}
            </button>
          )
        })}
      </nav>

      <div className="lc-sidebar-spacer" />

      <section className="lc-level-card">
        <div className="lc-level-top">
          <span className="lc-level-icon"><Zap size={19} /></span>
          <span>YOUR LEVEL</span>
          <strong>0{level}</strong>
        </div>
        <h3>{isInstructor ? 'Verified Educator' : 'Curious Explorer'}</h3>
        <div className="lc-xp-row">
          <span>{xpEarned} XP</span>
          <span>{nextLevelXp} XP</span>
        </div>
        <div className="lc-xp-track">
          <span style={{ width: `${Math.min(100, Math.round((xpEarned / nextLevelXp) * 100))}%` }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
          {totalLessonsDone} lessons completed
        </div>
      </section>

      <div className="lc-sidebar-bottom">
        <button type="button" className="lc-nav-item lc-logout" onClick={handleSignOut}>
          <LogOut size={19} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="lc-sidebar-footer">© 2026 LearnCraft</div>
    </aside>
  )
}
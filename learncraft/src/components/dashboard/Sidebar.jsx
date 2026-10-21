import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  Compass,
  Trophy,
  ChartNoAxesColumnIncreasing,
  Settings,
  CircleHelp,
  LogOut,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'My Courses', icon: BookOpen, path: '/courses' },
  { label: 'Explore', icon: Compass, path: '/explore' },
  { label: 'Achievements', icon: Trophy, path: '/achievements' },
  { label: 'My Progress', icon: ChartNoAxesColumnIncreasing, path: '/progress' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

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
          <strong>05</strong>
        </div>
        <h3>Curious Explorer</h3>
        <div className="lc-xp-row">
          <span>1,250 XP</span>
          <span>1,500 XP</span>
        </div>
        <div className="lc-xp-track">
          <span />
        </div>
        <button type="button" className="lc-level-link" onClick={() => navigate('/progress')}>
          View progress <ChevronRight size={15} />
        </button>
      </section>

      <div className="lc-sidebar-bottom">
        <button type="button" className="lc-nav-item" onClick={() => navigate('/settings')}>
          <Settings size={19} />
          <span>Settings</span>
        </button>
        <button type="button" className="lc-nav-item" onClick={() => navigate('/help')}>
          <CircleHelp size={19} />
          <span>Help & Support</span>
        </button>
        <button type="button" className="lc-nav-item lc-logout" onClick={() => navigate('/login')}>
          <LogOut size={19} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="lc-sidebar-footer">© 2026 LearnCraft</div>
    </aside>
  )
}
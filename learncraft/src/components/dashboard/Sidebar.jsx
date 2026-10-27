import { useEffect } from 'react'
import {
  Sparkles,
  LayoutDashboard,
  Gamepad2,
  Trophy,
  ShoppingBag,
  Coins,
  LogOut,
  Zap,
  GraduationCap,
  User,
  X,
} from 'lucide-react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({
  totalLessonsDone = 0,
  gamificationData = null,
  isOpen = false,
  onClose = () => {},
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, isInstructor } = useAuth()

  const level = gamificationData?.level || Math.max(1, Math.floor((totalLessonsDone * 50) / 200) + 1)
  const lifetimeXp = gamificationData?.lifetimeXp ?? (totalLessonsDone * 50)
  const nextLevelXp = gamificationData?.levelDetails?.nextLevelCeiling || level * 200
  const progressPercent = gamificationData?.levelDetails?.progressPercentage ?? Math.min(100, Math.round((lifetimeXp / nextLevelXp) * 100))
  const title = gamificationData?.levelDetails?.title || (isInstructor ? 'Verified Educator' : 'Curious Explorer')
  const coins = gamificationData?.coins ?? 0

  // Close drawer on Escape keypress
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const navigation = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Profile', icon: User, path: '/profile' },
    { label: 'Arcade Games', icon: Gamepad2, path: '/arcade' },
    { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { label: 'Reward Shop', icon: ShoppingBag, path: '/shop' },
  ]

  if (isInstructor) {
    navigation.push({
      label: 'Instructor Studio',
      icon: GraduationCap,
      path: '/instructor',
    })
  }

  const handleNavigate = (path) => {
    onClose()
    navigate(path)
  }

  const handleSignOut = async () => {
    onClose()
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`lc-sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`lc-sidebar ${isOpen ? 'is-open' : ''}`}
        aria-label="Sidebar navigation"
      >
        <div className="lc-sidebar-brand-row">
          <Link
            className="lc-brand"
            to="/dashboard"
            onClick={() => onClose()}
          >
            <span className="lc-brand-icon">
              <Sparkles size={25} />
            </span>
            <span>
              <strong>Learn<span>Craft</span></strong>
              <small>LEARN • GROW • SHINE</small>
            </span>
          </Link>

          {/* Close button visible only on mobile screens */}
          <button
            type="button"
            className="lc-sidebar-close"
            onClick={onClose}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="lc-sidebar-label">MENU</div>

        <nav className="lc-navigation" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path

            return (
              <button
                key={label}
                type="button"
                className={`lc-nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNavigate(path)}
              >
                <Icon size={20} />
                <span>{label}</span>
                {active && <span className="lc-nav-indicator" />}
              </button>
            )
          })}
        </nav>

        <div className="lc-sidebar-spacer" />

        {/* Spendable Coins quick badge */}
        <div
          className="lc-coins-pill"
          onClick={() => handleNavigate('/shop')}
          title="Your spendable Game Coins. Click to visit Reward Shop!"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '0 12px 14px',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffd76a', fontSize: '0.82rem', fontWeight: '700' }}>
            <Coins size={16} /> Coins
          </span>
          <strong style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800' }}>
            {coins.toLocaleString()}
          </strong>
        </div>

        <section className="lc-level-card">
          <div className="lc-level-top">
            <span className="lc-level-icon"><Zap size={19} /></span>
            <span>YOUR LEVEL</span>
            <strong>{level < 10 ? `0${level}` : level}</strong>
          </div>
          <h3>{title}</h3>
          <div className="lc-xp-row">
            <span>{lifetimeXp} XP</span>
            <span>{nextLevelXp} XP</span>
          </div>
          <div className="lc-xp-track">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
            {totalLessonsDone} lessons verified
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
    </>
  )
}
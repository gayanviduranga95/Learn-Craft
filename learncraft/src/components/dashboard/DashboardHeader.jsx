import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Coins,
  Flame,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../common/ThemeToggle'

export default function DashboardHeader({
  coins = 0,
  streak = 0,
  equippedFrame = 'default',
  onToggleMobileNav,
  isMobileNavOpen = false,
}) {
  const navigate = useNavigate()
  const { user, logout, isInstructor } = useAuth()

  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [internalMobileOpen, setInternalMobileOpen] = useState(false)

  const isMenuOpen = onToggleMobileNav ? isMobileNavOpen : internalMobileOpen
  const handleToggleMenu = () => {
    if (onToggleMobileNav) {
      onToggleMobileNav()
    } else {
      setInternalMobileOpen((prev) => !prev)
    }
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'S'

  return (
    <header className="lc-header">
      <button
        type="button"
        className="lc-mobile-menu"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        onClick={handleToggleMenu}
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className="lc-header-search">
        <Search size={20} />
        <input
          type="search"
          placeholder="Search lessons, courses..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search lessons and courses"
        />
        <kbd>⌘ K</kbd>
      </div>

      <div className="lc-header-actions">
        {/* Spendable Coins counter */}
        <button
          type="button"
          className="lc-header-pill"
          onClick={() => navigate('/shop')}
          title="Game Coins balance. Click to visit Reward Shop"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#b45309',
            padding: '6px 12px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <Coins size={16} />
          <span>{coins.toLocaleString()}</span>
        </button>

        {/* Learning Streak flame */}
        {streak > 0 && (
          <div
            className="lc-header-pill"
            title={`${streak}-day learning streak!`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '6px 10px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '0.85rem',
            }}
          >
            <Flame size={16} />
            <span>{streak}</span>
          </div>
        )}

        {isInstructor && (
          <button
            type="button"
            className="lc-inst-btn lc-inst-btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px' }}
            onClick={() => navigate('/instructor')}
          >
            <GraduationCap size={15} /> Instructor Studio
          </button>
        )}

        {/* Global Theme Toggle */}
        <ThemeToggle />

        <div className="lc-header-popover">
          <button
            type="button"
            className="lc-icon-button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((current) => !current)
              setProfileOpen(false)
            }}
          >
            <Bell size={20} />
            <span className="lc-notification-dot" />
          </button>

          {notificationsOpen && (
            <div className="lc-popover">
              <strong>Notifications</strong>
              <p>Welcome to LearnCraft! Complete your courses to earn official certificates and test your skills with quizzes.</p>
              {user && user.isEmailVerified === false && (
                <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontSize: '12px' }}>
                  Your email is unverified. <span onClick={() => { setNotificationsOpen(false); navigate('/profile'); }} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>Verify in Profile</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lc-profile-wrap">
          <button
            type="button"
            className="lc-profile-button"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((current) => !current)
              setNotificationsOpen(false)
            }}
          >
            <span className="lc-avatar">
              {user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
                <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : user?.avatar ? (
                <span>{user.avatar}</span>
              ) : (
                initial
              )}
            </span>
            <span className="lc-profile-text">
              <strong>{user?.name || 'Student'}</strong>
              <small style={{ textTransform: 'capitalize' }}>
                {user?.role || 'Learner'} {user && user.isEmailVerified === false && '• Unverified'}
              </small>
            </span>
            <ChevronDown size={17} />
          </button>

          {profileOpen && (
            <div className="lc-profile-menu">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/profile')
                }}
              >
                <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                My Profile &amp; Settings
              </button>

              {isInstructor && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/instructor')
                  }}
                >
                  <GraduationCap size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Instructor Studio
                </button>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                style={{ color: '#ef4444' }}
              >
                <LogOut size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

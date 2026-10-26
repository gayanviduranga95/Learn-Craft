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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function DashboardHeader() {
  const navigate = useNavigate()
  const { user, logout, isInstructor } = useAuth()

  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMobileMenuOpen((current) => !current)}
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
            <span className="lc-avatar">{initial}</span>
            <span className="lc-profile-text">
              <strong>{user?.name || 'Student'}</strong>
              <small style={{ textTransform: 'capitalize' }}>{user?.role || 'Learner'}</small>
            </span>
            <ChevronDown size={17} />
          </button>

          {profileOpen && (
            <div className="lc-profile-menu">
              {isInstructor && (
                <button type="button" onClick={() => navigate('/instructor')}>
                  Instructor Studio
                </button>
              )}
              <button type="button" onClick={handleSignOut} style={{ color: '#ef4444' }}>
                <LogOut size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lc-mobile-menu-note">
          Use the dashboard navigation to explore your learning sections.
        </div>
      )}
    </header>
  )
}

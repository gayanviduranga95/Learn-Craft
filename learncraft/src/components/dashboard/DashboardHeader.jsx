import { useState } from 'react'
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'

export default function DashboardHeader() {
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
              <p>You're all caught up. Keep learning to earn more XP!</p>
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
            <span className="lc-avatar">S</span>
            <span className="lc-profile-text">
              <strong>Student</strong>
              <small>Grade 10</small>
            </span>
            <ChevronDown size={17} />
          </button>

          {profileOpen && (
            <div className="lc-profile-menu">
              <button type="button" onClick={() => window.location.assign('/settings')}>
                Account settings
              </button>
              <button type="button" onClick={() => window.location.assign('/login')}>
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

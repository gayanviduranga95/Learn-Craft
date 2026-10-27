import { useState, useEffect } from 'react'
import {
  Trophy,
  Crown,
  Zap,
  Globe,
  Calendar,
  Sparkles,
} from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { leaderboardApi, gamificationApi } from '../services/api'
import './Leaderboard.css'

export default function Leaderboard() {
  const [period, setPeriod] = useState('global') // 'global' | 'weekly' | 'monthly'
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gamification, setGamification] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    gamificationApi.getProfile().then((res) => {
      if (res.success) setGamification(res.data)
    }).catch(console.warn)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)

    leaderboardApi
      .getLeaderboard(period)
      .then((res) => {
        if (!active) return
        if (res.success) {
          setLeaderboard(res.leaderboard || [])
          setUserRank(res.currentUserRank || null)
        }
      })
      .catch((err) => {
        console.warn('Leaderboard fetch failed:', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [period])

  const topThree = leaderboard.slice(0, 3)

  return (
    <div className="dashboard leaderboard-page">
      <Sidebar
        gamificationData={gamification}
        totalLessonsDone={gamification?.stats?.lessonsCompleted || 0}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <main className="dashboard-main">
        <DashboardHeader
          coins={gamification?.coins || 0}
          streak={gamification?.streak?.current || 0}
          equippedFrame={gamification?.equippedFrame}
          onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
          isMobileNavOpen={mobileNavOpen}
        />

        <div className="dashboard-content leaderboard-content">
          {/* Header Banner */}
          <div className="lb-banner">
            <div>
              <span className="arcade-pill">
                <Trophy size={16} /> HALL OF FAME
              </span>
              <h1>LearnCraft Leaderboard</h1>
              <p>
                Recognizing our most dedicated learners. Complete lessons, solve quizzes, and conquer the arcade to climb the ranks!
              </p>
            </div>

            {/* Period Selector Tabs */}
            <div className="lb-period-switch">
              <button
                type="button"
                className={`lb-tab ${period === 'global' ? 'active' : ''}`}
                onClick={() => setPeriod('global')}
              >
                <Globe size={16} /> All-Time
              </button>
              <button
                type="button"
                className={`lb-tab ${period === 'weekly' ? 'active' : ''}`}
                onClick={() => setPeriod('weekly')}
              >
                <Calendar size={16} /> This Week
              </button>
              <button
                type="button"
                className={`lb-tab ${period === 'monthly' ? 'active' : ''}`}
                onClick={() => setPeriod('monthly')}
              >
                <Sparkles size={16} /> This Month
              </button>
            </div>
          </div>

          {loading ? (
            <div className="lb-loading">
              <Trophy size={36} className="lb-spin-icon" />
              <p>Calculating leaderboard rankings...</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {topThree.length > 0 && (
                <div className="podium-container">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <div className="podium-item rank-2">
                      <div className="podium-avatar-wrap">
                        <span className="podium-rank-badge silver">2</span>
                        <div className={`avatar-box ${topThree[1].equippedFrame}`}>
                          {topThree[1].name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <strong>{topThree[1].name}</strong>
                      <span className="podium-level">Lvl {topThree[1].level}</span>
                      <span className="podium-xp">
                        <Zap size={14} /> {topThree[1].xp.toLocaleString()} XP
                      </span>
                      <div className="podium-pillar pillar-2">2nd</div>
                    </div>
                  )}

                  {/* 1st Place (Gold Center) */}
                  {topThree[0] && (
                    <div className="podium-item rank-1">
                      <div className="podium-crown">
                        <Crown size={28} />
                      </div>
                      <div className="podium-avatar-wrap">
                        <span className="podium-rank-badge gold">1</span>
                        <div className={`avatar-box ${topThree[0].equippedFrame}`}>
                          {topThree[0].name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <strong>{topThree[0].name}</strong>
                      <span className="podium-level">Lvl {topThree[0].level}</span>
                      <span className="podium-xp">
                        <Zap size={14} /> {topThree[0].xp.toLocaleString()} XP
                      </span>
                      <div className="podium-pillar pillar-1">1st</div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <div className="podium-item rank-3">
                      <div className="podium-avatar-wrap">
                        <span className="podium-rank-badge bronze">3</span>
                        <div className={`avatar-box ${topThree[2].equippedFrame}`}>
                          {topThree[2].name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <strong>{topThree[2].name}</strong>
                      <span className="podium-level">Lvl {topThree[2].level}</span>
                      <span className="podium-xp">
                        <Zap size={14} /> {topThree[2].xp.toLocaleString()} XP
                      </span>
                      <div className="podium-pillar pillar-3">3rd</div>
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="lb-table-card">
                <div className="lb-table-header">
                  <span className="col-rank">#</span>
                  <span className="col-user">Learner</span>
                  <span className="col-level">Level</span>
                  <span className="col-xp">XP Earned</span>
                </div>

                <div className="lb-table-body">
                  {leaderboard.length === 0 ? (
                    <div className="lb-empty">
                      No rewards logged for this period yet. Be the first to earn XP!
                    </div>
                  ) : (
                    leaderboard.map((entry) => {
                      const isCurrentUser = userRank?.userId === entry.userId

                      return (
                        <div
                          key={entry.userId}
                          className={`lb-row ${isCurrentUser ? 'is-me' : ''}`}
                        >
                          <span className="col-rank">
                            {entry.rank <= 3 ? (
                              <span className={`mini-badge r-${entry.rank}`}>
                                {entry.rank}
                              </span>
                            ) : (
                              `#${entry.rank}`
                            )}
                          </span>

                          <div className="col-user">
                            <span className={`user-avatar ${entry.equippedFrame}`}>
                              {entry.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="user-name">
                              {entry.name}
                              {isCurrentUser && <span className="you-pill">You</span>}
                            </span>
                          </div>

                          <span className="col-level">
                            Level {entry.level < 10 ? `0${entry.level}` : entry.level}
                          </span>

                          <span className="col-xp">
                            <Zap size={15} />
                            <strong>{entry.xp.toLocaleString()} XP</strong>
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Current User Fixed Bottom Status */}
              {userRank && (
                <div className="lb-my-position-card">
                  <div className="my-rank-info">
                    <span className="my-rank-num">#{userRank.rank}</span>
                    <div>
                      <strong>Your Position ({period.toUpperCase()})</strong>
                      <small>Keep completing lessons to climb up!</small>
                    </div>
                  </div>
                  <div className="my-rank-score">
                    <Zap size={17} />
                    <span>{userRank.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

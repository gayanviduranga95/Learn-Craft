import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Gamepad2,
  Clock,
  Zap,
  Coins,
  Trophy,
  Brain,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import RewardToast from '../components/common/RewardToast'
import { arcadeApi, gamificationApi } from '../services/api'
import './Arcade.css'

export default function Arcade() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('quiz-rush') // 'quiz-rush' | 'memory-match'
  const [gamification, setGamification] = useState(null)
  const [rewardNotification, setRewardNotification] = useState(null)

  // Quiz Rush State
  const [qrState, setQrState] = useState('lobby') // 'lobby' | 'playing' | 'result'
  const [qrDifficulty, setQrDifficulty] = useState('medium')
  const [qrSessionId, setQrSessionId] = useState(null)
  const [qrQuestions, setQrQuestions] = useState([])
  const [qrCurrentIndex, setQrCurrentIndex] = useState(0)
  const [qrAnswers, setQrAnswers] = useState([]) // [{ index, selectedOptionIndex }]
  const [qrTimeRemaining, setQrTimeRemaining] = useState(60)
  const [qrResult, setQrResult] = useState(null)
  const [qrSubmitting, setQrSubmitting] = useState(false)
  const [qrError, setQrError] = useState('')

  // Memory Match State
  const [mmState, setMmState] = useState('lobby') // 'lobby' | 'playing' | 'result'
  const [mmDifficulty, setMmDifficulty] = useState('medium')
  const [mmSessionId, setMmSessionId] = useState(null)
  const [mmCards, setMmCards] = useState([])
  const [mmFlippedIndices, setMmFlippedIndices] = useState([])
  const [mmMatchedPairIds, setMmMatchedPairIds] = useState(new Set())
  const [mmMoves, setMmMoves] = useState(0)
  const [mmTimerSeconds, setMmTimerSeconds] = useState(0)
  const [mmResult, setMmResult] = useState(null)
  const [mmSubmitting, setMmSubmitting] = useState(false)
  const [mmError, setMmError] = useState('')

  const qrTimerRef = useRef(null)
  const mmTimerRef = useRef(null)

  // Load gamification profile
  const fetchProfile = async () => {
    try {
      const res = await gamificationApi.getProfile()
      if (res.success) {
        setGamification(res.data)
      }
    } catch (err) {
      console.warn('Failed to load profile:', err)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // ----------------------------------------------------
  // QUIZ RUSH LOGIC
  // ----------------------------------------------------
  const handleStartQuizRush = async () => {
    setQrError('')
    setQrSubmitting(true)
    try {
      const res = await arcadeApi.startQuizRush(qrDifficulty)
      if (res.success) {
        setQrSessionId(res.sessionId)
        setQrQuestions(res.questions)
        setQrCurrentIndex(0)
        setQrAnswers([])
        setQrTimeRemaining(res.timeLimitSeconds || 60)
        setQrState('playing')
      }
    } catch (err) {
      setQrError(err.message || 'Could not start Quiz Rush.')
    } finally {
      setQrSubmitting(false)
    }
  }

  // Quiz Rush Timer
  useEffect(() => {
    if (qrState !== 'playing') {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current)
      return
    }

    qrTimerRef.current = setInterval(() => {
      setQrTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(qrTimerRef.current)
          handleFinishQuizRush()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current)
    }
  }, [qrState])

  const handleSelectQuizOption = (optionIndex) => {
    const updatedAnswers = [
      ...qrAnswers.filter((a) => a.index !== qrCurrentIndex),
      { index: qrCurrentIndex, selectedOptionIndex: optionIndex },
    ]
    setQrAnswers(updatedAnswers)

    // Move to next question or submit if last
    if (qrCurrentIndex + 1 < qrQuestions.length) {
      setQrCurrentIndex((prev) => prev + 1)
    } else {
      handleFinishQuizRush(updatedAnswers)
    }
  }

  const handleFinishQuizRush = async (answersOverride) => {
    if (qrSubmitting) return
    setQrSubmitting(true)
    if (qrTimerRef.current) clearInterval(qrTimerRef.current)

    const finalAnswers = answersOverride || qrAnswers
    const timeElapsed = Math.max(1, 60 - qrTimeRemaining)

    try {
      const res = await arcadeApi.submitQuizRush({
        sessionId: qrSessionId,
        answers: finalAnswers,
        timeElapsedSeconds: timeElapsed,
      })

      if (res.success) {
        setQrResult(res.result)
        setQrState('result')
        if (res.result?.reward?.awarded) {
          setRewardNotification({
            title: 'Quiz Rush Victory!',
            description: `Scored ${res.result.score}% in ${timeElapsed}s`,
            xpAwarded: res.result.reward.xpAwarded,
            coinsAwarded: res.result.reward.coinsAwarded,
          })
        }
        fetchProfile()
      }
    } catch (err) {
      setQrError(err.message || 'Failed to submit Quiz Rush.')
      setQrState('lobby')
    } finally {
      setQrSubmitting(false)
    }
  }

  // ----------------------------------------------------
  // MEMORY MATCH LOGIC
  // ----------------------------------------------------
  const handleStartMemoryMatch = async () => {
    setMmError('')
    setMmSubmitting(true)
    try {
      const res = await arcadeApi.startMemoryMatch(mmDifficulty)
      if (res.success) {
        setMmSessionId(res.sessionId)
        setMmCards(res.cards)
        setMmFlippedIndices([])
        setMmMatchedPairIds(new Set())
        setMmMoves(0)
        setMmTimerSeconds(0)
        setMmState('playing')
      }
    } catch (err) {
      setMmError(err.message || 'Could not start Memory Match.')
    } finally {
      setMmSubmitting(false)
    }
  }

  // Memory Match Stopwatch
  useEffect(() => {
    if (mmState !== 'playing') {
      if (mmTimerRef.current) clearInterval(mmTimerRef.current)
      return
    }

    mmTimerRef.current = setInterval(() => {
      setMmTimerSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      if (mmTimerRef.current) clearInterval(mmTimerRef.current)
    }
  }, [mmState])

  const handleCardClick = (index) => {
    if (mmFlippedIndices.length === 2) return // Wait for reset
    if (mmFlippedIndices.includes(index)) return // Already flipped
    const card = mmCards[index]
    if (mmMatchedPairIds.has(card.pairId)) return // Already matched

    const newFlipped = [...mmFlippedIndices, index]
    setMmFlippedIndices(newFlipped)

    if (newFlipped.length === 2) {
      setMmMoves((prev) => prev + 1)
      const firstCard = mmCards[newFlipped[0]]
      const secondCard = mmCards[newFlipped[1]]

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH!
        const nextMatched = new Set(mmMatchedPairIds)
        nextMatched.add(firstCard.pairId)
        setMmMatchedPairIds(nextMatched)
        setMmFlippedIndices([])

        // Check if all pairs matched!
        const totalPairs = mmCards.length / 2
        if (nextMatched.size === totalPairs) {
          handleFinishMemoryMatch(mmMoves + 1)
        }
      } else {
        // No match - flip back after 1.1s
        setTimeout(() => {
          setMmFlippedIndices([])
        }, 1100)
      }
    }
  }

  const handleFinishMemoryMatch = async (finalMoves) => {
    if (mmTimerRef.current) clearInterval(mmTimerRef.current)
    setMmSubmitting(true)
    const timeTaken = mmTimerSeconds

    try {
      const res = await arcadeApi.submitMemoryMatch({
        sessionId: mmSessionId,
        moves: finalMoves,
        timeSeconds: timeTaken,
      })

      if (res.success) {
        setMmResult(res.result)
        setMmState('result')
        if (res.result?.reward?.awarded) {
          setRewardNotification({
            title: 'Memory Match Solved!',
            description: `Finished in ${finalMoves} moves (${timeTaken}s)`,
            xpAwarded: res.result.reward.xpAwarded,
            coinsAwarded: res.result.reward.coinsAwarded,
          })
        }
        fetchProfile()
      }
    } catch (err) {
      setMmError(err.message || 'Failed to submit Memory Match.')
      setMmState('lobby')
    } finally {
      setMmSubmitting(false)
    }
  }

  const currentQ = qrQuestions[qrCurrentIndex]

  return (
    <div className="dashboard arcade-page">
      <Sidebar
        gamificationData={gamification}
        totalLessonsDone={gamification?.stats?.lessonsCompleted || 0}
      />

      <main className="dashboard-main">
        <DashboardHeader
          coins={gamification?.coins || 0}
          streak={gamification?.streak?.current || 0}
          equippedFrame={gamification?.equippedFrame}
        />

        <div className="dashboard-content arcade-content">
          {/* Header Banner */}
          <div className="arcade-banner">
            <div className="arcade-banner-text">
              <span className="arcade-pill">
                <Gamepad2 size={16} /> EDUCATIONAL ARCADE
              </span>
              <h1>LearnCraft Arcade</h1>
              <p>
                Level up your skills through high-energy challenges! Test your speed and concepts to earn verified XP and spendable Game Coins.
              </p>
            </div>

            <div className="arcade-stats-card">
              <div className="arcade-stat-item">
                <span className="arcade-stat-icon gold"><Coins size={20} /></span>
                <div>
                  <strong>{gamification?.coins?.toLocaleString() || 0}</strong>
                  <small>Game Coins</small>
                </div>
              </div>
              <div className="arcade-stat-item">
                <span className="arcade-stat-icon cyan"><Zap size={20} /></span>
                <div>
                  <strong>{gamification?.lifetimeXp?.toLocaleString() || 0}</strong>
                  <small>Lifetime XP</small>
                </div>
              </div>
            </div>
          </div>

          {/* Game Selector Tabs */}
          <div className="arcade-tabs">
            <button
              type="button"
              className={`arcade-tab ${activeTab === 'quiz-rush' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('quiz-rush')
                setQrState('lobby')
              }}
            >
              <Zap size={18} />
              <span>Quiz Rush</span>
              <span className="badge-tag">Fast Timed</span>
            </button>

            <button
              type="button"
              className={`arcade-tab ${activeTab === 'memory-match' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('memory-match')
                setMmState('lobby')
              }}
            >
              <Brain size={18} />
              <span>Memory Match</span>
              <span className="badge-tag">Concepts</span>
            </button>

            <div className="arcade-tab-coming-soon" title="New game arriving soon!">
              <Sparkles size={16} />
              <span>Word Challenge</span>
              <small>Coming Soon</small>
            </div>
          </div>

          {/* ========================================================= */}
          {/* GAME 1: QUIZ RUSH */}
          {/* ========================================================= */}
          {activeTab === 'quiz-rush' && (
            <div className="arcade-arena">
              {/* LOBBY */}
              {qrState === 'lobby' && (
                <div className="arcade-lobby-card">
                  <div className="lobby-icon-wrap cyan">
                    <Zap size={38} />
                  </div>
                  <h2>Quiz Rush Challenge</h2>
                  <p>
                    Race against the clock! Answer computer science and STEM questions as fast as you can. Score 60% or higher to win XP and Coins.
                  </p>

                  <div className="difficulty-picker">
                    <label>Select Difficulty:</label>
                    <div className="diff-buttons">
                      {['easy', 'medium', 'hard'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`diff-btn ${qrDifficulty === d ? 'selected' : ''}`}
                          onClick={() => setQrDifficulty(d)}
                        >
                          {d.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {qrError && <div className="arcade-error"><ShieldAlert size={16} /> {qrError}</div>}

                  <button
                    type="button"
                    className="arcade-start-btn"
                    onClick={handleStartQuizRush}
                    disabled={qrSubmitting}
                  >
                    {qrSubmitting ? 'Loading Rush...' : 'Launch Quiz Rush ⚡'}
                  </button>
                </div>
              )}

              {/* PLAYING */}
              {qrState === 'playing' && currentQ && (
                <div className="quiz-rush-game">
                  <div className="qr-hud">
                    <div className="qr-progress">
                      Question {qrCurrentIndex + 1} of {qrQuestions.length}
                    </div>

                    <div className={`qr-timer ${qrTimeRemaining <= 10 ? 'urgent' : ''}`}>
                      <Clock size={18} />
                      <strong>{qrTimeRemaining}s</strong>
                    </div>
                  </div>

                  <div className="qr-progress-bar">
                    <span
                      style={{
                        width: `${((qrCurrentIndex + 1) / qrQuestions.length) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="qr-question-card">
                    <h3>{currentQ.questionText}</h3>

                    <div className="qr-options-grid">
                      {currentQ.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          className="qr-option-btn"
                          onClick={() => handleSelectQuizOption(oIdx)}
                          disabled={qrSubmitting}
                        >
                          <span className="qr-opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                          <span className="qr-opt-text">{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RESULT */}
              {qrState === 'result' && qrResult && (
                <div className="qr-result-card">
                  <div className={`result-badge ${qrResult.passed ? 'won' : 'retry'}`}>
                    {qrResult.passed ? <Trophy size={42} /> : <RotateCcw size={42} />}
                  </div>

                  <h2>{qrResult.passed ? 'Mission Complete!' : 'Good Effort!'}</h2>
                  <p>
                    You scored <strong>{qrResult.score}%</strong> ({qrResult.correctCount} of {qrResult.totalQuestions} correct) in {qrResult.timeElapsedSeconds} seconds.
                  </p>

                  {qrResult.reward?.awarded ? (
                    <div className="reward-summary-pill">
                      <span><Zap size={16} /> +{qrResult.reward.xpAwarded} XP</span>
                      <span><Coins size={16} /> +{qrResult.reward.coinsAwarded} Coins</span>
                    </div>
                  ) : (
                    <div className="reward-note">
                      {qrResult.passed
                        ? 'Daily rewards limit reached for today or already credited. Keep practicing!'
                        : 'Score 60% or above on your next attempt to earn rewards!'}
                    </div>
                  )}

                  <div className="qr-review-list">
                    <h4>Review Answers:</h4>
                    {qrResult.evaluated?.map((item, idx) => (
                      <div
                        key={idx}
                        className={`qr-review-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
                      >
                        <div className="qr-review-header">
                          {item.isCorrect ? (
                            <CheckCircle2 size={18} className="text-green" />
                          ) : (
                            <XCircle size={18} className="text-red" />
                          )}
                          <strong>Q{idx + 1}: {item.questionText}</strong>
                        </div>
                        <div className="qr-review-explanation">
                          {item.explanation || `Correct: ${item.options[item.correctOptionIndex]}`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="qr-actions">
                    <button
                      type="button"
                      className="arcade-start-btn"
                      onClick={() => setQrState('lobby')}
                    >
                      <RotateCcw size={16} /> Play Again
                    </button>
                    <button
                      type="button"
                      className="arcade-secondary-btn"
                      onClick={() => navigate('/leaderboard')}
                    >
                      View Leaderboard <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* GAME 2: MEMORY MATCH */}
          {/* ========================================================= */}
          {activeTab === 'memory-match' && (
            <div className="arcade-arena">
              {/* LOBBY */}
              {mmState === 'lobby' && (
                <div className="arcade-lobby-card">
                  <div className="lobby-icon-wrap purple">
                    <Brain size={38} />
                  </div>
                  <h2>Concept Memory Match</h2>
                  <p>
                    Test your memory and programming vocabulary! Match concept terms with their accurate definitions in as few moves as possible.
                  </p>

                  <div className="difficulty-picker">
                    <label>Grid Size:</label>
                    <div className="diff-buttons">
                      {[
                        { key: 'easy', label: '6 Pairs (12 Cards)' },
                        { key: 'medium', label: '8 Pairs (16 Cards)' },
                        { key: 'hard', label: '10 Pairs (20 Cards)' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          className={`diff-btn ${mmDifficulty === key ? 'selected' : ''}`}
                          onClick={() => setMmDifficulty(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {mmError && <div className="arcade-error"><ShieldAlert size={16} /> {mmError}</div>}

                  <button
                    type="button"
                    className="arcade-start-btn"
                    onClick={handleStartMemoryMatch}
                    disabled={mmSubmitting}
                  >
                    {mmSubmitting ? 'Shuffling Cards...' : 'Start Matching 🧠'}
                  </button>
                </div>
              )}

              {/* PLAYING */}
              {mmState === 'playing' && (
                <div className="memory-match-game">
                  <div className="mm-hud">
                    <div className="mm-stat">
                      <span>Moves:</span>
                      <strong>{mmMoves}</strong>
                    </div>
                    <div className="mm-stat">
                      <span>Matched:</span>
                      <strong>
                        {mmMatchedPairIds.size} / {mmCards.length / 2}
                      </strong>
                    </div>
                    <div className="mm-stat">
                      <Clock size={16} />
                      <strong>{mmTimerSeconds}s</strong>
                    </div>
                  </div>

                  <div className={`mm-grid grid-${mmCards.length}`}>
                    {mmCards.map((card, idx) => {
                      const isFlipped = mmFlippedIndices.includes(idx)
                      const isMatched = mmMatchedPairIds.has(card.pairId)

                      return (
                        <div
                          key={card.id || idx}
                          className={`mm-card ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                          onClick={() => handleCardClick(idx)}
                        >
                          <div className="mm-card-inner">
                            <div className="mm-card-front">
                              <Sparkles size={22} />
                              <small>LearnCraft</small>
                            </div>
                            <div className={`mm-card-back ${card.kind}`}>
                              <span className="mm-card-tag">
                                {card.kind === 'term' ? 'Concept' : 'Definition'}
                              </span>
                              <p>{card.content}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* RESULT */}
              {mmState === 'result' && mmResult && (
                <div className="qr-result-card">
                  <div className="result-badge won">
                    <Trophy size={42} />
                  </div>
                  <h2>Puzzle Solved!</h2>
                  <p>
                    Outstanding memory! You completed the grid in{' '}
                    <strong>{mmResult.moves} moves</strong> and{' '}
                    <strong>{mmResult.timeSeconds} seconds</strong>.
                  </p>

                  {mmResult.reward?.awarded ? (
                    <div className="reward-summary-pill">
                      <span><Zap size={16} /> +{mmResult.reward.xpAwarded} XP</span>
                      <span><Coins size={16} /> +{mmResult.reward.coinsAwarded} Coins</span>
                    </div>
                  ) : (
                    <div className="reward-note">
                      Daily reward allowance achieved for today. You still earned mental sharpness!
                    </div>
                  )}

                  <div className="qr-actions">
                    <button
                      type="button"
                      className="arcade-start-btn"
                      onClick={() => setMmState('lobby')}
                    >
                      <RotateCcw size={16} /> Play Again
                    </button>
                    <button
                      type="button"
                      className="arcade-secondary-btn"
                      onClick={() => navigate('/shop')}
                    >
                      Visit Shop <Coins size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <RewardToast
        reward={rewardNotification}
        onClose={() => setRewardNotification(null)}
      />
    </div>
  )
}

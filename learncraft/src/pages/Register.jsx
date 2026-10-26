import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  UserRound,
  Mail,
  LockKeyhole,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  Trophy,
  ChartNoAxesColumnIncreasing,
  Sparkles,
} from 'lucide-react'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import AccountLinkingModal from '../components/auth/AccountLinkingModal'
import './Login.css'
import './Register.css'

const roles = [
  { name: 'Student', icon: GraduationCap },
  { name: 'Teacher', icon: Users },
]

const features = [
  {
    label: <>Interactive<br />Lessons</>,
    icon: BookOpenText,
    color: 'purple',
  },
  {
    label: <>AI Tutor<br />Support</>,
    icon: BrainCircuit,
    color: 'green',
  },
  {
    label: <>Earn XP<br />&amp; Badges</>,
    icon: Trophy,
    color: 'orange',
  },
  {
    label: <>Track<br />Your Progress</>,
    icon: ChartNoAxesColumnIncreasing,
    color: 'pink',
  },
]

export default function Register() {
  const navigate = useNavigate()
  const { googleLogin } = useAuth()

  const [role, setRole] = useState('Student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [grade, setGrade] = useState('')
  const [subjects, setSubjects] = useState([])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Google registration states
  const [googleLoading, setGoogleLoading] = useState(false)
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null)
  const [linkingEmail, setLinkingEmail] = useState('')
  const [linkingError, setLinkingError] = useState('')

  async function handleGoogleSuccess(idToken) {
    setError('')
    setGoogleLoading(true)
    try {
      // Pass the selected role tab so new accounts are created with the right role
      const requestedRole = role === 'Teacher' ? 'instructor' : 'student'
      const result = await googleLogin({ idToken, role: requestedRole })
      const loggedInUser = result.data?.user
      if (loggedInUser?.role === 'instructor' || loggedInUser?.role === 'admin') {
        navigate('/instructor')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.data?.requiresLinking) {
        setPendingGoogleToken(idToken)
        setLinkingEmail(err.data.email || '')
        setLinkingError('')
      } else {
        setError(err.message || 'Google registration failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleLinkAccountConfirm({ linkAccountPassword }) {
    if (!pendingGoogleToken) return
    setGoogleLoading(true)
    setLinkingError('')
    try {
      const result = await googleLogin({
        idToken: pendingGoogleToken,
        linkAccountPassword,
      })
      setPendingGoogleToken(null)
      const loggedInUser = result.data?.user
      if (loggedInUser?.role === 'instructor' || loggedInUser?.role === 'admin') {
        navigate('/instructor')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setLinkingError(err.message || 'Incorrect password for account linking.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const availableSubjects = [
    'Mathematics',
    'Science',
    'English',
    'ICT',
    'History',
  ]

  function toggleSubject(subject) {
    setSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject]
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      return
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError('Your password must not exceed 72 bytes.')
      return
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions to continue.')
      return
    }

    setLoading(true)

    try {
      const result = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: role === 'Teacher' ? 'instructor' : 'student',
      })

      if (!result.success) {
        setError(
          result.message || 'Unable to create your account. Please try again.'
        )
        return
      }

      navigate('/login', {
        state: { registrationSuccess: true },
      })
    } catch (err) {
      setError(
        err.message || 'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-overlay" />

      <header className="login-header">
        <Link className="brand" to="/" aria-label="LearnCraft home">
          <span className="brand-icon">
            <Sparkles size={27} />
          </span>
          <span>
            <span className="brand-learn">Learn</span>Craft
          </span>
        </Link>

        <div className="header-account">
          <span>Already have an account?</span>
          <Link to="/login" className="outline-button">
            Sign In
          </Link>
        </div>
      </header>

      <div className="login-layout">
        <section className="hero-section">
          <div className="hero-copy">
            <h1>
              Learn Brighter
              <span>Go Further</span>
            </h1>
            <p>
              AI-powered learning for curious minds
              <br className="desktop-break" /> aged 10–15.
            </p>
          </div>

          <div className="feature-list">
            {features.map(({ label, icon: Icon, color }, index) => (
              <div className="feature-item" key={index}>
                <div className={`feature-icon ${color}`}>
                  <Icon size={34} strokeWidth={2.2} />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="form-section register-form-section">
          <div className="login-card register-card">
            <div className="card-heading">
              <div>
                <h2>Create Account</h2>
                <p>Start your learning journey today</p>
              </div>
              <div className="rocket-decoration" aria-hidden="true">
                🚀
              </div>
            </div>

            <div
              className="role-tabs"
              role="tablist"
              aria-label="Account type"
            >
              {roles.map(({ name: roleName, icon: Icon }) => (
                <button
                  key={roleName}
                  type="button"
                  role="tab"
                  aria-selected={role === roleName}
                  className={`role-tab ${
                    role === roleName ? 'active' : ''
                  }`}
                  onClick={() => {
                    setRole(roleName)
                    setError('')
                  }}
                >
                  <Icon
                    size={23}
                    fill={roleName === 'Student' ? 'currentColor' : 'none'}
                  />
                  <span>{roleName}</span>
                </button>
              ))}
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <label className="input-wrap">
                <UserRound size={22} />
                <input
                  type="text"
                  placeholder="Full name"
                  aria-label="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  required
                />
              </label>

              <label className="input-wrap">
                <Mail size={22} />
                <input
                  type="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              {role === 'Student' && (
                <label className="input-wrap register-select-wrap">
                  <GraduationCap size={22} />
                  <select
                    aria-label="Grade"
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                  >
                    <option value="">Select your grade (optional)</option>
                    {[6, 7, 8, 9, 10, 11].map((value) => (
                      <option key={value} value={value}>
                        Grade {value}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {role === 'Student' && (
                <div className="register-subject-picker">
                  <p className="register-field-label">
                    <BookOpenText size={18} />
                    Choose your subjects (optional)
                  </p>

                  <div className="register-subject-options">
                    {availableSubjects.map((subject) => (
                      <label
                        className={`register-subject-option ${
                          subjects.includes(subject) ? 'selected' : ''
                        }`}
                        key={subject}
                      >
                        <input
                          type="checkbox"
                          checked={subjects.includes(subject)}
                          onChange={() => toggleSubject(subject)}
                        />
                        <span>{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="input-wrap">
                <LockKeyhole size={22} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  aria-label="Create password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </label>

              <label className="input-wrap">
                <LockKeyhole size={22} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  aria-label="Confirm password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={22} />
                  ) : (
                    <Eye size={22} />
                  )}
                </button>
              </label>

              <label className="register-terms">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) =>
                    setAcceptedTerms(event.target.checked)
                  }
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--brand-primary, #6366f1)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => alert('LearnCraft Terms of Service: By signing up, you agree to our standard academic learning guidelines and privacy practices.')}
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--brand-primary, #6366f1)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => alert('LearnCraft Privacy Policy: Your data and learning progress are securely stored and protected.')}
                  >
                    Privacy Policy
                  </button>.
                </span>
              </label>

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="sign-in-button"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight size={22} />}
              </button>
            </form>

            <div className="separator">
              <span>or</span>
            </div>

            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
              loading={googleLoading}
              text="signup_with"
            />

            <p className="register-prompt">
              Already have an account?
              <Link to="/login">
                Sign In <ArrowRight size={18} />
              </Link>
            </p>
          </div>
        </section>
      </div>

      <AccountLinkingModal
        isOpen={Boolean(pendingGoogleToken)}
        email={linkingEmail}
        onConfirm={handleLinkAccountConfirm}
        onCancel={() => {
          setPendingGoogleToken(null)
          setLinkingError('')
        }}
        loading={googleLoading}
        error={linkingError}
      />
    </main>
  )
}
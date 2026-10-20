
import { useState } from 'react'
import {
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  House,
  Mail,
  LockKeyhole,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  Trophy,
  ChartNoAxesColumnIncreasing,
  Sparkles,
} from 'lucide-react'
import './Login.css'

const roles = [
  { name: 'Student', icon: GraduationCap },
  { name: 'Teacher', icon: Users },
  { name: 'Parent', icon: House },
]

const features = [
  { label: <>Interactive<br />Lessons</>, icon: BookOpenText, color: 'purple' },
  { label: <>AI Tutor<br />Support</>, icon: BrainCircuit, color: 'green' },
  { label: <>Earn XP<br />& Badges</>, icon: Trophy, color: 'orange' },
  { label: <>Track<br />Your Progress</>, icon: ChartNoAxesColumnIncreasing, color: 'pink' },
]

export default function Login() {
  const [role, setRole] = useState('Student')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    alert('Login interface is ready. Authentication will be connected later.')
  }

  return (
    <main className="login-page">
      <div className="login-overlay" />

      <header className="login-header">
        <a className="brand" href="/" aria-label="LearnCraft home">
          <span className="brand-icon"><Sparkles size={27} /></span>
          <span><span className="brand-learn">Learn</span>Craft</span>
        </a>

        <div className="header-account">
          <span>New to LearnCraft?</span>
          <a href="/register" className="outline-button">Create Account</a>
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

        <section className="form-section">
          <div className="login-card">
            <div className="card-heading">
              <div>
                <h2>Welcome Back</h2>
                <p>Continue your learning journey</p>
              </div>
              <div className="rocket-decoration" aria-hidden="true">🚀</div>
            </div>

            <div className="role-tabs" role="tablist" aria-label="Account type">
              {roles.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={role === name}
                  className={`role-tab ${role === name ? 'active' : ''}`}
                  onClick={() => setRole(name)}
                >
                  <Icon size={23} fill={name === 'Student' ? 'currentColor' : 'none'} />
                  <span>{name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <label className="input-wrap">
                <Mail size={23} />
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

              <label className="input-wrap">
                <LockKeyhole size={22} fill="currentColor" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  aria-label="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={23} /> : <Eye size={23} />}
                </button>
              </label>

              <div className="form-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="sign-in-button">
                Sign In <ArrowRight size={22} />
              </button>
            </form>

            <div className="separator"><span>or</span></div>

            <button
              type="button"
              className="social-button"
              onClick={() => alert('Google sign-in will be integrated later.')}
            >
              <span className="google-mark">G</span>
              Continue with Google
            </button>

            <button
              type="button"
              className="social-button"
              onClick={() => alert('Microsoft sign-in will be integrated later.')}
            >
              <span className="microsoft-mark">
                <i /><i /><i /><i />
              </span>
              Continue with Microsoft
            </button>

            <p className="register-prompt">
              Don’t have an account?
              <a href="/register">Create Account <ArrowRight size={18} /></a>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

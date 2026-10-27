import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { LockKeyhole, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { authApi } from "../services/api";
import "./Login.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(
    !token ? "Missing password reset token. Please request a new link from the forgot password page." : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing password reset token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Password must not exceed 72 bytes.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to reset password. The reset link may have expired.");
    } finally {
      setLoading(false);
    }
  };

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
      </header>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 120px)", padding: "clamp(12px, 3vw, 20px)" }}>
        <div className="login-card" style={{ maxWidth: "460px", width: "100%", padding: "clamp(22px, 5vw, 36px) clamp(16px, 4vw, 32px)" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(34, 197, 94, 0.15)",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px", color: "var(--lc-text, #132447)" }}>
                Password Reset Complete
              </h2>

              <p style={{ color: "var(--lc-muted, #75839d)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                Your password has been securely updated. You can now log in using your new credentials.
              </p>

              <button
                type="button"
                className="submit-button"
                onClick={() => navigate("/login")}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <span>Sign In Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div>
              <div className="card-heading" style={{ marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "800" }}>Set New Password</h2>
                  <p style={{ color: "var(--lc-muted, #75839d)", fontSize: "14px" }}>
                    Choose a strong password with at least 8 characters
                  </p>
                </div>
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", color: "#dc2626", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="input-wrap" style={{ marginBottom: "16px" }}>
                  <LockKeyhole size={22} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </label>

                <label className="input-wrap" style={{ marginBottom: "22px" }}>
                  <LockKeyhole size={22} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </label>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !token}
                  style={{ width: "100%", justifyContent: "center", marginBottom: "16px" }}
                >
                  <span>{loading ? "Resetting Password..." : "Reset Password"}</span>
                  <ArrowRight size={18} />
                </button>

                <div style={{ textAlign: "center" }}>
                  <Link
                    to="/forgot-password"
                    style={{
                      color: "var(--brand-primary, #6366f1)",
                      fontSize: "13px",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    Request a new reset link
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

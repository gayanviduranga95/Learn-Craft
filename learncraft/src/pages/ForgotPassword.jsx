import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { authApi } from "../services/api";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setLoading(true);

    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      // Generic message to avoid enumeration
      setSubmitted(true);
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
          {submitted ? (
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
                Check Your Inbox
              </h2>

              <p style={{ color: "var(--lc-muted, #75839d)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                If an account with <strong>{email}</strong> exists, we have sent instructions to reset your password. The link is valid for 30 minutes.
              </p>

              <Link
                to="/login"
                className="submit-button"
                style={{ display: "inline-flex", width: "100%", justifyContent: "center", textDecoration: "none" }}
              >
                <span>Return to Sign In</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div>
              <div className="card-heading" style={{ marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "800" }}>Reset Password</h2>
                  <p style={{ color: "var(--lc-muted, #75839d)", fontSize: "14px" }}>
                    Enter your email to receive recovery instructions
                  </p>
                </div>
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", color: "#dc2626", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="input-wrap" style={{ marginBottom: "20px" }}>
                  <Mail size={22} />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </label>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                  style={{ width: "100%", justifyContent: "center", marginBottom: "16px" }}
                >
                  <span>{loading ? "Sending..." : "Send Reset Link"}</span>
                  <ArrowRight size={18} />
                </button>

                <div style={{ textAlign: "center" }}>
                  <Link
                    to="/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "var(--brand-primary, #6366f1)",
                      fontSize: "13px",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    <ArrowLeft size={15} /> Back to Sign In
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

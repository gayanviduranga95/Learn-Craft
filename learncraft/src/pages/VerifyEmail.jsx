import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendNotice, setResendNotice] = useState("");
  const [resending, setResending] = useState(false);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // If the logged in user is already verified, show success immediately
    if (user?.isEmailVerified) {
      setVerified(true);
      setLoading(false);
      return;
    }

    if (!token) {
      setError("No verification token was provided in the link. Please check your verification email.");
      setLoading(false);
      return;
    }

    // Prevent double invocation in React StrictMode
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    async function doVerify() {
      try {
        setLoading(true);
        setError("");
        await authApi.verifyEmail(token);
        setVerified(true);
        if (user) {
          await refreshUser();
        }
      } catch (err) {
        // If user is already verified in context, treat as success
        if (user?.isEmailVerified) {
          setVerified(true);
        } else {
          setError(err.message || "This verification link is invalid, expired, or has already been used.");
        }
      } finally {
        setLoading(false);
      }
    }

    doVerify();
  }, [token, user, refreshUser]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResending(true);
    setResendNotice("");
    try {
      const res = await authApi.resendVerification(resendEmail.trim());
      if (res.alreadyVerified) {
        setResendNotice("This account is already verified! You can sign in directly.");
      } else if (res.devVerificationUrl) {
        setResendNotice("Verification link created! You can use this link to verify: " + res.devVerificationUrl);
      } else {
        setResendNotice(res.message || "If an account exists, a new verification link was sent.");
      }
      setResendEmail("");
    } catch {
      setResendNotice("If an account exists, a new verification link was sent.");
    } finally {
      setResending(false);
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
        <div className="login-card" style={{ maxWidth: "480px", width: "100%", textAlign: "center", padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px)" }}>
          {loading ? (
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <RefreshCw size={44} className="animate-spin" color="var(--brand-primary, #6366f1)" />
              </div>
              <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Verifying your email...</h2>
              <p style={{ color: "var(--lc-muted, #75839d)", fontSize: "14px" }}>
                Please wait a moment while we confirm your LearnCraft account credentials.
              </p>
            </div>
          ) : verified ? (
            <div>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(34, 197, 94, 0.15)",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px", color: "var(--lc-text, #132447)" }}>
                Email Verified Successfully!
              </h2>

              <p style={{ color: "var(--lc-muted, #75839d)", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>
                Your email address has been confirmed. You now have full access to interactive courses, AI tutor, quizzes, and official certificates.
              </p>

              <button
                type="button"
                className="submit-button"
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <span>{user ? "Continue to Dashboard" : "Sign In to Your Account"}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <AlertCircle size={36} />
              </div>

              <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px", color: "var(--lc-text, #132447)" }}>
                Verification Failed
              </h2>

              <p style={{ color: "#ef4444", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
                {error}
              </p>

              <div style={{ background: "var(--lc-bg, #f8faff)", border: "1px solid var(--lc-border, #e4eaf4)", borderRadius: "12px", padding: "20px", textAlign: "left", marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "14px" }}>Need a new verification link?</h4>
                <p style={{ margin: "0 0 14px", fontSize: "13px", color: "var(--lc-muted, #75839d)" }}>
                  Enter your email address below to receive a fresh verification link.
                </p>

                {resendNotice && (
                  <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.15)", color: "#16a34a", fontSize: "13px", marginBottom: "12px" }}>
                    {resendNotice}
                  </div>
                )}

                <form onSubmit={handleResend} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--lc-border, #e4eaf4)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    style={{
                      background: "var(--brand-primary, #6366f1)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resending ? "Sending..." : "Resend"}
                  </button>
                </form>
              </div>

              <Link
                to="/login"
                style={{
                  color: "var(--brand-primary, #6366f1)",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

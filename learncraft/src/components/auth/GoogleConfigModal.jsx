import { useState } from "react";
import { X, Sparkles, Key, ExternalLink, ArrowRight } from "lucide-react";

export default function GoogleConfigModal({
  isOpen,
  onClose,
  onSelectDemoAccount,
}) {
  const [customEmail, setCustomEmail] = useState("");

  if (!isOpen) return null;

  function handleCustomSubmit(e) {
    e.preventDefault();
    if (!customEmail) return;
    const name = customEmail.split("@")[0];
    const sub = "demo_google_sub_" + Math.abs(customEmail.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
    onSelectDemoAccount({
      sub,
      email: customEmail.trim().toLowerCase(),
      name,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(3, 12, 35, 0.8)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          color: "#f8fafc",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(66, 133, 244, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
              Google Sign-In Options
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Option 1: Quick Demo Account (Instant Test) */}
          <div
            style={{
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: "14px",
              padding: "18px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Sparkles size={18} color="#818cf8" />
              <strong style={{ color: "#c7d2fe", fontSize: "0.95rem" }}>
                Option 1: Test with Demo Google Account (Instant)
              </strong>
            </div>
            <p style={{ margin: "0 0 14px", color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.5 }}>
              Test the complete Google authentication, user provisioning, and role redirection right now:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() =>
                  onSelectDemoAccount({
                    sub: "demo_google_student_001",
                    email: "alex.learner@gmail.com",
                    name: "Alex Rivera (Student)",
                    picture: "https://api.dicebear.com/7.x/bottts/svg?seed=Alex",
                  })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  color: "#f8fafc",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div>
                  <strong>Alex Rivera</strong>
                  <span style={{ display: "block", color: "#94a3b8", fontSize: "0.78rem" }}>
                    alex.learner@gmail.com (Role: Student)
                  </span>
                </div>
                <ArrowRight size={16} color="#818cf8" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onSelectDemoAccount({
                    sub: "demo_google_student_002",
                    email: "maya.builder@gmail.com",
                    name: "Maya Chen (Student)",
                    picture: "https://api.dicebear.com/7.x/bottts/svg?seed=Maya",
                  })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  color: "#f8fafc",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div>
                  <strong>Maya Chen</strong>
                  <span style={{ display: "block", color: "#94a3b8", fontSize: "0.78rem" }}>
                    maya.builder@gmail.com (Role: Student)
                  </span>
                </div>
                <ArrowRight size={16} color="#818cf8" />
              </button>
            </div>

            {/* Custom email */}
            <form onSubmit={handleCustomSubmit} style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              <input
                type="email"
                placeholder="Or enter any custom Google email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                style={{
                  flex: 1,
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#f8fafc",
                  fontSize: "0.82rem",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 14px",
                  background: "#4f46e5",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            </form>
          </div>

          {/* Option 2: Live Google Cloud OAuth Setup */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Key size={18} color="#38bdf8" />
              <strong style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>
                Option 2: Connect Live Google Cloud OAuth
              </strong>
            </div>

            <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: "0.83rem", lineHeight: 1.5 }}>
              To enable live Google accounts with the official Google button popup:
            </p>

            <ol
              style={{
                margin: 0,
                paddingLeft: "20px",
                color: "#cbd5e1",
                fontSize: "0.82rem",
                lineHeight: 1.6,
              }}
            >
              <li>
                Create a Web OAuth Client ID in{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#38bdf8", textDecoration: "underline" }}
                >
                  Google Cloud Console <ExternalLink size={12} style={{ display: "inline" }} />
                </a>
              </li>
              <li>
                Add <strong>Authorized JavaScript Origins</strong>:
                <div style={{ marginTop: "3px" }}>
                  <code style={{ color: "#fcd34d", background: "rgba(0,0,0,0.4)", padding: "1px 5px", borderRadius: "4px" }}>http://localhost:5173</code> (local) and <code style={{ color: "#fcd34d", background: "rgba(0,0,0,0.4)", padding: "1px 5px", borderRadius: "4px" }}>https://your-frontend.vercel.app</code> (production).
                </div>
                <small style={{ color: "#94a3b8", display: "block", marginTop: "2px" }}>
                  *If the origin is missing in Google Cloud Console, Google blocks popups with <code>origin_mismatch</code>.
                </small>
              </li>
              <li>
                Paste your Client ID into both files:
                <div style={{ margin: "6px 0", background: "rgba(0,0,0,0.4)", padding: "8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.75rem", color: "#a5f3fc" }}>
                  <div>learncraft/.env: VITE_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com</div>
                  <div>backend/.env: GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com</div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

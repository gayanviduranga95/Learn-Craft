import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Coins,
  Flame,
  ArrowLeft,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authApi, gamificationApi } from "../services/api";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import "./Profile.css";

const AVATAR_PRESETS = [
  "🚀", "🎨", "🧪", "🧙‍♂️", "🦄", "⚡", "🌟", "🦁", "🎮", "📚"
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security' | 'verification'
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Edit profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Verification state
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [profileRes, gamifyRes] = await Promise.all([
          authApi.getProfile().catch(() => null),
          gamificationApi.getProfile().catch(() => null),
        ]);

        if (mounted) {
          if (profileRes?.data?.user) {
            const u = profileRes.data.user;
            setProfileData(u);
            setName(u.name || "");
            setEmail(u.email || "");
            setAvatar(u.avatar || "");
          } else if (user) {
            setProfileData(user);
            setName(user.name || "");
            setEmail(user.email || "");
            setAvatar(user.avatar || "");
          }

          if (gamifyRes?.success && gamifyRes?.data) {
            setGamification(gamifyRes.data);
          }
        }
      } catch (err) {
        console.warn("Failed to load profile data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!name.trim() || name.trim().length < 2) {
      setProfileError("Name must contain at least 2 characters.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        email: email.trim() !== profileData?.email ? email.trim() : undefined,
      });

      if (res.data?.user) {
        setProfileData(res.data.user);
        await refreshUser();
      }

      setProfileSuccess(res.message || "Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (err) {
      setProfileError(err.message || "Unable to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess(res.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    setVerificationNotice("");
    setVerificationError("");

    try {
      const res = await authApi.resendVerification(profileData?.email || user?.email);
      if (res.alreadyVerified) {
        setVerificationNotice("Your email address is already verified!");
        setProfileData((prev) => ({ ...prev, isEmailVerified: true }));
        if (refreshUser) refreshUser();
      } else if (res.devVerificationUrl) {
        setVerificationNotice(
          `Verification link generated! ${res.emailWarning ? "(Delivery warning: " + res.emailWarning + ")" : ""}`
        );
      } else {
        setVerificationNotice(res.message || "Verification email sent! Please check your inbox.");
      }
      setTimeout(() => setVerificationNotice(""), 8000);
    } catch (err) {
      setVerificationError(err.message || "Failed to resend verification email.");
    } finally {
      setSendingVerification(false);
    }
  };

  const memberSince = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Learner";

  const isGoogleAccount = profileData?.authProvider === "google";
  const isVerified = isGoogleAccount || Boolean(profileData?.isEmailVerified);
  const initial = name ? name.charAt(0).toUpperCase() : "U";

  return (
    <div className="lc-profile-page">
      <Sidebar
        gamificationData={gamification}
        totalLessonsDone={gamification?.totalLessonsCompleted || 0}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="lc-profile-container">
        <DashboardHeader
          coins={gamification?.coins ?? profileData?.coins ?? 0}
          streak={gamification?.streak?.current ?? profileData?.streak?.current ?? 0}
          equippedFrame={profileData?.equippedFrame}
          onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
          isMobileNavOpen={mobileNavOpen}
        />

        <main className="lc-profile-main">
          <div className="lc-profile-header">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                color: "var(--lc-blue, #087bff)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "12px",
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1>Student Profile &amp; Settings</h1>
            <p>Manage your personal learning account, preferences, and security.</p>
          </div>

          {loading && !profileData && (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--lc-muted)" }}>
              <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
              <p>Loading your profile and learning statistics...</p>
            </div>
          )}

          {/* Hero Profile Summary Card */}
          <div className="lc-profile-hero">
            <div className="lc-profile-hero-left">
              <div className="lc-profile-avatar-wrap">
                <div className="lc-profile-avatar-large">
                  {avatar && (avatar.startsWith("http") || avatar.startsWith("/")) ? (
                    <img src={avatar} alt={name} />
                  ) : avatar ? (
                    <span>{avatar}</span>
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
              </div>

              <div className="lc-profile-hero-info">
                <h2>{name || "LearnCraft Learner"}</h2>
                <div className="lc-profile-hero-email">
                  <Mail size={15} />
                  <span>{email || profileData?.email}</span>
                </div>

                <div className="lc-profile-badges">
                  <span className="lc-badge lc-badge-role">
                    <Shield size={12} /> {profileData?.role || "Student"}
                  </span>

                  {isVerified ? (
                    <span className="lc-badge lc-badge-verified">
                      <CheckCircle2 size={12} /> Verified Email
                    </span>
                  ) : (
                    <span className="lc-badge lc-badge-unverified">
                      <AlertCircle size={12} /> Unverified
                    </span>
                  )}

                  <span className="lc-badge lc-badge-auth">
                    {isGoogleAccount ? "Google Sign-In" : "Email & Password"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: "12px", color: "var(--lc-muted, #75839d)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                <Calendar size={14} /> Member since
              </div>
              <strong style={{ color: "var(--lc-text, #132447)", fontSize: "13px" }}>{memberSince}</strong>
            </div>
          </div>

          {/* Quick Learning Stats Grid */}
          <div className="lc-profile-stats-grid">
            <div className="lc-profile-stat-box">
              <div className="lc-profile-stat-icon" style={{ background: "rgba(255, 215, 106, 0.15)", color: "#ffd76a" }}>
                <Zap size={22} />
              </div>
              <div className="lc-profile-stat-info">
                <span>Current Level</span>
                <strong>Level {gamification?.level || profileData?.level || 1}</strong>
              </div>
            </div>

            <div className="lc-profile-stat-box">
              <div className="lc-profile-stat-icon" style={{ background: "rgba(8, 123, 255, 0.12)", color: "var(--lc-blue, #087bff)" }}>
                <Sparkles size={22} />
              </div>
              <div className="lc-profile-stat-info">
                <span>Lifetime XP</span>
                <strong>{(gamification?.lifetimeXp || profileData?.lifetimeXp || 0).toLocaleString()} XP</strong>
              </div>
            </div>

            <div className="lc-profile-stat-box">
              <div className="lc-profile-stat-icon" style={{ background: "rgba(251, 191, 36, 0.15)", color: "#f59e0b" }}>
                <Coins size={22} />
              </div>
              <div className="lc-profile-stat-info">
                <span>Game Coins</span>
                <strong>{(gamification?.coins ?? profileData?.coins ?? 50).toLocaleString()}</strong>
              </div>
            </div>

            <div className="lc-profile-stat-box">
              <div className="lc-profile-stat-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                <Flame size={22} />
              </div>
              <div className="lc-profile-stat-info">
                <span>Daily Streak</span>
                <strong>{gamification?.streak?.current ?? profileData?.streak?.current ?? 0} Days</strong>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="lc-profile-tabs">
            <button
              type="button"
              className={`lc-profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <UserIcon size={17} /> Edit Profile
            </button>
            <button
              type="button"
              className={`lc-profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <KeyRound size={17} /> Account &amp; Password
            </button>
            <button
              type="button"
              className={`lc-profile-tab-btn ${activeTab === "verification" ? "active" : ""}`}
              onClick={() => setActiveTab("verification")}
            >
              <Shield size={17} /> Email Verification
            </button>
          </div>

          {/* TAB 1: EDIT PROFILE */}
          {activeTab === "profile" && (
            <div className="lc-settings-card">
              <div className="lc-settings-card-header">
                <h3>Personal Information</h3>
                <p>Update your display name, email, or customize your avatar symbol.</p>
              </div>

              {profileSuccess && (
                <div className="lc-feedback-alert lc-feedback-success">
                  <CheckCircle2 size={18} /> {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="lc-feedback-alert lc-feedback-error">
                  <AlertCircle size={18} /> {profileError}
                </div>
              )}

              <form onSubmit={handleSaveProfile}>
                <div className="lc-form-row">
                  <label className="lc-form-label">Full Name</label>
                  <input
                    type="text"
                    className="lc-form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Your full name"
                  />
                </div>

                <div className="lc-form-row">
                  <label className="lc-form-label">Email Address</label>
                  <input
                    type="email"
                    className="lc-form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                  />
                  <small style={{ color: "var(--lc-muted, #75839d)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    Note: Updating your email address will require re-verifying the new address.
                  </small>
                </div>

                <div className="lc-form-row">
                  <label className="lc-form-label">Account Role</label>
                  <input
                    type="text"
                    className="lc-form-input"
                    value={profileData?.role || "student"}
                    disabled
                    style={{ textTransform: "capitalize" }}
                  />
                  <small style={{ color: "var(--lc-muted, #75839d)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    Account roles are managed by platform administrators.
                  </small>
                </div>

                <div className="lc-form-row">
                  <label className="lc-form-label">Choose Avatar Badge</label>
                  <div className="lc-avatar-presets">
                    {AVATAR_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`lc-avatar-preset-btn ${avatar === emoji ? "active" : ""}`}
                        onClick={() => setAvatar(emoji)}
                        title={`Select ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lc-form-row" style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    className="lc-profile-save-btn"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      "Save Profile Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === "security" && (
            <div>
              {/* Theme Settings Card */}
              <div className="lc-settings-card">
                <div className="lc-settings-card-header">
                  <h3>Interface Theme</h3>
                  <p>Choose your preferred LearnCraft visual appearance.</p>
                </div>

                <div className="lc-theme-options-grid">
                  <button
                    type="button"
                    className={`lc-theme-card-option ${theme === "light" ? "active" : ""}`}
                    onClick={() => setTheme("light")}
                  >
                    <Sun size={24} />
                    <span>Light Mode</span>
                  </button>

                  <button
                    type="button"
                    className={`lc-theme-card-option ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon size={24} />
                    <span>Dark Mode</span>
                  </button>

                  <button
                    type="button"
                    className={`lc-theme-card-option ${theme === "system" ? "active" : ""}`}
                    onClick={() => setTheme("system")}
                  >
                    <Laptop size={24} />
                    <span>System Default</span>
                  </button>
                </div>
              </div>

              {/* Password Change Card */}
              <div className="lc-settings-card">
                <div className="lc-settings-card-header">
                  <h3>Change Password</h3>
                  <p>Ensure your account stays protected by using a secure, unique password.</p>
                </div>

                {isGoogleAccount ? (
                  <div
                    style={{
                      background: "rgba(8, 123, 255, 0.08)",
                      border: "1px solid rgba(8, 123, 255, 0.2)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      color: "var(--lc-text, #132447)",
                      fontSize: "14px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Google Sign-In Account</p>
                    <p style={{ margin: 0, color: "var(--lc-muted, #75839d)" }}>
                      Your LearnCraft account is authenticated through Google. You do not need a separate local password. To update your credentials, visit your Google Account settings.
                    </p>
                  </div>
                ) : (
                  <>
                    {passwordSuccess && (
                      <div className="lc-feedback-alert lc-feedback-success">
                        <CheckCircle2 size={18} /> {passwordSuccess}
                      </div>
                    )}
                    {passwordError && (
                      <div className="lc-feedback-alert lc-feedback-error">
                        <AlertCircle size={18} /> {passwordError}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword}>
                      <div className="lc-form-row">
                        <label className="lc-form-label">Current Password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            className="lc-form-input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "var(--lc-muted, #75839d)",
                              cursor: "pointer",
                            }}
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="lc-form-row">
                        <label className="lc-form-label">New Password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            className="lc-form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="At least 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "var(--lc-muted, #75839d)",
                              cursor: "pointer",
                            }}
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="lc-form-row">
                        <label className="lc-form-label">Confirm New Password</label>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="lc-form-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Re-enter new password"
                        />
                      </div>

                      <div className="lc-form-row" style={{ marginTop: "24px" }}>
                        <button
                          type="submit"
                          className="lc-profile-save-btn"
                          disabled={savingPassword}
                        >
                          {savingPassword ? "Updating Password..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL VERIFICATION */}
          {activeTab === "verification" && (
            <div className="lc-settings-card">
              <div className="lc-settings-card-header">
                <h3>Email Verification Status</h3>
                <p>LearnCraft requires verified email addresses to ensure genuine student progress and certificate legitimacy.</p>
              </div>

              {verificationNotice && (
                <div className="lc-feedback-alert lc-feedback-success">
                  <CheckCircle2 size={18} /> {verificationNotice}
                </div>
              )}
              {verificationError && (
                <div className="lc-feedback-alert lc-feedback-error">
                  <AlertCircle size={18} /> {verificationError}
                </div>
              )}

              {isVerified ? (
                <div
                  style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.25)",
                    borderRadius: "14px",
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(34, 197, 94, 0.2)",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "var(--lc-text, #132447)" }}>
                      Your email address is verified
                    </h4>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--lc-muted, #75839d)" }}>
                      You have full verified access to all courses, quizzes, and verifiable completion certificates.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "14px",
                    padding: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                    <AlertCircle size={28} color="#dc2626" />
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "var(--lc-text, #132447)" }}>
                        Your email address is not yet verified
                      </h4>
                      <p style={{ margin: 0, fontSize: "14px", color: "var(--lc-muted, #75839d)" }}>
                        Please check your inbox at <strong>{profileData?.email}</strong> and click the link inside to verify.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="lc-profile-save-btn"
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                  >
                    {sendingVerification ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

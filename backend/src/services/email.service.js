import crypto from "crypto";

/**
 * LearnCraft Transactional Email Service
 *
 * Supports:
 * 1. Resend API (via RESEND_API_KEY)
 * 2. SendGrid API (via SENDGRID_API_KEY)
 * 3. Fallback / Test / Development mock mode (securely logs dispatch without sending external emails)
 *
 * Security:
 * - Credentials and API keys stay exclusively in backend environment variables.
 * - Raw token secrets are never logged in production.
 * - Dynamic frontend origin support (respects CLIENT_ORIGIN / FRONTEND_URL).
 */

function getFrontendBaseUrl() {
  const origin = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173";
  // If multiple comma-separated origins, pick the first valid web origin
  const primary = origin.split(",")[0].trim().replace(/\/+$/, "");
  return primary.startsWith("http") ? primary : `https://${primary}`;
}

function getSenderInfo() {
  const email = process.env.EMAIL_FROM || "no-reply@learncraft.app";
  const name = process.env.EMAIL_FROM_NAME || "LearnCraft LMS";
  return { email, name };
}

/**
 * Escapes HTML characters to prevent XSS in email clients
 */
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Core send mail helper that uses configured provider or falls back safely
 */
export async function sendEmail({ to, subject, html, text }) {
  const { email: fromEmail, name: fromName } = getSenderInfo();
  const fromFormatted = `"${fromName}" <${fromEmail}>`;

  // 1. Resend Integration
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromFormatted,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Resend email provider error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      return { success: true, messageId: result.id, provider: "resend" };
    } catch (err) {
      console.error("[EmailService] Resend dispatch failed:", err.message);
      throw err;
    }
  }

  // 2. SendGrid Integration
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`SendGrid provider error: ${response.status} - ${errorData}`);
      }

      return { success: true, provider: "sendgrid" };
    } catch (err) {
      console.error("[EmailService] SendGrid dispatch failed:", err.message);
      throw err;
    }
  }

  // 3. Fallback / Test / Development logger
  // Secure mock: logs receipt of dispatch request without revealing production secrets
  if (process.env.NODE_ENV !== "test") {
    console.info(
      `[EmailService:Mock] Email dispatch to <${to}>: "${subject}". (No email API key configured. Set RESEND_API_KEY or SENDGRID_API_KEY to send live emails).`
    );
  }

  return {
    success: true,
    provider: "mock",
    mock: true,
    recipient: to,
    subject,
  };
}

/**
 * Sends an email verification link
 */
export async function sendVerificationEmail({ to, name, token }) {
  const baseUrl = getFrontendBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const cleanName = escapeHtml(name || "Student");

  const subject = "Verify your LearnCraft account";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #071735; color: #f8faff; margin: 0; padding: 40px 20px; }
    .card { max-width: 540px; margin: 0 auto; background: #0b1a38; border: 1px solid #1e335a; border-radius: 16px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .brand { font-size: 22px; font-weight: 800; color: #00d9ed; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
    h1 { font-size: 20px; color: #ffffff; margin-top: 0; }
    p { color: #a8b8d2; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #087bff, #00d9ed); color: #ffffff; text-decoration: none; font-weight: 700; padding: 13px 28px; border-radius: 10px; margin: 24px 0; font-size: 15px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #152648; font-size: 12px; color: #617596; }
    .link-alt { word-break: break-all; color: #00d9ed; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">✦ LearnCraft</div>
    <h1>Welcome to LearnCraft, ${cleanName}!</h1>
    <p>Thank you for creating your account. Please click the button below to verify your email address and activate all learning features:</p>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="btn" target="_blank" rel="noopener noreferrer">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #879ab5;">This verification link will expire in 24 hours. If you did not create a LearnCraft account, you can safely ignore this email.</p>
    <div class="footer">
      <p>Button not working? Copy and paste this link into your browser:</p>
      <p class="link-alt">${verifyUrl}</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
Welcome to LearnCraft, ${name}!

Please verify your email address by visiting the link below:
${verifyUrl}

This link will expire in 24 hours.

If you did not create a LearnCraft account, please ignore this email.
`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Sends a password reset link
 */
export async function sendPasswordResetEmail({ to, name, token }) {
  const baseUrl = getFrontendBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const cleanName = escapeHtml(name || "Learner");

  const subject = "Reset your LearnCraft password";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #071735; color: #f8faff; margin: 0; padding: 40px 20px; }
    .card { max-width: 540px; margin: 0 auto; background: #0b1a38; border: 1px solid #1e335a; border-radius: 16px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .brand { font-size: 22px; font-weight: 800; color: #00d9ed; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
    h1 { font-size: 20px; color: #ffffff; margin-top: 0; }
    p { color: #a8b8d2; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #087bff, #00d9ed); color: #ffffff; text-decoration: none; font-weight: 700; padding: 13px 28px; border-radius: 10px; margin: 24px 0; font-size: 15px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #152648; font-size: 12px; color: #617596; }
    .link-alt { word-break: break-all; color: #00d9ed; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">✦ LearnCraft</div>
    <h1>Password Reset Request</h1>
    <p>Hello ${cleanName},</p>
    <p>We received a request to reset the password for your LearnCraft account. Click the button below to choose a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #879ab5;">For security, this password reset link is single-use and will expire in 30 minutes.</p>
    <p style="font-size: 13px; color: #879ab5;">If you did not request a password reset, no action is needed — your account remains completely secure.</p>
    <div class="footer">
      <p>Button not working? Copy and paste this link into your browser:</p>
      <p class="link-alt">${resetUrl}</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
Hello ${name},

We received a request to reset your LearnCraft password.

Please reset your password using the link below:
${resetUrl}

This link is single-use and will expire in 30 minutes.

If you did not request a password reset, please ignore this email.
`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Sends a notification for Google-only users who attempt password reset
 */
export async function sendGoogleAccountRecoveryNotice({ to, name }) {
  const cleanName = escapeHtml(name || "Learner");
  const subject = "LearnCraft Sign-In Information";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #071735; color: #f8faff; margin: 0; padding: 40px 20px; }
    .card { max-width: 540px; margin: 0 auto; background: #0b1a38; border: 1px solid #1e335a; border-radius: 16px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .brand { font-size: 22px; font-weight: 800; color: #00d9ed; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
    h1 { font-size: 20px; color: #ffffff; margin-top: 0; }
    p { color: #a8b8d2; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">✦ LearnCraft</div>
    <h1>Sign-in with Google</h1>
    <p>Hello ${cleanName},</p>
    <p>We received a password reset request for your email address. However, your LearnCraft account is configured with <strong>Google Sign-In</strong> and does not use an independent password.</p>
    <p>To access your account, simply click <strong>"Continue with Google"</strong> on the LearnCraft login page.</p>
  </div>
</body>
</html>
`;

  const text = `
Hello ${name},

Your LearnCraft account uses Google Sign-In and does not require a password.
To sign in, please click "Continue with Google" on the LearnCraft sign-in page.
`;

  return sendEmail({ to, subject, html, text });
}

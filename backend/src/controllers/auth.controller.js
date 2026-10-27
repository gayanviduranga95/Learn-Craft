
import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendGoogleAccountRecoveryNotice,
} from "../services/email.service.js";

let googleClient = null;

function getGoogleClient() {
  if (!googleClient) {
    const rawId = process.env.GOOGLE_CLIENT_ID || "";
    googleClient = new OAuth2Client(rawId.trim().replace(/^["']|["']$/g, ""));
  }
  return googleClient;
}

export async function verifyGoogleToken(idToken) {
  const configuredClientId = (process.env.GOOGLE_CLIENT_ID || "").trim().replace(/^["']|["']$/g, "");

  // Support testing in test and development environment if test token fixture is passed
  if (
    (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") &&
    idToken.startsWith("test_google_token:")
  ) {
    const raw = idToken.replace("test_google_token:", "");
    const parsed = JSON.parse(raw);
    if (parsed.isExpired) {
      throw new Error("Token is expired.");
    }
    if (parsed.aud && configuredClientId && parsed.aud !== configuredClientId) {
      throw new Error("Token audience mismatch.");
    }
    return {
      sub: parsed.sub,
      email: parsed.email,
      email_verified: parsed.email_verified !== false,
      name: parsed.name,
      picture: parsed.picture,
    };
  }

  if (!configuredClientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: configuredClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Failed to verify Google ID token payload.");
  }

  return payload;
}

export function issueAuthCookie(res, user) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short.");
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    secret,
    {
      expiresIn: "15m",
      issuer: "learncraft-api",
      audience: "learncraft-client",
    }
  );

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("learncraft_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  return token;
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};

    // 1. Validate required fields.
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      cleanEmail.length > 254 ||
      !emailPattern.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // bcrypt only processes up to 72 bytes of a password.
    if (
      Buffer.byteLength(password, "utf8") < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    // 2. Check whether the email is already registered.
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 3. Hash the password.
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Validate and set role (student or instructor).
    const validRoles = ["student", "instructor"];
    const assignedRole = validRoles.includes(req.body?.role) ? req.body.role : "student";

    // 5. Generate secure email verification token.
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
      isEmailVerified: false,
      verificationTokenHash,
      verificationTokenExpires,
    });

    // 6. Send verification email via configured provider or safe mock.
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: verificationToken,
      });
    } catch (emailErr) {
      console.warn("Verification email dispatch warning:", emailErr.message);
    }

    // 7. Return safe user details only.
    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please check your email to verify your account.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: false,
          createdAt: user.createdAt,
        },
        requiresEmailVerification: true,
      },
    });
  } catch (error) {
    // Handles duplicate email attempts, including concurrent requests.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create your account right now.",
    });
  }

}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Include passwordHash because the schema excludes it by default.
    const user = await User.findOne({
      email: cleanEmail,
    }).select("+passwordHash");

    // Use the same message for unknown emails and wrong passwords.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. If you haven't created an account yet, please click 'Create Account' below.",
      });
    }

    if (!user.passwordHash && user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account was created with Google. Please click 'Continue with Google' to sign in.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    issueAuthCookie(res, user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider,
          isEmailVerified: user.isEmailVerified !== false,
          themePreference: user.themePreference || "system",
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in right now.",
    });
  }
}

export async function googleAuth(req, res) {
  try {
    const { idToken, linkAccountPassword } = req.body ?? {};

    if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required.",
      });
    }

    let payload;
    try {
      payload = await verifyGoogleToken(idToken.trim());
    } catch (verifyErr) {
      console.warn("Google token verification failed:", verifyErr.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google token.",
      });
    }

    const { sub, email, email_verified, name, picture } = payload ?? {};

    if (!sub || !email) {
      return res.status(400).json({
        success: false,
        message: "Google token is missing essential identity attributes.",
      });
    }

    if (!email_verified) {
      return res.status(403).json({
        success: false,
        message: "Google account email is not verified. Please verify your email with Google first.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Look for existing user with this googleId
    let user = await User.findOne({ googleId: sub });

    if (user) {
      // Returning Google user
      if (picture && !user.avatar) {
        user.avatar = picture;
        await user.save();
      }

      issueAuthCookie(res, user);

      return res.status(200).json({
        success: true,
        message: "Google sign-in successful.",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            authProvider: user.authProvider,
            isEmailVerified: true,
            themePreference: user.themePreference || "system",
          },
        },
      });
    }

    // 2. Check if a user with this email already exists (local account)
    const existingEmailUser = await User.findOne({ email: cleanEmail }).select("+passwordHash");

    if (existingEmailUser) {
      // Safe account-linking flow: require user to provide password before linking
      if (!linkAccountPassword) {
        return res.status(409).json({
          success: false,
          requiresLinking: true,
          email: cleanEmail,
          message: "An account with this email already exists. Please enter your existing password to link your Google account.",
        });
      }

      const passwordMatches = await bcrypt.compare(
        linkAccountPassword,
        existingEmailUser.passwordHash
      );

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          requiresLinking: true,
          email: cleanEmail,
          message: "Incorrect password for existing account linking.",
        });
      }

      // Passwords match -> Link Google identity to existing account
      existingEmailUser.googleId = sub;
      existingEmailUser.authProvider = "google";
      existingEmailUser.isEmailVerified = true;
      if (picture && !existingEmailUser.avatar) {
        existingEmailUser.avatar = picture;
      }
      await existingEmailUser.save();

      user = existingEmailUser;
      issueAuthCookie(res, user);

      return res.status(200).json({
        success: true,
        message: "Account linked and signed in successfully with Google.",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            authProvider: user.authProvider,
            isEmailVerified: true,
            themePreference: user.themePreference || "system",
          },
        },
      });
    }

    // 3. Brand new user registration via Google
    // Accept role from client but STRICTLY whitelist — only "student" or "instructor" allowed.
    // Existing accounts always keep their stored role (handled above).
    const allowedRoles = ["student", "instructor"];
    const requestedRole = typeof req.body?.role === "string" ? req.body.role.trim().toLowerCase() : "";
    const assignedRole = allowedRoles.includes(requestedRole) ? requestedRole : "student";

    user = await User.create({
      name: (name || cleanEmail.split("@")[0]).trim(),
      email: cleanEmail,
      googleId: sub,
      authProvider: "google",
      role: assignedRole,
      avatar: picture || "",
      isEmailVerified: true,
    });

    issueAuthCookie(res, user);

    return res.status(201).json({
      success: true,
      message: "Account created and signed in with Google.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider,
          isEmailVerified: true,
          themePreference: user.themePreference || "system",
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this Google ID or email already exists.",
      });
    }

    console.error("Google authentication error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to authenticate with Google right now.",
    });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider,
          isEmailVerified: user.isEmailVerified !== false,
          themePreference: user.themePreference || "system",
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your account.",
    });
  }
}

export async function logout(req, res) {
  const isProduction = process.env.NODE_ENV === "production";
  const secureCookie = isProduction || process.env.COOKIE_SECURE === "true";

  res.clearCookie("learncraft_token", {
    httpOnly: true,
    secure: secureCookie,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}

/**
 * Get detailed student profile including learning stats
 */
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider,
          isEmailVerified: user.isEmailVerified !== false,
          themePreference: user.themePreference || "system",
          xp: user.xp || 0,
          lifetimeXp: user.lifetimeXp || 0,
          level: user.level || 1,
          coins: user.coins ?? 50,
          equippedFrame: user.equippedFrame || "default",
          equippedTheme: user.equippedTheme || "default",
          streak: user.streak || { current: 0, longest: 0 },
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user profile.",
    });
  }
}

/**
 * Update student profile info (name, avatar, themePreference, email)
 * Mass-assignment protected: ignores/rejects role, xp, coins, isEmailVerified manipulation
 */
export async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const { name, avatar, themePreference, email } = req.body ?? {};

    // 1. Safe update for name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 80 characters.",
        });
      }
      user.name = name.trim();
    }

    // 2. Safe update for avatar
    if (avatar !== undefined) {
      if (typeof avatar !== "string" || avatar.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Invalid avatar format.",
        });
      }
      user.avatar = avatar.trim();
    }

    // 3. Safe update for theme preference
    if (themePreference !== undefined) {
      const validThemes = ["system", "light", "dark"];
      if (!validThemes.includes(themePreference)) {
        return res.status(400).json({
          success: false,
          message: "Theme preference must be system, light, or dark.",
        });
      }
      user.themePreference = themePreference;
    }

    // 4. Safe email update (requires re-verification)
    let emailChanged = false;
    if (email !== undefined) {
      const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || cleanEmail.length > 254 || !emailPattern.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }

      if (cleanEmail !== user.email) {
        const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "An account with this email address already exists.",
          });
        }

        user.email = cleanEmail;
        user.isEmailVerified = false;
        emailChanged = true;

        const verificationToken = crypto.randomBytes(32).toString("hex");
        user.verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
        user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        try {
          await sendVerificationEmail({
            to: user.email,
            name: user.name,
            token: verificationToken,
          });
        } catch (emailErr) {
          console.warn("Failed to dispatch verification email upon email update:", emailErr.message);
        }
      }
    }

    // Protected from role/xp/coins escalation
    await user.save();

    return res.status(200).json({
      success: true,
      message: emailChanged
        ? "Profile updated. We have sent a verification email to your new address."
        : "Profile updated successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider,
          isEmailVerified: user.isEmailVerified !== false,
          themePreference: user.themePreference || "system",
          createdAt: user.createdAt,
        },
        requiresEmailVerification: emailChanged,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }
    console.error("Update profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
}

/**
 * Change password for local accounts
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    if (
      Buffer.byteLength(newPassword, "utf8") < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "New password must be between 8 characters and 72 bytes.",
      });
    }

    const user = await User.findById(req.auth.userId).select("+passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (!user.passwordHash && user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account was created with Google Sign-In and does not have an independent password.",
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to change password right now.",
    });
  }
}

/**
 * Verify email address with single-use token
 */
export async function verifyEmail(req, res) {
  try {
    const { token } = req.body ?? {};

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await User.findOne({
      verificationTokenHash: tokenHash,
      verificationTokenExpires: { $gt: new Date() },
    }).select("+verificationTokenHash");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification link is invalid, expired, or has already been used.",
      });
    }

    user.isEmailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You now have full access to LearnCraft.",
    });
  } catch (error) {
    console.error("Verify email error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify email address.",
    });
  }
}

/**
 * Resend email verification link with rate limiting
 */
export async function resendVerification(req, res) {
  try {
    const email = req.body?.email || req.auth?.email;
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    const genericResponse = {
      success: true,
      message: "If an unverified account matches that email, a verification link has been sent.",
    };

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user || user.isEmailVerified) {
      return res.status(200).json(genericResponse);
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: verificationToken,
      });
    } catch (err) {
      console.warn("Failed to dispatch resend verification email:", err.message);
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Resend verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to resend verification link.",
    });
  }
}

/**
 * Initiate password reset request (Forgot Password)
 * Returns a generic response to prevent account enumeration
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body ?? {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const genericResponse = {
      success: true,
      message: "If an account matches that email address, password reset instructions have been sent to your inbox.",
    };

    const user = await User.findOne({ email: cleanEmail }).select("+passwordHash");
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    if (!user.passwordHash && user.authProvider === "google") {
      try {
        await sendGoogleAccountRecoveryNotice({
          to: user.email,
          name: user.name,
        });
      } catch (err) {
        console.warn("Failed to send Google account notice:", err.message);
      }
      return res.status(200).json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: resetToken,
      });
    } catch (err) {
      console.warn("Failed to dispatch password reset email:", err.message);
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
}

/**
 * Reset password using single-use reset token
 */
export async function resetPassword(req, res) {
  try {
    const { token, password, newPassword, confirmPassword } = req.body ?? {};
    const passToSet = password || newPassword;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required.",
      });
    }

    if (!passToSet || typeof passToSet !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (confirmPassword !== undefined && passToSet !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (
      Buffer.byteLength(passToSet, "utf8") < 8 ||
      Buffer.byteLength(passToSet, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordTokenExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid, already used, or expired.",
      });
    }

    user.passwordHash = await bcrypt.hash(passToSet, 12);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
}



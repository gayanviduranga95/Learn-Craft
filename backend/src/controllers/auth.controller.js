
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

let googleClient = null;

function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

export async function verifyGoogleToken(idToken) {
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
    if (parsed.aud && process.env.GOOGLE_CLIENT_ID && parsed.aud !== process.env.GOOGLE_CLIENT_ID) {
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

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
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

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
    });

    // 5. Return safe user details only.
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
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
        message: "Invalid email or password.",
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
          },
        },
      });
    }

    // 3. Brand new user registration via Google
    // Enforce safe default role: ALWAYS "student", client role is ignored
    user = await User.create({
      name: (name || cleanEmail.split("@")[0]).trim(),
      email: cleanEmail,
      googleId: sub,
      authProvider: "google",
      role: "student",
      avatar: picture || "",
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



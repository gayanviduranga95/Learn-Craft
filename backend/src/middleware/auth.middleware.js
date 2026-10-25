
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.learncraft_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "learncraft-api",
      audience: "learncraft-client",
    });

    req.auth = {
      userId: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
}

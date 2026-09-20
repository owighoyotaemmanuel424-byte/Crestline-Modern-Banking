import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { db, hashPassword, verifyPassword } from "./db.js";

export interface AuthenticatedUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  country: string;
  status: string;
  kyc_status: string;
  transfer_blocked?: number;
  withdrawal_blocked?: number;
  block_message?: string | null;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  sessionToken?: string;
}

// 7 days session expiration
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function createSession(userId: string, req: Request): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const createdAt = new Date().toISOString();
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Unknown";

  db.prepare(`
    INSERT INTO sessions (token, user_id, ip, user_agent, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(token, userId, ip, userAgent, expiresAt, createdAt);

  // Record security event
  db.prepare(`
    INSERT INTO security_events (id, user_id, event_type, ip, user_agent, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `sec_${crypto.randomUUID()}`,
    userId,
    "LOGIN_SUCCESS",
    ip,
    userAgent,
    "Session token issued",
    createdAt
  );

  return token;
}

export function revokeSession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function revokeAllUserSessions(userId: string) {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function getSessionUser(token: string): AuthenticatedUser | null {
  const now = new Date().toISOString();
  const row = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.country, u.status, u.kyc_status,
           u.transfer_blocked, u.withdrawal_blocked, u.block_message, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.status = 'ACTIVE'
  `).get(token, now) as unknown as AuthenticatedUser | undefined;

  return row || null;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Also support custom x-session-token or cookie
  const customHeader = req.headers["x-session-token"];
  if (typeof customHeader === "string") {
    return customHeader.trim();
  }

  const cookieHeader = req.headers["cookie"];
  if (cookieHeader) {
    const match = cookieHeader.match(/crestline_session=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in."
    });
  }

  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Session has expired or is invalid. Please sign in again."
    });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required."
      });
    }

    // Super Administrator has access to all admin functionality
    if (req.user.role === "Super Administrator" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Record unauthorized access attempt in audit log
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      req.user.role,
      "UNAUTHORIZED_ACCESS_ATTEMPT",
      "ENDPOINT",
      req.originalUrl,
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
      JSON.stringify({ requiredRoles: allowedRoles, userRole: req.user.role }),
      now
    );

    return res.status(403).json({
      success: false,
      error: "Access forbidden. Insufficient permissions for administrative resources."
    });
  };
}

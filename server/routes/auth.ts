import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { db, hashPassword, verifyPassword } from "../db.js";
import { createSession, revokeSession, revokeAllUserSessions, requireAuth, AuthRequest } from "../auth.js";
import { generateAccountNumber } from "../ledger.js";

export const authRouter = Router();

// Validation Schemas
const RegisterSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  country: z.string().min(2, "Country is required"),
  termsAccepted: z.boolean().refine(val => val === true, { message: "You must accept the terms of service." })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

// Register new customer
authRouter.post("/register", (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid registration data"
      });
    }

    const { firstName, lastName, email, phone, password, country } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "An account with this email address already exists. Please sign in."
      });
    }

    db.exec("BEGIN IMMEDIATE");
    const userId = `usr_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(password);

    // Create user
    db.prepare(`
      INSERT INTO users (id, first_name, last_name, email, phone, password_hash, password_salt, role, country, status, kyc_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, firstName.trim(), lastName.trim(), cleanEmail, phone?.trim() || null, hash, salt, "Customer", country, "ACTIVE", "VERIFIED", now, now);

    // Automatically provision primary checking account with $1,000 welcome credit for immediate testing
    const accountId = `acc_${crypto.randomUUID()}`;
    const accountNumber = generateAccountNumber("CHECKING");
    const welcomeCents = 100000; // $1,000.00

    db.prepare(`
      INSERT INTO accounts (id, user_id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(accountId, userId, accountNumber, "021000089", "Premier Checking", "CHECKING", "USD", welcomeCents, welcomeCents, "ACTIVE", now, now);

    // Create initial ledger credit transaction
    const txnId = `txn_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO transactions (id, reference, account_id, user_id, amount, currency, type, status, description, sender_name, sender_account_number, recipient_name, recipient_account_number, fee, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txnId,
      `TXN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      accountId,
      userId,
      welcomeCents,
      "USD",
      "DEPOSIT",
      "COMPLETED",
      "New Account Opening Courtesy Credit",
      "Crestline Capital Operations",
      "TREAS-001",
      `${firstName} ${lastName}`,
      accountNumber,
      0,
      now,
      now
    );

    // Ledger entry
    db.prepare(`
      INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, running_balance, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`led_${crypto.randomUUID()}`, txnId, accountId, "CREDIT", welcomeCents, welcomeCents, "Opening balance courtesy credit", now);

    // Welcome Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      userId,
      "ACCOUNT_STATUS_CHANGE",
      "Welcome to Crestline Capital",
      `Your account ${accountNumber} is active with an opening balance of $1,000.00.`,
      0,
      "/dashboard",
      now
    );

    db.exec("COMMIT");

    const token = createSession(userId, req);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        firstName,
        lastName,
        email: cleanEmail,
        phone,
        role: "Customer",
        country,
        status: "ACTIVE",
        kycStatus: "VERIFIED",
        createdAt: now
      },
      account: {
        id: accountId,
        accountNumber,
        accountName: "Premier Checking",
        accountType: "CHECKING",
        availableBalance: welcomeCents,
        ledgerBalance: welcomeCents
      }
    });
  } catch (err: any) {
    try { db.exec("ROLLBACK"); } catch (_) {}
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create account"
    });
  }
});

// Login
authRouter.post("/login", (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email and password"
      });
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    const user = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(cleanEmail) as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "Account has been suspended or deactivated. Please contact support."
      });
    }

    const isValid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      // Record failed security event
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
      db.prepare(`
        INSERT INTO security_events (id, user_id, event_type, ip, user_agent, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`sec_${crypto.randomUUID()}`, user.id, "LOGIN_FAILED", ip, req.headers["user-agent"] || "Unknown", "Incorrect password attempt", new Date().toISOString());

      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    const token = createSession(user.id, req);

    const accounts = db.prepare(`
      SELECT id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at
      FROM accounts
      WHERE user_id = ? AND status = 'ACTIVE'
    `).all(user.id);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        country: user.country,
        status: user.status,
        kycStatus: user.kyc_status,
        createdAt: user.created_at
      },
      accounts
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: "Authentication service error. Please try again."
    });
  }
});

// Logout
authRouter.post("/logout", requireAuth, (req: AuthRequest, res: Response) => {
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// Get current authenticated user profile & accounts
authRouter.get("/me", requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const accounts = db.prepare(`
    SELECT id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at
    FROM accounts
    WHERE user_id = ?
  `).all(user.id);

  const unreadNotifs = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
  `).get(user.id) as { count: number };

  res.json({
    success: true,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      country: user.country,
      status: user.status,
      kycStatus: user.kyc_status,
      createdAt: user.created_at
    },
    accounts,
    unreadNotificationsCount: unreadNotifs.count
  });
});

// Update Profile
authRouter.put("/profile", requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { firstName, lastName, phone } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, error: "First and last name are required" });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users
    SET first_name = ?, last_name = ?, phone = ?, updated_at = ?
    WHERE id = ?
  `).run(firstName.trim(), lastName.trim(), phone?.trim() || null, now, user.id);

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: {
      ...user,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || null
    }
  });
});

// Change Password
authRouter.post("/change-password", requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: "New password must be at least 8 characters"
    });
  }

  const dbUser = db.prepare("SELECT password_hash, password_salt FROM users WHERE id = ?").get(user.id) as any;
  if (!verifyPassword(currentPassword, dbUser.password_hash, dbUser.password_salt)) {
    return res.status(400).json({
      success: false,
      error: "Current password is incorrect"
    });
  }

  const { hash, salt } = hashPassword(newPassword);
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users
    SET password_hash = ?, password_salt = ?, updated_at = ?
    WHERE id = ?
  `).run(hash, salt, now, user.id);

  // Record security event
  db.prepare(`
    INSERT INTO security_events (id, user_id, event_type, ip, user_agent, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `sec_${crypto.randomUUID()}`,
    user.id,
    "PASSWORD_CHANGED",
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    req.headers["user-agent"] || "Unknown",
    "Password changed by user",
    now
  );

  res.json({ success: true, message: "Password changed successfully" });
});

// Forgot password token generation
authRouter.post("/forgot-password", (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email.toLowerCase().trim()) as any;
  if (!user) {
    // Return success anyway to avoid user enumeration
    return res.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been dispatched."
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  db.prepare(`
    INSERT INTO password_resets (token, user_id, expires_at, used)
    VALUES (?, ?, ?, 0)
  `).run(resetToken, user.id, expiresAt);

  const isProduction = process.env.NODE_ENV === "production";

  return res.json({
    success: true,
    message: "If an account exists with that email, a password reset link has been dispatched.",
    ...(isProduction ? {} : { demoResetToken: resetToken })
  });
});

// Reset password with token
authRouter.post("/reset-password", (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Valid reset token and new password (min 8 chars) required."
    });
  }

  const now = new Date().toISOString();
  const resetRecord = db.prepare(`
    SELECT * FROM password_resets WHERE token = ? AND expires_at > ? AND used = 0
  `).get(token, now) as any;

  if (!resetRecord) {
    return res.status(400).json({
      success: false,
      error: "Reset link has expired or has already been used."
    });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(`
      UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?
    `).run(hash, salt, now, resetRecord.user_id);

    db.prepare("UPDATE password_resets SET used = 1 WHERE token = ?").run(token);

    // Invalidate all existing sessions
    revokeAllUserSessions(resetRecord.user_id);

    db.exec("COMMIT");
    return res.json({ success: true, message: "Password reset successful. Please sign in with your new password." });
  } catch (err: any) {
    db.exec("ROLLBACK");
    return res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

// Active Sessions management
authRouter.get("/sessions", requireAuth, (req: AuthRequest, res: Response) => {
  const sessions = db.prepare(`
    SELECT token, ip, user_agent, expires_at, created_at
    FROM sessions
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user!.id) as any[];

  res.json({
    success: true,
    sessions: sessions.map(s => ({
      tokenPreview: s.token.slice(0, 8) + "...",
      ip: s.ip,
      userAgent: s.userAgent || s.user_agent,
      createdAt: s.created_at,
      isCurrent: s.token === req.sessionToken
    }))
  });
});

// Revoke all other sessions
authRouter.post("/sessions/revoke-others", requireAuth, (req: AuthRequest, res: Response) => {
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(req.user!.id, req.sessionToken);
  res.json({ success: true, message: "All other active sessions revoked." });
});

// Security Events / Activity History
authRouter.get("/security-events", requireAuth, (req: AuthRequest, res: Response) => {
  const events = db.prepare(`
    SELECT id, event_type, ip, user_agent, details, created_at
    FROM security_events
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.user!.id);

  res.json({ success: true, events });
});

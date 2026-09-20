import { Router, Response } from "express";
import crypto from "node:crypto";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";

export const securityRouter = Router();
securityRouter.use(requireAuth);

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const maskedUser = user.length <= 2 ? user[0] + "***" : user[0] + "***" + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

// 1. Request OTP email verification code for outgoing actions (Transfers & Withdrawals)
securityRouter.post("/request-otp", (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { actionType, payload } = req.body;

  if (!["TRANSFER", "WITHDRAWAL"].includes(actionType)) {
    return res.status(400).json({ success: false, error: "actionType must be TRANSFER or WITHDRAWAL." });
  }

  // Generate 6-digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id = `otp_${crypto.randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Invalidate any previous unused codes for this action
  db.prepare("UPDATE verification_codes SET used = 1 WHERE user_id = ? AND action_type = ? AND used = 0").run(user.id, actionType);

  // Save new code
  db.prepare(`
    INSERT INTO verification_codes (id, user_id, email, code, action_type, action_payload, expires_at, used, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    id,
    user.id,
    user.email,
    code,
    actionType,
    payload ? JSON.stringify(payload) : null,
    expiresAt,
    now.toISOString()
  );

  // Deliver simulated email notification to the user's notification tray
  const readableAction = actionType === "TRANSFER" ? "Wire / Transfer" : "Account Withdrawal";
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `notif_${crypto.randomUUID()}`,
    user.id,
    "EMAIL_SECURITY_CODE",
    `📧 [Crestline Email Verification] Your Authorization Code`,
    `Your one-time security authorization code for ${readableAction} is: ${code}. This code expires in 10 minutes. If you did not initiate this request, contact Crestline Fraud Services immediately.`,
    0,
    null,
    now.toISOString()
  );

  res.json({
    success: true,
    message: `Authorization code sent to registered email ${maskEmail(user.email)}.`,
    maskedEmail: maskEmail(user.email),
    code, // returned so the client can display the simulated email preview/toast
    expiresInSeconds: 600
  });
});

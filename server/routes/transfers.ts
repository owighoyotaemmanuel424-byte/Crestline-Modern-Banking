import { Router, Response } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";
import { executeTransfer, formatCents } from "../ledger.js";

export const transfersRouter = Router();

const LookupSchema = z.object({
  accountNumber: z.string().min(5, "Account number is required")
});

const TransferSchema = z.object({
  sourceAccountId: z.string().min(1, "Source account is required"),
  recipientAccountNumber: z.string().min(5, "Recipient account number is required"),
  amountCents: z.number().int().positive("Transfer amount must be greater than zero"),
  description: z.string().max(200).optional(),
  securityCode: z.string().optional()
});

// Lookup recipient before transfer
transfersRouter.post("/lookup", requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const parse = LookupSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: "Invalid account number" });
    }

    const cleanAcc = parse.data.accountNumber.trim();
    const recipient = db.prepare(`
      SELECT a.id, a.account_number, a.account_type, a.status, u.id as user_id, u.first_name, u.last_name, u.status as user_status
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.account_number = ?
    `).get(cleanAcc) as any;

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: `No Crestline Capital account found with number '${cleanAcc}'. Please verify the account number.`
      });
    }

    // Check if it's the sender's own account
    const isOwn = recipient.user_id === req.user!.id;

    if (recipient.status !== "ACTIVE" || recipient.user_status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        error: "This recipient account is restricted and cannot receive incoming funds."
      });
    }

    return res.json({
      success: true,
      recipient: {
        accountNumber: recipient.account_number,
        name: `${recipient.first_name} ${recipient.last_name}`,
        accountType: recipient.account_type,
        isOwnAccount: isOwn
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Execute send money / transfer
transfersRouter.post("/", requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const parse = TransferSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || "Invalid transfer parameters"
      });
    }

    const { sourceAccountId, recipientAccountNumber, amountCents, description, securityCode } = parse.data;

    // Validate 6-digit email authorization code
    if (!securityCode || securityCode.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: "A 6-digit email authorization code is required to authorize this transfer."
      });
    }

    const now = new Date().toISOString();
    const validCode = db.prepare(`
      SELECT * FROM verification_codes
      WHERE user_id = ? AND code = ? AND action_type = 'TRANSFER' AND used = 0 AND expires_at > ?
    `).get(req.user!.id, securityCode.trim(), now) as any;

    if (!validCode) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired authorization code. Please request a new code sent to your email."
      });
    }

    // Mark code as used
    db.prepare("UPDATE verification_codes SET used = 1 WHERE id = ?").run(validCode.id);

    const idempotencyKey = (req.headers["idempotency-key"] as string) || (req.headers["x-idempotency-key"] as string);
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";

    const result = executeTransfer({
      senderUserId: req.user!.id,
      sourceAccountId,
      recipientAccountNumber,
      amountCents,
      description: description || "Account transfer",
      idempotencyKey,
      ip,
      userAgent
    });

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || "Failed to execute transfer"
    });
  }
});

import { Router, Response } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";
import { requestWithdrawal } from "../ledger.js";

export const withdrawalsRouter = Router();

const WithdrawalSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  amountCents: z.number().int().positive("Withdrawal amount must be greater than zero"),
  destinationMethod: z.string().min(2, "Destination method is required"),
  destinationDetails: z.string().min(4, "Destination account / routing details are required"),
  securityCode: z.string().optional()
});

withdrawalsRouter.post("/", requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const parse = WithdrawalSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || "Invalid withdrawal request"
      });
    }

    const { accountId, amountCents, destinationMethod, destinationDetails, securityCode } = parse.data;

    // Validate 6-digit email authorization code
    if (!securityCode || securityCode.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: "A 6-digit email authorization code is required to authorize this withdrawal."
      });
    }

    const now = new Date().toISOString();
    const validCode = db.prepare(`
      SELECT * FROM verification_codes
      WHERE user_id = ? AND code = ? AND action_type = 'WITHDRAWAL' AND used = 0 AND expires_at > ?
    `).get(req.user!.id, securityCode.trim(), now) as any;

    if (!validCode) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired authorization code. Please request a new code sent to your email."
      });
    }

    // Mark code as used
    db.prepare("UPDATE verification_codes SET used = 1 WHERE id = ?").run(validCode.id);

    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    const result = requestWithdrawal({
      userId: req.user!.id,
      accountId,
      amountCents,
      destinationMethod,
      destinationDetails,
      ip
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Failed to submit withdrawal request"
    });
  }
});

withdrawalsRouter.get("/", requireAuth, (req: AuthRequest, res: Response) => {
  const withdrawals = db.prepare(`
    SELECT w.*, a.account_number, a.account_name, t.reference, t.description
    FROM withdrawals w
    JOIN accounts a ON w.account_id = a.id
    JOIN transactions t ON w.transaction_id = t.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).all(req.user!.id);

  res.json({ success: true, withdrawals });
});

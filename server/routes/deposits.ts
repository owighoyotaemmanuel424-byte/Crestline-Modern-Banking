import { Router, Response } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";
import { executeDeposit, formatCents } from "../ledger.js";

export const depositsRouter = Router();

const DepositSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  amountCents: z.number().int().positive("Deposit amount must be positive"),
  method: z.enum(["DIRECT_DEPOSIT", "DOMESTIC_WIRE", "CRYPTO_SETTLEMENT", "CHECK"]),
  reference: z.string().optional()
});

depositsRouter.post("/", requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const parse = DepositSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || "Invalid deposit parameters"
      });
    }

    const { accountId, amountCents, method, reference } = parse.data;
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    const result = executeDeposit({
      userId: req.user!.id,
      accountId,
      amountCents,
      method,
      reference,
      ip
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Failed to process deposit"
    });
  }
});

depositsRouter.get("/", requireAuth, (req: AuthRequest, res: Response) => {
  const deposits = db.prepare(`
    SELECT d.*, a.account_number, a.account_name, t.reference, t.description
    FROM deposits d
    JOIN accounts a ON d.account_id = a.id
    JOIN transactions t ON d.transaction_id = t.id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
    LIMIT 50
  `).all(req.user!.id);

  res.json({ success: true, deposits });
});

import { Router, Response } from "express";
import crypto from "node:crypto";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";
import { generateAccountNumber } from "../ledger.js";

export const accountsRouter = Router();

// Get all accounts for current user
accountsRouter.get("/", requireAuth, (req: AuthRequest, res: Response) => {
  const accounts = db.prepare(`
    SELECT id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at, updated_at
    FROM accounts
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).all(req.user!.id);

  res.json({ success: true, accounts });
});

// Get specific account details (IDOR protected)
accountsRouter.get("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = ["Super Administrator", "Administrator", "Compliance Officer"].includes(req.user!.role);

  const account = db.prepare(`
    SELECT a.*, u.first_name, u.last_name, u.email
    FROM accounts a
    JOIN users u ON a.user_id = u.id
    WHERE a.id = ? ${isAdmin ? "" : "AND a.user_id = ?"}
  `).get(...(isAdmin ? [id] : [id, req.user!.id])) as any;

  if (!account) {
    return res.status(404).json({
      success: false,
      error: "Account not found or access denied."
    });
  }

  // Also fetch recent 20 transactions for this account
  const transactions = db.prepare(`
    SELECT id, reference, amount, currency, type, status, description, sender_name, sender_account_number, recipient_name, recipient_account_number, fee, created_at
    FROM transactions
    WHERE account_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(account.id);

  res.json({
    success: true,
    account: {
      id: account.id,
      accountNumber: account.account_number,
      routingNumber: account.routing_number,
      accountName: account.account_name,
      accountType: account.account_type,
      currency: account.currency,
      availableBalance: account.available_balance,
      ledgerBalance: account.ledger_balance,
      status: account.status,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
      holderName: `${account.first_name} ${account.last_name}`,
      holderEmail: account.email
    },
    recentTransactions: transactions
  });
});

// Open a new account (e.g. High-Yield Savings or Investment)
accountsRouter.post("/", requireAuth, (req: AuthRequest, res: Response) => {
  const { accountType = "SAVINGS", accountName } = req.body;
  const user = req.user!;

  const validTypes = ["CHECKING", "SAVINGS", "INVESTMENT"];
  if (!validTypes.includes(accountType)) {
    return res.status(400).json({ success: false, error: "Invalid account type" });
  }

  const defaultNames: Record<string, string> = {
    CHECKING: "Secondary Checking",
    SAVINGS: "High-Yield Treasury Savings",
    INVESTMENT: "Crestline Yield & Liquidity"
  };

  const name = accountName?.trim() || defaultNames[accountType] || "Personal Account";
  const accNum = generateAccountNumber(accountType);
  const accId = `acc_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO accounts (id, user_id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at, updated_at)
    VALUES (?, ?, ?, '021000089', ?, ?, 'USD', 0, 0, 'ACTIVE', ?, ?)
  `).run(accId, user.id, accNum, name, accountType, now, now);

  // Notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `notif_${crypto.randomUUID()}`,
    user.id,
    "ACCOUNT_STATUS_CHANGE",
    "New Account Opened",
    `Your new ${name} (${accNum}) is active and ready for deposits and transfers.`,
    0,
    `/accounts/${accId}`,
    now
  );

  res.status(201).json({
    success: true,
    account: {
      id: accId,
      accountNumber: accNum,
      routingNumber: "021000089",
      accountName: name,
      accountType,
      currency: "USD",
      availableBalance: 0,
      ledgerBalance: 0,
      status: "ACTIVE",
      createdAt: now
    }
  });
});

// Get official statement data
accountsRouter.get("/:id/statement", requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  const user = req.user!;
  const isAdmin = ["Super Administrator", "Administrator", "Compliance Officer"].includes(user.role);

  const account = db.prepare(`
    SELECT a.*, u.first_name, u.last_name, u.email, u.phone
    FROM accounts a
    JOIN users u ON a.user_id = u.id
    WHERE a.id = ? ${isAdmin ? "" : "AND a.user_id = ?"}
  `).get(...(isAdmin ? [id] : [id, user.id])) as any;

  if (!account) {
    return res.status(404).json({ success: false, error: "Account not found or access denied." });
  }

  let dateQuery = "";
  const params: any[] = [account.id];

  if (typeof startDate === "string" && startDate) {
    dateQuery += " AND created_at >= ?";
    params.push(startDate);
  }
  if (typeof endDate === "string" && endDate) {
    dateQuery += " AND created_at <= ?";
    params.push(endDate);
  }

  const txns = db.prepare(`
    SELECT id, reference, amount, currency, type, status, description, sender_name, sender_account_number, recipient_name, recipient_account_number, fee, created_at
    FROM transactions
    WHERE account_id = ? ${dateQuery}
    ORDER BY created_at ASC
  `).all(...params) as any[];

  // Calculate totals
  let totalDeposits = 0;
  let totalDebits = 0;

  for (const t of txns) {
    if (t.type === "DEPOSIT" || (t.type === "TRANSFER" && t.recipient_account_number === account.account_number)) {
      totalDeposits += t.amount;
    } else {
      totalDebits += t.amount;
    }
  }

  res.json({
    success: true,
    statement: {
      institution: "Crestline Capital, N.A.",
      routingNumber: account.routing_number,
      accountNumber: account.account_number,
      accountName: account.account_name,
      accountType: account.account_type,
      currency: account.currency,
      holder: {
        name: `${account.first_name} ${account.last_name}`,
        email: account.email,
        phone: account.phone
      },
      period: {
        start: startDate || "Inception",
        end: endDate || new Date().toISOString().split("T")[0]
      },
      currentBalance: account.available_balance,
      totalDeposits,
      totalDebits,
      transactionCount: txns.length,
      transactions: txns
    }
  });
});

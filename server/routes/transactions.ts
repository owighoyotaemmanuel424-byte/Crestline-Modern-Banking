import { Router, Response } from "express";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";
import { formatCents } from "../ledger.js";

export const transactionsRouter = Router();

transactionsRouter.get("/", requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { type, status, accountId, search, limit = 50, offset = 0 } = req.query;

  let query = "SELECT t.*, a.account_number, a.account_name FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE t.user_id = ?";
  const params: any[] = [user.id];

  if (type && type !== "all") {
    query += " AND t.type = ?";
    params.push(type);
  }

  if (status && status !== "all") {
    query += " AND t.status = ?";
    params.push(status);
  }

  if (accountId && accountId !== "all") {
    query += " AND t.account_id = ?";
    params.push(accountId);
  }

  if (search && typeof search === "string") {
    query += " AND (t.description LIKE ? OR t.reference LIKE ? OR t.recipient_name LIKE ? OR t.sender_name LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  query += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));

  const transactions = db.prepare(query).all(...params);

  // Get total count for pagination
  const countRow = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = ?").get(user.id) as { count: number };

  res.json({
    success: true,
    transactions,
    total: countRow.count
  });
});

// Single transaction & receipt data
transactionsRouter.get("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const isAdmin = ["Super Administrator", "Administrator", "Compliance Officer"].includes(user.role);

  const txn = db.prepare(`
    SELECT t.*, a.account_number, a.account_name, a.routing_number, u.first_name, u.last_name, u.email
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN users u ON t.user_id = u.id
    WHERE (t.id = ? OR t.reference = ?) ${isAdmin ? "" : "AND t.user_id = ?"}
  `).get(...(isAdmin ? [id, id] : [id, id, user.id])) as any;

  if (!txn) {
    return res.status(404).json({ success: false, error: "Transaction not found or unauthorized" });
  }

  // Fetch double-entry ledger entries for this transaction
  const ledgerEntries = db.prepare(`
    SELECT id, entry_type, amount, running_balance, description, created_at
    FROM ledger_entries
    WHERE transaction_id = ?
    ORDER BY created_at ASC
  `).all(txn.id);

  // Format receipt payload
  const receipt = {
    institution: "Crestline Capital, N.A.",
    institutionAddress: "100 Financial Center Blvd, Suite 2400, New York, NY 10005",
    routingNumber: txn.routing_number,
    reference: txn.reference,
    transactionId: txn.id,
    type: txn.type,
    status: txn.status,
    amountCents: txn.amount,
    formattedAmount: formatCents(txn.amount),
    feeCents: txn.fee || 0,
    formattedFee: formatCents(txn.fee || 0),
    currency: txn.currency,
    description: txn.description,
    senderName: txn.sender_name || `${txn.first_name} ${txn.last_name}`,
    senderAccount: txn.sender_account_number || txn.account_number,
    recipientName: txn.recipient_name,
    recipientAccount: txn.recipient_account_number,
    createdAt: txn.created_at,
    completedAt: txn.completed_at || txn.created_at,
    ledgerVerification: ledgerEntries.length > 0 ? "VERIFIED_DOUBLE_ENTRY" : "SETTLED"
  };

  res.json({
    success: true,
    transaction: txn,
    ledgerEntries,
    receipt
  });
});

import crypto from "node:crypto";
import { db } from "./db.js";

export interface TransferParams {
  senderUserId: string;
  sourceAccountId: string;
  recipientAccountNumber: string;
  amountCents: number;
  description: string;
  idempotencyKey?: string;
  ip?: string;
  userAgent?: string;
}

export interface DepositParams {
  userId: string;
  accountId: string;
  amountCents: number;
  method: string;
  reference?: string;
  ip?: string;
}

export interface WithdrawalParams {
  userId: string;
  accountId: string;
  amountCents: number;
  destinationMethod: string;
  destinationDetails: string;
  ip?: string;
}

// Helper to format cents into readable USD ($XX.XX)
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
}

export function generateReference(prefix: string = "TXN"): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${randomNum}`;
}

export function generateAccountNumber(type: string): string {
  const prefix = type === "SAVINGS" ? "SAV" : type === "INVESTMENT" ? "INV" : "CHK";
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${num}`;
}

/**
 * Executes an atomic transfer between two Crestline accounts with full double-entry ledger entries.
 */
export function executeTransfer(params: TransferParams) {
  const {
    senderUserId,
    sourceAccountId,
    recipientAccountNumber,
    amountCents,
    description,
    idempotencyKey,
    ip = "127.0.0.1"
  } = params;

  // Validation
  if (amountCents <= 0) {
    throw new Error("Transfer amount must be greater than zero.");
  }

  // Check idempotency if key provided
  if (idempotencyKey) {
    const existing = db.prepare("SELECT response_json FROM idempotency_keys WHERE key = ? AND user_id = ?").get(idempotencyKey, senderUserId) as { response_json: string } | undefined;
    if (existing) {
      return JSON.parse(existing.response_json);
    }
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();

    // 1. Fetch & lock sender account
    const sourceAccount = db.prepare(`
      SELECT a.*, u.first_name, u.last_name, u.status as user_status,
             u.transfer_blocked, u.block_message
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(sourceAccountId, senderUserId) as any;

    if (!sourceAccount) {
      throw new Error("Source account not found or unauthorized.");
    }
    if (sourceAccount.transfer_blocked === 1) {
      throw new Error(sourceAccount.block_message || "Outgoing transfers from this account have been restricted by administrative compliance. Please contact support.");
    }
    if (sourceAccount.status !== "ACTIVE" || sourceAccount.user_status !== "ACTIVE") {
      throw new Error("Source account is not active or is frozen.");
    }
    if (sourceAccount.available_balance < amountCents) {
      throw new Error(`Insufficient funds. Available balance: ${formatCents(sourceAccount.available_balance)}.`);
    }

    // 2. Fetch & lock recipient account
    const destAccount = db.prepare(`
      SELECT a.*, u.first_name, u.last_name, u.status as user_status
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.account_number = ?
    `).get(recipientAccountNumber.trim()) as any;

    if (!destAccount) {
      throw new Error(`Recipient account '${recipientAccountNumber}' does not exist.`);
    }
    if (destAccount.id === sourceAccount.id) {
      throw new Error("Self-transfer to the same account is not permitted. Please choose a different account.");
    }
    if (destAccount.status !== "ACTIVE" || destAccount.user_status !== "ACTIVE") {
      throw new Error("Recipient account is currently unable to accept transfers.");
    }

    const senderFullName = `${sourceAccount.first_name} ${sourceAccount.last_name}`;
    const recipientFullName = `${destAccount.first_name} ${destAccount.last_name}`;
    const cleanDesc = description?.trim() || `Transfer to ${recipientFullName}`;
    const txnRef = generateReference("TXN");
    const txnId = `txn_${crypto.randomUUID()}`;

    // 3. Update account balances atomically
    const newSenderBal = sourceAccount.available_balance - amountCents;
    const newDestBal = destAccount.available_balance + amountCents;

    db.prepare(`
      UPDATE accounts
      SET available_balance = ?, ledger_balance = ?, updated_at = ?
      WHERE id = ?
    `).run(newSenderBal, newSenderBal, now, sourceAccount.id);

    db.prepare(`
      UPDATE accounts
      SET available_balance = ?, ledger_balance = ?, updated_at = ?
      WHERE id = ?
    `).run(newDestBal, newDestBal, now, destAccount.id);

    // 4. Create master transaction record for sender
    db.prepare(`
      INSERT INTO transactions (
        id, reference, account_id, user_id, amount, currency, type, status,
        description, sender_name, sender_account_number, recipient_name,
        recipient_account_number, fee, created_at, completed_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txnId,
      txnRef,
      sourceAccount.id,
      senderUserId,
      amountCents,
      "USD",
      "TRANSFER",
      "COMPLETED",
      cleanDesc,
      senderFullName,
      sourceAccount.account_number,
      recipientFullName,
      destAccount.account_number,
      0,
      now,
      now,
      JSON.stringify({ channel: "INTERNAL_BOOK_TRANSFER", sourceAccountName: sourceAccount.account_name })
    );

    // Also create recipient incoming transaction record if recipient is a different user
    if (destAccount.user_id !== senderUserId) {
      const recipientTxnId = `txn_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO transactions (
          id, reference, account_id, user_id, amount, currency, type, status,
          description, sender_name, sender_account_number, recipient_name,
          recipient_account_number, fee, created_at, completed_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        recipientTxnId,
        generateReference("TXN"),
        destAccount.id,
        destAccount.user_id,
        amountCents,
        "USD",
        "TRANSFER",
        "COMPLETED",
        `Received transfer from ${senderFullName}`,
        senderFullName,
        sourceAccount.account_number,
        recipientFullName,
        destAccount.account_number,
        0,
        now,
        now,
        JSON.stringify({ channel: "INTERNAL_BOOK_TRANSFER", relatedTxnId: txnId })
      );

      // Ledger entry for recipient (CREDIT)
      db.prepare(`
        INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, running_balance, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `led_${crypto.randomUUID()}`,
        recipientTxnId,
        destAccount.id,
        "CREDIT",
        amountCents,
        newDestBal,
        `Credit transfer from ${senderFullName}`,
        now
      );

      // Notification for recipient
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `notif_${crypto.randomUUID()}`,
        destAccount.user_id,
        "TRANSFER_COMPLETED",
        "Money Received",
        `You received ${formatCents(amountCents)} from ${senderFullName} into ${destAccount.account_name} (${destAccount.account_number}).`,
        0,
        "/transactions",
        now
      );
    }

    // 5. Double-entry ledger entries for sender (DEBIT)
    db.prepare(`
      INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, running_balance, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `led_${crypto.randomUUID()}`,
      txnId,
      sourceAccount.id,
      "DEBIT",
      amountCents,
      newSenderBal,
      `Debit transfer to ${recipientFullName} (${destAccount.account_number})`,
      now
    );

    // 6. Transfer record
    db.prepare(`
      INSERT INTO transfers (id, transaction_id, source_account_id, dest_account_id, amount, fee, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`trf_${crypto.randomUUID()}`, txnId, sourceAccount.id, destAccount.id, amountCents, 0, "COMPLETED", now);

    // 7. Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      senderUserId,
      senderFullName,
      "Customer",
      "TRANSFER_EXECUTED",
      "TRANSACTION",
      txnId,
      ip,
      JSON.stringify({
        amountCents,
        sourceAccountNumber: sourceAccount.account_number,
        destAccountNumber: destAccount.account_number,
        senderBalAfter: newSenderBal
      }),
      now
    );

    // 8. Notification for sender
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      senderUserId,
      "TRANSFER_COMPLETED",
      "Transfer Sent Successfully",
      `Your transfer of ${formatCents(amountCents)} to ${recipientFullName} has completed.`,
      0,
      `/transactions/${txnId}`,
      now
    );

    const result = {
      success: true,
      transactionId: txnId,
      reference: txnRef,
      amountCents,
      formattedAmount: formatCents(amountCents),
      recipientName: recipientFullName,
      recipientAccount: destAccount.account_number,
      sourceAccount: sourceAccount.account_number,
      sourceBalanceAfter: newSenderBal,
      timestamp: now,
      description: cleanDesc
    };

    // Store idempotency result if key was provided
    if (idempotencyKey) {
      db.prepare(`
        INSERT OR REPLACE INTO idempotency_keys (key, user_id, endpoint, response_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(idempotencyKey, senderUserId, "/api/transfer", JSON.stringify(result), now);
    }

    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Initiates a deposit into an account.
 */
export function executeDeposit(params: DepositParams) {
  const { userId, accountId, amountCents, method, reference, ip = "127.0.0.1" } = params;

  if (amountCents <= 0) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    const account = db.prepare(`
      SELECT a.*, u.first_name, u.last_name, u.status as user_status
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(accountId, userId) as any;

    if (!account) {
      throw new Error("Account not found.");
    }
    if (account.status !== "ACTIVE" || account.user_status !== "ACTIVE") {
      throw new Error("Account is frozen or inactive.");
    }

    const txnRef = reference || generateReference("DEP");
    const txnId = `txn_${crypto.randomUUID()}`;
    const userFullName = `${account.first_name} ${account.last_name}`;
    const newBal = account.available_balance + amountCents;

    // Credit account balance
    db.prepare(`
      UPDATE accounts
      SET available_balance = ?, ledger_balance = ?, updated_at = ?
      WHERE id = ?
    `).run(newBal, newBal, now, account.id);

    // Create transaction
    db.prepare(`
      INSERT INTO transactions (
        id, reference, account_id, user_id, amount, currency, type, status,
        description, sender_name, sender_account_number, recipient_name,
        recipient_account_number, fee, created_at, completed_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txnId,
      txnRef,
      account.id,
      userId,
      amountCents,
      "USD",
      "DEPOSIT",
      "COMPLETED",
      `Deposit via ${method.replace(/_/g, " ")}`,
      "External Settlement Network",
      "SETTLE-001",
      userFullName,
      account.account_number,
      0,
      now,
      now,
      JSON.stringify({ method, traceId: `DEP-${Date.now()}` })
    );

    // Ledger entry (CREDIT)
    db.prepare(`
      INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, running_balance, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `led_${crypto.randomUUID()}`,
      txnId,
      account.id,
      "CREDIT",
      amountCents,
      newBal,
      `Deposit credit via ${method}`,
      now
    );

    // Deposit record
    db.prepare(`
      INSERT INTO deposits (id, transaction_id, account_id, user_id, amount, method, reference, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`dep_${crypto.randomUUID()}`, txnId, account.id, userId, amountCents, method, txnRef, "COMPLETED", now);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      userId,
      userFullName,
      "Customer",
      "DEPOSIT_PROCESSED",
      "TRANSACTION",
      txnId,
      ip,
      JSON.stringify({ amountCents, method, newBalance: newBal }),
      now
    );

    // Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      userId,
      "DEPOSIT_COMPLETED",
      "Deposit Credited",
      `Your deposit of ${formatCents(amountCents)} into ${account.account_name} (${account.account_number}) is complete.`,
      0,
      `/transactions/${txnId}`,
      now
    );

    db.exec("COMMIT");

    return {
      success: true,
      transactionId: txnId,
      reference: txnRef,
      amountCents,
      formattedAmount: formatCents(amountCents),
      accountNumber: account.account_number,
      newBalance: newBal,
      timestamp: now
    };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Customer requests a withdrawal. If under auto-approval threshold, settles immediately;
 * otherwise creates a PENDING withdrawal for compliance/admin approval.
 */
export function requestWithdrawal(params: WithdrawalParams) {
  const { userId, accountId, amountCents, destinationMethod, destinationDetails, ip = "127.0.0.1" } = params;

  if (amountCents <= 0) {
    throw new Error("Withdrawal amount must be greater than zero.");
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    const account = db.prepare(`
      SELECT a.*, u.first_name, u.last_name, u.status as user_status,
             u.withdrawal_blocked, u.block_message
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(accountId, userId) as any;

    if (!account) {
      throw new Error("Account not found.");
    }
    if (account.withdrawal_blocked === 1) {
      throw new Error(account.block_message || "Withdrawals from this account have been restricted by administrative compliance. Please contact support.");
    }
    if (account.status !== "ACTIVE" || account.user_status !== "ACTIVE") {
      throw new Error("Account is frozen or inactive.");
    }
    if (account.available_balance < amountCents) {
      throw new Error(`Insufficient funds. Available balance is ${formatCents(account.available_balance)}.`);
    }

    const userFullName = `${account.first_name} ${account.last_name}`;
    const txnRef = generateReference("WTH");
    const txnId = `txn_${crypto.randomUUID()}`;
    const withdrawalId = `wth_${crypto.randomUUID()}`;

    // Deduct immediately from available_balance to prevent double-spending
    const newAvailBal = account.available_balance - amountCents;
    db.prepare(`
      UPDATE accounts
      SET available_balance = ?, updated_at = ?
      WHERE id = ?
    `).run(newAvailBal, now, account.id);

    // Create pending transaction
    db.prepare(`
      INSERT INTO transactions (
        id, reference, account_id, user_id, amount, currency, type, status,
        description, sender_name, sender_account_number, recipient_name,
        recipient_account_number, fee, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txnId,
      txnRef,
      account.id,
      userId,
      amountCents,
      "USD",
      "WITHDRAWAL",
      "PENDING",
      `Withdrawal to ${destinationDetails}`,
      userFullName,
      account.account_number,
      destinationDetails,
      "DEST-WIRE",
      0,
      now,
      JSON.stringify({ destinationMethod, destinationDetails })
    );

    // Create withdrawal record
    db.prepare(`
      INSERT INTO withdrawals (
        id, transaction_id, account_id, user_id, amount, fee, destination_method,
        destination_details, status, admin_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      withdrawalId,
      txnId,
      account.id,
      userId,
      amountCents,
      0,
      destinationMethod,
      destinationDetails,
      "PENDING",
      "Awaiting compliance verification",
      now
    );

    // Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      userId,
      "WITHDRAWAL_SUBMITTED",
      "Withdrawal Under Review",
      `Your withdrawal request of ${formatCents(amountCents)} has been submitted for processing.`,
      0,
      `/transactions/${txnId}`,
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      userId,
      userFullName,
      "Customer",
      "WITHDRAWAL_SUBMITTED",
      "WITHDRAWAL",
      withdrawalId,
      ip,
      JSON.stringify({ amountCents, destinationMethod, destinationDetails }),
      now
    );

    db.exec("COMMIT");

    return {
      success: true,
      withdrawalId,
      transactionId: txnId,
      reference: txnRef,
      amountCents,
      formattedAmount: formatCents(amountCents),
      status: "PENDING",
      message: "Withdrawal request placed in compliance queue for review.",
      availableBalanceAfter: newAvailBal
    };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Admin approves a pending withdrawal: updates ledger, finalizes transaction.
 */
export function approveWithdrawal(adminUser: any, withdrawalId: string, adminNotes: string = "Approved by Administrator", ip: string = "127.0.0.1") {
  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    const w = db.prepare(`
      SELECT w.*, t.reference, t.description, a.account_number, a.ledger_balance, a.id as acc_id, u.first_name, u.last_name
      FROM withdrawals w
      JOIN transactions t ON w.transaction_id = t.id
      JOIN accounts a ON w.account_id = a.id
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `).get(withdrawalId) as any;

    if (!w) throw new Error("Withdrawal request not found.");
    if (w.status !== "PENDING") throw new Error(`Withdrawal is already in '${w.status}' status.`);

    // Finalize ledger balance deduction
    const newLedgerBal = w.ledger_balance - w.amount;
    db.prepare(`
      UPDATE accounts
      SET ledger_balance = ?, updated_at = ?
      WHERE id = ?
    `).run(newLedgerBal, now, w.acc_id);

    // Update withdrawal status
    db.prepare(`
      UPDATE withdrawals
      SET status = 'APPROVED', admin_notes = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).run(adminNotes, `${adminUser.first_name} ${adminUser.last_name}`, now, withdrawalId);

    // Update transaction status
    db.prepare(`
      UPDATE transactions
      SET status = 'COMPLETED', completed_at = ?
      WHERE id = ?
    `).run(now, w.transaction_id);

    // Create ledger entry (DEBIT)
    db.prepare(`
      INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, running_balance, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `led_${crypto.randomUUID()}`,
      w.transaction_id,
      w.acc_id,
      "DEBIT",
      w.amount,
      newLedgerBal,
      `Settled withdrawal: ${w.destination_details}`,
      now
    );

    // Notification to user
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      w.user_id,
      "WITHDRAWAL_APPROVED",
      "Withdrawal Approved & Dispatched",
      `Your withdrawal of ${formatCents(w.amount)} has been approved and dispatched to ${w.destination_details}.`,
      0,
      `/transactions/${w.transaction_id}`,
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      adminUser.id,
      `${adminUser.first_name} ${adminUser.last_name}`,
      adminUser.role,
      "WITHDRAWAL_APPROVED",
      "WITHDRAWAL",
      withdrawalId,
      ip,
      JSON.stringify({ amountCents: w.amount, notes: adminNotes }),
      now
    );

    db.exec("COMMIT");
    return { success: true, message: "Withdrawal successfully approved and settled." };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Admin rejects a pending withdrawal: returns reserved funds to available_balance.
 */
export function rejectWithdrawal(adminUser: any, withdrawalId: string, rejectionReason: string, ip: string = "127.0.0.1") {
  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    const w = db.prepare(`
      SELECT w.*, a.available_balance, a.id as acc_id, u.first_name, u.last_name
      FROM withdrawals w
      JOIN accounts a ON w.account_id = a.id
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `).get(withdrawalId) as any;

    if (!w) throw new Error("Withdrawal request not found.");
    if (w.status !== "PENDING") throw new Error(`Withdrawal is already in '${w.status}' status.`);

    // Return funds back to available_balance
    const restoredAvailBal = w.available_balance + w.amount;
    db.prepare(`
      UPDATE accounts
      SET available_balance = ?, updated_at = ?
      WHERE id = ?
    `).run(restoredAvailBal, now, w.acc_id);

    // Update withdrawal record
    db.prepare(`
      UPDATE withdrawals
      SET status = 'REJECTED', admin_notes = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).run(`Rejected: ${rejectionReason}`, `${adminUser.first_name} ${adminUser.last_name}`, now, withdrawalId);

    // Update transaction record
    db.prepare(`
      UPDATE transactions
      SET status = 'CANCELLED'
      WHERE id = ?
    `).run(w.transaction_id);

    // Notification to user
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      w.user_id,
      "WITHDRAWAL_REJECTED",
      "Withdrawal Request Declined",
      `Your withdrawal request of ${formatCents(w.amount)} was declined. Reason: ${rejectionReason}. Funds have been restored to your available balance.`,
      0,
      `/transactions/${w.transaction_id}`,
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      adminUser.id,
      `${adminUser.first_name} ${adminUser.last_name}`,
      adminUser.role,
      "WITHDRAWAL_REJECTED",
      "WITHDRAWAL",
      withdrawalId,
      ip,
      JSON.stringify({ amountCents: w.amount, reason: rejectionReason }),
      now
    );

    db.exec("COMMIT");
    return { success: true, message: "Withdrawal rejected and funds restored to customer account." };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export interface AdminBalanceAdjustmentParams {
  adminUserId: string;
  adminName: string;
  adminRole: string;
  accountId: string;
  amountCents: number;
  adjustmentType: 'CREDIT' | 'DEBIT';
  note: string;
  category?: string;
  ip?: string;
}

export function executeAdminBalanceAdjustment(params: AdminBalanceAdjustmentParams) {
  const {
    adminUserId,
    adminName,
    adminRole,
    accountId,
    amountCents,
    adjustmentType,
    note,
    category = "Administrative Adjustment",
    ip = "127.0.0.1"
  } = params;

  if (amountCents <= 0) {
    throw new Error("Adjustment amount must be greater than zero.");
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const account = db.prepare(`
      SELECT a.*, u.id as user_id, u.first_name, u.last_name, u.email
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(accountId) as any;

    if (!account) {
      throw new Error("Account not found.");
    }

    if (adjustmentType === "DEBIT" && account.available_balance < amountCents) {
      throw new Error(`Insufficient funds for debit adjustment. Current balance is ${formatCents(account.available_balance)}.`);
    }

    const now = new Date().toISOString();
    const newAvail = adjustmentType === "CREDIT" ? account.available_balance + amountCents : account.available_balance - amountCents;
    const newLedger = adjustmentType === "CREDIT" ? account.ledger_balance + amountCents : account.ledger_balance - amountCents;

    // 1. Update account balance
    db.prepare(`
      UPDATE accounts
      SET available_balance = ?, ledger_balance = ?, updated_at = ?
      WHERE id = ?
    `).run(newAvail, newLedger, now, accountId);

    // 2. Insert transaction
    const txnId = `txn_${crypto.randomUUID()}`;
    const reference = generateReference(adjustmentType === "CREDIT" ? "CR" : "DB");
    const desc = `${adjustmentType === "CREDIT" ? "Credit Adjustment" : "Debit Adjustment"}: ${note || category}`;

    db.prepare(`
      INSERT INTO transactions (
        id, reference, account_id, user_id, amount, currency,
        type, status, description, sender_name, sender_account_number,
        recipient_name, recipient_account_number,
        fee, created_at, completed_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txnId,
      reference,
      accountId,
      account.user_id,
      amountCents,
      account.currency || "USD",
      "ADJUSTMENT",
      "COMPLETED",
      desc,
      adjustmentType === "CREDIT" ? `Crestline Treasury (${adminName})` : `${account.first_name} ${account.last_name}`,
      adjustmentType === "CREDIT" ? "TREASURY-01" : account.account_number,
      adjustmentType === "CREDIT" ? `${account.first_name} ${account.last_name}` : `Crestline Treasury (${adminName})`,
      adjustmentType === "CREDIT" ? account.account_number : "TREASURY-01",
      0,
      now,
      now,
      JSON.stringify({ adminUserId, adminName, adjustmentType, note, category })
    );

    // 3. Ledger entry
    const ledgerEntryId = `led_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, running_balance, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ledgerEntryId,
      txnId,
      accountId,
      adjustmentType === "CREDIT" ? "CREDIT" : "DEBIT",
      amountCents,
      newAvail,
      desc,
      now
    );

    // 4. Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      adminUserId,
      adminName,
      adminRole,
      adjustmentType === "CREDIT" ? "ADMIN_BALANCE_CREDIT" : "ADMIN_BALANCE_DEBIT",
      "ACCOUNT",
      accountId,
      ip,
      JSON.stringify({
        amountCents,
        formattedAmount: formatCents(amountCents),
        previousBalance: account.available_balance,
        newBalance: newAvail,
        note
      }),
      now
    );

    // 5. User Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      account.user_id,
      adjustmentType === "CREDIT" ? "BALANCE_CREDITED" : "BALANCE_DEBITED",
      adjustmentType === "CREDIT" ? "Account Credited" : "Account Debited",
      adjustmentType === "CREDIT"
        ? `An administrative credit of ${formatCents(amountCents)} has been added to your account (${account.account_number}). Reason: ${note || category}`
        : `An administrative debit of ${formatCents(amountCents)} has been removed from your account (${account.account_number}). Reason: ${note || category}`,
      0,
      `/transactions/${txnId}`,
      now
    );

    db.exec("COMMIT");

    return {
      success: true,
      transactionId: txnId,
      reference,
      adjustmentType,
      amountCents,
      formattedAmount: formatCents(amountCents),
      previousBalanceCents: account.available_balance,
      newBalanceCents: newAvail,
      formattedNewBalance: formatCents(newAvail),
      accountNumber: account.account_number
    };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}


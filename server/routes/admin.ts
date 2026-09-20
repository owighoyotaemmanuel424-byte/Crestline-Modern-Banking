import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { db, verifyPassword, removeAllDemoData } from "../db.js";
import { requireAuth, requireRole, createSession, AuthRequest } from "../auth.js";
import { approveWithdrawal, rejectWithdrawal, formatCents, executeAdminBalanceAdjustment } from "../ledger.js";

export const adminRouter = Router();

// Public Admin Login endpoint before requireAuth
adminRouter.post("/login", (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail) as any;
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid admin email or password" });
    }

    const allowedRoles = ["Super Administrator", "Administrator", "Compliance Officer", "Support Operator"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, error: "Access denied. Account lacks administrative clearance." });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ success: false, error: "Administrator account is inactive or suspended" });
    }

    const isValid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid admin email or password" });
    }

    const token = createSession(user.id, req);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
        role: user.role,
        country: user.country,
        status: user.status
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Admin authentication service error" });
  }
});

// 192-bit / 48-char Hex Master Key Gatekeeper Login
adminRouter.post("/gatekeeper-login", (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentFails = db.prepare(`
      SELECT COUNT(*) as count FROM security_events
      WHERE event_type = 'ADMIN_GATEKEEPER_FAIL' AND ip = ? AND created_at > ?
    `).get(clientIp, fiveMinsAgo) as { count: number };

    if (recentFails && recentFails.count >= 5) {
      return res.status(429).json({
        success: false,
        error: "Security lockout: Excessive invalid gatekeeper authentication attempts. Access temporarily restricted for 5 minutes."
      });
    }

    const { masterKey } = req.body || {};
    if (!masterKey || typeof masterKey !== "string") {
      return res.status(400).json({ success: false, error: "192-bit cryptographic master token required" });
    }

    const cleanKey = masterKey.trim().toLowerCase();
    
    // Validate that it conforms to 48-hexadecimal characters (192 bits)
    const is48Hex = /^[0-9a-f]{48}$/i.test(cleanKey);
    if (!is48Hex) {
      return res.status(400).json({ success: false, error: "Invalid master key structure: Must be exactly 48 hexadecimal characters (192-bit entropy)" });
    }

    const envKey = process.env.ADMIN_GATEKEEPER_MASTER_KEY?.trim().toLowerCase();
    const masterKeyRow = db.prepare("SELECT value FROM system_settings WHERE key = 'ADMIN_GATEKEEPER_MASTER_KEY'").get() as { value: string } | undefined;
    const expectedKey = (envKey || (masterKeyRow ? masterKeyRow.value : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c")).toLowerCase();

    // Constant-time comparison to prevent timing attacks
    const keyBuf = Buffer.from(cleanKey);
    const expectedBuf = Buffer.from(expectedKey);
    const isMatch = keyBuf.length === expectedBuf.length && crypto.timingSafeEqual(keyBuf, expectedBuf);

    if (!isMatch) {
      db.prepare(`
        INSERT INTO security_events (id, user_id, event_type, severity, ip, user_agent, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'sec_' + Date.now(),
        'system',
        'ADMIN_GATEKEEPER_FAIL',
        'HIGH',
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'Unknown',
        JSON.stringify({ attempt: cleanKey.substring(0, 8) + '...' }),
        new Date().toISOString()
      );
      return res.status(401).json({ success: false, error: "Cryptographic Gatekeeper authentication rejected: Invalid Master Key" });
    }

    // Authenticate as Super Administrator
    const designatedAdmin = db.prepare("SELECT * FROM users WHERE email = 'owighoyotaemmanuel424@gmail.com'").get() as any
      || db.prepare("SELECT * FROM users WHERE role = 'Super Administrator' LIMIT 1").get() as any;

    if (!designatedAdmin) {
      return res.status(500).json({ success: false, error: "Root administrative account not provisioned" });
    }

    const token = createSession(designatedAdmin.id, req);

    // Record audit event
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'aud_' + Date.now(),
      designatedAdmin.id,
      `${designatedAdmin.first_name} ${designatedAdmin.last_name}`,
      designatedAdmin.role,
      'MASTER_GATEKEEPER_AUTH_SUCCESS',
      'SYSTEM',
      'GATEKEEPER_192BIT',
      req.ip || '127.0.0.1',
      JSON.stringify({ method: '192-bit Cryptographic Hex Key' }),
      new Date().toISOString()
    );

    return res.json({
      success: true,
      token,
      clearance: "Super Administrator (Tier 1 Clearance)",
      user: {
        id: designatedAdmin.id,
        firstName: designatedAdmin.first_name,
        lastName: designatedAdmin.last_name,
        name: `${designatedAdmin.first_name} ${designatedAdmin.last_name}`,
        email: designatedAdmin.email,
        phone: designatedAdmin.phone,
        role: designatedAdmin.role,
        country: designatedAdmin.country,
        status: designatedAdmin.status
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Gatekeeper verification service exception" });
  }
});

// Protect ALL admin routes with server-side RBAC
adminRouter.use(requireAuth);
adminRouter.use(requireRole("Super Administrator", "Administrator", "Compliance Officer", "Support Operator"));

// Purge all demo data for production deployment
adminRouter.post("/purge-demo-data", (req: AuthRequest, res: Response) => {
  try {
    const callerRole = req.user?.role;
    if (callerRole !== "Super Administrator" && callerRole !== "Administrator") {
      return res.status(403).json({ success: false, error: "Only Super Administrators can purge demo data for production." });
    }

    const stats = removeAllDemoData();

    // Record immutable audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      req.user?.id || "usr_emmanuel_admin",
      "Emmanuel Owighoyota",
      "Super Administrator",
      "DEMO_DATA_PURGED_FOR_PRODUCTION",
      "SYSTEM",
      "CRESTLINE_PRODUCTION",
      req.ip || "127.0.0.1",
      JSON.stringify(stats),
      new Date().toISOString()
    );

    return res.json({
      success: true,
      message: "All demo data permanently purged for production deployment.",
      stats
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to purge demo data" });
  }
});

// 1. Admin Dashboard Stats
adminRouter.get("/dashboard-stats", (req: AuthRequest, res: Response) => {
  // Total Platform Balances
  const balanceRow = db.prepare(`
    SELECT
      COALESCE(SUM(available_balance), 0) as total_available,
      COALESCE(SUM(ledger_balance), 0) as total_ledger
    FROM accounts
  `).get() as { total_available: number; total_ledger: number };

  // Total and Pending Deposits
  const depositsRow = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_completed,
      COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as total_pending,
      COUNT(*) as count
    FROM transactions
    WHERE type = 'DEPOSIT'
  `).get() as { total_completed: number; total_pending: number; count: number };

  // Total and Pending Withdrawals
  const withdrawalsRow = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'APPROVED' OR status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_completed,
      COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as total_pending,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count
    FROM withdrawals
  `).get() as { total_completed: number; total_pending: number; pending_count: number };

  // Total Transfers
  const transfersRow = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_completed,
      COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as total_pending,
      COUNT(*) as count
    FROM transfers
  `).get() as { total_completed: number; total_pending: number; count: number };

  // Customer Metrics
  const usersRow = db.prepare(`
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_users,
      COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END) as suspended_users
    FROM users
    WHERE role = 'Customer'
  `).get() as { total_users: number; active_users: number; suspended_users: number };

  // Accounts Count
  const accountsRow = db.prepare(`
    SELECT
      COUNT(*) as total_accounts,
      COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_accounts,
      COUNT(CASE WHEN status = 'FROZEN' THEN 1 END) as frozen_accounts
    FROM accounts
  `).get() as { total_accounts: number; active_accounts: number; frozen_accounts: number };

  // Recent 6 transactions
  const recentTransactions = db.prepare(`
    SELECT t.id, t.reference, t.amount, t.currency, t.type, t.status, t.description, t.sender_name, t.recipient_name, t.created_at, u.email as user_email
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    LIMIT 6
  `).all();

  res.json({
    success: true,
    platformLiquidityCents: balanceRow.total_available,
    formattedPlatformLiquidity: formatCents(balanceRow.total_available),
    totalDeposits: depositsRow.total_completed / 100,
    pendingDeposits: depositsRow.total_pending / 100,
    totalWithdrawals: withdrawalsRow.total_completed / 100,
    pendingWithdrawals: withdrawalsRow.total_pending / 100,
    totalTransfers: transfersRow.total_completed / 100,
    pendingTransfers: transfersRow.total_pending / 100,
    totalUsers: usersRow.total_users,
    activeUsers: usersRow.active_users,
    blockedUsers: usersRow.suspended_users,
    totalDepositsCents: depositsRow.total_completed,
    pendingDepositsCents: depositsRow.total_pending,
    totalWithdrawalsCents: withdrawalsRow.total_completed,
    pendingWithdrawalsCents: withdrawalsRow.total_pending,
    pendingWithdrawalsCount: withdrawalsRow.pending_count,
    totalTransfersCents: transfersRow.total_completed,
    pendingTransfersCents: transfersRow.total_pending,
    totalCustomers: usersRow.total_users,
    activeCustomers: usersRow.active_users,
    suspendedCustomers: usersRow.suspended_users,
    totalAccounts: accountsRow.total_accounts,
    activeAccounts: accountsRow.active_accounts,
    recentTransactions
  });
});

// 2. Customers Management
adminRouter.get("/customers", (req: AuthRequest, res: Response) => {
  const customers = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.country, u.status, u.kyc_status,
           u.transfer_blocked, u.withdrawal_blocked, u.block_message, u.created_at,
           COUNT(a.id) as account_count,
           COALESCE(SUM(a.available_balance), 0) as total_balance_cents
    FROM users u
    LEFT JOIN accounts a ON u.id = a.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as any[];

  res.json({
    success: true,
    customers: customers.map(c => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      phone: c.phone,
      role: c.role,
      country: c.country,
      status: c.status,
      kycStatus: c.kyc_status,
      transferBlocked: c.transfer_blocked === 1,
      withdrawalBlocked: c.withdrawal_blocked === 1,
      blockMessage: c.block_message || "",
      accountCount: c.account_count,
      totalBalanceCents: c.total_balance_cents,
      formattedBalance: formatCents(c.total_balance_cents),
      createdAt: c.created_at
    }))
  });
});

// Update customer restrictions (block transfers / withdrawals and set custom message)
adminRouter.post("/customers/:id/restrictions", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { transferBlocked, withdrawalBlocked, blockMessage } = req.body;
  const admin = req.user!;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  if (!user) {
    return res.status(404).json({ success: false, error: "Customer not found." });
  }

  const now = new Date().toISOString();
  const tBlocked = transferBlocked ? 1 : 0;
  const wBlocked = withdrawalBlocked ? 1 : 0;
  const msg = blockMessage !== undefined ? String(blockMessage).trim() : user.block_message || "";

  db.prepare(`
    UPDATE users
    SET transfer_blocked = ?, withdrawal_blocked = ?, block_message = ?, updated_at = ?
    WHERE id = ?
  `).run(tBlocked, wBlocked, msg, now, id);

  // Record audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "CUSTOMER_RESTRICTIONS_UPDATED",
    "USER",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ transferBlocked: tBlocked === 1, withdrawalBlocked: wBlocked === 1, blockMessage: msg }),
    now
  );

  // If restrictions were applied, send notification to user
  if (tBlocked === 1 || wBlocked === 1) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${crypto.randomUUID()}`,
      id,
      "SECURITY_RESTRICTION",
      "Account Service Notice",
      msg || "Your account has received updated transactional guidelines. Please contact Crestline Support.",
      0,
      "/security",
      now
    );
  }

  res.json({
    success: true,
    message: "Customer transactional restrictions updated successfully.",
    restrictions: {
      transferBlocked: tBlocked === 1,
      withdrawalBlocked: wBlocked === 1,
      blockMessage: msg
    }
  });
});

// Toggle user status (suspend / restore)
adminRouter.post("/customers/:id/status", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const admin = req.user!;

  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    return res.status(400).json({ success: false, error: "Status must be ACTIVE or SUSPENDED" });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  // Prevent suspending the last super admin
  if (user.role === "Super Administrator" && status === "SUSPENDED") {
    const superAdminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Super Administrator' AND status = 'ACTIVE'").get() as { count: number };
    if (superAdminCount.count <= 1) {
      return res.status(400).json({ success: false, error: "Cannot suspend the last active Super Administrator." });
    }
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?").run(status, now, id);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    status === "ACTIVE" ? "USER_RESTORED" : "USER_SUSPENDED",
    "USER",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ reason: reason || "Admin policy decision", previousStatus: user.status }),
    now
  );

  res.json({ success: true, message: `Customer status updated to ${status}` });
});

// 3. Accounts Management
adminRouter.get("/accounts", (req: AuthRequest, res: Response) => {
  const accounts = db.prepare(`
    SELECT a.*, u.first_name, u.last_name, u.email
    FROM accounts a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
  `).all();

  res.json({ success: true, accounts });
});

adminRouter.post("/accounts/:id/freeze", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const now = new Date().toISOString();

  db.prepare("UPDATE accounts SET status = 'FROZEN', updated_at = ? WHERE id = ?").run(now, id);

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "ACCOUNT_FROZEN",
    "ACCOUNT",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ notes: req.body?.reason || "Admin intervention" }),
    now
  );

  res.json({ success: true, message: "Account has been frozen" });
});

adminRouter.post("/accounts/:id/unfreeze", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const now = new Date().toISOString();

  db.prepare("UPDATE accounts SET status = 'ACTIVE', updated_at = ? WHERE id = ?").run(now, id);

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "ACCOUNT_UNFROZEN",
    "ACCOUNT",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ notes: req.body?.reason || "Compliance review resolved" }),
    now
  );

  res.json({ success: true, message: "Account has been restored to ACTIVE" });
});

// Admin Add or Remove Balance (Double-entry ledger credit/debit adjustment)
adminRouter.post("/accounts/:id/adjust-balance", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amountCents, adjustmentType, note, category } = req.body;
  const admin = req.user!;

  if (!amountCents || typeof amountCents !== "number" || amountCents <= 0) {
    return res.status(400).json({ success: false, error: "Valid positive amount in cents is required." });
  }

  if (!["CREDIT", "DEBIT"].includes(adjustmentType)) {
    return res.status(400).json({ success: false, error: "adjustmentType must be CREDIT or DEBIT." });
  }

  try {
    const result = executeAdminBalanceAdjustment({
      adminUserId: admin.id,
      adminName: `${admin.first_name} ${admin.last_name}`,
      adminRole: admin.role,
      accountId: id,
      amountCents,
      adjustmentType,
      note: note || (adjustmentType === "CREDIT" ? "Administrative balance credit" : "Administrative balance debit"),
      category: category || "Compliance Adjustment",
      ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1"
    });

    res.json({
      success: true,
      message: `Successfully ${adjustmentType === "CREDIT" ? "added" : "deducted"} ${result.formattedAmount} ${adjustmentType === "CREDIT" ? "to" : "from"} account.`,
      result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Balance adjustment failed."
    });
  }
});

// 4. Transactions Management
adminRouter.get("/transactions", (req: AuthRequest, res: Response) => {
  const { type, status, search, limit = 100 } = req.query;

  let query = `
    SELECT t.*, a.account_number, a.account_name, u.first_name, u.last_name, u.email
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (type && type !== "all") {
    query += " AND t.type = ?";
    params.push(type);
  }
  if (status && status !== "all") {
    query += " AND t.status = ?";
    params.push(status);
  }
  if (search && typeof search === "string") {
    query += " AND (t.reference LIKE ? OR t.description LIKE ? OR u.email LIKE ? OR a.account_number LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  query += " ORDER BY t.created_at DESC LIMIT ?";
  params.push(Number(limit));

  const transactions = db.prepare(query).all(...params);
  res.json({ success: true, transactions });
});

// 5. Withdrawals Approval System
adminRouter.get("/withdrawals", (req: AuthRequest, res: Response) => {
  const withdrawals = db.prepare(`
    SELECT w.*, a.account_number, a.account_name, a.available_balance, a.ledger_balance,
           u.first_name, u.last_name, u.email, t.reference
    FROM withdrawals w
    JOIN accounts a ON w.account_id = a.id
    JOIN users u ON w.user_id = u.id
    JOIN transactions t ON w.transaction_id = t.id
    ORDER BY w.created_at DESC
  `).all();

  res.json({ success: true, withdrawals });
});

adminRouter.post("/withdrawals/:id/approve", (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    const result = approveWithdrawal(req.user!, id, notes, ip);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

adminRouter.post("/withdrawals/:id/reject", (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: "A rejection reason is required for compliance records." });
    }

    const result = rejectWithdrawal(req.user!, id, reason, ip);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Audit Logs (Append-Only)
adminRouter.get("/audit", (req: AuthRequest, res: Response) => {
  const { action, limit = 100 } = req.query;
  let query = "SELECT * FROM audit_logs";
  const params: any[] = [];

  if (action && typeof action === "string") {
    query += " WHERE action LIKE ?";
    params.push(`%${action}%`);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(Number(limit));

  const logs = db.prepare(query).all(...params);
  res.json({ success: true, logs });
});

// 7. System Settings
adminRouter.get("/settings", (req: AuthRequest, res: Response) => {
  const settings = db.prepare("SELECT * FROM system_settings").all();
  res.json({ success: true, settings });
});

adminRouter.put("/settings", (req: AuthRequest, res: Response) => {
  const { key, value } = req.body;
  const admin = req.user!;
  if (!key || value === undefined) {
    return res.status(400).json({ success: false, error: "Key and value are required" });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE system_settings
    SET value = ?, updated_at = ?
    WHERE key = ?
  `).run(String(value), now, key);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "SETTING_CHANGED",
    "SYSTEM_SETTING",
    key,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ updatedKey: key, newValue: value }),
    now
  );

  res.json({ success: true, message: `Setting '${key}' updated successfully` });
});

// KYC Compliance Management Endpoints
adminRouter.get("/settings/kyc", (req: AuthRequest, res: Response) => {
  const row = db.prepare("SELECT value FROM system_settings WHERE key = 'KYC_REQUIRED'").get() as { value: string } | undefined;
  const isKycRequired = row ? row.value === "true" : true;
  const pendingCount = (db.prepare("SELECT COUNT(*) as count FROM kyc_submissions WHERE status = 'pending'").get() as { count: number }).count;
  res.json({ isKycRequired, submissionsCount: pendingCount });
});

adminRouter.put("/settings/kyc", (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const now = new Date().toISOString();
  let isKycRequired = true;
  if (typeof req.body.isKycRequired === "boolean") {
    isKycRequired = req.body.isKycRequired;
  }
  db.prepare(`
    INSERT INTO system_settings (key, value, description, updated_at)
    VALUES ('KYC_REQUIRED', ?, 'Flag enforcing KYC verification for account operations', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(String(isKycRequired), now);

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "KYC_POLICY_TOGGLED",
    "SYSTEM_SETTING",
    "KYC_REQUIRED",
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ isKycRequired }),
    now
  );

  res.json({ success: true, isKycRequired });
});

adminRouter.post("/settings/kyc", (req: AuthRequest, res: Response) => {
  const admin = req.user!;
  const now = new Date().toISOString();
  let isKycRequired = true;
  if (typeof req.body.isKycRequired === "boolean") {
    isKycRequired = req.body.isKycRequired;
  }
  db.prepare(`
    INSERT INTO system_settings (key, value, description, updated_at)
    VALUES ('KYC_REQUIRED', ?, 'Flag enforcing KYC verification for account operations', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(String(isKycRequired), now);

  res.json({ success: true, isKycRequired });
});

adminRouter.get("/kyc/submissions", (req: AuthRequest, res: Response) => {
  const rows = db.prepare("SELECT * FROM kyc_submissions ORDER BY submitted_at DESC").all() as any[];
  const submissions = rows.map(r => {
    let auditLogs = [];
    try {
      if (r.audit_trail_json) auditLogs = JSON.parse(r.audit_trail_json);
    } catch (_) {}
    return {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      status: r.status,
      submittedAt: r.submitted_at,
      docType: r.document_type,
      documentType: r.document_type,
      docNumber: r.document_number,
      documentNumber: r.document_number,
      country: r.country,
      riskScore: r.risk_score ? (isNaN(Number(r.risk_score)) ? 12 : Number(r.risk_score)) : 12,
      riskLevel: r.compliance_level || "Tier 2 - Verified Individual",
      complianceLevel: r.compliance_level || "Tier 2 - Verified Individual",
      reviewNotes: r.review_notes,
      auditLogs,
      auditTrail: auditLogs
    };
  });
  res.json(submissions);
});

adminRouter.post("/kyc/submissions/:id/approve", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const now = new Date().toISOString();

  const sub = db.prepare("SELECT * FROM kyc_submissions WHERE id = ?").get(id) as any;
  if (!sub) {
    return res.status(404).json({ success: false, error: "Submission not found" });
  }

  let auditLogs = [];
  try {
    if (sub.audit_trail_json) auditLogs = JSON.parse(sub.audit_trail_json);
  } catch (_) {}

  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: now,
    actor: `${admin.first_name} ${admin.last_name} (${admin.role})`,
    event: "Verification Approved",
    details: "Compliance approval granted. Clearance updated to Verified."
  });

  db.prepare("UPDATE kyc_submissions SET status = 'approved', audit_trail_json = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(auditLogs), now, id);

  if (sub.user_id) {
    db.prepare("UPDATE users SET kyc_status = 'VERIFIED', updated_at = ? WHERE id = ? OR email = ?")
      .run(now, sub.user_id, sub.email);
  }

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "KYC_APPROVED",
    "KYC_SUBMISSION",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ submissionId: id, userEmail: sub.email }),
    now
  );

  res.json({ success: true, message: "Submission approved successfully" });
});

adminRouter.post("/kyc/submissions/:id/reject", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const admin = req.user!;
  const now = new Date().toISOString();

  const sub = db.prepare("SELECT * FROM kyc_submissions WHERE id = ?").get(id) as any;
  if (!sub) {
    return res.status(404).json({ success: false, error: "Submission not found" });
  }

  let auditLogs = [];
  try {
    if (sub.audit_trail_json) auditLogs = JSON.parse(sub.audit_trail_json);
  } catch (_) {}

  auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: now,
    actor: `${admin.first_name} ${admin.last_name} (${admin.role})`,
    event: "Verification Rejected",
    details: `Submission rejected by administrator: ${reason || 'Documentation standard not met'}`
  });

  db.prepare("UPDATE kyc_submissions SET status = 'rejected', audit_trail_json = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(auditLogs), now, id);

  if (sub.user_id) {
    db.prepare("UPDATE users SET kyc_status = 'REJECTED', updated_at = ? WHERE id = ? OR email = ?")
      .run(now, sub.user_id, sub.email);
  }

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "KYC_REJECTED",
    "KYC_SUBMISSION",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ submissionId: id, userEmail: sub.email, reason }),
    now
  );

  res.json({ success: true, message: "Submission rejected" });
});

// 8. Users List Endpoint (matching /api/admin/users)
adminRouter.get("/users", (req: AuthRequest, res: Response) => {
  const users = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.country, u.status, u.kyc_status,
           u.transfer_blocked, u.withdrawal_blocked, u.block_message, u.created_at,
           COUNT(a.id) as account_count,
           COALESCE(SUM(a.available_balance), 0) as total_balance_cents
    FROM users u
    LEFT JOIN accounts a ON u.id = a.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as any[];

  res.json(users.map(u => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    country: u.country,
    status: u.status,
    kycStatus: u.kyc_status,
    kycVerified: u.kyc_status === 'VERIFIED',
    transferBlocked: u.transfer_blocked === 1,
    withdrawalBlocked: u.withdrawal_blocked === 1,
    blockMessage: u.block_message || "",
    accountCount: u.account_count,
    balance: u.total_balance_cents / 100,
    totalBalanceCents: u.total_balance_cents,
    formattedBalance: formatCents(u.total_balance_cents),
    joinedDate: u.created_at,
    createdAt: u.created_at
  })));
});

// 9. Generic Resource CRUD Engine for Administrative Modules
adminRouter.get("/resource/:resourceType", (req: AuthRequest, res: Response) => {
  const { resourceType } = req.params;

  // Special handling for audit-log
  if (resourceType === 'audit-log' || resourceType === 'audit') {
    const logs = db.prepare(`
      SELECT id, actor_name as admin, action, target_type, target_id, ip, metadata, created_at as timestamp
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all() as any[];

    return res.json(logs.map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      admin: l.admin || 'System',
      action: l.action,
      target: `${l.target_type} (${l.target_id || 'N/A'})`,
      ip: l.ip
    })));
  }

  // Fetch from admin_resources table
  const rows = db.prepare(`
    SELECT id, data_json, created_at, updated_at
    FROM admin_resources
    WHERE resource_type = ?
    ORDER BY created_at DESC
  `).all(resourceType) as any[];

  const items = rows.map(r => {
    try {
      const parsed = JSON.parse(r.data_json);
      return { id: r.id, ...parsed, _createdAt: r.created_at, _updatedAt: r.updated_at };
    } catch {
      return { id: r.id, _createdAt: r.created_at };
    }
  });

  res.json(items);
});

adminRouter.post("/resource/:resourceType", (req: AuthRequest, res: Response) => {
  const { resourceType } = req.params;
  const admin = req.user!;
  const data = req.body || {};
  const id = data.id || `rec_${resourceType.slice(0, 3)}_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO admin_resources (id, resource_type, data_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, resourceType, JSON.stringify(data), now, now);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "RESOURCE_CREATED",
    resourceType.toUpperCase(),
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ resourceType, recordId: id }),
    now
  );

  res.status(201).json({ success: true, id, ...data });
});

adminRouter.put("/resource/:resourceType/:id", (req: AuthRequest, res: Response) => {
  const { resourceType, id } = req.params;
  const admin = req.user!;
  const data = req.body || {};
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT id FROM admin_resources WHERE id = ? AND resource_type = ?").get(id, resourceType);
  if (!existing) {
    // Upsert if not found
    db.prepare(`
      INSERT INTO admin_resources (id, resource_type, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, resourceType, JSON.stringify(data), now, now);
  } else {
    db.prepare(`
      UPDATE admin_resources
      SET data_json = ?, updated_at = ?
      WHERE id = ? AND resource_type = ?
    `).run(JSON.stringify(data), now, id, resourceType);
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "RESOURCE_UPDATED",
    resourceType.toUpperCase(),
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ resourceType, recordId: id }),
    now
  );

  res.json({ success: true, id, ...data });
});

adminRouter.delete("/resource/:resourceType/:id", (req: AuthRequest, res: Response) => {
  const { resourceType, id } = req.params;
  const admin = req.user!;
  const now = new Date().toISOString();

  db.prepare("DELETE FROM admin_resources WHERE id = ? AND resource_type = ?").run(id, resourceType);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "RESOURCE_DELETED",
    resourceType.toUpperCase(),
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ resourceType, recordId: id }),
    now
  );

  res.json({ success: true, message: "Record deleted successfully" });
});

// 10. Deposits List and Approval
adminRouter.get("/deposits", (req: AuthRequest, res: Response) => {
  const deposits = db.prepare(`
    SELECT t.id, t.reference, t.amount, t.currency, t.status, t.description, t.sender_name, t.created_at,
           u.email as user_email, u.first_name, u.last_name, a.account_number
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    JOIN accounts a ON t.account_id = a.id
    WHERE t.type = 'DEPOSIT'
    ORDER BY t.created_at DESC
  `).all();

  res.json({ success: true, deposits });
});

adminRouter.post("/deposits/:id/approve", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const now = new Date().toISOString();

  const txn = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
  if (!txn) {
    return res.status(404).json({ success: false, error: "Deposit transaction not found" });
  }

  if (txn.status === "COMPLETED") {
    return res.status(400).json({ success: false, error: "Deposit is already completed" });
  }

  // Update status to COMPLETED
  db.prepare("UPDATE transactions SET status = 'COMPLETED', updated_at = ? WHERE id = ?").run(now, id);

  // Credit the account
  db.prepare("UPDATE accounts SET available_balance = available_balance + ?, ledger_balance = ledger_balance + ?, updated_at = ? WHERE id = ?")
    .run(txn.amount, txn.amount, now, txn.account_id);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "DEPOSIT_APPROVED",
    "TRANSACTION",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ amountCents: txn.amount, accountId: txn.account_id }),
    now
  );

  res.json({ success: true, message: "Deposit verified and funds credited to customer ledger" });
});

adminRouter.post("/deposits/:id/reject", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const admin = req.user!;
  const now = new Date().toISOString();

  db.prepare("UPDATE transactions SET status = 'FAILED', description = ?, updated_at = ? WHERE id = ?")
    .run(`Rejected: ${reason || 'Compliance verification failed'}`, now, id);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "DEPOSIT_REJECTED",
    "TRANSACTION",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ reason: reason || 'Compliance failure' }),
    now
  );

  res.json({ success: true, message: "Deposit rejected" });
});

// 11. Transfers Ledger
adminRouter.get("/transfers", (req: AuthRequest, res: Response) => {
  const transfers = db.prepare(`
    SELECT tr.*, u.email as sender_email, u.first_name as sender_first, u.last_name as sender_last
    FROM transfers tr
    JOIN users u ON tr.user_id = u.id
    ORDER BY tr.created_at DESC
  `).all();

  res.json({ success: true, transfers });
});

// 12. Cards Management
adminRouter.get("/cards", (req: AuthRequest, res: Response) => {
  const cards = db.prepare(`
    SELECT c.*, u.email as user_email, u.first_name, u.last_name
    FROM cards c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
  `).all();

  res.json({ success: true, cards });
});

adminRouter.post("/cards/:id/freeze", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const now = new Date().toISOString();

  db.prepare("UPDATE cards SET status = 'FROZEN', updated_at = ? WHERE id = ?").run(now, id);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "CARD_FROZEN",
    "CARD",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ cardId: id }),
    now
  );

  res.json({ success: true, message: "Card frozen securely" });
});

adminRouter.post("/cards/:id/unfreeze", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const now = new Date().toISOString();

  db.prepare("UPDATE cards SET status = 'ACTIVE', updated_at = ? WHERE id = ?").run(now, id);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud_${crypto.randomUUID()}`,
    admin.id,
    `${admin.first_name} ${admin.last_name}`,
    admin.role,
    "CARD_UNFROZEN",
    "CARD",
    id,
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    JSON.stringify({ cardId: id }),
    now
  );

  res.json({ success: true, message: "Card unfrozen" });
});


import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import crypto from "node:crypto";

const DB_PATH = process.env.VERCEL
  ? ":memory:"
  : path.join(process.cwd(), "crestline_bank.db");

export const db = new DatabaseSync(DB_PATH);

// Vercel Functions run with an immutable deployment filesystem. Keep the
// serverless demo/runtime database in memory and enable WAL only for local
// file-backed SQLite.
if (!process.env.VERCEL) {
  db.exec("PRAGMA journal_mode = WAL;");
}
db.exec("PRAGMA foreign_keys = ON;");

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Customer',
      country TEXT NOT NULL DEFAULT 'United States',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      kyc_status TEXT NOT NULL DEFAULT 'VERIFIED',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_number TEXT UNIQUE NOT NULL,
      routing_number TEXT NOT NULL DEFAULT '021000089',
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL, -- 'CHECKING', 'SAVINGS', 'INVESTMENT'
      currency TEXT NOT NULL DEFAULT 'USD',
      available_balance INTEGER NOT NULL DEFAULT 0, -- minor units (cents)
      ledger_balance INTEGER NOT NULL DEFAULT 0,    -- minor units (cents)
      status TEXT NOT NULL DEFAULT 'ACTIVE',        -- 'ACTIVE', 'FROZEN', 'CLOSED'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL, -- in cents
      currency TEXT NOT NULL DEFAULT 'USD',
      type TEXT NOT NULL,      -- 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'FEE', 'ADJUSTMENT'
      status TEXT NOT NULL,    -- 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED'
      description TEXT NOT NULL,
      sender_name TEXT,
      sender_account_number TEXT,
      recipient_name TEXT,
      recipient_account_number TEXT,
      fee INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES transactions(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      entry_type TEXT NOT NULL, -- 'DEBIT' or 'CREDIT'
      amount INTEGER NOT NULL,   -- positive integer in cents
      running_balance INTEGER NOT NULL, -- balance after entry
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES transactions(id),
      source_account_id TEXT NOT NULL REFERENCES accounts(id),
      dest_account_id TEXT NOT NULL REFERENCES accounts(id),
      amount INTEGER NOT NULL,
      fee INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES transactions(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      fee INTEGER NOT NULL DEFAULT 0,
      destination_method TEXT NOT NULL,
      destination_details TEXT NOT NULL,
      status TEXT NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
      admin_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES transactions(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      method TEXT NOT NULL,
      reference TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      card_number TEXT NOT NULL,
      card_holder TEXT NOT NULL,
      expiry_month INTEGER NOT NULL,
      expiry_year INTEGER NOT NULL,
      cvv TEXT NOT NULL,
      pin TEXT NOT NULL DEFAULT '4892',
      card_type TEXT NOT NULL, -- 'DEBIT', 'CREDIT', 'VIRTUAL'
      card_tier TEXT NOT NULL DEFAULT 'Obsidian Elite', -- 'Obsidian Elite', 'Platinum Reserve', 'Commercial Black'
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'FROZEN', 'BLOCKED'
      daily_spend_limit INTEGER NOT NULL DEFAULT 1000000, -- cents ($10,000)
      monthly_spend_limit INTEGER NOT NULL DEFAULT 5000000, -- cents ($50,000)
      atm_limit INTEGER NOT NULL DEFAULT 250000, -- cents ($2,500)
      international_enabled INTEGER NOT NULL DEFAULT 1,
      online_enabled INTEGER NOT NULL DEFAULT 1,
      contactless_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      action_type TEXT NOT NULL, -- 'TRANSFER', 'WITHDRAWAL'
      action_payload TEXT,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      submitted_at TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT,
      country TEXT NOT NULL,
      risk_score TEXT,
      compliance_level TEXT,
      review_notes TEXT,
      audit_trail_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Performance Indexes for Production Scalability
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_transfers_source_account ON transfers(source_account_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_dest_account ON transfers(dest_account_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_account_id ON withdrawals(account_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
    CREATE INDEX IF NOT EXISTS idx_deposits_account_id ON deposits(account_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
    CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_security_events_ip_created ON security_events(ip, created_at);
    CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);
  `);

  // Safe migration for user blocking columns
  try {
    db.exec("ALTER TABLE users ADD COLUMN transfer_blocked INTEGER NOT NULL DEFAULT 0;");
  } catch (_) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN withdrawal_blocked INTEGER NOT NULL DEFAULT 0;");
  } catch (_) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN block_message TEXT;");
  } catch (_) {}

  // Initialize essential system configuration
  seedEssentialSystemSettings();

  const isProduction = process.env.PURGE_DEMO_DATA === "true";

  if (isProduction) {
    // In production deployments, permanently purge all demo accounts and mock data
    removeAllDemoData();
  } else {
    // In non-production development sandbox, seed default mock data if empty
    seedInitialData();
    seedCardsIfEmpty();
    seedAdminResourcesAndSnapshotUsers();
    seedKycIfEmpty();
  }

  // Ensure the designated Super Administrator is always operational
  ensureDesignatedAdmin();
}

export function seedEssentialSystemSettings() {
  const now = new Date().toISOString();
  const settings = [
    { key: "max_daily_transfer_cents", value: "5000000", desc: "Maximum daily transfer limit per customer ($50,000.00)" },
    { key: "wire_fee_domestic_cents", value: "2500", desc: "Standard domestic wire fee ($25.00)" },
    { key: "wire_fee_international_cents", value: "4500", desc: "International SWIFT wire fee ($45.00)" },
    { key: "withdrawal_auto_approval_limit_cents", value: "500000", desc: "Withdrawals below $5,000 are processed automatically" },
    { key: "maintenance_mode", value: "false", desc: "System operational status" },
    { key: "KYC_REQUIRED", value: "true", desc: "Flag enforcing KYC verification for account operations" },
    { key: "ADMIN_GATEKEEPER_MASTER_KEY", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c", desc: "192-bit high-entropy cryptographic master gatekeeper key (48-char hex)" }
  ];

  for (const s of settings) {
    const existing = db.prepare("SELECT value FROM system_settings WHERE key = ?").get(s.key);
    if (!existing) {
      db.prepare(`
        INSERT INTO system_settings (key, value, description, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(s.key, s.value, s.desc, now);
    }
  }
}

export function removeAllDemoData(): {
  removedUsers: number;
  removedAccounts: number;
  removedTransactions: number;
  removedCards: number;
  removedKyc: number;
} {
  const demoEmails = [
    "sarah.jenkins@crestline.bank",
    "david.nguyen@crestline.bank",
    "emma.admin@crestline.bank",
    "marcus.compliance@crestline.bank",
    "paulogla61@gmail.com",
    "mikev4469@gmail.com",
    "guruogle89@gmail.com",
    "johntaylor@gmail.com",
    "europee20@yahoo.com",
    "dn4387801@gmail.com"
  ];

  // Fetch all demo users (strictly excluding Emmanuel Owighoyota)
  const usersToDelete = db.prepare(`
    SELECT id, email FROM users 
    WHERE (email IN (${demoEmails.map(() => '?').join(',')})
       OR id LIKE 'usr_sarah%'
       OR id LIKE 'usr_david%'
       OR id LIKE 'usr_emma%'
       OR id LIKE 'usr_marcus%'
       OR id LIKE 'usr_paulo%'
       OR id LIKE 'usr_mike%'
       OR id LIKE 'usr_guru%'
       OR id LIKE 'usr_john%'
       OR id LIKE 'usr_europee%'
       OR id LIKE 'usr_dn%')
      AND email != 'owighoyotaemmanuel424@gmail.com'
      AND id != 'usr_emmanuel_admin'
  `).all(...demoEmails) as { id: string; email: string }[];

  const userIds = usersToDelete.map(u => u.id);
  let removedAccounts = 0;
  let removedTransactions = 0;
  let removedCards = 0;
  let removedKyc = 0;

  if (userIds.length > 0) {
    const userPlaceholders = userIds.map(() => '?').join(',');

    // Accounts for these users
    const accounts = db.prepare(`SELECT id FROM accounts WHERE user_id IN (${userPlaceholders})`).all(...userIds) as { id: string }[];
    const accountIds = accounts.map(a => a.id);
    removedAccounts = accounts.length;

    // Transactions for these users / accounts
    let txnIds: string[] = [];
    if (accountIds.length > 0) {
      const accPlaceholders = accountIds.map(() => '?').join(',');
      const txns = db.prepare(`SELECT id FROM transactions WHERE account_id IN (${accPlaceholders}) OR user_id IN (${userPlaceholders})`).all(...accountIds, ...userIds) as { id: string }[];
      txnIds = txns.map(t => t.id);
    } else {
      const txns = db.prepare(`SELECT id FROM transactions WHERE user_id IN (${userPlaceholders})`).all(...userIds) as { id: string }[];
      txnIds = txns.map(t => t.id);
    }
    removedTransactions = txnIds.length;

    if (txnIds.length > 0) {
      const txnPlaceholders = txnIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM ledger_entries WHERE transaction_id IN (${txnPlaceholders})`).run(...txnIds);
      db.prepare(`DELETE FROM transfers WHERE transaction_id IN (${txnPlaceholders})`).run(...txnIds);
      db.prepare(`DELETE FROM withdrawals WHERE transaction_id IN (${txnPlaceholders})`).run(...txnIds);
      db.prepare(`DELETE FROM deposits WHERE transaction_id IN (${txnPlaceholders})`).run(...txnIds);
      db.prepare(`DELETE FROM transactions WHERE id IN (${txnPlaceholders})`).run(...txnIds);
    }

    // Cards
    const cardRes = db.prepare(`DELETE FROM cards WHERE user_id IN (${userPlaceholders}) OR id LIKE 'crd_%'`).run(...userIds);
    removedCards = Number(cardRes.changes);

    // Accounts
    if (accountIds.length > 0) {
      db.prepare(`DELETE FROM accounts WHERE user_id IN (${userPlaceholders})`).run(...userIds);
    }

    // Sessions, password resets, verification codes, notifications, security events
    db.prepare(`DELETE FROM verification_codes WHERE user_id IN (${userPlaceholders})`).run(...userIds);
    db.prepare(`DELETE FROM sessions WHERE user_id IN (${userPlaceholders})`).run(...userIds);
    db.prepare(`DELETE FROM password_resets WHERE user_id IN (${userPlaceholders})`).run(...userIds);
    db.prepare(`DELETE FROM notifications WHERE user_id IN (${userPlaceholders})`).run(...userIds);
    db.prepare(`DELETE FROM security_events WHERE user_id IN (${userPlaceholders})`).run(...userIds);

    // KYC submissions
    const kycRes = db.prepare(`
      DELETE FROM kyc_submissions 
      WHERE user_id IN (${userPlaceholders}) 
         OR email IN (${demoEmails.map(() => '?').join(',')})
         OR id IN ('kyc-sub-101', 'kyc-sub-102')
    `).run(...userIds, ...demoEmails);
    removedKyc = Number(kycRes.changes);

    // Users
    db.prepare(`DELETE FROM users WHERE id IN (${userPlaceholders})`).run(...userIds);
  } else {
    const kycRes = db.prepare(`DELETE FROM kyc_submissions WHERE id IN ('kyc-sub-101', 'kyc-sub-102') OR email IN (${demoEmails.map(() => '?').join(',')})`).run(...demoEmails);
    removedKyc = Number(kycRes.changes);
  }

  // Remove any dummy demo cards
  try {
    const strayCards = db.prepare(`DELETE FROM cards WHERE id LIKE 'crd_%'`).run();
    removedCards += Number(strayCards.changes);
  } catch (_) {}

  // Ensure designated super admin is intact
  ensureDesignatedAdmin();

  return {
    removedUsers: userIds.length,
    removedAccounts,
    removedTransactions,
    removedCards,
    removedKyc
  };
}

export function seedKycIfEmpty() {
  const now = new Date().toISOString();

  // Ensure KYC_REQUIRED system setting exists
  const kycSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'KYC_REQUIRED'").get();
  if (!kycSetting) {
    db.prepare(`
      INSERT INTO system_settings (key, value, description, updated_at)
      VALUES (?, ?, ?, ?)
    `).run('KYC_REQUIRED', 'true', 'Flag enforcing KYC verification for account operations', now);
  }

  // Ensure initial KYC submission exists
  const kycCount = db.prepare("SELECT COUNT(*) as count FROM kyc_submissions").get() as { count: number };
  if (kycCount.count === 0) {
    const initialLogs = [
      { id: "log-1", timestamp: "2026-08-05T09:14:22.000Z", actor: "User", event: "Document Uploaded", details: "US Passport uploaded via encrypted tunnel" },
      { id: "log-2", timestamp: "2026-08-05T09:14:25.000Z", actor: "Automated OCR Engine", event: "MRZ Extracted", details: "Checksum verified, validity confirmed through 2031" },
      { id: "log-3", timestamp: "2026-08-05T09:15:01.000Z", actor: "Facial Match AI", event: "Biometric Liveness Confirmed", details: "99.4% confidence score against selfie verification" },
      { id: "log-4", timestamp: "2026-08-05T09:15:40.000Z", actor: "AML Screening Service", event: "PEP Check Cleared", details: "No politically exposed person matches found" },
      { id: "log-5", timestamp: "2026-08-05T09:15:42.000Z", actor: "System", event: "Queued for Admin Review", details: "Pending manual verification approval" }
    ];

    db.prepare(`
      INSERT INTO kyc_submissions (id, user_id, name, email, phone, status, submitted_at, document_type, document_number, country, risk_score, compliance_level, review_notes, audit_trail_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "kyc-001",
      "usr-4921",
      "Marcus Vance",
      "m.vance@vanceholdings.com",
      "+1 (555) 392-1084",
      "pending",
      "2026-08-05T09:14:22.000Z",
      "Passport",
      "P-88492019",
      "United States",
      "Low (12/100)",
      "Tier 2 - Verified Individual",
      "All documents submitted with high-resolution scan. Awaiting final operational sign-off.",
      JSON.stringify(initialLogs),
      now,
      now
    );

    const logs101 = [
      { id: "log-1", timestamp: "2026-08-04T14:20:00.000Z", actor: "System", event: "Account Registration", details: "User registered via Web Client (IP: 82.165.19.42)" },
      { id: "log-2", timestamp: "2026-08-04T14:22:10.000Z", actor: "Eminent Aninu", event: "Documents Uploaded", details: "National Passport front & facial biometric selfie uploaded" },
      { id: "log-3", timestamp: "2026-08-04T14:22:15.000Z", actor: "AI Verification Engine", event: "Facial Match Passed", details: "98.4% facial similarity match against document photo" },
      { id: "log-4", timestamp: "2026-08-04T14:22:18.000Z", actor: "AML Screening Service", event: "Sanction Check Cleared", details: "0 hits found on Interpol, OFAC, and EU sanction lists" },
      { id: "log-5", timestamp: "2026-08-04T14:22:20.000Z", actor: "System", event: "Queued for Admin Review", details: "Pending manual verification approval" }
    ];

    db.prepare(`
      INSERT INTO kyc_submissions (id, user_id, name, email, phone, status, submitted_at, document_type, document_number, country, risk_score, compliance_level, review_notes, audit_trail_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "kyc-sub-101",
      "usr-201",
      "Eminent Aninu",
      "europee20@yahoo.com",
      "+44 7700 900077",
      "pending",
      "2026-08-04T14:22:10.000Z",
      "National Passport",
      "A08923411",
      "United Kingdom",
      "98",
      "Low Risk",
      "Biometric selfie and passport scan verified with high confidence score.",
      JSON.stringify(logs101),
      now,
      now
    );

    const logs102 = [
      { id: "log-1", timestamp: "2026-08-05T09:10:00.000Z", actor: "System", event: "Account Registration", details: "User registered via iOS Application" },
      { id: "log-2", timestamp: "2026-08-05T09:15:30.000Z", actor: "David Nguyen", event: "Documents Uploaded", details: "Driver's License front, back & live liveness selfie uploaded" },
      { id: "log-3", timestamp: "2026-08-05T09:15:35.000Z", actor: "AI Verification Engine", event: "Liveness Verification Passed", details: "Liveness test passed (Score: 0.992)" },
      { id: "log-4", timestamp: "2026-08-05T09:15:40.000Z", actor: "AML Screening Service", event: "PEP Check Cleared", details: "No politically exposed person matches found" },
      { id: "log-5", timestamp: "2026-08-05T09:15:42.000Z", actor: "System", event: "Queued for Admin Review", details: "Pending manual verification approval" }
    ];

    db.prepare(`
      INSERT INTO kyc_submissions (id, user_id, name, email, phone, status, submitted_at, document_type, document_number, country, risk_score, compliance_level, review_notes, audit_trail_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "kyc-sub-102",
      "usr-202",
      "David Nguyen",
      "david.nguyen@crestline.bank",
      "+1 (415) 892-3041",
      "pending",
      "2026-08-05T09:15:30.000Z",
      "Driver's License",
      "DL-9948201",
      "United States",
      "94",
      "Low Risk",
      "State identification verified against motor vehicles registry database.",
      JSON.stringify(logs102),
      now,
      now
    );
  }
}

export function ensureDesignatedAdmin() {
  const adminEmail = "owighoyotaemmanuel424@gmail.com";
  const adminPass = "Owighoyota12345";
  const { hash, salt } = hashPassword(adminPass);
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail) as any;
  if (!existing) {
    db.prepare(`
      INSERT INTO users (id, first_name, last_name, email, phone, password_hash, password_salt, role, country, status, kyc_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "usr_emmanuel_admin",
      "Emmanuel",
      "Owighoyota",
      adminEmail,
      "+1 (555) 724-8190",
      hash,
      salt,
      "Super Administrator",
      "United States",
      "ACTIVE",
      "VERIFIED",
      now,
      now
    );
  } else {
    // Ensure the password hash, salt, and role are explicitly up-to-date
    db.prepare(`
      UPDATE users
      SET password_hash = ?, password_salt = ?, role = 'Super Administrator', status = 'ACTIVE', updated_at = ?
      WHERE email = ?
    `).run(hash, salt, now, adminEmail);
  }
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, "sha512").toString("hex");
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
}

function seedInitialData() {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();
  const past3Days = new Date(Date.now() - 3 * 86400000).toISOString();
  const past7Days = new Date(Date.now() - 7 * 86400000).toISOString();
  const past14Days = new Date(Date.now() - 14 * 86400000).toISOString();

  // 1. Create Default Users
  const { hash: passHash, salt: passSalt } = hashPassword("Crestline2026!");

  // Demo Customer: Sarah Jenkins
  const sarahId = "usr_sarah_jenkins";
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, email, phone, password_hash, password_salt, role, country, status, kyc_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sarahId,
    "Sarah",
    "Jenkins",
    "sarah.jenkins@crestline.bank",
    "+1 (555) 234-5678",
    passHash,
    passSalt,
    "Customer",
    "United States",
    "ACTIVE",
    "VERIFIED",
    past14Days,
    now
  );

  // Demo Customer 2: David Nguyen
  const davidId = "usr_david_nguyen";
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, email, phone, password_hash, password_salt, role, country, status, kyc_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    davidId,
    "David",
    "Nguyen",
    "david.nguyen@crestline.bank",
    "+1 (555) 890-1234",
    passHash,
    passSalt,
    "Customer",
    "United States",
    "ACTIVE",
    "VERIFIED",
    past14Days,
    now
  );

  // Demo Super Administrator: Emma Sullivan
  const adminId = "usr_emma_admin";
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, email, phone, password_hash, password_salt, role, country, status, kyc_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    "Emma",
    "Sullivan",
    "emma.admin@crestline.bank",
    "+1 (555) 999-0001",
    passHash,
    passSalt,
    "Super Administrator",
    "United States",
    "ACTIVE",
    "VERIFIED",
    past14Days,
    now
  );

  // Demo Compliance Officer: Marcus Vance
  const complianceId = "usr_marcus_compliance";
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, email, phone, password_hash, password_salt, role, country, status, kyc_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    complianceId,
    "Marcus",
    "Vance",
    "marcus.compliance@crestline.bank",
    "+1 (555) 888-0002",
    passHash,
    passSalt,
    "Compliance Officer",
    "United States",
    "ACTIVE",
    "VERIFIED",
    past14Days,
    now
  );

  // 2. Create Bank Accounts
  // Sarah's Primary Checking: $24,850.50 (2485050 cents)
  const sarahChkId = "acc_sarah_chk";
  db.prepare(`
    INSERT INTO accounts (id, user_id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sarahChkId,
    sarahId,
    "CHK-74920193",
    "021000089",
    "Premier Checking",
    "CHECKING",
    "USD",
    2485050,
    2485050,
    "ACTIVE",
    past14Days,
    now
  );

  // Sarah's High Yield Savings: $68,200.00 (6820000 cents)
  const sarahSavId = "acc_sarah_sav";
  db.prepare(`
    INSERT INTO accounts (id, user_id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sarahSavId,
    sarahId,
    "SAV-83920145",
    "021000089",
    "High-Yield Treasury Savings",
    "SAVINGS",
    "USD",
    6820000,
    6820000,
    "ACTIVE",
    past14Days,
    now
  );

  // David's Checking: $14,320.00 (1432000 cents)
  const davidChkId = "acc_david_chk";
  db.prepare(`
    INSERT INTO accounts (id, user_id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    davidChkId,
    davidId,
    "CHK-91823471",
    "021000089",
    "Everyday Checking",
    "CHECKING",
    "USD",
    1432000,
    1432000,
    "ACTIVE",
    past14Days,
    now
  );

  // 3. Transactions & Ledger Entries
  // Transaction 1: Direct Deposit Payroll ($8,500.00)
  const txn1Id = "txn_seed_001";
  db.prepare(`
    INSERT INTO transactions (id, reference, account_id, user_id, amount, currency, type, status, description, sender_name, sender_account_number, recipient_name, recipient_account_number, fee, created_at, completed_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    txn1Id,
    "TXN-2026-94812",
    sarahChkId,
    sarahId,
    850000,
    "USD",
    "DEPOSIT",
    "COMPLETED",
    "Direct Deposit — Apex Global Tech Payroll",
    "Apex Global Tech LLC",
    "ORG-9901842",
    "Sarah Jenkins",
    "CHK-74920193",
    0,
    past7Days,
    past7Days,
    JSON.stringify({ channel: "ACH", traceId: "ACH-9821039821" })
  );

  db.prepare(`
    INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, running_balance, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "led_001",
    txn1Id,
    sarahChkId,
    "CREDIT",
    850000,
    2485050,
    "Payroll direct credit from Apex Global Tech",
    past7Days
  );

  // Transaction 2: Transfer to Savings ($2,500.00)
  const txn2Id = "txn_seed_002";
  db.prepare(`
    INSERT INTO transactions (id, reference, account_id, user_id, amount, currency, type, status, description, sender_name, sender_account_number, recipient_name, recipient_account_number, fee, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    txn2Id,
    "TXN-2026-95021",
    sarahChkId,
    sarahId,
    250000,
    "USD",
    "TRANSFER",
    "COMPLETED",
    "Internal Transfer to High-Yield Treasury Savings",
    "Sarah Jenkins",
    "CHK-74920193",
    "Sarah Jenkins",
    "SAV-83920145",
    0,
    past3Days,
    past3Days
  );

  // Transaction 3: Outgoing Client Wire to David ($1,200.00)
  const txn3Id = "txn_seed_003";
  db.prepare(`
    INSERT INTO transactions (id, reference, account_id, user_id, amount, currency, type, status, description, sender_name, sender_account_number, recipient_name, recipient_account_number, fee, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    txn3Id,
    "TXN-2026-95240",
    sarahChkId,
    sarahId,
    120000,
    "USD",
    "TRANSFER",
    "COMPLETED",
    "Transfer to David Nguyen — Design Consulting Services",
    "Sarah Jenkins",
    "CHK-74920193",
    "David Nguyen",
    "CHK-91823471",
    0,
    past3Days,
    past3Days
  );

  // Transaction 4: Pending Institutional Withdrawal ($15,000.00) for Admin Review
  const txn4Id = "txn_seed_004";
  db.prepare(`
    INSERT INTO transactions (id, reference, account_id, user_id, amount, currency, type, status, description, sender_name, sender_account_number, recipient_name, recipient_account_number, fee, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    txn4Id,
    "TXN-2026-95899",
    sarahSavId,
    sarahId,
    1500000,
    "USD",
    "WITHDRAWAL",
    "PENDING",
    "Domestic Wire Withdrawal — Escrow Deposit Real Estate",
    "Sarah Jenkins",
    "SAV-83920145",
    "First American Title Co",
    "WIRE-8839102",
    2500,
    now
  );

  db.prepare(`
    INSERT INTO withdrawals (id, transaction_id, account_id, user_id, amount, fee, destination_method, destination_details, status, admin_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "wth_seed_001",
    txn4Id,
    sarahSavId,
    sarahId,
    1500000,
    2500,
    "DOMESTIC_WIRE",
    "First American Title Co — Routing: 121000358, Acct: 99281048",
    "PENDING",
    "Large amount flagged for standard compliance review (> $10k)",
    now
  );

  // 4. Notifications
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "notif_001",
    sarahId,
    "DEPOSIT_COMPLETED",
    "Direct Deposit Credited",
    "Your direct deposit of $8,500.00 from Apex Global Tech has been credited to Premier Checking.",
    1,
    "/transactions",
    past7Days
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "notif_002",
    sarahId,
    "SECURITY_ALERT",
    "New Device Sign-In",
    "A successful login was recorded from Chrome on macOS (San Francisco, US).",
    0,
    "/security",
    now
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "notif_003",
    sarahId,
    "WITHDRAWAL_SUBMITTED",
    "Withdrawal Under Review",
    "Your domestic wire withdrawal request for $15,000.00 has been submitted for compliance review.",
    0,
    "/withdraw",
    now
  );

  // 5. Audit Logs
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "aud_001",
    "system",
    "Core Ledger Engine",
    "SYSTEM",
    "ACCOUNT_INITIALIZATION",
    "ACCOUNT",
    sarahChkId,
    "127.0.0.1",
    JSON.stringify({ initialBalanceCents: 2485050 }),
    past14Days
  );

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target_type, target_id, ip, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "aud_002",
    sarahId,
    "Sarah Jenkins",
    "Customer",
    "TRANSFER_EXECUTED",
    "TRANSFER",
    txn3Id,
    "192.168.1.104",
    JSON.stringify({ amountCents: 120000, recipient: "CHK-91823471" }),
    past3Days
  );

  // 6. System Settings
  const settings = [
    { key: "max_daily_transfer_cents", value: "5000000", desc: "Maximum daily transfer limit per customer ($50,000.00)" },
    { key: "wire_fee_domestic_cents", value: "2500", desc: "Standard domestic wire fee ($25.00)" },
    { key: "wire_fee_international_cents", value: "4500", desc: "International SWIFT wire fee ($45.00)" },
    { key: "withdrawal_auto_approval_limit_cents", value: "500000", desc: "Withdrawals below $5,000 are processed automatically" },
    { key: "maintenance_mode", value: "false", desc: "System operational status" }
  ];

  for (const s of settings) {
    db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, description, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(s.key, s.value, s.desc, now);
  }
}

function seedCardsIfEmpty() {
  const countRow = db.prepare("SELECT COUNT(*) as count FROM cards").get() as { count: number };
  if (countRow.count > 0) return;

  const sarah = db.prepare("SELECT id FROM users WHERE email = 'sarah.jenkins@crestline.bank'").get() as { id: string } | undefined;
  if (!sarah) return;

  const sarahChecking = db.prepare("SELECT id FROM accounts WHERE user_id = ? AND account_type = 'CHECKING'").get(sarah.id) as { id: string } | undefined;
  if (!sarahChecking) return;

  const now = new Date().toISOString();

  // 1. Sarah's Obsidian Elite Debit Card (Physical)
  db.prepare(`
    INSERT INTO cards (
      id, user_id, account_id, card_number, card_holder,
      expiry_month, expiry_year, cvv, pin, card_type, card_tier,
      status, daily_spend_limit, monthly_spend_limit, atm_limit,
      international_enabled, online_enabled, contactless_enabled, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "crd_obsidian_001",
    sarah.id,
    sarahChecking.id,
    "5399482109848819",
    "SARAH JENKINS",
    11,
    2029,
    "742",
    "4892",
    "DEBIT",
    "Obsidian Elite",
    "ACTIVE",
    1500000, // $15,000 daily
    7500000, // $75,000 monthly
    500000,  // $5,000 ATM
    1,
    1,
    1,
    now
  );

  // 2. Sarah's Virtual Platinum Reserve Card
  db.prepare(`
    INSERT INTO cards (
      id, user_id, account_id, card_number, card_holder,
      expiry_month, expiry_year, cvv, pin, card_type, card_tier,
      status, daily_spend_limit, monthly_spend_limit, atm_limit,
      international_enabled, online_enabled, contactless_enabled, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "crd_virtual_002",
    sarah.id,
    sarahChecking.id,
    "4024007182933421",
    "SARAH JENKINS",
    8,
    2028,
    "918",
    "5123",
    "VIRTUAL",
    "Platinum Reserve",
    "ACTIVE",
    500000, // $5,000 daily
    2500000, // $25,000 monthly
    0, // No ATM for virtual
    1,
    1,
    1,
    now
  );
}

export function seedAdminResourcesAndSnapshotUsers() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_resources (
      id TEXT PRIMARY KEY,
      resource_type TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_res_type ON admin_resources(resource_type);
  `);

  const now = new Date().toISOString();

  // 1. Ensure 192-bit / 48-char Hex Master Gatekeeper Key exists in system_settings
  const masterKeySetting = db.prepare("SELECT value FROM system_settings WHERE key = 'ADMIN_GATEKEEPER_MASTER_KEY'").get();
  if (!masterKeySetting) {
    db.prepare(`
      INSERT INTO system_settings (key, value, description, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(
      'ADMIN_GATEKEEPER_MASTER_KEY',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c',
      '192-bit high-entropy cryptographic master gatekeeper key (48-char hex)',
      now
    );
  }

  // 2. Ensure the 6 Live Roster Snapshot Users from PDF Specification exist
  const snapshotUsers = [
    {
      id: 'usr_paulogla61',
      firstName: 'Paulo',
      lastName: 'Glauber',
      email: 'paulogla61@gmail.com',
      phone: '+1 (555) 481-9021',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedDate: '2026-08-17T09:15:00.000Z',
      balanceCents: 4582000 // $45,820.00
    },
    {
      id: 'usr_mikev4469',
      firstName: 'Mike',
      lastName: 'Vance',
      email: 'mikev4469@gmail.com',
      phone: '+1 (555) 392-1084',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedDate: '2026-08-17T11:42:00.000Z',
      balanceCents: 12850000 // $128,500.00
    },
    {
      id: 'usr_guruogle89',
      firstName: 'Guru',
      lastName: 'Ogle',
      email: 'guruogle89@gmail.com',
      phone: '+1 (555) 829-4155',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedDate: '2026-08-10T14:20:00.000Z',
      balanceCents: 6734000 // $67,340.00
    },
    {
      id: 'usr_johntaylor',
      firstName: 'John',
      lastName: 'Taylor',
      email: 'johntaylor@gmail.com',
      phone: '+1 (555) 671-8820',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedDate: '2026-08-07T16:05:00.000Z',
      balanceCents: 9140000 // $91,400.00
    },
    {
      id: 'usr_europee20',
      firstName: 'Euro',
      lastName: 'Pee',
      email: 'europee20@yahoo.com',
      phone: '+44 20 7946 0912',
      status: 'ACTIVE',
      kycStatus: 'UNVERIFIED',
      joinedDate: '2026-08-03T08:30:00.000Z',
      balanceCents: 1540000 // $15,400.00
    },
    {
      id: 'usr_dn4387801',
      firstName: 'David',
      lastName: 'Nguyen',
      email: 'dn4387801@gmail.com',
      phone: '+1 (555) 438-7801',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedDate: '2026-08-02T13:45:00.000Z',
      balanceCents: 3820000 // $38,200.00
    }
  ];

  const { hash: userHash, salt: userSalt } = hashPassword('Crestline2026!');

  for (const su of snapshotUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(su.email) as { id: string } | undefined;
    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, first_name, last_name, email, phone, password_hash, password_salt, role, country, status, kyc_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        su.id,
        su.firstName,
        su.lastName,
        su.email,
        su.phone,
        userHash,
        userSalt,
        'Customer',
        su.email.endsWith('.com') ? 'United States' : 'United Kingdom',
        su.status,
        su.kycStatus,
        su.joinedDate,
        now
      );

      // Create primary checking account
      const acctNum = 'CHK-' + Math.floor(10000000 + Math.random() * 90000000);
      const acctId = 'acc_' + su.id.replace('usr_', '');
      db.prepare(`
        INSERT INTO accounts (id, user_id, account_number, routing_number, account_name, account_type, currency, available_balance, ledger_balance, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        acctId,
        su.id,
        acctNum,
        '021000089',
        'Premier Checking Account',
        'CHECKING',
        'USD',
        su.balanceCents,
        su.balanceCents,
        'ACTIVE',
        su.joinedDate,
        now
      );
    }
  }

  // 3. Seed Institutional Admin Resources if empty
  const countRes = db.prepare('SELECT COUNT(*) as count FROM admin_resources').get() as { count: number };
  if (countRes.count > 0) return;

  const insertResource = (resourceType: string, id: string, data: any) => {
    db.prepare(`
      INSERT INTO admin_resources (id, resource_type, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, resourceType, JSON.stringify(data), now, now);
  };

  // Staff Tasks
  insertResource('tasks', 'tsk_001', {
    id: 'TSK-2026-01',
    title: 'Review High-Value Outbound Wire ($145,000)',
    assignedTo: 'Marcus Vance',
    status: 'In Review',
    priority: 'High',
    dueDate: '2026-08-31'
  });
  insertResource('tasks', 'tsk_002', {
    id: 'TSK-2026-02',
    title: 'Quarterly FinCEN CTR Threshold Audit & Filing',
    assignedTo: 'Emma Sullivan',
    status: 'In Progress',
    priority: 'Urgent',
    dueDate: '2026-09-02'
  });
  insertResource('tasks', 'tsk_003', {
    id: 'TSK-2026-03',
    title: 'Update SWIFT BIC Routing Tables for Q3',
    assignedTo: 'Tech Operations',
    status: 'Pending',
    priority: 'Normal',
    dueDate: '2026-09-05'
  });
  insertResource('tasks', 'tsk_004', {
    id: 'TSK-2026-04',
    title: 'Verify Re-submitted Corporate KYC Documentation',
    assignedTo: 'Compliance Desk',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2026-08-30'
  });

  // Referrals
  insertResource('referrals', 'ref_001', {
    id: 'REF-8012',
    affiliate: 'Apex Wealth Partners LLC',
    referredUser: 'paulogla61@gmail.com',
    commission: 1250,
    status: 'Paid',
    date: '2026-08-18'
  });
  insertResource('referrals', 'ref_002', {
    id: 'REF-8013',
    affiliate: 'Blackstone Syndicate Advisory',
    referredUser: 'mikev4469@gmail.com',
    commission: 2400,
    status: 'Pending',
    date: '2026-08-20'
  });
  insertResource('referrals', 'ref_003', {
    id: 'REF-8014',
    affiliate: 'Sovereign Capital Management',
    referredUser: 'johntaylor@gmail.com',
    commission: 850,
    status: 'Paid',
    date: '2026-08-10'
  });

  // Loans
  insertResource('loans', 'loan_001', {
    id: 'LN-9021',
    borrower: 'Paulo Glauber (paulogla61@gmail.com)',
    amount: 150000,
    interestRate: '6.25% APR',
    status: 'Active',
    nextPayment: '2026-09-15'
  });
  insertResource('loans', 'loan_002', {
    id: 'LN-9022',
    borrower: 'John Taylor (johntaylor@gmail.com)',
    amount: 50000,
    interestRate: '5.75% APR',
    status: 'Underwriting',
    nextPayment: 'Pending Review'
  });
  insertResource('loans', 'loan_003', {
    id: 'LN-9023',
    borrower: 'David Nguyen (dn4387801@gmail.com)',
    amount: 75000,
    interestRate: '6.50% APR',
    status: 'Active',
    nextPayment: '2026-09-20'
  });

  // Grants
  insertResource('grants', 'grt_001', {
    id: 'GRT-401',
    recipient: 'CleanTech Innovation Initiative',
    amount: 250000,
    eligibility: 'Clean Energy Tier-A',
    status: 'Disbursed'
  });
  insertResource('grants', 'grt_002', {
    id: 'GRT-402',
    recipient: 'FinTech Institutional Security Lab',
    amount: 100000,
    eligibility: 'Cryptographic Research',
    status: 'Approved'
  });

  // IRS / Tax Controls
  insertResource('irs', 'irs_001', {
    id: 'TAX-1099-01',
    formType: 'IRS Form 1099-INT / W-9',
    holdback: '0.0% (Certified)',
    alerts: 'Exempt Status Validated',
    status: 'Compliant'
  });
  insertResource('irs', 'irs_002', {
    id: 'TAX-W8BEN-02',
    formType: 'W-8BEN Foreign Non-Resident',
    holdback: '30.0% Statutory',
    alerts: 'Withholding Escrow Active',
    status: 'Hold Applied'
  });

  // VIP Membership
  insertResource('membership', 'mem_001', {
    id: 'MBR-01',
    tier: 'Obsidian Private Reserve',
    fee: 15000,
    eligibility: 'Liquidity > $1,000,000',
    status: 'Active'
  });
  insertResource('membership', 'mem_002', {
    id: 'MBR-02',
    tier: 'Crestline Premier Wealth',
    fee: 5000,
    eligibility: 'Liquidity > $250,000',
    status: 'Active'
  });

  // Plans
  insertResource('plans', 'pln_001', {
    id: 'PLN-01',
    name: 'Treasury Fixed Yield 90D',
    minAmount: 10000,
    roi: '5.45% APY',
    duration: '90 Days',
    status: 'Active'
  });
  insertResource('plans', 'pln_002', {
    id: 'PLN-02',
    name: 'Sovereign Gold Hedge Note',
    minAmount: 25000,
    roi: '7.80% APY',
    duration: '180 Days',
    status: 'Active'
  });

  // Crypto Assets
  insertResource('crypto', 'cry_001', {
    id: 'CRY-BTC',
    asset: 'Bitcoin (BTC)',
    network: 'Bitcoin Core',
    walletAddress: 'bc1q9x3d8w04zkeml29c4p9s82x7a4v6k10ytr765q',
    status: 'Active'
  });
  insertResource('crypto', 'cry_002', {
    id: 'CRY-ETH',
    asset: 'Ethereum (ETH)',
    network: 'ERC-20 Mainnet',
    walletAddress: '0x71C2B04E93dE36F46C34aD821098E165dFA0e10b',
    status: 'Active'
  });
  insertResource('crypto', 'cry_003', {
    id: 'CRY-USDC',
    asset: 'USD Coin (USDC)',
    network: 'ERC-20 / Arbitrum',
    walletAddress: '0x28974aD3c25b031448bEbF8A80e36Fe17478052F',
    status: 'Active'
  });

  // Trading Signals
  insertResource('signals', 'sig_001', {
    id: 'SIG-201',
    pair: 'BTC/USD',
    direction: 'LONG',
    entry: 64200,
    target: 68500,
    status: 'Active',
    date: '2026-08-30'
  });
  insertResource('signals', 'sig_002', {
    id: 'SIG-202',
    pair: 'ETH/USD',
    direction: 'LONG',
    entry: 3450,
    target: 3800,
    status: 'Active',
    date: '2026-08-30'
  });

  // Integration Providers
  insertResource('providers', 'prv_001', {
    id: 'PRV-CHAIN',
    name: 'Chainalysis KYT Real-Time',
    capabilities: 'Sanctions Screening & Real-Time AML Risk Scoring',
    status: 'Connected'
  });
  insertResource('providers', 'prv_002', {
    id: 'PRV-BLM',
    name: 'Bloomberg B-PIPE Market Feed',
    capabilities: 'Level 2 Quotes, Spot Rates & FX Benchmarks',
    status: 'Online'
  });

  // Copy Trading
  insertResource('copy-trading', 'cpt_001', {
    id: 'CPY-01',
    masterTrader: 'Apex Alpha Macro Strategy',
    followers: 148,
    performance: '+34.2% YTD',
    status: 'Active'
  });
  insertResource('copy-trading', 'cpt_002', {
    id: 'CPY-02',
    masterTrader: 'Horizon Quantitative Yield',
    followers: 92,
    performance: '+18.7% YTD',
    status: 'Active'
  });

  // Educational Courses
  insertResource('courses', 'crs_001', {
    id: 'CRS-101',
    title: 'Institutional Wealth Preservation 2026',
    modules: 8,
    order: 1,
    status: 'Published'
  });
  insertResource('courses', 'crs_002', {
    id: 'CRS-102',
    title: 'Advanced Treasury & Fixed Income Strategies',
    modules: 12,
    order: 2,
    status: 'Published'
  });

  // Secure Inbox
  insertResource('inbox', 'ibx_001', {
    id: 'MSG-901',
    from: 'paulogla61@gmail.com',
    subject: 'Inquiry Regarding SWIFT MT103 Proof of Credit',
    priority: 'High',
    status: 'Open'
  });
  insertResource('inbox', 'ibx_002', {
    id: 'MSG-902',
    from: 'mikev4469@gmail.com',
    subject: 'Request for Obsidian Card Limit Expansion',
    priority: 'Normal',
    status: 'Assigned'
  });

  // Support Tickets
  insertResource('tickets', 'tkt_001', {
    id: 'TKT-501',
    user: 'europee20@yahoo.com',
    category: 'KYC Document Verification',
    agent: 'Marcus Vance',
    status: 'Investigating'
  });
  insertResource('tickets', 'tkt_002', {
    id: 'TKT-502',
    user: 'dn4387801@gmail.com',
    category: 'Account Limit Reconfiguration',
    agent: 'Emma Sullivan',
    status: 'Resolved'
  });

  // Contact & Live Chat
  insertResource('contact-chat', 'cht_001', {
    id: 'CHAT-8419',
    visitor: 'Institutional Client (Zurich, CH)',
    tags: 'VIP Onboarding, Wealth Advisory',
    status: 'Active'
  });
  insertResource('contact-chat', 'cht_002', {
    id: 'CHAT-2094',
    visitor: 'Corporate Treasurer (London, UK)',
    tags: 'Card Issuance, Cross-Border Wire',
    status: 'Waiting'
  });

  // Mass Broadcasts
  insertResource('broadcast', 'bcd_001', {
    id: 'BRD-301',
    type: 'In-App Modal Bulletin',
    audience: 'All Verified Tier-1 & Tier-2 Account Holders',
    date: '2026-08-30',
    status: 'Delivered'
  });
  insertResource('broadcast', 'bcd_002', {
    id: 'BRD-302',
    type: 'Security System Notice',
    audience: 'Global Administrative Personnel',
    date: '2026-08-28',
    status: 'Delivered'
  });

  // Staff / Agents
  insertResource('agents', 'agt_001', {
    id: 'AGT-01',
    name: 'Emma Sullivan',
    role: 'Super Administrator',
    workload: '14 Active Audits',
    status: 'Online'
  });
  insertResource('agents', 'agt_002', {
    id: 'AGT-02',
    name: 'Marcus Vance',
    role: 'Compliance Officer',
    workload: '8 AML Reviews',
    status: 'Online'
  });
  insertResource('agents', 'agt_003', {
    id: 'AGT-03',
    name: 'Emmanuel Owighoyota',
    role: 'Super Administrator',
    workload: 'System Clearance (Tier 1)',
    status: 'Online'
  });

  // Testimonials
  insertResource('testimonials', 'tst_001', {
    id: 'TST-01',
    customer: 'Arthur Pendelton, CEO Vanguard Tech',
    rating: '5 / 5 Stars',
    featured: true,
    status: 'Approved'
  });
  insertResource('testimonials', 'tst_002', {
    id: 'TST-02',
    customer: 'Elena Rostova, Managing Partner',
    rating: '5 / 5 Stars',
    featured: true,
    status: 'Approved'
  });

  // Payment Methods
  insertResource('payment-methods', 'pm_001', {
    id: 'PM-FEDWIRE',
    name: 'Federal Reserve Fedwire Direct',
    type: 'Wire / RTGS',
    fee: '$0 Incoming / $25 Outgoing',
    status: 'Active'
  });
  insertResource('payment-methods', 'pm_002', {
    id: 'PM-SWIFT',
    name: 'SWIFT Cross-Border Wire',
    type: 'International Wire',
    fee: '$35 Flat',
    status: 'Active'
  });
  insertResource('payment-methods', 'pm_003', {
    id: 'PM-USDC',
    name: 'USDC Institutional Settlement',
    type: 'Digital Asset Rail',
    fee: '0.0% + Network Gas',
    status: 'Active'
  });

  // Currencies
  insertResource('currencies', 'cur_usd', {
    code: 'USD',
    symbol: '$',
    rate: 1.000,
    status: 'Base'
  });
  insertResource('currencies', 'cur_eur', {
    code: 'EUR',
    symbol: '€',
    rate: 0.920,
    status: 'Active'
  });
  insertResource('currencies', 'cur_gbp', {
    code: 'GBP',
    symbol: '£',
    rate: 0.785,
    status: 'Active'
  });
  insertResource('currencies', 'cur_chf', {
    code: 'CHF',
    symbol: 'CHF',
    rate: 0.885,
    status: 'Active'
  });

  // Media & Assets
  insertResource('assets', 'ast_001', {
    id: 'AST-01',
    filename: 'crestline-master-crest-gold.svg',
    type: 'VECTOR',
    size: '48 KB',
    status: 'Active'
  });
  insertResource('assets', 'ast_002', {
    id: 'AST-02',
    filename: 'sec-finra-compliance-certification.pdf',
    type: 'DOCUMENT',
    size: '1.2 MB',
    status: 'Verified'
  });

  // Content Blocks
  insertResource('content', 'cnt_001', {
    id: 'CNT-01',
    filename: 'Hero Main Headline',
    type: 'HERO',
    size: '120 chars',
    status: 'Published'
  });
  insertResource('content', 'cnt_002', {
    id: 'CNT-02',
    filename: 'Institutional Security Notice',
    type: 'COMPLIANCE',
    size: '480 chars',
    status: 'Published'
  });

  // Knowledge Base FAQ
  insertResource('faq', 'faq_001', {
    id: 'FAQ-01',
    category: 'Security & Governance',
    question: 'How does Crestline Capital protect client liquidity?',
    status: 'Published'
  });
  insertResource('faq', 'faq_002', {
    id: 'FAQ-02',
    category: 'Treasury & Transfers',
    question: 'What are the cutoff times for same-day Fedwire settlements?',
    status: 'Published'
  });

  // Card Setup & Program Configuration
  insertResource('card-setup', 'cst_001', {
    id: 'CSP-01',
    name: 'Obsidian Elite Metal Debit Program',
    bin: '5399 48XX (World Elite)',
    tier: 'Private Wealth',
    dailyLimit: 25000,
    status: 'Active'
  });
  insertResource('card-setup', 'cst_002', {
    id: 'CSP-02',
    name: 'Platinum Reserve Virtual Corporate',
    bin: '4024 00XX (Commercial)',
    tier: 'Corporate Reserve',
    dailyLimit: 15000,
    status: 'Active'
  });

  // Live Chat Console Sessions
  insertResource('live-chat', 'lvc_001', {
    id: 'CHAT-LIVE-01',
    visitor: 'Marcus Sterling (sterling.holdings@corp.ch)',
    assignedAgent: 'Emma Sullivan',
    duration: '14m 32s',
    status: 'In Progress'
  });
  insertResource('live-chat', 'lvc_002', {
    id: 'CHAT-LIVE-02',
    visitor: 'David Nguyen (dn4387801@gmail.com)',
    assignedAgent: 'Marcus Vance',
    duration: '4m 15s',
    status: 'Resolved'
  });

  // Appearance & Styling Config
  insertResource('appearance', 'app_001', {
    id: 'APP-01',
    element: 'Executive Primary Accent',
    value: 'Amber 500 / Gold (#F59E0B)',
    mode: 'Dark / Obsidian',
    status: 'Active'
  });
  insertResource('appearance', 'app_002', {
    id: 'APP-02',
    element: 'Data Visualization Contrast',
    value: 'WCAG AAA 7:1 Certified',
    mode: 'High-Contrast',
    status: 'Active'
  });

  // Theme Definitions
  insertResource('themes', 'thm_001', {
    id: 'THM-01',
    name: 'Obsidian Executive Dark (Default)',
    primaryColor: '#090D16',
    contrastRatio: '9.4:1 (AAA)',
    status: 'Active'
  });
  insertResource('themes', 'thm_002', {
    id: 'THM-02',
    name: 'Crestline Sovereign Gold',
    primaryColor: '#F59E0B',
    contrastRatio: '7.8:1 (AAA)',
    status: 'Published'
  });
}


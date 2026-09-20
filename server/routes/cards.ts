import { Router, Response } from "express";
import crypto from "node:crypto";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";

export const cardsRouter = Router();
cardsRouter.use(requireAuth);

// 1. Get all cards for current user
cardsRouter.get("/", (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const cards = db.prepare(`
    SELECT c.*, a.account_number, a.account_name, a.available_balance
    FROM cards c
    JOIN accounts a ON c.account_id = a.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId) as any[];

  res.json({
    success: true,
    cards: cards.map(c => ({
      id: c.id,
      accountId: c.account_id,
      accountNumber: c.account_number,
      accountName: c.account_name,
      availableBalanceCents: c.available_balance,
      cardNumber: c.card_number,
      last4: c.card_number.slice(-4),
      cardHolder: c.card_holder,
      expiryMonth: c.expiry_month,
      expiryYear: c.expiry_year,
      cvv: c.cvv,
      cardType: c.card_type,
      cardTier: c.card_tier,
      status: c.status,
      dailySpendLimitCents: c.daily_spend_limit,
      monthlySpendLimitCents: c.monthly_spend_limit,
      atmLimitCents: c.atm_limit,
      internationalEnabled: c.international_enabled === 1,
      onlineEnabled: c.online_enabled === 1,
      contactlessEnabled: c.contactless_enabled === 1,
      createdAt: c.created_at
    }))
  });
});

// 2. Issue a new virtual or physical card
cardsRouter.post("/", (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { accountId, cardType = "VIRTUAL", cardTier = "Obsidian Elite" } = req.body;

  const account = db.prepare("SELECT * FROM accounts WHERE id = ? AND user_id = ?").get(accountId, userId) as any;
  if (!account) {
    return res.status(404).json({ success: false, error: "Selected account not found or unauthorized." });
  }

  // Generate 16 digit card number
  const prefix = cardType === "VIRTUAL" ? "4024" : "5399";
  const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const cardNumber = `${prefix}${randomDigits}`;
  const cvv = Math.floor(100 + Math.random() * 900).toString();
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const now = new Date();
  const expiryYear = now.getFullYear() + (cardType === "VIRTUAL" ? 3 : 5);
  const expiryMonth = ((now.getMonth() + 2) % 12) + 1;
  const cardId = `crd_${crypto.randomUUID()}`;
  const cardHolder = `${req.user!.first_name} ${req.user!.last_name}`.toUpperCase();

  db.prepare(`
    INSERT INTO cards (
      id, user_id, account_id, card_number, card_holder,
      expiry_month, expiry_year, cvv, pin, card_type, card_tier,
      status, daily_spend_limit, monthly_spend_limit, atm_limit,
      international_enabled, online_enabled, contactless_enabled, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cardId,
    userId,
    accountId,
    cardNumber,
    cardHolder,
    expiryMonth,
    expiryYear,
    cvv,
    pin,
    cardType,
    cardTier,
    "ACTIVE",
    cardType === "VIRTUAL" ? 500000 : 1500000,
    cardType === "VIRTUAL" ? 2500000 : 7500000,
    cardType === "VIRTUAL" ? 0 : 500000,
    1,
    1,
    1,
    now.toISOString()
  );

  // Notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `notif_${crypto.randomUUID()}`,
    userId,
    "CARD_ISSUED",
    "New Card Activated",
    `Your new ${cardTier} ${cardType.toLowerCase()} card ending in ${cardNumber.slice(-4)} has been generated and is ready to use.`,
    0,
    "/cards",
    now.toISOString()
  );

  res.json({
    success: true,
    message: "New card issued successfully.",
    card: {
      id: cardId,
      accountId,
      accountNumber: account.account_number,
      cardNumber,
      last4: cardNumber.slice(-4),
      cardHolder,
      expiryMonth,
      expiryYear,
      cvv,
      cardType,
      cardTier,
      status: "ACTIVE"
    }
  });
});

// 3. Freeze / Unfreeze card
cardsRouter.patch("/:id/toggle-freeze", (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const card = db.prepare("SELECT * FROM cards WHERE id = ? AND user_id = ?").get(id, userId) as any;
  if (!card) {
    return res.status(404).json({ success: false, error: "Card not found." });
  }

  const newStatus = card.status === "ACTIVE" ? "FROZEN" : "ACTIVE";
  db.prepare("UPDATE cards SET status = ? WHERE id = ?").run(newStatus, id);

  res.json({
    success: true,
    status: newStatus,
    message: newStatus === "FROZEN" ? "Card has been temporarily frozen." : "Card has been unlocked."
  });
});

// 4. Update card limits & settings
cardsRouter.patch("/:id/settings", (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const {
    dailySpendLimitCents,
    monthlySpendLimitCents,
    atmLimitCents,
    internationalEnabled,
    onlineEnabled,
    contactlessEnabled
  } = req.body;

  const card = db.prepare("SELECT * FROM cards WHERE id = ? AND user_id = ?").get(id, userId) as any;
  if (!card) {
    return res.status(404).json({ success: false, error: "Card not found." });
  }

  db.prepare(`
    UPDATE cards
    SET daily_spend_limit = COALESCE(?, daily_spend_limit),
        monthly_spend_limit = COALESCE(?, monthly_spend_limit),
        atm_limit = COALESCE(?, atm_limit),
        international_enabled = COALESCE(?, international_enabled),
        online_enabled = COALESCE(?, online_enabled),
        contactless_enabled = COALESCE(?, contactless_enabled)
    WHERE id = ?
  `).run(
    dailySpendLimitCents,
    monthlySpendLimitCents,
    atmLimitCents,
    internationalEnabled !== undefined ? (internationalEnabled ? 1 : 0) : null,
    onlineEnabled !== undefined ? (onlineEnabled ? 1 : 0) : null,
    contactlessEnabled !== undefined ? (contactlessEnabled ? 1 : 0) : null,
    id
  );

  res.json({ success: true, message: "Card preferences updated successfully." });
});

// 5. Reveal Card PIN
cardsRouter.get("/:id/pin", (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const card = db.prepare("SELECT pin FROM cards WHERE id = ? AND user_id = ?").get(id, userId) as any;
  if (!card) {
    return res.status(404).json({ success: false, error: "Card not found." });
  }

  res.json({ success: true, pin: card.pin });
});

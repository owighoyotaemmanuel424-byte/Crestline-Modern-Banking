import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDatabase } from "./server/db.js";
import { authRouter } from "./server/routes/auth.js";
import { accountsRouter } from "./server/routes/accounts.js";
import { transfersRouter } from "./server/routes/transfers.js";
import { depositsRouter } from "./server/routes/deposits.js";
import { withdrawalsRouter } from "./server/routes/withdrawals.js";
import { transactionsRouter } from "./server/routes/transactions.js";
import { notificationsRouter } from "./server/routes/notifications.js";
import { adminRouter } from "./server/routes/admin.js";
import { cardsRouter } from "./server/routes/cards.js";
import { securityRouter } from "./server/routes/security.js";

initDatabase();

export const app = express();

app.use(express.json({ limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Core Banking API Routers
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/transfer", transfersRouter);
app.use("/api/transfers", transfersRouter);
app.use("/api/deposits", depositsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/security", securityRouter);
app.use("/api/admin", adminRouter);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled server error:", err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ success: false, error: "Internal server error" });
});

async function startServer() {
  // Vite middleware is used only by the local development server.
  // Vercel serves the built SPA separately and imports the exported Express app
  // through api/[...path].ts for /api/* requests.
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Crestline Capital Server running on http://0.0.0.0:${PORT}`);
  });
}

// Vercel imports the Express app without starting a long-lived listener.
if (!process.env.VERCEL) {
  startServer();
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

import { Router, Response } from "express";
import { db } from "../db.js";
import { requireAuth, AuthRequest } from "../auth.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, (req: AuthRequest, res: Response) => {
  const notifications = db.prepare(`
    SELECT id, type, title, message, read, link, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user!.id);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
  `).get(req.user!.id) as { count: number };

  res.json({
    success: true,
    notifications,
    unreadCount: unreadCount.count
  });
});

notificationsRouter.put("/:id/read", requireAuth, (req: AuthRequest, res: Response) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
  res.json({ success: true });
});

notificationsRouter.put("/read-all", requireAuth, (req: AuthRequest, res: Response) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(req.user!.id);
  res.json({ success: true });
});

notificationsRouter.delete("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  db.prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
  res.json({ success: true });
});

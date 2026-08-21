import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  countVisit,
  createEntry,
  deleteEntry,
  listAllEntries,
  listEntries,
  replyToEntry,
  setEntryVisibility,
  stats,
} from "../controllers/guestbookController.js";
import { requireAdmin } from "../middleware/auth.js";

export const guestbookRouter = Router();

// The global /api limiter (200 per 15 min) is sized for browsing. Signing is a
// write that the desktop stand now advertises on every page load, so it gets a
// much tighter budget of its own.
const signLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You've signed a few times already. Try again a bit later." },
});

guestbookRouter.get("/admin", requireAdmin, listAllEntries);
guestbookRouter.get("/", listEntries);
guestbookRouter.get("/stats", stats);
guestbookRouter.post("/", signLimiter, createEntry);
guestbookRouter.post("/visit", countVisit);
guestbookRouter.patch("/:id/reply", requireAdmin, replyToEntry);
guestbookRouter.patch("/:id/visibility", requireAdmin, setEntryVisibility);
guestbookRouter.delete("/:id", requireAdmin, deleteEntry);

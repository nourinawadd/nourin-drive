import type { Request, Response, NextFunction } from "express";
import { GuestbookEntry } from "../models/GuestbookEntry.js";
import { bump, peek } from "../models/Counter.js";

const VISITS_KEY = "visits";
const SEQ_KEY = "guestbook-seq";

export async function listEntries(_req: Request, res: Response, next: NextFunction) {
  try {
    const entries = await GuestbookEntry.find().sort({ createdAt: -1 }).limit(200);
    res.json(entries);
  } catch (err) { next(err); }
}

export async function createEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, message, emoji } = req.body ?? {};
    if (typeof name !== "string" || typeof message !== "string") {
      return res.status(400).json({ error: "name and message are required strings" });
    }
    // Allocated before the write so every signature gets a distinct number even
    // when two people sign at once. A failed create burns a number — a gap in
    // the sequence is cosmetic, a duplicate number would not be.
    const seq = await bump(SEQ_KEY);
    const entry = await GuestbookEntry.create({ name, message, emoji, seq });
    res.status(201).json(entry);
  } catch (err) { next(err); }
}

// The hit counter. Read-only — POST /visit is what moves it, so opening the
// guestbook app doesn't inflate the count.
export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [visits, signatures] = await Promise.all([
      peek(VISITS_KEY),
      GuestbookEntry.countDocuments(),
    ]);
    res.json({ visits, signatures });
  } catch (err) { next(err); }
}

export async function countVisit(_req: Request, res: Response, next: NextFunction) {
  try {
    const [visits, signatures] = await Promise.all([
      bump(VISITS_KEY),
      GuestbookEntry.countDocuments(),
    ]);
    res.json({ visits, signatures });
  } catch (err) { next(err); }
}

export async function replyToEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reply } = req.body ?? {};
    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(400).json({ error: "reply is required" });
    }
    const updated = await GuestbookEntry.findByIdAndUpdate(
      id,
      { reply: reply.trim(), repliedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const removed = await GuestbookEntry.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

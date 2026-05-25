import type { Request, Response, NextFunction } from "express";
import { GuestbookEntry } from "../models/GuestbookEntry.js";

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
    const entry = await GuestbookEntry.create({ name, message, emoji });
    res.status(201).json(entry);
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

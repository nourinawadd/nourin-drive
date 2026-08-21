import type { Request, Response, NextFunction } from "express";
import { Comment } from "../models/Comment.js";
import { bump, peek } from "../models/Counter.js";

const viewsKey = (slug: string) => `blog-views:${slug}`;
const seqKey = (slug: string) => `blog-seq:${slug}`;

const MAX_COMMENTS = 500;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function requireSlug(req: Request, res: Response, next: NextFunction) {
  const slug = String(req.params.slug ?? "").toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ error: "bad post id" });
  }
  req.params.slug = slug;
  next();
}

export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const comments = await Comment.find({ slug: req.params.slug, hidden: { $ne: true } })
      .sort({ createdAt: 1 })
      .limit(MAX_COMMENTS);
    res.json(comments);
  } catch (err) { next(err); }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const { name, message, website } = req.body ?? {};

    if (typeof website === "string" && website.trim()) {
      return res.status(201).json({ slug, name: "", message: "", createdAt: new Date().toISOString() });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Write something first." });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "That's longer than 1000 characters." });
    }
    if (name != null && typeof name !== "string") {
      return res.status(400).json({ error: "name must be text" });
    }

    const seq = await bump(seqKey(slug));
    const comment = await Comment.create({
      slug,
      name: (name ?? "").trim().slice(0, 40),
      message: message.trim(),
      seq,
    });
    res.status(201).json(comment);
  } catch (err) { next(err); }
}

export async function postStats(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const [views, comments] = await Promise.all([
      peek(viewsKey(slug)),
      Comment.countDocuments({ slug, hidden: { $ne: true } }),
    ]);
    res.json({ views, comments });
  } catch (err) { next(err); }
}

export async function countView(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const [views, comments] = await Promise.all([
      bump(viewsKey(slug)),
      Comment.countDocuments({ slug, hidden: { $ne: true } }),
    ]);
    res.json({ views, comments });
  } catch (err) { next(err); }
}

export async function replyToComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reply } = req.body ?? {};
    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(400).json({ error: "reply is required" });
    }
    const updated = await Comment.findByIdAndUpdate(
      id,
      { reply: reply.trim(), repliedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function hideComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const purge = req.query.purge === "true";

    const removed = purge
      ? await Comment.findByIdAndDelete(id)
      : await Comment.findByIdAndUpdate(id, { hidden: true }, { new: true });

    if (!removed) return res.status(404).json({ error: "not found" });
    res.json({ ok: true, purged: purge });
  } catch (err) { next(err); }
}

export async function listAllComments(_req: Request, res: Response, next: NextFunction) {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 }).limit(MAX_COMMENTS);
    res.json(comments);
  } catch (err) { next(err); }
}

export async function setCommentVisibility(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { hidden } = req.body ?? {};
    if (typeof hidden !== "boolean") {
      return res.status(400).json({ error: "hidden must be true or false" });
    }
    const updated = await Comment.findByIdAndUpdate(id, { hidden }, { new: true });
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json(updated);
  } catch (err) { next(err); }
}

import type { Request, Response, NextFunction } from "express";
import { BlogPost } from "../models/BlogPost.js";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function listPosts(_req: Request, res: Response, next: NextFunction) {
  try {
    // List view: omit full markdown content for payload size.
    const posts = await BlogPost.find()
      .select("-content")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { next(err); }
}

export async function getPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ error: "not found" });
    res.json(post);
  } catch (err) { next(err); }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, excerpt, content, tags } = req.body ?? {};
    if (typeof title !== "string" || typeof content !== "string") {
      return res.status(400).json({ error: "title and content are required strings" });
    }
    const slug = slugify(title);
    const post = await BlogPost.create({ title, slug, excerpt, content, tags });
    res.status(201).json(post);
  } catch (err) { next(err); }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const removed = await BlogPost.findOneAndDelete({ slug: req.params.slug });
    if (!removed) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

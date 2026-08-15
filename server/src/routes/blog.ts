import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  countView,
  createComment,
  hideComment,
  listComments,
  postStats,
  replyToComment,
  requireSlug,
} from "../controllers/blogController.js";
import { requireAdmin } from "../middleware/auth.js";

export const blogRouter = Router();

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You've commented a few times already. Try again a bit later." },
});

blogRouter.patch("/comments/:id/reply", requireAdmin, replyToComment);
blogRouter.delete("/comments/:id", requireAdmin, hideComment);

blogRouter.get("/:slug/comments", requireSlug, listComments);
blogRouter.post("/:slug/comments", commentLimiter, requireSlug, createComment);
blogRouter.get("/:slug/stats", requireSlug, postStats);
blogRouter.post("/:slug/view", requireSlug, countView);

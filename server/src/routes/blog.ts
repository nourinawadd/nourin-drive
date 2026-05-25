import { Router } from "express";
import { createPost, deletePost, getPost, listPosts } from "../controllers/blogController.js";
import { requireAdmin } from "../middleware/auth.js";

export const blogRouter = Router();

blogRouter.get("/", listPosts);
blogRouter.get("/:slug", getPost);
blogRouter.post("/", requireAdmin, createPost);
blogRouter.delete("/:slug", requireAdmin, deletePost);

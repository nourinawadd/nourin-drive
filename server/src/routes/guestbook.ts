import { Router } from "express";
import { createEntry, deleteEntry, listEntries } from "../controllers/guestbookController.js";
import { requireAdmin } from "../middleware/auth.js";

export const guestbookRouter = Router();

guestbookRouter.get("/", listEntries);
guestbookRouter.post("/", createEntry);
guestbookRouter.delete("/:id", requireAdmin, deleteEntry);

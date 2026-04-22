import "dotenv/config";
import express      from "express";
import cors         from "cors";
import helmet       from "helmet";
import morgan       from "morgan";
import rateLimit    from "express-rate-limit";

import { connectDB }        from "./config/db.js";
import { guestbookRouter }  from "./routes/guestbook.js";
import { blogRouter }       from "./routes/blog.js";
import { instagramRouter }  from "./routes/instagram.js";
import { errorHandler }     from "./middleware/errorHandler.js";
import { notFound }         from "./middleware/notFound.js";

const app  = express();
const PORT = process.env.PORT ?? 5000;

// ── Security & parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL ?? "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

// ── Rate limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs:       15 * 60 * 1000,   // 15 min
  max:            200,
  standardHeaders: true,
  legacyHeaders:   false,
  message:        { error: "Too many requests — try again later." },
});
app.use("/api", limiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/guestbook",  guestbookRouter);
app.use("/api/blog",       blogRouter);
app.use("/api/instagram",  instagramRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: Date.now(), env: process.env.NODE_ENV });
});

// ── Error handlers ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Boot ────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀  Server running on http://localhost:${PORT}`);
    console.log(`📡  Instagram token: ${process.env.INSTAGRAM_TOKEN ? "✅ set" : "⚠️  not set (photography uses placeholders)"}`);
    console.log(`🔐  Admin token:     ${process.env.ADMIN_TOKEN     ? "✅ set" : "⚠️  not set (admin routes open in dev)"}\n`);
  });
}

start();

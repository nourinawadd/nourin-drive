import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { guestbookRouter } from "./routes/guestbook.js";
import { blogRouter } from "./routes/blog.js";
import { funRouter } from "./routes/fun.js";
import { subsRouter } from "./routes/subs.js";
import { tasksRouter } from "./routes/tasks.js";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  [process.env.CLIENT_URL, process.env.BLOG_URL].filter(Boolean).join(",") ??
  ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:3000", "http://localhost:4000");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});
app.use("/api", limiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    ts: Date.now(),
    env: process.env.NODE_ENV ?? "development",
  });
});

app.use("/api/guestbook", guestbookRouter);
app.use("/api/blog", blogRouter);
app.use("/api/fun", funRouter);
app.use("/api/subs", subsRouter);
app.use("/api/tasks", tasksRouter);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n  server listening on http://localhost:${PORT}`);
    console.log(`  health: http://localhost:${PORT}/api/health\n`);
  });
}

start();

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
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
  message: { error: "Too many requests — try again later." },
});
app.use("/api", limiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    ts: Date.now(),
    env: process.env.NODE_ENV ?? "development",
  });
});

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

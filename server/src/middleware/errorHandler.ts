import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[error]", err);

  // Mongoose validation failures carry no `.status`, so without this branch a
  // too-long name or a missing required field came back as a 500 with the raw
  // mongoose message ("GuestbookEntry validation failed: name: Path `name` is
  // required.") echoed to the caller. They're bad input, not server faults.
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ error: err?.message ?? "Invalid request" });
  }

  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({
    error: err?.message ?? "Internal server error",
  });
};

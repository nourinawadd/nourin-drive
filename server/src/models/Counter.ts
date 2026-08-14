import { Schema, model } from "mongoose";

// Keyed monotonic counters. Two keys are in use:
//   "visits"        — the guestbook hit counter shown on the desktop stand
//   "guestbook-seq" — the permanent entry number stamped on each signature
//
// Always mutate through `bump()`. A read-then-write would lose increments when
// two visitors land at the same moment; `$inc` with `upsert` is atomic in the
// database, so the count stays honest without any locking here.
const counterSchema = new Schema({
  _id: { type: String, required: true },
  value: { type: Number, default: 0 },
});

export const Counter = model("Counter", counterSchema);

/** Atomically increment a counter and return its new value. Creates it at 1 if absent. */
export async function bump(key: string, by = 1): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { value: by } },
    { new: true, upsert: true },
  );
  return doc?.value ?? 0;
}

/** Read a counter without touching it. Returns 0 when it has never been bumped. */
export async function peek(key: string): Promise<number> {
  const doc = await Counter.findById(key);
  return doc?.value ?? 0;
}

/** Raise a counter to at least `floor`. Used by the seq backfill; never lowers it. */
export async function raiseTo(key: string, floor: number): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $max: { value: floor } },
    { new: true, upsert: true },
  );
  return doc?.value ?? 0;
}

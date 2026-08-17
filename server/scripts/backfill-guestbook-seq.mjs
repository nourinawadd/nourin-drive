// One-off: stamps `seq` onto guestbook entries written before that field
// existed, oldest first, then raises the "guestbook-seq" counter so new
// signatures continue from the top instead of colliding.
//
//   node scripts/backfill-guestbook-seq.mjs
//
// Idempotent - entries that already have a seq are left alone, so re-running it
// is harmless. Safe to run late: until it does, the client numbers unstamped
// entries by counting backwards from the total.

import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("[backfill] MONGO_URI not set - nothing to do.");
  process.exit(1);
}

await mongoose.connect(uri);
const entries = mongoose.connection.collection("guestbookentries");
const counters = mongoose.connection.collection("counters");

const existing = await entries
  .find({ seq: { $type: "number" } })
  .sort({ seq: -1 })
  .limit(1)
  .toArray();
let next = (existing[0]?.seq ?? 0) + 1;

const unstamped = await entries
  .find({ seq: { $exists: false } })
  .sort({ createdAt: 1 })
  .toArray();

for (const doc of unstamped) {
  await entries.updateOne({ _id: doc._id }, { $set: { seq: next } });
  next += 1;
}

const highest = next - 1;
if (highest > 0) {
  await counters.updateOne(
    { _id: "guestbook-seq" },
    { $max: { value: highest } },
    { upsert: true },
  );
}

console.log(
  `[backfill] stamped ${unstamped.length} entr${unstamped.length === 1 ? "y" : "ies"}; ` +
    `guestbook-seq now at ${Math.max(highest, 0)}`,
);

await mongoose.disconnect();

import { Schema, model, type InferSchemaType } from "mongoose";

const guestbookSchema = new Schema(
  {
    name:    { type: String, required: true, trim: true, maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 280 },
    emoji:   { type: String, trim: true, maxlength: 8 },

    // The visible entry number ("#42"), allocated from the "guestbook-seq"
    // counter at sign time. Permanent: deleting entry #7 leaves a gap rather
    // than renumbering everyone after it, exactly like the CGI guestbooks this
    // is imitating. Optional because entries written before this field existed
    // have none until the backfill script runs - the client falls back to
    // counting backwards from the total for those.
    seq: { type: Number, index: true },

    // Webmaster reply, shown indented under the entry.
    reply:     { type: String, trim: true, maxlength: 280 },
    repliedAt: { type: Date },
  },
  { timestamps: true },
);

export type GuestbookEntryDoc = InferSchemaType<typeof guestbookSchema>;
export const GuestbookEntry = model("GuestbookEntry", guestbookSchema);

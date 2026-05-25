import { Schema, model, type InferSchemaType } from "mongoose";

const guestbookSchema = new Schema(
  {
    name:    { type: String, required: true, trim: true, maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 280 },
    emoji:   { type: String, trim: true, maxlength: 8 },
  },
  { timestamps: true },
);

export type GuestbookEntryDoc = InferSchemaType<typeof guestbookSchema>;
export const GuestbookEntry = model("GuestbookEntry", guestbookSchema);

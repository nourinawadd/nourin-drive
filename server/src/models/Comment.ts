import { Schema, model, type InferSchemaType } from "mongoose";

const commentSchema = new Schema(
  {
    slug: { type: String, required: true, index: true, lowercase: true, trim: true },
    name: { type: String, trim: true, maxlength: 40, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    seq: { type: Number },
    reply: { type: String, trim: true, maxlength: 1000 },
    repliedAt: { type: Date },
    hidden: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

commentSchema.index({ slug: 1, hidden: 1, createdAt: 1 });

export type CommentDoc = InferSchemaType<typeof commentSchema>;
export const Comment = model("Comment", commentSchema);

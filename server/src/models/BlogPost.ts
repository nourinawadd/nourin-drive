import { Schema, model, type InferSchemaType } from "mongoose";

const blogPostSchema = new Schema(
  {
    title:   { type: String, required: true, trim: true, maxlength: 140 },
    slug:    { type: String, required: true, trim: true, unique: true, lowercase: true },
    excerpt: { type: String, trim: true, maxlength: 280, default: "" },
    content: { type: String, required: true },           // markdown
    tags:    { type: [String], default: [] },
  },
  { timestamps: true },
);

export type BlogPostDoc = InferSchemaType<typeof blogPostSchema>;
export const BlogPost = model("BlogPost", blogPostSchema);

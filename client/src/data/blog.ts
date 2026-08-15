import { GENERATED_POSTS } from "./blog.generated";

export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string;
  number: string;
  tags: string[];
  summary: string;
  words: number;
  minutes: number;
  bytes: number;
};

export const BLOG_URL = (process.env.NEXT_PUBLIC_BLOG_URL ?? "https://blog.nourin.is-a.dev")
  .replace(/\/+$/, "");

export const POSTS: BlogPostMeta[] = GENERATED_POSTS;

export const postUrl = (slug: string) => `${BLOG_URL}/posts/${slug}.html`;

export function findPost(slug: string): BlogPostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export const postFileName = (slug: string) => `${slug}.html`;

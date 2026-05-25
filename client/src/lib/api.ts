import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const api = axios.create({ baseURL });

export type GuestbookEntry = {
  _id: string;
  name: string;
  message: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = BlogPostSummary & { content: string };

export async function listGuestbook() {
  const { data } = await api.get<GuestbookEntry[]>("/api/guestbook");
  return data;
}

export async function postGuestbook(body: { name: string; message: string; emoji?: string }) {
  const { data } = await api.post<GuestbookEntry>("/api/guestbook", body);
  return data;
}

export async function listBlog() {
  const { data } = await api.get<BlogPostSummary[]>("/api/blog");
  return data;
}

export async function getBlog(slug: string) {
  const { data } = await api.get<BlogPost>(`/api/blog/${slug}`);
  return data;
}

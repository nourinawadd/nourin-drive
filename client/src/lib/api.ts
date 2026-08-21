import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const api = axios.create({ baseURL });

export type GuestbookEntry = {
  _id: string;
  name: string;
  message: string;
  emoji?: string;
  /** Permanent entry number. Absent on entries written before numbering existed. */
  seq?: number;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type GuestbookStats = { visits: number; signatures: number };

export async function listGuestbook() {
  const { data } = await api.get<GuestbookEntry[]>("/api/guestbook");
  return data;
}

export async function postGuestbook(body: { name: string; message: string; emoji?: string }) {
  const { data } = await api.post<GuestbookEntry>("/api/guestbook", body);
  return data;
}

export async function getGuestbookStats() {
  const { data } = await api.get<GuestbookStats>("/api/guestbook/stats");
  return data;
}

/** Increments the hit counter. Call once per browser session, not per render. */
export async function pingGuestbookVisit() {
  const { data } = await api.post<GuestbookStats>("/api/guestbook/visit");
  return data;
}

/**
 * Axios reports transport failures ("Request failed with status code 400"),
 * which tells a visitor nothing. The API answers with `{ error }` - prefer that.
 */
export function apiErrorMessage(err: unknown, fallback = "something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { error?: unknown } | undefined;
    if (typeof body?.error === "string" && body.error.trim()) return body.error;
    if (!err.response) return "could not reach the server";
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

export type PostStats = { views: number; comments: number };

export async function getPostStats(slug: string) {
  const { data } = await api.get<PostStats>(`/api/blog/${encodeURIComponent(slug)}/stats`);
  return data;
}

export type ModeratedEntry = GuestbookEntry & { hidden?: boolean };

export type BlogComment = {
  _id: string;
  slug: string;
  name: string;
  message: string;
  seq?: number;
  hidden?: boolean;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
};

function auth(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function listAllGuestbook(token: string) {
  const { data } = await api.get<ModeratedEntry[]>("/api/guestbook/admin", auth(token));
  return data;
}

export async function listAllComments(token: string) {
  const { data } = await api.get<BlogComment[]>("/api/blog/admin/comments", auth(token));
  return data;
}

export async function setGuestbookHidden(token: string, id: string, hidden: boolean) {
  const { data } = await api.patch<ModeratedEntry>(`/api/guestbook/${id}/visibility`, { hidden }, auth(token));
  return data;
}

export async function setCommentHidden(token: string, id: string, hidden: boolean) {
  const { data } = await api.patch<BlogComment>(`/api/blog/comments/${id}/visibility`, { hidden }, auth(token));
  return data;
}

export async function replyToGuestbook(token: string, id: string, reply: string) {
  const { data } = await api.patch<ModeratedEntry>(`/api/guestbook/${id}/reply`, { reply }, auth(token));
  return data;
}

export async function replyToComment(token: string, id: string, reply: string) {
  const { data } = await api.patch<BlogComment>(`/api/blog/comments/${id}/reply`, { reply }, auth(token));
  return data;
}

export async function deleteGuestbookEntry(token: string, id: string) {
  const { data } = await api.delete<{ ok: boolean }>(`/api/guestbook/${id}`, auth(token));
  return data;
}

export async function deleteComment(token: string, id: string) {
  const { data } = await api.delete<{ ok: boolean }>(
    `/api/blog/comments/${id}?purge=true`,
    auth(token),
  );
  return data;
}

export function isUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

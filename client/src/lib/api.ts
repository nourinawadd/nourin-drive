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

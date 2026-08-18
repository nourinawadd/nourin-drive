import type { Request, Response } from "express";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

// A self-contained demo of the Subscriptions Tracker API
// (github.com/nourinawadd/subscriptions-tracker) so the API Studio has a real
// JWT-guarded CRUD surface to work against. Same routes, same response shapes
// and same field enums as the original, but seeded data, no database, and
// writes that never persist - nothing here can be abused or fall over.

const DEMO_EMAIL = "demo@subs.dev";
const DEMO_PASSWORD = "workbench";
const TOKEN_TTL_S = 60 * 60;
const SECRET = process.env.SUBS_DEMO_SECRET ?? "workbench-subs-demo";

type User = { _id: string; name: string; email: string; createdAt: string };

const USERS: User[] = [
  { _id: "u_1001", name: "Demo User", email: DEMO_EMAIL, createdAt: "2025-01-14T09:20:00.000Z" },
  { _id: "u_1002", name: "Ada Byron", email: "ada@subs.dev", createdAt: "2025-02-02T16:05:00.000Z" },
  { _id: "u_1003", name: "Jay Miner", email: "jay@subs.dev", createdAt: "2025-03-19T11:41:00.000Z" },
];

type Subscription = {
  _id: string;
  name: string;
  price: number;
  currency: "USD" | "EGP" | "KWD" | "EUR" | "GBP";
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  category: "entertainment" | "education" | "productivity" | "health" | "other";
  paymentMethod: string;
  status: "active" | "paused" | "canceled" | "expired";
  startDate: string;
  renewalDate: string;
  user: string;
};

const SUBSCRIPTIONS: Subscription[] = [
  { _id: "s_2001", name: "Spotify", price: 9.99, currency: "USD", frequency: "monthly", category: "entertainment", paymentMethod: "Visa 4242", status: "active", startDate: "2025-01-20T00:00:00.000Z", renewalDate: "2026-09-20T00:00:00.000Z", user: "u_1001" },
  { _id: "s_2002", name: "Adobe CC", price: 52.99, currency: "USD", frequency: "monthly", category: "productivity", paymentMethod: "Visa 4242", status: "active", startDate: "2025-02-11T00:00:00.000Z", renewalDate: "2026-09-11T00:00:00.000Z", user: "u_1001" },
  { _id: "s_2003", name: "Coursera Plus", price: 399, currency: "USD", frequency: "yearly", category: "education", paymentMethod: "PayPal", status: "active", startDate: "2025-03-05T00:00:00.000Z", renewalDate: "2027-03-05T00:00:00.000Z", user: "u_1001" },
  { _id: "s_2004", name: "Gym Membership", price: 750, currency: "EGP", frequency: "monthly", category: "health", paymentMethod: "Cash", status: "paused", startDate: "2024-11-01T00:00:00.000Z", renewalDate: "2026-08-25T00:00:00.000Z", user: "u_1001" },
  { _id: "s_2005", name: "Notion", price: 8, currency: "USD", frequency: "monthly", category: "productivity", paymentMethod: "Visa 4242", status: "canceled", startDate: "2024-06-14T00:00:00.000Z", renewalDate: "2026-06-14T00:00:00.000Z", user: "u_1001" },
  { _id: "s_2006", name: "Domain renewal", price: 14.5, currency: "EUR", frequency: "yearly", category: "other", paymentMethod: "Visa 4242", status: "active", startDate: "2025-08-30T00:00:00.000Z", renewalDate: "2026-08-30T00:00:00.000Z", user: "u_1002" },
  { _id: "s_2007", name: "Xbox Game Pass", price: 14.99, currency: "USD", frequency: "monthly", category: "entertainment", paymentMethod: "Mastercard 8801", status: "active", startDate: "2025-05-02T00:00:00.000Z", renewalDate: "2026-09-02T00:00:00.000Z", user: "u_1003" },
];

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (data: string) => createHmac("sha256", SECRET).update(data).digest("base64url");

// Real HS256 JWTs, so the Authorization header behaves exactly like the
// original's and an expired token fails the way a real one would.
function mintToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ userId, iat: now, exp: now + TOKEN_TTL_S });
  return head + "." + body + "." + sign(head + "." + body);
}

function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(sign(parts[0] + "." + parts[1]));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as {
      userId?: string;
      exp?: number;
    };
    if (!claims.userId || !claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims.userId;
  } catch {
    return null;
  }
}

/** Mirrors the original's auth middleware, including its 401 body. */
function requireUser(req: Request, res: Response): User | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided, authorization denied" });
    return null;
  }
  const userId = verifyToken(header.slice(7).trim());
  const user = userId ? USERS.find((u) => u._id === userId) : undefined;
  if (!user) {
    res.status(401).json({ success: false, message: "Unauthorized", error: "invalid or expired token" });
    return null;
  }
  return user;
}

export function signUp(req: Request, res: Response) {
  const { name, email, password } = (req.body ?? {}) as Record<string, unknown>;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "name, email and password are required" });
  }
  if (USERS.some((u) => u.email === email)) {
    return res.status(409).json({ success: false, message: "User already exists" });
  }
  const user: User = {
    _id: "u_" + randomUUID().slice(0, 8),
    name: String(name),
    email: String(email),
    createdAt: new Date().toISOString(),
  };
  res.status(201).json({
    success: true,
    message: "User created successfully",
    note: "Demo API - the account is not stored. Sign in with the demo credentials instead.",
    data: { token: mintToken(USERS[0]._id), user },
  });
}

export function signIn(req: Request, res: Response) {
  const { email, password } = (req.body ?? {}) as Record<string, unknown>;
  const user = USERS.find((u) => u.email === email);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid password",
      hint: "Demo credentials: " + DEMO_EMAIL + " / " + DEMO_PASSWORD,
    });
  }
  res.json({
    success: true,
    message: "User signed in successfully",
    data: { token: mintToken(user._id), user, expiresIn: TOKEN_TTL_S + "s" },
  });
}

export function signOut(_req: Request, res: Response) {
  res.json({ success: true, message: "User signed out successfully" });
}

export function getUsers(_req: Request, res: Response) {
  res.json({ success: true, data: USERS });
}

export function getUser(req: Request, res: Response) {
  if (!requireUser(req, res)) return;
  const user = USERS.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
}

export function getAllSubscriptions(req: Request, res: Response) {
  if (!requireUser(req, res)) return;
  res.json({ success: true, count: SUBSCRIPTIONS.length, data: SUBSCRIPTIONS });
}

export function getUserSubscriptions(req: Request, res: Response) {
  const me = requireUser(req, res);
  if (!me) return;
  if (me._id !== req.params.userId) {
    return res.status(403).json({ success: false, message: "You are not the owner of this account" });
  }
  res.json({ success: true, data: SUBSCRIPTIONS.filter((s) => s.user === me._id) });
}

export function getSubscriptionById(req: Request, res: Response) {
  if (!requireUser(req, res)) return;
  const sub = SUBSCRIPTIONS.find((s) => s._id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
  res.json({ success: true, data: sub });
}

export function getUpcomingRenewals(req: Request, res: Response) {
  if (!requireUser(req, res)) return;
  const now = Date.now();
  const soon = SUBSCRIPTIONS
    .filter((s) => s.status === "active")
    .map((s) => ({ ...s, daysUntilRenewal: Math.ceil((Date.parse(s.renewalDate) - now) / 86_400_000) }))
    .filter((s) => s.daysUntilRenewal >= 0)
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
  res.json({ success: true, count: soon.length, data: soon });
}

export function createSubscription(req: Request, res: Response) {
  const me = requireUser(req, res);
  if (!me) return;
  const body = (req.body ?? {}) as Partial<Subscription>;
  if (!body.name || typeof body.price !== "number") {
    return res.status(400).json({ success: false, message: "name and a numeric price are required" });
  }
  res.status(201).json({
    success: true,
    message: "Subscription created successfully",
    note: "Demo API - nothing is written, so this record vanishes with the response.",
    data: { _id: "s_" + randomUUID().slice(0, 8), status: "active", ...body, user: me._id },
  });
}

export function updateSubscription(req: Request, res: Response) {
  if (!requireUser(req, res)) return;
  const sub = SUBSCRIPTIONS.find((s) => s._id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
  res.json({
    success: true,
    message: "Subscription updated successfully",
    note: "Demo API - the change is echoed back, not stored.",
    data: { ...sub, ...(req.body ?? {}) },
  });
}

export function cancelSubscription(req: Request, res: Response) {
  if (!requireUser(req, res)) return;
  const sub = SUBSCRIPTIONS.find((s) => s._id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
  res.json({
    success: true,
    message: "Subscription canceled successfully",
    note: "Demo API - the change is echoed back, not stored.",
    data: { ...sub, status: "canceled" },
  });
}

export function deleteSubscription(req: Request, res: Response) {
  if (!requireUser(req, res)) return;
  const sub = SUBSCRIPTIONS.find((s) => s._id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
  res.json({
    success: true,
    message: "Subscription deleted successfully",
    note: "Demo API - nothing is removed.",
    data: {},
  });
}

export function sendReminders(req: Request, res: Response) {
  const { subscriptionId } = (req.body ?? {}) as Record<string, unknown>;
  if (!subscriptionId) {
    return res.status(400).json({ success: false, message: "subscriptionId is required" });
  }
  const sub = SUBSCRIPTIONS.find((s) => s._id === subscriptionId);
  if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
  res.json({
    success: true,
    message: "Reminder workflow triggered",
    note: "Demo API - no email is sent and no workflow is queued.",
    data: {
      subscription: sub.name,
      renewalDate: sub.renewalDate.slice(0, 10),
      remindersAt: [7, 5, 2, 1].map((d) => d + " days before renewal"),
    },
  });
}

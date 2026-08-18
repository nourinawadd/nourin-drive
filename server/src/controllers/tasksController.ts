import type { Request, Response } from "express";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

// A self-contained demo of the Task Manager API
// (github.com/nourinawadd/task-manager-api) so the API Studio has a second,
// differently-shaped auth surface to work against. Same routes, same
// { token: { accessToken, expiresIn, expiration }, user } login payload, same
// soft-delete-and-restore model as the original - but seeded data, no
// database, and writes that are echoed rather than stored.

const DEMO_EMAIL = "demo@tasks.dev";
const DEMO_PASSWORD = "workbench";
const TOKEN_TTL_S = 60 * 60;
const SECRET = process.env.TASKS_DEMO_SECRET ?? "workbench-tasks-demo";

type User = {
  _id: string;
  name: string;
  email: string;
  age: number;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

const USERS: User[] = [
  { _id: "6501a1f4c3a1b2000f0a1001", name: "Demo User", email: DEMO_EMAIL, age: 22, confirmed: true, createdAt: "2025-04-02T10:15:00.000Z", updatedAt: "2025-04-02T10:15:00.000Z" },
  { _id: "6501a1f4c3a1b2000f0a1002", name: "Grace Hopper", email: "grace@tasks.dev", age: 45, confirmed: true, createdAt: "2025-04-08T08:40:00.000Z", updatedAt: "2025-04-08T08:40:00.000Z" },
  { _id: "6501a1f4c3a1b2000f0a1003", name: "Alan Kay", email: "alan@tasks.dev", age: 38, confirmed: false, createdAt: "2025-04-21T19:02:00.000Z", updatedAt: "2025-04-21T19:02:00.000Z" },
];

type Task = {
  _id: string;
  description: string;
  completed: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

const OWNER = USERS[0]._id;

const TASKS: Task[] = [
  { _id: "7101b2e5d4b2c3000f0b2001", description: "Write the migration for the tasks table", completed: true, owner: OWNER, createdAt: "2025-04-03T09:00:00.000Z", updatedAt: "2025-04-05T14:20:00.000Z", deletedAt: null },
  { _id: "7101b2e5d4b2c3000f0b2002", description: "Add JWT refresh tokens", completed: false, owner: OWNER, createdAt: "2025-04-04T11:30:00.000Z", updatedAt: "2025-04-04T11:30:00.000Z", deletedAt: null },
  { _id: "7101b2e5d4b2c3000f0b2003", description: "Rate-limit the login route", completed: false, owner: OWNER, createdAt: "2025-04-06T16:45:00.000Z", updatedAt: "2025-04-06T16:45:00.000Z", deletedAt: null },
  { _id: "7101b2e5d4b2c3000f0b2004", description: "Document every endpoint in Swagger", completed: true, owner: OWNER, createdAt: "2025-04-09T08:05:00.000Z", updatedAt: "2025-04-12T10:00:00.000Z", deletedAt: null },
  { _id: "7101b2e5d4b2c3000f0b2005", description: "Seed the database for local development", completed: false, owner: OWNER, createdAt: "2025-04-14T13:10:00.000Z", updatedAt: "2025-04-14T13:10:00.000Z", deletedAt: null },
  { _id: "7101b2e5d4b2c3000f0b2006", description: "Switch avatars to S3", completed: false, owner: OWNER, createdAt: "2025-04-17T07:55:00.000Z", updatedAt: "2025-04-19T09:30:00.000Z", deletedAt: "2025-04-19T09:30:00.000Z" },
  { _id: "7101b2e5d4b2c3000f0b2007", description: "Drop the unused roles table", completed: false, owner: OWNER, createdAt: "2025-04-18T12:00:00.000Z", updatedAt: "2025-04-20T17:15:00.000Z", deletedAt: "2025-04-20T17:15:00.000Z" },
  { _id: "7101b2e5d4b2c3000f0b2008", description: "Review Grace's pull request", completed: false, owner: USERS[1]._id, createdAt: "2025-04-22T15:25:00.000Z", updatedAt: "2025-04-22T15:25:00.000Z", deletedAt: null },
];

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (data: string) => createHmac("sha256", SECRET).update(data).digest("base64url");

// Real HS256 JWTs carrying a sessionId, matching the original's JWT.sign call.
function mintToken(sessionId: string) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ sessionId, iat: now, exp: now + TOKEN_TTL_S });
  return head + "." + body + "." + sign(head + "." + body);
}

function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(sign(parts[0] + "." + parts[1]));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as { exp?: number };
    return !!claims.exp && claims.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** Mirrors setMiddlewareMustBeLoggedIn: 401 with the original's error shape. */
function requireAuth(req: Request, res: Response): User | null {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: { name: "UnauthorizedError", message: "Please authenticate" } });
    return null;
  }
  return USERS[0];
}

const publicUser = (u: User) => ({ ...u, id: u._id });
const publicTask = ({ deletedAt: _deletedAt, ...t }: Task) => ({ ...t, id: t._id });

/** limit / skip / sortBy=field:asc|desc, as ParsePagingQuery accepts. */
function paginate<T>(rows: T[], q: Request["query"]) {
  const limit = Math.min(Number(q.limit) || rows.length, 100);
  const skip = Number(q.skip) || 0;
  const sortBy = typeof q.sortBy === "string" ? q.sortBy : "";
  const out = [...rows];
  if (sortBy) {
    const [field, dir] = sortBy.split(":");
    const sign = dir === "desc" ? -1 : 1;
    out.sort((a, b) => {
      const av = String((a as Record<string, unknown>)[field] ?? "");
      const bv = String((b as Record<string, unknown>)[field] ?? "");
      return av.localeCompare(bv) * sign;
    });
  }
  return { total: rows.length, limit, skip, data: out.slice(skip, skip + limit) };
}

export function login(req: Request, res: Response) {
  const { email, password } = (req.body ?? {}) as Record<string, unknown>;
  const clean = String(email ?? "").trim();
  if (clean !== DEMO_EMAIL || String(password ?? "").trim() !== DEMO_PASSWORD) {
    return res.status(401).json({
      error: { name: "UnauthorizedError", message: "Invalid user and/or password" },
      hint: "Demo credentials: " + DEMO_EMAIL + " / " + DEMO_PASSWORD,
    });
  }
  const expiration = new Date(Date.now() + TOKEN_TTL_S * 1000).toISOString();
  res.json({
    token: {
      accessToken: mintToken(randomUUID()),
      expiresIn: TOKEN_TTL_S,
      expiration,
    },
    user: publicUser(USERS[0]),
  });
}

export function logout(req: Request, res: Response) {
  if (!requireAuth(req, res)) return;
  res.json({ message: "Session closed" });
}

export function logoutAll(req: Request, res: Response) {
  if (!requireAuth(req, res)) return;
  res.json({ message: "All sessions closed" });
}

export function findUsers(req: Request, res: Response) {
  if (!requireAuth(req, res)) return;
  res.json(paginate(USERS.map(publicUser), req.query));
}

export function findMe(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  res.json(publicUser(me));
}

export function findOneUser(req: Request, res: Response) {
  if (!requireAuth(req, res)) return;
  const user = USERS.find((u) => u._id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: { name: "NotFoundError", message: "User not found" } });
  }
  res.json(publicUser(user));
}

export function createUser(req: Request, res: Response) {
  const { name, email, password } = (req.body ?? {}) as Record<string, unknown>;
  if (!name || !email || !password) {
    return res.status(400).json({
      error: { name: "BadRequestError", message: "name, email and password are required" },
    });
  }
  res.status(201).json({
    note: "Demo API - the account is not stored. Log in with the demo credentials instead.",
    user: { _id: randomUUID(), name, email, age: 0, confirmed: false },
  });
}

export function findTasks(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  let rows = TASKS.filter((t) => t.deletedAt === null && t.owner === me._id);
  if (req.query.completed === "true") rows = rows.filter((t) => t.completed);
  if (req.query.completed === "false") rows = rows.filter((t) => !t.completed);
  res.json(paginate(rows.map(publicTask), req.query));
}

export function findDeletedTasks(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  const rows = TASKS.filter((t) => t.deletedAt !== null && t.owner === me._id);
  res.json(paginate(rows.map((t) => ({ ...publicTask(t), deletedAt: t.deletedAt })), req.query));
}

export function findOneTask(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  const task = TASKS.find((t) => t._id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: { name: "NotFoundError", message: "Task not found" } });
  }
  if (task.owner !== me._id) {
    return res.status(403).json({ error: { name: "ForbiddenError", message: "Not the owner of this task" } });
  }
  res.json(publicTask(task));
}

export function createTask(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  const { description } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof description !== "string" || !description.trim()) {
    return res.status(400).json({
      error: { name: "BadRequestError", message: "description is required" },
    });
  }
  const now = new Date().toISOString();
  res.status(201).json({
    note: "Demo API - nothing is written, so this task vanishes with the response.",
    ...publicTask({
      _id: randomUUID(),
      description: description.trim(),
      completed: false,
      owner: me._id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }),
  });
}

export function updateTask(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  const task = TASKS.find((t) => t._id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: { name: "NotFoundError", message: "Task not found" } });
  }
  if (task.owner !== me._id) {
    return res.status(403).json({ error: { name: "ForbiddenError", message: "Not the owner of this task" } });
  }
  res.json({
    note: "Demo API - the change is echoed back, not stored.",
    ...publicTask({ ...task, ...(req.body ?? {}), updatedAt: new Date().toISOString() }),
  });
}

export function restoreTask(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  const task = TASKS.find((t) => t._id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: { name: "NotFoundError", message: "Task not found" } });
  }
  res.json({
    note: "Demo API - the restore is echoed back, not stored.",
    ...publicTask({ ...task, deletedAt: null, updatedAt: new Date().toISOString() }),
  });
}

export function removeTask(req: Request, res: Response) {
  const me = requireAuth(req, res);
  if (!me) return;
  const task = TASKS.find((t) => t._id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: { name: "NotFoundError", message: "Task not found" } });
  }
  if (task.owner !== me._id) {
    return res.status(403).json({ error: { name: "ForbiddenError", message: "Not the owner of this task" } });
  }
  res.json({
    note: "Demo API - soft delete is echoed back, not stored. Find it again via GET /tasks/deleted.",
    ...publicTask(task),
    deletedAt: new Date().toISOString(),
  });
}

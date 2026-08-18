export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Header = { key: string; value: string };

export type Preset = {
  id: string;
  name: string;
  method: Method;
  url: string;
  group: PresetGroup;
  headers?: Header[];
  body?: string;
};

export type PresetGroup = "This site" | "Subscriptions API" | "Task Manager API" | "Playground" | "Out there";

/** Sidebar order for the group headings. */
export const PRESET_GROUPS: PresetGroup[] = ["This site", "Subscriptions API", "Task Manager API", "Playground", "Out there"];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const JSON_HEADER: Header[] = [{ key: "Content-Type", value: "application/json" }];

export const PRESETS: Preset[] = [
  /* ---------- this site's own server ---------- */
  {
    id: "health",
    name: "Server health",
    method: "GET",
    url: `${API_BASE}/api/health`,
    group: "This site",
  },
  {
    id: "fun-index",
    name: "Endpoint index",
    method: "GET",
    url: `${API_BASE}/api/fun`,
    group: "This site",
  },
  {
    id: "fun-uptime",
    name: "Server uptime",
    method: "GET",
    url: `${API_BASE}/api/fun/uptime`,
    group: "This site",
  },
  {
    id: "guestbook-list",
    name: "Guestbook",
    method: "GET",
    url: `${API_BASE}/api/guestbook`,
    group: "This site",
  },
  {
    id: "guestbook-sign",
    name: "Sign guestbook",
    method: "POST",
    url: `${API_BASE}/api/guestbook`,
    group: "This site",
    headers: JSON_HEADER,
    body: JSON.stringify(
      { name: "anonymous", message: "signed from the API Studio", emoji: "👾" },
      null,
      2,
    ),
  },
  {
    id: "blog-list",
    name: "Blog posts",
    method: "GET",
    url: `${API_BASE}/api/blog`,
    group: "This site",
  },

  /* ---------- the Subscriptions Tracker API, seeded and in-memory ----------
     Everything past sign-in needs a JWT: run "Sign in", copy `data.token` out
     of the response, and paste it into the Authorization header the guarded
     presets already carry. Writes are echoed back, never stored. */
  {
    id: "subs-index",
    name: "About this API",
    method: "GET",
    url: `${API_BASE}/api/subs`,
    group: "Subscriptions API",
  },
  {
    id: "subs-signin",
    name: "1. Sign in (get token)",
    method: "POST",
    url: `${API_BASE}/api/subs/auth/sign-in`,
    group: "Subscriptions API",
    headers: JSON_HEADER,
    body: JSON.stringify({ email: "demo@subs.dev", password: "workbench" }, null, 2),
  },
  {
    id: "subs-list",
    name: "2. All subscriptions",
    method: "GET",
    url: `${API_BASE}/api/subs/subscriptions`,
    group: "Subscriptions API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "subs-renewals",
    name: "Upcoming renewals",
    method: "GET",
    url: `${API_BASE}/api/subs/subscriptions/upcoming-renewals`,
    group: "Subscriptions API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "subs-one",
    name: "One subscription",
    method: "GET",
    url: `${API_BASE}/api/subs/subscriptions/s_2001`,
    group: "Subscriptions API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "subs-mine",
    name: "My subscriptions",
    method: "GET",
    url: `${API_BASE}/api/subs/subscriptions/user/u_1001`,
    group: "Subscriptions API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "subs-create",
    name: "Create a subscription",
    method: "POST",
    url: `${API_BASE}/api/subs/subscriptions`,
    group: "Subscriptions API",
    headers: [...JSON_HEADER, { key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
    body: JSON.stringify(
      {
        name: "Figma",
        price: 12,
        currency: "USD",
        frequency: "monthly",
        category: "productivity",
        paymentMethod: "Visa 4242",
        startDate: "2026-08-01T00:00:00.000Z",
        renewalDate: "2026-09-01T00:00:00.000Z",
      },
      null,
      2,
    ),
  },
  {
    id: "subs-cancel",
    name: "Cancel a subscription",
    method: "PUT",
    url: `${API_BASE}/api/subs/subscriptions/s_2002/cancel`,
    group: "Subscriptions API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "subs-unauthorized",
    name: "401 without a token",
    method: "GET",
    url: `${API_BASE}/api/subs/subscriptions`,
    group: "Subscriptions API",
  },
  {
    id: "subs-users",
    name: "Demo users",
    method: "GET",
    url: `${API_BASE}/api/subs/users`,
    group: "Subscriptions API",
  },
  {
    id: "subs-reminder",
    name: "Trigger reminder workflow",
    method: "POST",
    url: `${API_BASE}/api/subs/workflows/subscription/reminder`,
    group: "Subscriptions API",
    headers: JSON_HEADER,
    body: JSON.stringify({ subscriptionId: "s_2001" }, null, 2),
  },

  /* ---------- the Task Manager API, seeded and in-memory ----------
     Same drill as above, but this one returns the token nested at
     `token.accessToken` and soft-deletes instead of removing rows. */
  {
    id: "tm-index",
    name: "About this API",
    method: "GET",
    url: `${API_BASE}/api/tasks`,
    group: "Task Manager API",
  },
  {
    id: "tm-login",
    name: "1. Log in (get token)",
    method: "POST",
    url: `${API_BASE}/api/tasks/account/login`,
    group: "Task Manager API",
    headers: JSON_HEADER,
    body: JSON.stringify({ email: "demo@tasks.dev", password: "workbench" }, null, 2),
  },
  {
    id: "tm-tasks",
    name: "2. My tasks",
    method: "GET",
    url: `${API_BASE}/api/tasks/tasks`,
    group: "Task Manager API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "tm-sorted",
    name: "Sorted + paged",
    method: "GET",
    url: `${API_BASE}/api/tasks/tasks?limit=3&skip=0&sortBy=createdAt:desc`,
    group: "Task Manager API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "tm-open",
    name: "Only unfinished",
    method: "GET",
    url: `${API_BASE}/api/tasks/tasks?completed=false`,
    group: "Task Manager API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "tm-deleted",
    name: "Soft-deleted tasks",
    method: "GET",
    url: `${API_BASE}/api/tasks/tasks/deleted`,
    group: "Task Manager API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "tm-create",
    name: "Create a task",
    method: "POST",
    url: `${API_BASE}/api/tasks/tasks`,
    group: "Task Manager API",
    headers: [...JSON_HEADER, { key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
    body: JSON.stringify({ description: "Ship the portfolio" }, null, 2),
  },
  {
    id: "tm-complete",
    name: "Mark one complete",
    method: "PATCH",
    url: `${API_BASE}/api/tasks/tasks/7101b2e5d4b2c3000f0b2002`,
    group: "Task Manager API",
    headers: [...JSON_HEADER, { key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
    body: JSON.stringify({ completed: true }, null, 2),
  },
  {
    id: "tm-restore",
    name: "Restore a deleted task",
    method: "PATCH",
    url: `${API_BASE}/api/tasks/tasks/7101b2e5d4b2c3000f0b2006/restore`,
    group: "Task Manager API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "tm-me",
    name: "Who am I?",
    method: "GET",
    url: `${API_BASE}/api/tasks/users/me`,
    group: "Task Manager API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "tm-forbidden",
    name: "403 on someone else's task",
    method: "GET",
    url: `${API_BASE}/api/tasks/tasks/7101b2e5d4b2c3000f0b2008`,
    group: "Task Manager API",
    headers: [{ key: "Authorization", value: "Bearer PASTE_TOKEN_HERE" }],
  },
  {
    id: "tm-unauthorized",
    name: "401 without a token",
    method: "GET",
    url: `${API_BASE}/api/tasks/tasks`,
    group: "Task Manager API",
  },

  /* ---------- playground routes on the same server ---------- */
  {
    id: "fun-whoami",
    name: "Who am I?",
    method: "GET",
    url: `${API_BASE}/api/fun/whoami`,
    group: "Playground",
  },
  {
    id: "fun-echo",
    name: "Echo my request",
    method: "POST",
    url: `${API_BASE}/api/fun/echo?hello=world`,
    group: "Playground",
    headers: [...JSON_HEADER, { key: "X-Sent-From", value: "Workbench" }],
    body: JSON.stringify({ ping: "pong", nested: { works: true } }, null, 2),
  },
  {
    id: "fun-fortune",
    name: "Fortune cookie",
    method: "GET",
    url: `${API_BASE}/api/fun/fortune`,
    group: "Playground",
  },
  {
    id: "fun-dice",
    name: "Roll 2d20",
    method: "GET",
    url: `${API_BASE}/api/fun/dice?d=20&n=2`,
    group: "Playground",
  },
  {
    id: "fun-coin",
    name: "Flip 5 coins",
    method: "GET",
    url: `${API_BASE}/api/fun/coin?n=5`,
    group: "Playground",
  },
  {
    id: "fun-palette",
    name: "Random palette",
    method: "GET",
    url: `${API_BASE}/api/fun/palette?n=6`,
    group: "Playground",
  },
  {
    id: "fun-hash",
    name: "Hash some text",
    method: "POST",
    url: `${API_BASE}/api/fun/hash`,
    group: "Playground",
    headers: JSON_HEADER,
    body: JSON.stringify({ text: "Only Amiga makes it possible" }, null, 2),
  },
  {
    id: "fun-delay",
    name: "Slow response (2s)",
    method: "GET",
    url: `${API_BASE}/api/fun/delay/2000`,
    group: "Playground",
  },
  {
    id: "fun-status",
    name: "Force a 503",
    method: "GET",
    url: `${API_BASE}/api/fun/status/503`,
    group: "Playground",
  },

  /* ---------- public APIs out on the internet ---------- */
  {
    id: "gh-user",
    name: "Github profile",
    method: "GET",
    url: "https://api.github.com/users/nourinawadd",
    group: "Out there",
  },
  {
    id: "posts-list",
    name: "List posts",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts",
    group: "Out there",
  },
  {
    id: "post-create",
    name: "Create post",
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    group: "Out there",
    headers: JSON_HEADER,
    body: JSON.stringify(
      { title: "hello", body: "from workbench", userId: 1 },
      null,
      2,
    ),
  },
  {
    id: "cat-fact",
    name: "Random cat fact",
    method: "GET",
    url: "https://catfact.ninja/fact",
    group: "Out there",
  },
  {
    id: "dog-photo",
    name: "Random dog photo",
    method: "GET",
    url: "https://dog.ceo/api/breeds/image/random",
    group: "Out there",
  },
  {
    id: "advice",
    name: "Unsolicited advice",
    method: "GET",
    url: "https://api.adviceslip.com/advice",
    group: "Out there",
  },
  {
    id: "useless-fact",
    name: "Useless fact",
    method: "GET",
    url: "https://uselessfacts.jsph.pl/api/v2/facts/random",
    group: "Out there",
  },
  {
    id: "nasa-apod",
    name: "NASA photo of the day",
    method: "GET",
    url: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
    group: "Out there",
  },
  {
    id: "random-user",
    name: "Random person",
    method: "GET",
    url: "https://randomuser.me/api/",
    group: "Out there",
  },
  {
    id: "my-ip",
    name: "My public IP",
    method: "GET",
    url: "https://api.ipify.org?format=json",
    group: "Out there",
  },
  {
    id: "httpbin",
    name: "httpbin: anything",
    method: "POST",
    url: "https://httpbin.org/anything",
    group: "Out there",
    headers: JSON_HEADER,
    body: JSON.stringify({ from: "Amiga Workbench", year: 1992 }, null, 2),
  },
];

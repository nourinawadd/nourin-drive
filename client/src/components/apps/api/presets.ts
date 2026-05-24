export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Header = { key: string; value: string };

export type Preset = {
  id: string;
  name: string;
  method: Method;
  url: string;
  headers?: Header[];
  body?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const PRESETS: Preset[] = [
  {
    id: "health",
    name: "Server health",
    method: "GET",
    url: `${API_BASE}/api/health`,
  },
  {
    id: "posts-list",
    name: "List posts",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts",
  },
  {
    id: "post-one",
    name: "Single post",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts/1",
  },
  {
    id: "post-create",
    name: "Create post",
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body: JSON.stringify(
      { title: "hello", body: "from workbench", userId: 1 },
      null,
      2,
    ),
  },
  {
    id: "gh-user",
    name: "Github profile",
    method: "GET",
    url: "https://api.github.com/users/nourinawadd",
  },
  {
    id: "cat-fact",
    name: "Random cat fact",
    method: "GET",
    url: "https://catfact.ninja/fact",
  },
];

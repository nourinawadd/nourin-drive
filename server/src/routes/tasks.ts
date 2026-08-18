import { Router } from "express";
import {
  createTask,
  createUser,
  findDeletedTasks,
  findMe,
  findOneTask,
  findOneUser,
  findTasks,
  findUsers,
  login,
  logout,
  logoutAll,
  removeTask,
  restoreTask,
  updateTask,
} from "../controllers/tasksController.js";

export const tasksRouter = Router();

tasksRouter.get("/", (_req, res) => {
  res.json({
    name: "Task Manager API (demo)",
    source: "https://github.com/nourinawadd/task-manager-api",
    note: "A seeded, in-memory copy of the real API. Writes are echoed, never stored.",
    auth: {
      how: "POST /api/tasks/account/login, then send: Authorization: Bearer <token.accessToken>",
      demo: { email: "demo@tasks.dev", password: "workbench" },
      expiresIn: "1h",
    },
    query: {
      limit: "page size, max 100",
      skip: "offset",
      sortBy: "field:asc | field:desc, e.g. createdAt:desc",
      completed: "true | false, tasks only",
    },
    endpoints: [
      { method: "POST", path: "/api/tasks/account/login", desc: "returns { token, user }" },
      { method: "POST", path: "/api/tasks/account/logout", desc: "close this session (auth)" },
      { method: "POST", path: "/api/tasks/account/logout/all", desc: "close every session (auth)" },
      { method: "GET", path: "/api/tasks/users", desc: "all demo users (auth)" },
      { method: "GET", path: "/api/tasks/users/me", desc: "the signed-in user (auth)" },
      { method: "GET", path: "/api/tasks/users/:id", desc: "one user (auth)" },
      { method: "POST", path: "/api/tasks/users", desc: "register (not persisted)" },
      { method: "GET", path: "/api/tasks/tasks", desc: "your open tasks, paged (auth)" },
      { method: "GET", path: "/api/tasks/tasks/deleted", desc: "soft-deleted tasks (auth)" },
      { method: "GET", path: "/api/tasks/tasks/:id", desc: "one task (auth)" },
      { method: "POST", path: "/api/tasks/tasks", desc: "create a task (auth)" },
      { method: "PATCH", path: "/api/tasks/tasks/:id", desc: "update a task (auth)" },
      { method: "PATCH", path: "/api/tasks/tasks/:id/restore", desc: "undo a soft delete (auth)" },
      { method: "DELETE", path: "/api/tasks/tasks/:id", desc: "soft-delete a task (auth)" },
    ],
  });
});

tasksRouter.post("/account/login", login);
tasksRouter.post("/account/logout/all", logoutAll);
tasksRouter.post("/account/logout", logout);

// `me` before `:id` so it isn't swallowed as an id.
tasksRouter.get("/users/me", findMe);
tasksRouter.get("/users/:id", findOneUser);
tasksRouter.get("/users", findUsers);
tasksRouter.post("/users", createUser);

// `deleted` before `:id`, same reason.
tasksRouter.get("/tasks/deleted", findDeletedTasks);
tasksRouter.get("/tasks/:id", findOneTask);
tasksRouter.get("/tasks", findTasks);
tasksRouter.post("/tasks", createTask);
tasksRouter.patch("/tasks/:id/restore", restoreTask);
tasksRouter.patch("/tasks/:id", updateTask);
tasksRouter.delete("/tasks/:id", removeTask);

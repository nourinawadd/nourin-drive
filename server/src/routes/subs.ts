import { Router } from "express";
import {
  cancelSubscription,
  createSubscription,
  deleteSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  getUpcomingRenewals,
  getUser,
  getUserSubscriptions,
  getUsers,
  sendReminders,
  signIn,
  signOut,
  signUp,
  updateSubscription,
} from "../controllers/subsController.js";

export const subsRouter = Router();

subsRouter.get("/", (_req, res) => {
  res.json({
    name: "Subscriptions Tracker API (demo)",
    source: "https://github.com/nourinawadd/subscriptions-tracker",
    note: "A seeded, in-memory copy of the real API so the API Studio has something live to hit. Writes are echoed, never stored.",
    auth: {
      how: "POST /api/subs/auth/sign-in, then send the token as: Authorization: Bearer <token>",
      demo: { email: "demo@subs.dev", password: "workbench" },
      expiresIn: "1h",
    },
    endpoints: [
      { method: "POST", path: "/api/subs/auth/sign-up", desc: "create an account (not persisted)" },
      { method: "POST", path: "/api/subs/auth/sign-in", desc: "returns a signed JWT" },
      { method: "POST", path: "/api/subs/auth/sign-out", desc: "no-op, mirrors the original" },
      { method: "GET", path: "/api/subs/users", desc: "all demo users" },
      { method: "GET", path: "/api/subs/users/:id", desc: "one user (auth)" },
      { method: "GET", path: "/api/subs/subscriptions", desc: "every subscription (auth)" },
      { method: "POST", path: "/api/subs/subscriptions", desc: "create one (auth)" },
      { method: "GET", path: "/api/subs/subscriptions/upcoming-renewals", desc: "sorted by days left (auth)" },
      { method: "GET", path: "/api/subs/subscriptions/user/:userId", desc: "one user's subscriptions (auth)" },
      { method: "GET", path: "/api/subs/subscriptions/:id", desc: "one subscription (auth)" },
      { method: "PUT", path: "/api/subs/subscriptions/:id", desc: "update one (auth)" },
      { method: "PUT", path: "/api/subs/subscriptions/:id/cancel", desc: "cancel one (auth)" },
      { method: "DELETE", path: "/api/subs/subscriptions/:id", desc: "delete one (auth)" },
      { method: "POST", path: "/api/subs/workflows/subscription/reminder", desc: "trigger the reminder workflow" },
    ],
  });
});

subsRouter.post("/auth/sign-up", signUp);
subsRouter.post("/auth/sign-in", signIn);
subsRouter.post("/auth/sign-out", signOut);

subsRouter.get("/users", getUsers);
subsRouter.get("/users/:id", getUser);

// `upcoming-renewals` is declared before `/:id` so it isn't swallowed as an id.
subsRouter.get("/subscriptions/upcoming-renewals", getUpcomingRenewals);
subsRouter.get("/subscriptions/user/:userId", getUserSubscriptions);
subsRouter.get("/subscriptions", getAllSubscriptions);
subsRouter.post("/subscriptions", createSubscription);
subsRouter.get("/subscriptions/:id", getSubscriptionById);
subsRouter.put("/subscriptions/:id/cancel", cancelSubscription);
subsRouter.put("/subscriptions/:id", updateSubscription);
subsRouter.delete("/subscriptions/:id", deleteSubscription);

subsRouter.post("/workflows/subscription/reminder", sendReminders);

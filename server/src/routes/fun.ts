import { Router } from "express";
import {
  coin,
  delay,
  dice,
  echo,
  fortune,
  guru,
  hash,
  palette,
  status,
  teapot,
  time,
  uptime,
  whoami,
} from "../controllers/funController.js";

export const funRouter = Router();

funRouter.get("/", (_req, res) => {
  res.json({
    name: "fun endpoints",
    note: "Playground routes for the API Studio. No auth, no database.",
    endpoints: [
      { method: "GET", path: "/api/fun/uptime", desc: "how long this server has been awake" },
      { method: "GET", path: "/api/fun/whoami", desc: "what the server sees about you" },
      { method: "ALL", path: "/api/fun/echo", desc: "mirrors your request back" },
      { method: "GET", path: "/api/fun/status/:code", desc: "responds with any status 100-599" },
      { method: "GET", path: "/api/fun/delay/:ms", desc: "slow response, capped at 10s" },
      { method: "GET", path: "/api/fun/dice?d=20&n=2", desc: "roll dice" },
      { method: "GET", path: "/api/fun/coin?n=3", desc: "flip coins" },
      { method: "GET", path: "/api/fun/fortune", desc: "a fortune cookie" },
      { method: "GET", path: "/api/fun/guru", desc: "fake Guru Meditation error" },
      { method: "GET", path: "/api/fun/palette?n=4", desc: "random colours + Workbench palette" },
      { method: "GET", path: "/api/fun/time", desc: "now, including Amiga epoch seconds" },
      { method: "POST", path: "/api/fun/hash", desc: "md5/sha/base64/rot13 of { text }" },
      { method: "GET", path: "/api/fun/teapot", desc: "418" },
    ],
  });
});

funRouter.get("/uptime", uptime);
funRouter.get("/whoami", whoami);
funRouter.all("/echo", echo);
funRouter.get("/status/:code", status);
funRouter.get("/delay/:ms", delay);
funRouter.get("/dice", dice);
funRouter.get("/coin", coin);
funRouter.get("/fortune", fortune);
funRouter.get("/guru", guru);
funRouter.get("/palette", palette);
funRouter.get("/time", time);
funRouter.post("/hash", hash);
funRouter.get("/teapot", teapot);

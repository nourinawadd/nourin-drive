# Deploying the API

The companion to `blog-guide.md`, for the thing behind the guestbook and the blog
comments: the Express server, running on the Oracle VM under systemd, reached through
nginx at `https://nourin.is-a.dev/api/`.

## The shape

```
nourin.is-a.dev/           the desktop      static / next build
nourin.is-a.dev/api/*      the api          nginx -> 127.0.0.1:5000
blog.nourin.is-a.dev       the blog         static, /var/www/blog
```

The API is a **path on the apex**, not its own subdomain. That means no second is-a.dev
registration and no second certificate, and the desktop talks to it same-origin. The blog
is a different origin, so it still goes through CORS.

## The base URL has no `/api` on the end

Every caller appends `/api/...` itself:

| Caller | Builds |
| --- | --- |
| `client/src/lib/api.ts` | axios `baseURL` + `/api/guestbook` |
| `client/src/components/apps/api/presets.ts` | `` `${API_BASE}/api/health` `` |
| `blog/blog.js` | `API + "/api/blog/" + slug + "/comments"` |

So the value everywhere is the bare origin:

```
https://nourin.is-a.dev
```

Not `https://nourin.is-a.dev/api`. That produces `/api/api/blog/...` and 404s everything.

Two places hold it:

| Where | Value |
| --- | --- |
| `blog/site.config.json` → `api` | `https://nourin.is-a.dev` |
| `NEXT_PUBLIC_API_URL` when building the client | `https://nourin.is-a.dev` |

`NEXT_PUBLIC_*` is inlined into the bundle at **build time**. Setting it at runtime does
nothing.

## One-time setup on the VM

### 1. The env file

`/srv/nourin-api/.env` - written once by hand, never touched by a deploy:

```
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://nourin.is-a.dev,https://blog.nourin.is-a.dev
MONGO_URI=<the Atlas URI from your local server/.env>
ADMIN_TOKEN=<the token from your local server/.env>
```

```bash
chmod 600 /srv/nourin-api/.env
```

`ALLOWED_ORIGINS` overrides `CLIENT_URL` and `BLOG_URL` entirely - set it and ignore
those two. The blog must be listed or its comments get rejected by CORS.

### 2. systemd

Copy `infra/systemd/nourin-api.service` to `/etc/systemd/system/nourin-api.service`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nourin-api
curl localhost:5000/api/health
```

`dotenv/config` reads `.env` out of the working directory, which is why the unit sets
`WorkingDirectory=/srv/nourin-api` and no `EnvironmentFile` is needed.

Get a healthy response here **before** touching nginx. If it fails,
`journalctl -u nourin-api -n 50`.

### 3. nginx

The tracked copies in `infra/nginx/` are the target state, not a verbatim dump of the VM.
Diff before replacing - `root` and the certbot paths are the lines most likely to differ:

```bash
diff infra/nginx/nourin.is-a.dev.conf /etc/nginx/sites-available/nourin.is-a.dev
```

The part that matters is the `location /api/` block. `proxy_pass` has **no trailing
slash** - with one, nginx strips `/api` and Express 404s. Ordering against `location /`
doesn't matter; nginx takes the longest prefix match.

`X-Forwarded-For` pairs with `app.set("trust proxy", 1)` in `server/src/index.ts`. Without
both, `express-rate-limit` sees every request as coming from `127.0.0.1` and rate-limits
the whole internet as one client.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Deploying after that

```bash
bash server/deploy.sh
```

Builds locally, uploads `dist/` and `package.json`, installs production dependencies on
the VM, restarts the service. Override the target with `API_HOST`, `API_APPROOT`, or
`API_SERVICE`.

Two things it does deliberately:

- `rsync --delete` is scoped to `dist/` only. `/srv/nourin-api` also holds `.env` and
  `node_modules`, and deleting at the top level would take both with it.
- It runs `npm install --omit=dev`, not `npm ci`. This is an npm workspace - the lockfile
  lives at the repo root, so a standalone `server/` directory has none for `npm ci` to
  read. `npm install` writes one on the VM the first time and is a fast no-op after.

Changing `blog/site.config.json` means rebuilding the blog too - the API origin is baked
into every page via `blog/templates/base.html`:

```bash
npm run blog && bash blog/deploy.sh
```

## Checking it

```bash
curl https://nourin.is-a.dev/api/health
curl -I https://nourin.is-a.dev/api/health          # RateLimit-* headers present
```

Cross-origin from the blog, which is the path that was broken:

```bash
curl -s -H "Origin: https://blog.nourin.is-a.dev" -D- -o /dev/null \
  https://nourin.is-a.dev/api/blog/hello-welcome-in/stats | grep -i access-control-allow-origin
```

## Local dev is unaffected

`blog/blog.js` picks `apiDev` over `api` when the hostname is localhost, so
`npm run dev` still talks to `localhost:5000`. `client/.env.local` stays on localhost
values too.

## When it doesn't work

| Symptom | Cause |
| --- | --- |
| `404` on every `/api/*` | Trailing slash on `proxy_pass`. Remove it and reload. |
| `502 Bad Gateway` | The service isn't up. `systemctl status nourin-api`. |
| Comments say "server may be asleep" | `ALLOWED_ORIGINS` doesn't list `https://blog.nourin.is-a.dev`. |
| Requests 404 with a doubled path | A base URL ending in `/api`. It should be the bare origin. |
| Everyone gets rate-limited at once | `trust proxy` or `X-Forwarded-For` missing - they only work as a pair. |
| Deploy ran but nothing changed | Browser cache. The blog's `Cache-Control` rules live in `infra/nginx/blog.nourin.is-a.dev.conf`. |
| Security headers vanish on some paths | nginx `add_header` doesn't inherit into a `location` that sets its own - they have to be repeated. |
| `npm ci` errors about a missing lockfile | Use `npm install --omit=dev`; see above. |

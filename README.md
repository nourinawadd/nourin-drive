# ◈ RetroDesk Portfolio

A personal portfolio styled as a **Win98 desktop OS**, built with the MERN stack + Next.js.
Every section lives inside a draggable, resizable window. The desktop boots, you double-click icons, apps open.

```
ssh nourin.is-a.dev -p 2323   ← the SSH version (Go / Bubbletea)
https://nourin.is-a.dev       ← this project (Next.js / MERN)
```

---

## Tech Stack

| Layer      | Technology                                                |
|------------|-----------------------------------------------------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS, 98.css |
| State      | Zustand (window manager store)                            |
| Data       | TanStack Query (server state), Axios                      |
| Windowing  | react-rnd (drag + resize)                                 |
| Backend    | Express.js, TypeScript                                    |
| Database   | MongoDB + Mongoose                                        |
| Dev        | tsx (hot-reload), concurrently (parallel scripts)         |

---

## Project Structure

```
retrodesk-portfolio/
├── package.json                  ← root workspace (npm workspaces)
│
├── client/                       ← Next.js frontend
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── .env.local
│   └── src/
│       ├── app/
│       │   ├── layout.tsx        ← root layout, loads fonts + globals
│       │   ├── page.tsx          ← renders Desktop + WindowLayer + Taskbar
│       │   └── globals.css       ← 98.css import, Tailwind, design tokens
│       │
│       ├── components/
│       │   ├── os/               ← OS chrome (no app logic here)
│       │   │   ├── BootScreen.tsx
│       │   │   ├── Desktop.tsx
│       │   │   ├── DesktopIcon.tsx
│       │   │   ├── WindowLayer.tsx
│       │   │   ├── WindowFrame.tsx   ← react-rnd + 98.css title bar
│       │   │   ├── AppRouter.tsx     ← maps appId → component
│       │   │   ├── Taskbar.tsx
│       │   │   └── ContextMenu.tsx
│       │   │
│       │   └── apps/             ← one folder per app
│       │       ├── APIStudio/    📡 Postman-style portfolio viewer
│       │       ├── Browser/      🌐 iframe browser with URL bar + bookmarks
│       │       ├── Explorer/     📁 virtual FS of projects (categories as folders)
│       │       ├── Gallery/      🎨 graphic design grid + lightbox
│       │       ├── Guestbook/    📝 live MongoDB-backed sign-the-guestbook
│       │       ├── Blog/         📰 Markdown blog posts from MongoDB
│       │       ├── RecycleBin/   🗑️  fake deleted files (flavour)
│       │       ├── AboutMe/      👤 rich about page
│       │       ├── GameLauncher/ 🎮 itch.io game cards → opens in Browser
│       │       ├── Spotify/      🎵 simulated music player
│       │       ├── EasterEgg/    🥚 konami-code hidden message
│       │       └── Notepad/      🗒️  editable text pad (opens with payload)
│       │
│       ├── context/
│       │   ├── windowStore.ts    ← Zustand: all open windows, focus, z-index
│       │   └── QueryProvider.tsx ← TanStack Query client wrapper
│       │
│       ├── data/
│       │   ├── appRegistry.ts    ← window dimensions / title / emoji per app
│       │   ├── desktopIcons.ts   ← which icons appear on the desktop
│       │   └── projects.ts       ← all portfolio projects (static seed)
│       │
│       ├── hooks/
│       │   └── useDraggable.ts   ← custom drag for non-window elements
│       │
│       ├── lib/
│       │   └── api.ts            ← axios instance + guestbook/blog helpers
│       │
│       └── types/
│           ├── window.ts         ← AppId, WindowInstance, DesktopIcon, ContextMenu
│           └── apps.ts           ← Project, BlogPost, GuestbookEntry, Game, etc.
│
└── server/                       ← Express backend
    ├── package.json
    ├── tsconfig.json
    ├── .env
    └── src/
        ├── index.ts              ← app setup: cors, helmet, morgan, rate-limit, routes
        ├── config/
        │   └── db.ts             ← mongoose.connect()
        ├── models/
        │   ├── GuestbookEntry.ts ← name, message, emoji, createdAt
        │   └── BlogPost.ts       ← title, slug, excerpt, content (md), tags
        ├── routes/
        │   ├── guestbook.ts      ← GET / POST / DELETE /api/guestbook
        │   └── blog.ts           ← GET / POST / DELETE /api/blog
        ├── controllers/
        │   ├── guestbookController.ts
        │   └── blogController.ts
        └── middleware/
            ├── errorHandler.ts   ← centralised error formatting
            └── notFound.ts       ← 404 fallback
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1 — Install

```bash
git clone https://github.com/yourusername/retrodesk-portfolio
cd retrodesk-portfolio
npm install:all        # installs root + client + server deps
```

### 2 — Environment

**`client/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**`server/.env`**
```
MONGO_URI=mongodb://localhost:27017/retrodesk
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3 — Run

```bash
npm run dev            # starts both client :3000 and server :5000
```

Or individually:
```bash
npm run dev:client     # Next.js → http://localhost:3000
npm run dev:server     # Express  → http://localhost:5000
```

---

## Adding a New App

### 1. Register it in `appRegistry.ts`

```ts
"my-app": {
  appId: "my-app", title: "My App", emoji: "🛸",
  defaultWidth: 600, defaultHeight: 450,
  defaultX: 100, defaultY: 80,
  singleton: true,
},
```

### 2. Add to `AppId` union in `types/window.ts`

```ts
export type AppId = ... | "my-app";
```

### 3. Create the component

```
src/components/apps/MyApp/MyApp.tsx
```

```tsx
export function MyApp({ windowId }: { windowId: string }) {
  return <div className="h-full bg-white p-4">Hello!</div>;
}
```

### 4. Register in `AppRouter.tsx`

```tsx
case "my-app": return <MyApp windowId={win.id} />;
```

### 5. Add a desktop icon (optional)

```ts
// desktopIcons.ts
{ id: "di-11", appId: "my-app", label: "My App", emoji: "🛸" },
```

That's it — the window manager handles everything else automatically.

---

## API Reference

### Guestbook

| Method | Endpoint                | Description             |
|--------|-------------------------|-------------------------|
| GET    | `/api/guestbook`        | List all entries        |
| POST   | `/api/guestbook`        | Create entry            |
| DELETE | `/api/guestbook/:id`    | Delete entry            |

**POST body:**
```json
{ "name": "Alex", "message": "Love the design!", "emoji": "✨" }
```

### Blog

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | `/api/blog`        | List posts (no content field)      |
| GET    | `/api/blog/:slug`  | Full post with Markdown content    |
| POST   | `/api/blog`        | Create post                        |
| DELETE | `/api/blog/:slug`  | Delete post                        |

**POST body:**
```json
{
  "title":   "My First Post",
  "excerpt": "A short summary...",
  "content": "# My First Post\n\nFull markdown here...",
  "tags":    ["Dev", "Portfolio"]
}
```

---

## Easter Egg

Type the **Konami code** anywhere on the desktop:

```
↑ ↑ ↓ ↓ ← → ← → B A
```

The `EasterEgg` window opens with a hidden message.
The hook (`useKonamiCode`) lives in `EasterEgg.tsx` — wire it into `Desktop.tsx` to activate it globally.

---

## Design Notes

### The 98.css + Tailwind Approach

98.css handles all the authentic Win98 chrome (title bars, buttons, inputs, menus) via class names.
Tailwind handles layout, spacing, and app-specific UI that shouldn't look retro (Spotify, Gallery).
The two coexist because Tailwind's preflight reset is disabled in `tailwind.config.ts`.

### Window Management

Every window is a `WindowInstance` in Zustand. `react-rnd` handles drag/resize and reports back via `onDragStop` / `onResizeStop` — those updates flow into the store via `updateWin()`. Focus and z-index are fully managed in `windowStore.ts`.

### Adding Real Auth (future)

For the blog admin and guestbook delete routes, add a simple JWT middleware:
```ts
// middleware/auth.ts
export const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
};
```
Then wrap the relevant routes: `blogRouter.delete("/:slug", requireAdmin, deletePost)`.

---

## Deployment

| Part   | Recommended Platform |
|--------|----------------------|
| Client | Vercel (zero-config for Next.js) |
| Server | Railway / Render / Fly.io        |
| DB     | MongoDB Atlas (free tier)        |

Set `NEXT_PUBLIC_API_URL` in Vercel to your deployed server URL.
Set `CLIENT_URL` on your server to your Vercel URL.

---

[github.com/nourinawadd](https://github.com/nourinawadd) ✦ [linkedin.com/in/nourinawad](https://linkedin.com/in/nourinawad)

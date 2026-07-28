# NOURIN:

a personal computer.

a personal portfolio built as a fake operating system: an **amiga workbench 3.31**
desktop you can actually use. it boots, you double-click icons, windows open, drag,
resize, and stack. every section of the portfolio is an "app" living inside its own
window.

the name is an amiga volume. the desktop mounts `User:`, `Projects:`, `Games:`,
`Music:`, `Library:` and `Trash:`, and the site itself is one more drive in that
set: everything-nourin, mounted.

```
https://nourin.is-a.dev       ← this project (next.js / mern)
ssh nourin.is-a.dev           ← the terminal version (go / bubble tea / wish)
```

## ✦ about

- a portfolio that behaves like a desktop os: boot screen, dock, top menubar,
  draggable + resizable windows, focus / z-order, minimise + restore
- content is data, not markup — drop a markdown file or a media asset and the site
  regenerates itself
- built on the mern stack with next.js on the front and express + mongo on the back

## ✦ stack

next.js 16 · typescript · react · zustand · react-rnd · tailwind · tanstack query ·
axios · express · mongodb (mongoose) · react-markdown · @react-pdf/renderer ·
music-metadata · prismjs

- **frontend** — next.js app router, zustand window manager, react-rnd for drag/resize
- **backend** — express api with mongoose models for the guestbook + blog
- **workspace** — npm workspaces (`client` + `server`), run together with concurrently

## ✦ apps

the windows on the desktop:

- **browser** — tabbed iframe browser with an address bar + bookmarks; opening a site
  adds a tab instead of a new window
- **file explorer** — projects as folders (websites, apis, games) you double-click to open
- **api studio** — postman-style viewer for the api projects
- **graphic design** — image gallery with a lightbox
- **games** — playable web builds (unity / godot) launched in-window
- **blog** — markdown posts served from mongo
- **guestbook** — sign it; entries persist in mongo
- **music player** — plays tracks from `public/music`, reads embedded artist/title tags
- **user profile** — a nourin-net style profile with pdf export
- **notepad · recycle bin · about · easter egg** — desktop fixtures (the egg is a konami code)

## ✦ content

nothing is hand-edited into the app — it's generated:

- projects → drop a `.md` in `client/content/projects` (or `npm run add`)
- cv / about → markdown in `client/content/cv`
- media → drop files into `client/public/{music,gallery,games}`
- `npm run gen` (runs automatically before dev/build) rebuilds the generated data via
  `gen-tracks` · `gen-gallery` · `gen-projects` · `gen-games`

## ✦ running it

prerequisites: node ≥ 18, mongodb (local or atlas)

```bash
npm install            # root + client + server (npm workspaces)
npm run dev            # client :3000 + server :5000, via concurrently
```

env:

```
# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000

# server/.env
MONGO_URI=mongodb://localhost:27017/nourin
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## ✦ contact

[github](https://github.com/nourinawadd) ✦ [linkedin](https://linkedin.com/in/nourinawad) ✦ [nourin.is-a.dev](http://nourin.is-a.dev)

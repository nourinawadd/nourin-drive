# NOURIN:

a personal computer.

my corner of the internet, built as a fake operating system. it's an **amiga
workbench 3.31** desktop you can actually use: it boots, you double-click icons,
windows open, drag, resize and stack. everything i make ends up in here somewhere.

the name is an amiga volume. the desktop mounts `User:`, `Projects:`, `Games:`,
`Music:`, `Library:` and `Trash:`, and the site is one more drive in that set.
everything-nourin, mounted.

```
https://nourin.is-a.dev        the desktop (next.js / mern)
https://blog.nourin.is-a.dev   the blog (static html, built from markdown)
ssh nourin.is-a.dev            the terminal version (go / bubble tea / wish)
```

## ✦ about

less a portfolio, more a dumping ground: projects, apis, games, photos, the music
i like, books and poems, a blog, a guestbook. if it's mine it goes in a window.

nothing is hand-edited into the app. drop a markdown file or a media asset in the
right folder and the site regenerates itself.

## ✦ stack

next.js 16 · typescript · react · zustand · react-rnd · tailwind · tanstack query ·
axios · express · mongodb (mongoose) · react-markdown · @react-pdf/renderer ·
music-metadata · prismjs · marked

- **frontend**: next.js app router, zustand window manager, react-rnd for drag and resize
- **backend**: express api with mongoose, for the guestbook and blog comments
- **blog**: a plain node script that turns markdown into static html, deployed on its own
- **workspace**: npm workspaces (`client`, `server`, `blog`), run together with concurrently

## ✦ apps

the windows on the desktop:

- **browser**: tabbed iframe browser with an address bar and bookmarks
- **file explorer**: everything as folders you double-click to open
- **api studio**: postman-style viewer for the api projects
- **graphic design**: image gallery with a lightbox
- **games**: playable unity / godot builds, launched in-window
- **blog**: opens blog.nourin.is-a.dev, which also works on its own
- **guestbook**: sign it, entries persist in mongo
- **music player**: plays tracks from `public/music`, reads the embedded tags
- **user profile**: a nourin-net style profile with pdf export
- **ereader**: poems, writing and open-licence books in a pdf.js viewer
- **recycle bin · about · easter egg**: desktop fixtures (the egg is a konami code)

## ✦ content

- projects: drop a `.md` in `client/content/projects` (or `npm run add`)
- cv / about: markdown in `client/content/cv`
- blog posts: copy `blog/content/_template.md` into `blog/content/posts`
- media: drop files into `client/public/{music,gallery,games}`

`npm run gen` runs before dev and build, and rebuilds the generated data. longer
notes live in `docs/`.

## ✦ running it

you need node ≥ 18 and mongodb (local or atlas).

```bash
npm install     # root, client, server, blog
npm run dev     # client :3000, server :5000, blog :4000
```

env:

```
# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BLOG_URL=http://localhost:4000

# server/.env
MONGO_URI=mongodb://localhost:27017/nourin
PORT=5000
CLIENT_URL=http://localhost:3000
BLOG_URL=http://localhost:4000
NODE_ENV=development
```

## ✦ contact

[github](https://github.com/nourinawadd) ✦ [linkedin](https://linkedin.com/in/nourinawad) ✦ [nourin.is-a.dev](https://nourin.is-a.dev)

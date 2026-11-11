# NOURIN-DRIVE:

a personal computer. my corner of the internet, built as an **amiga workbench
3.31** desktop.

```
https://nourin.is-a.dev        the desktop (next.js / mern)
https://blog.nourin.is-a.dev   the blog (static html, built from markdown)
ssh nourin.is-a.dev -p 2323    the terminal version (go / bubble tea / wish)
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/media/boot-dark.gif">
  <img src="docs/media/boot.gif" width="100%" alt="the kickstart screen asks for the workbench disk. the pointer clicks the disk, the desktop boots and the about window opens">
</picture>

## ✦ the desktop

it works like a normal desktop. you can open apps, drag windows around, resize
them and minimise them to icons. each drive is a window full of something:
projects, photos, music, books.

<img src="docs/media/desktop-tour.gif" width="100%" alt="the pointer opens the projects drive, shrinks the window and drags it aside, opens user, moves it, then minimises it to an icon on the desktop">

## ✦ palettes

prefs has six colour palettes. this is the same desktop in each one.

<img src="docs/media/palettes.png" width="100%" alt="the same desktop six times, in workbench grey, amber crt, green phosphor, paper white, midnight and hot pink">

## ✦ screensavers and the pet

leave it alone for a minute and a half and a screensaver comes on, the boing
ball or a starfield. prefs can also give you a desktop pet: a cat, a duck or a
crab. this one is the cat, climbing onto a window.

<img src="docs/media/boing.gif" width="270" alt="the boing ball screensaver, a red and white checkered ball bouncing over a purple grid"> <img src="docs/media/starfield.gif" width="270" alt="the starfield screensaver, coloured streaks flying out from the centre on black"> <img src="docs/media/pet.gif" width="270" alt="a small orange pixel cat walks in along the bottom of the screen, climbs the side of a window and sits on its title bar">

## ✦ apps

<table>
  <tr>
    <td><img src="docs/media/apps/profile.png" width="400" alt="the user profile window, a black and white portrait next to name, location and stats"><br><b>user profile</b>: a nourin-net style profile with pdf export</td>
    <td><img src="docs/media/apps/explorer.png" width="400" alt="the file explorer, a folder tree on the left and shortcut icons on the right"><br><b>file explorer</b>: everything as folders you double-click to open</td>
  </tr>
  <tr>
    <td><img src="docs/media/apps/ereader.png" width="400" alt="the ereader library, poems and books as cards with read buttons"><br><b>ereader</b>: poems, writing and open-licence books in a pdf.js viewer</td>
    <td><img src="docs/media/apps/music.png" width="400" alt="the music player, a grid of album covers above the playback bar"><br><b>music player</b>: plays tracks from <code>public/music</code>, reads the embedded tags</td>
  </tr>
  <tr>
    <td><img src="docs/media/apps/gallery.png" width="400" alt="the graphic design gallery, a grid of posters and photos"><br><b>graphic design</b>: image gallery with a lightbox</td>
    <td><img src="docs/media/apps/games.png" width="400" alt="the games window, four game cards with cover art"><br><b>games</b>: playable unity / godot builds, launched in-window</td>
  </tr>
  <tr>
    <td><img src="docs/media/apps/shell.png" width="400" alt="the shell, listing the drive's folders and then the shortcuts inside websites"><br><b>shell</b>: a command line for the desktop, browse the drive, launch apps, or ssh into the real machine</td>
    <td><img src="docs/media/apps/api-studio.png" width="400" alt="api studio, a list of saved requests on the left and an empty request form"><br><b>api studio</b>: postman-style viewer for the api projects</td>
  </tr>
  <tr>
    <td><img src="docs/media/apps/guestbook.png" width="400" alt="the guestbook, a sign form above a list of entries"><br><b>guestbook</b>: sign it, entries persist in mongo</td>
    <td><img src="docs/media/apps/blog.png" width="400" alt="the blog window showing the blog's front page"><br><b>blog</b>: opens blog.nourin.is-a.dev, which also works on its own</td>
  </tr>
</table>

also on the desktop:

- **browser**: tabbed iframe browser with an address bar and bookmarks
- **prefs**: repaint the desktop, palette, backdrop pattern, screensaver and a desktop pet
- **sticky notes**: scratch paper that never leaves the browser
- **recycle bin · about · easter egg**: desktop fixtures

## ✦ on a phone

on a phone it opens a phone shell instead, most of the same apps one at a
time, full screen, with back. how that works is in
[`docs/mobile-guide.md`](docs/mobile-guide.md).

<img src="docs/media/phone.gif" width="200" alt="on a phone: tap the disk, the launcher comes up, tap music, the player opens full screen, tap back"> <img src="docs/media/phone-home.png" width="200" alt="the phone launcher, the drives as a grid of big icons"> <img src="docs/media/phone-app.png" width="200" alt="the user profile open full screen on a phone"> <img src="docs/media/phone-music.png" width="200" alt="the phone launcher with a track loaded in the now-playing bar at the bottom">

## ✦ terminal version

there's also a version for the terminal, written in go with bubble tea and
wish.

```
ssh nourin.is-a.dev -p 2323
```

<img src="https://github.com/nourinawadd/ssh-portfolio/raw/main/assets/demo.gif" width="100%" alt="the terminal version in a terminal window, switching between the about, side projects, projects and skills tabs">

## ✦ easter egg

there's a konami code in here somewhere. i'm not showing what it does.

<img src="docs/media/signal.gif" width="100%" alt="the desktop sits still for a moment, then fades to black">

## ✦ about

less a portfolio, more a dumping ground: projects, apis, games, photos, the music
i like, books and poems, a blog, a guestbook. if it's mine it goes in a window.
everything i make ends up in here somewhere.

the name is an amiga volume. the desktop mounts `User:`, `Projects:`, `Games:`,
`Music:`, `Library:` and `Trash:`, and the site is one more drive in that set.
everything-nourin, mounted.

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

## ✦ content

- projects: drop a `.md` in `client/content/projects` (or `npm run add`)
- cv / about: markdown in `client/content/cv`
- blog posts: copy `blog/content/_template.md` into `blog/content/posts`
- media: drop files into `client/public/{music,gallery,games}`

`npm run gen` runs before dev and build, and rebuilds the generated data. longer
notes live in `docs/`. the screenshots and gifs in here are made by a script,
`npm run media`. how that works is in [`docs/readme-media.md`](docs/readme-media.md).

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

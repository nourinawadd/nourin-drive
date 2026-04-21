/**
 * seed.ts
 * Populates the database with sample blog posts and guestbook entries.
 *
 * Run with:
 *   npx tsx src/scripts/seed.ts
 *
 * (from the /server directory)
 */

import "dotenv/config";
import mongoose from "mongoose";
import { BlogPost }       from "../models/BlogPost.js";
import { GuestbookEntry } from "../models/GuestbookEntry.js";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/retrodesk";

// ── Sample blog posts ─────────────────────────────────────────────
const BLOG_POSTS = [
  {
    title:   "Building an SSH Portfolio with Go and Bubbletea",
    slug:    "ssh-portfolio-go-bubbletea",
    excerpt: "How I built a terminal-based portfolio accessible via SSH using the Charm ecosystem.",
    content: `# Building an SSH Portfolio with Go and Bubbletea

After seeing a few terminal UIs that genuinely impressed me, I decided to build my portfolio as an SSH-accessible TUI. The idea: \`ssh nourin.is-a.dev -p 2323\` lands you in a fully navigable interface.

## The Stack

The entire thing is built with three Charm libraries:

- **Bubbletea** — the Elm-architecture TUI framework
- **Lipgloss** — terminal styling (colours, borders, layout)  
- **Wish** — SSH server middleware that wraps Bubbletea programs

## Architecture

The model is a single Go struct holding all state: active tab, cursor position, scroll offset, frame counter for animations, and whether a detail panel is open.

\`\`\`go
type Model struct {
  width        int
  height       int
  activeTab    int
  cursor       int
  frame        int
  detailOpen   bool
  scrollOffset int
}
\`\`\`

## The Animated Spiral

The most eye-catching part is the animated particle spiral on the left sidebar. Each frame tick, concentric rings of dots rotate at different speeds. The rendering is pure math — polar coordinates to Cartesian, clamped to the grid.

## Lessons Learned

1. Terminal widths are unpredictable — always render a "too small" fallback
2. Bubbletea's \`tea.Tick\` is your animation primitive — 80ms feels smooth
3. OSC-8 hyperlinks work in iTerm2, WezTerm, and Kitty but not the default macOS terminal

The full source is on GitHub.`,
    tags: ["Go", "TUI", "Bubbletea", "SSH", "Charm"],
  },
  {
    title:   "Why I Built My Portfolio as a Fake OS",
    slug:    "retrodesk-portfolio-design",
    excerpt: "Design decisions behind RetroDesk — a Win98-style desktop portfolio built with Next.js and 98.css.",
    content: `# Why I Built My Portfolio as a Fake OS

Most portfolios look the same. A hero section, an about section, a projects grid. I wanted something that felt like an experience rather than a brochure.

## The Concept

The pitch is simple: what if your portfolio opened like you're turning on an old PC? Boot screen, desktop icons, draggable windows, a taskbar with a clock.

Every section of a traditional portfolio maps to an OS concept:

| Traditional portfolio | RetroDesk equivalent |
|----------------------|----------------------|
| About page           | About Me window      |
| Projects grid        | File Explorer        |
| API demo             | API Studio (Postman) |
| Design work          | Gallery app          |
| Blog                 | Blog reader          |
| Contact form         | Guestbook            |

## The Tech

- **98.css** for authentic Win98 chrome — just class names, no effort
- **react-rnd** for drag and resize — solved in one package
- **Zustand** for window state — every open window is just an array entry
- **Tailwind** for everything inside windows — the *content* doesn't need to look retro

## The Key Insight

98.css and Tailwind don't conflict because I disabled Tailwind's preflight. 98.css styles the *chrome* (title bars, buttons, borders). Tailwind styles the *content* (Spotify player, gallery grid, etc). They live in separate layers.

## What Surprised Me

The easter egg gets the most reactions. People who find it (Konami code: ↑↑↓↓←→←→BA) send screenshots.`,
    tags: ["Next.js", "React", "Design", "98.css", "Portfolio"],
  },
  {
    title:   "MEAN Stack Internship: What I Actually Learned",
    slug:    "mean-stack-internship-learnings",
    excerpt: "Real takeaways from my MEAN stack internship at NTI — beyond the listed technologies.",
    content: `# MEAN Stack Internship: What I Actually Learned

I just wrapped my MEAN stack internship at NTI in Mansoura. The official syllabus was Express APIs, Angular SPAs, MongoDB schemas, JWT auth. Here's what I actually came away with.

## 1. Schema design matters more than you think

It's tempting to denormalise everything in MongoDB ("it's NoSQL, refs are fine"). But when your subscription tracker has 3 collections and you need to show a dashboard that aggregates across all three, suddenly you're writing multi-stage aggregation pipelines.

Design your schema around your queries, not your objects.

## 2. Angular's reactivity model is a feature, not a quirk

I came in thinking Angular was "the Java of frontend frameworks" — verbose, enterprise-y, over-engineered. Two weeks in I was converted. Change detection zones mean you never wonder why your UI didn't update. Reactive forms make validation logic composable.

## 3. JWT is not a session

Sessions live on the server. JWTs live on the client. This sounds obvious but the implications took me a while to fully absorb. You can't invalidate a JWT without a blocklist (which partly defeats the purpose). Design your token expiry accordingly.

## 4. Postman is a first-class development tool

I'd used it before as a "let me test this endpoint" afterthought. By the end of the internship I was writing full collections with environment variables, pre-request scripts, and test assertions. Treat your API collection like documentation.

## What's Next

Currently applying everything to my own projects. The subscriptions tracker API is live on GitHub if you want to look at the schema design choices.`,
    tags: ["MEAN", "MongoDB", "Angular", "Express", "Internship"],
  },
];

// ── Sample guestbook entries ──────────────────────────────────────
const GUESTBOOK_ENTRIES = [
  { name: "Alex",    message: "Love the Win98 aesthetic! The boot screen got me good.",     emoji: "🎉" },
  { name: "Layla",   message: "The Konami code easter egg is such a nice touch ✨",          emoji: "✨" },
  { name: "Omar",    message: "Fellow Mansoura dev here — great work on the SSH portfolio!", emoji: "👋" },
  { name: "Youssef", message: "API Studio is incredibly clean. The lifecycle animation 🔥",  emoji: "🔥" },
  { name: "Sara",    message: "The Spotify player is so smooth. Did you reinvent music?",    emoji: "🎵" },
];

// ── Seed function ─────────────────────────────────────────────────
async function seed() {
  console.log("🌱  Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected.\n");

  // Clear existing data
  await BlogPost.deleteMany({});
  await GuestbookEntry.deleteMany({});
  console.log("🗑️   Cleared existing data.\n");

  // Insert blog posts
  const posts = await BlogPost.insertMany(BLOG_POSTS);
  console.log(`📝  Inserted ${posts.length} blog posts:`);
  posts.forEach((p) => console.log(`     • ${p.title}`));

  // Insert guestbook entries
  const entries = await GuestbookEntry.insertMany(GUESTBOOK_ENTRIES);
  console.log(`\n📖  Inserted ${entries.length} guestbook entries:`);
  entries.forEach((e) => console.log(`     • ${e.name}: "${e.message.slice(0, 50)}..."`));

  console.log("\n✅  Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});

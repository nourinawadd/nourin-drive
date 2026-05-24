// Single source of truth for content shown in Explorer / Gallery / Games.
// Replace placeholder URLs with real ones as projects ship.

export type ProjectCategory =
  | "websites"
  | "apis"
  | "games"
  | "designs"
  | "photos"
  | "blog";

export type Project = {
  id: string;
  name: string;
  category: ProjectCategory;
  blurb?: string;
  url?: string;       // for websites / apis / games
  thumb?: string;     // for designs / photos (path under /public)
  date?: string;      // YYYY-MM
};

export const CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: "websites", label: "Websites" },
  { id: "apis",     label: "APIs" },
  { id: "games",    label: "Games" },
  { id: "designs",  label: "Designs" },
  { id: "photos",   label: "Photos" },
  { id: "blog",     label: "Blog" },
];

export const PROJECTS: Project[] = [
  // websites
  { id: "w1", category: "websites", name: "Portfolio (this site)", url: "https://nourin.is-a.dev", blurb: "the desktop you're looking at", date: "2026-05" },
  { id: "w2", category: "websites", name: "Project Alpha",         url: "https://example.com",     blurb: "placeholder — swap me",  date: "2025-12" },
  { id: "w3", category: "websites", name: "Project Beta",          url: "https://example.com",     blurb: "placeholder — swap me",  date: "2025-09" },

  // apis
  { id: "a1", category: "apis", name: "Guestbook API", blurb: "express + mongo, in section 6", date: "2026-05" },
  { id: "a2", category: "apis", name: "Blog API",      blurb: "express + mongo, in section 6", date: "2026-05" },

  // games (open in new tab)
  { id: "g1", category: "games", name: "Game One",  url: "https://example.com", blurb: "placeholder", date: "2025-08" },
  { id: "g2", category: "games", name: "Game Two",  url: "https://example.com", blurb: "placeholder", date: "2025-06" },

  // designs (placeholder gradients; replace thumb with /designs/x.png later)
  { id: "d1", category: "designs", name: "Poster Series",   blurb: "screenprint, 2024" },
  { id: "d2", category: "designs", name: "Album Sleeve",    blurb: "vinyl, 2024" },
  { id: "d3", category: "designs", name: "Magazine Spread", blurb: "editorial, 2023" },
  { id: "d4", category: "designs", name: "Brand Mark",      blurb: "identity, 2023" },
  { id: "d5", category: "designs", name: "Zine",            blurb: "self-published, 2022" },
  { id: "d6", category: "designs", name: "Sticker Pack",    blurb: "for fun, 2022" },

  // photos
  { id: "p1", category: "photos", name: "@diarydump.jpg", url: "https://instagram.com/diarydump.jpg", blurb: "instagram feed" },

  // blog
  { id: "b1", category: "blog", name: "First post",   blurb: "in section 6" },
  { id: "b2", category: "blog", name: "Second post",  blurb: "in section 6" },
];

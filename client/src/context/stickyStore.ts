import { create } from "zustand";

// Sticky notes that live loose on the desktop. State is in-memory only (no
// persistence middleware), so every note - the seeded ones and any the user
// adds - is wiped on refresh. That's intentional: notes are a scratch surface.

export type StickyNote = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;   // paper tint
  rotate: number;  // slight tilt for the "stuck on" look
};

// Paper tints - soft enough to read as sticky notes, still framed by the hard
// black border + pixel shadow that keeps them on-theme.
const COLORS = ["#ffe27a", "#9ad3c8", "#f6a96b", "#c7a6f0"];

let nextId = 1;
const mkId = () => `note-${nextId++}`;

// Notes live in a band down the RIGHT of the desktop, just inside the column
// of minimised-window icons that hugs the edge. x depends on viewport width, so
// the seeds use a fallback and DesktopStickies re-snaps them on mount.
const STICKY_W = 156;
const MINICON_BAND = 100;   // 76px minicon cell + 16px margin + 8px gap
const RIGHT_MARGIN = 16;
const FALLBACK_W = 1280;

// How far each seeded note sits from the band's left edge. Not a formula: the
// scatter is hand-placed so the three read as dropped there rather than filed.
const SEED_DX = [0, -80, 58];

function bandX(viewportW: number, i: number): number {
  const right = viewportW - RIGHT_MARGIN - MINICON_BAND - STICKY_W;
  const dx = SEED_DX[i] ?? -(i % 3) * 18;
  return Math.max(RIGHT_MARGIN, Math.min(right + dx, viewportW - RIGHT_MARGIN - STICKY_W));
}

// Seeded notes replace the old desktop "clippings".
const SEED: StickyNote[] = [
  { id: mkId(), text: "HW: ch.7 problems 1, 4 and 9-12", x: bandX(FALLBACK_W, 0), y: 100, color: COLORS[0], rotate: -5 },
  { id: mkId(), text: "remind huda of the presentation tomorrow!!", x: bandX(FALLBACK_W, 1), y: 240, color: COLORS[1], rotate: -2 },
  { id: mkId(), text: "IMP: print the lab report", x: bandX(FALLBACK_W, 2), y: 412, color: COLORS[2], rotate: -3 },
];

type State = { notes: StickyNote[] };
type Actions = {
  add: () => string;
  reflow: (viewportW: number) => void;
  update: (id: string, text: string) => void;
  move: (id: string, x: number, y: number) => void;
  remove: (id: string) => void;
};

export const useStickyStore = create<State & Actions>((set, get) => ({
  notes: SEED,

  // Drop a fresh blank note into the right-hand band, cascaded so repeated
  // adds don't land exactly on top of each other.
  add: () => {
    const i = get().notes.length;
    const w = typeof window === "undefined" ? FALLBACK_W : window.innerWidth;
    const note: StickyNote = {
      id: mkId(),
      text: "",
      x: bandX(w, i),
      y: 96 + (i % 4) * 26,
      color: COLORS[i % COLORS.length],
      rotate: (i % 2 ? 1 : -1) * (2 + (i % 3)),
    };
    set((s) => ({ notes: [...s.notes, note] }));
    return note.id;
  },

  update: (id, text) =>
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, text } : n)) })),

  move: (id, x, y) =>
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, x, y } : n)) })),

  remove: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

  // Snap every note back into the right-hand band, for the real viewport width.
  reflow: (viewportW) =>
    set((s) => ({
      notes: s.notes.map((n, i) => ({ ...n, x: bandX(viewportW, i) })),
    })),
}));

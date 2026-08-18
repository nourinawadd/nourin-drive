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

function bandX(viewportW: number, i: number): number {
  const right = viewportW - RIGHT_MARGIN - MINICON_BAND - STICKY_W;
  return Math.max(RIGHT_MARGIN, right - (i % 3) * 18);
}

// Seeded notes replace the old desktop "clippings".
const SEED: StickyNote[] = [
  { id: mkId(), text: "ch.7 problems 1, 4 and 9-12", x: bandX(FALLBACK_W, 0), y: 96, color: COLORS[0], rotate: -5 },
  { id: mkId(), text: "office hours thu 2pm, ask about the extension", x: bandX(FALLBACK_W, 1), y: 250, color: COLORS[1], rotate: 4 },
  { id: mkId(), text: "print the lab report tonight", x: bandX(FALLBACK_W, 2), y: 404, color: COLORS[2], rotate: -3 },
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

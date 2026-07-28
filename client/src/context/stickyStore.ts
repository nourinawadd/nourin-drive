import { create } from "zustand";

// Sticky notes that live loose on the desktop. State is in-memory only (no
// persistence middleware), so every note — the seeded ones and any the user
// adds — is wiped on refresh. That's intentional: notes are a scratch surface.

export type StickyNote = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;   // paper tint
  rotate: number;  // slight tilt for the "stuck on" look
};

// Paper tints — soft enough to read as sticky notes, still framed by the hard
// black border + pixel shadow that keeps them on-theme.
const COLORS = ["#ffe27a", "#9ad3c8", "#f6a96b", "#c7a6f0"];

let nextId = 1;
const mkId = () => `note-${nextId++}`;

// Seeded notes replace the old desktop "clippings", roughly where they sat.
const SEED: StickyNote[] = [
  { id: mkId(), text: "Drag me around ✎", x: 60, y: 96, color: COLORS[0], rotate: -5 },
  { id: mkId(), text: "Double-click Notes:\nto add your own", x: 232, y: 250, color: COLORS[1], rotate: 4 },
  { id: mkId(), text: "Heads up! I vanish\non refresh.", x: 120, y: 392, color: COLORS[2], rotate: -3 },
];

type State = { notes: StickyNote[] };
type Actions = {
  add: () => string;
  update: (id: string, text: string) => void;
  move: (id: string, x: number, y: number) => void;
  remove: (id: string) => void;
};

export const useStickyStore = create<State & Actions>((set, get) => ({
  notes: SEED,

  // Drop a fresh blank note near the top-left, cascaded so repeated adds don't
  // land exactly on top of each other.
  add: () => {
    const i = get().notes.length;
    const note: StickyNote = {
      id: mkId(),
      text: "",
      x: 80 + (i % 6) * 26,
      y: 110 + (i % 6) * 26,
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
}));

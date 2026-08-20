export type Saver = {
  id: string;
  label: string;
  blurb: string;
};

export const SAVERS: Saver[] = [
  {
    id: "boing",
    label: "Boing Ball",
    blurb: "The demo that sold the Amiga. Checkered ball, purple grid, one very long bounce.",
  },
  {
    id: "stars",
    label: "Starfield",
    blurb: "Warp speed out from the centre. Takes its colours from the palette.",
  },
  {
    id: "off",
    label: "Off",
    blurb: "No screensaver. The desktop stays put however long you leave it.",
  },
];

export type IdleChoice = { seconds: number; label: string };

export const IDLE_CHOICES: IdleChoice[] = [
  { seconds: 30, label: "30 sec" },
  { seconds: 60, label: "1 min" },
  { seconds: 90, label: "90 sec" },
  { seconds: 180, label: "3 min" },
  { seconds: 300, label: "5 min" },
];

export const SAVER_OFF = "off";
export const DEFAULT_SAVER = SAVERS[0].id;
export const DEFAULT_IDLE = 90;

export function findSaver(id: string): Saver | undefined {
  return SAVERS.find((s) => s.id === id);
}

export function findIdle(seconds: number): IdleChoice | undefined {
  return IDLE_CHOICES.find((c) => c.seconds === seconds);
}

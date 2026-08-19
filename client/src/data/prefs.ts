export const PALETTE_TOKENS = [
  "--wb-blue",
  "--wb-blue-2",
  "--wb-blue-3",
  "--wb-steel",
  "--wb-gray-0",
  "--wb-gray",
  "--wb-gray-2",
  "--wb-gray-3",
  "--wb-white",
  "--wb-black",
  "--wb-orange",
  "--wb-orange-d",
  "--wb-red",
  "--wb-red-d",
  "--wb-teal",
  "--wb-teal-d",
  "--wb-tan",
  "--wb-tan-d",
  "--wb-purple",
  "--wb-purple-d",
  "--wb-yellow",
  "--wb-link",
] as const;

export type PaletteToken = (typeof PALETTE_TOKENS)[number];

export type Palette = {
  id: string;
  label: string;
  blurb: string;
  swatch: [string, string, string, string, string];
  tokens: Partial<Record<PaletteToken, string>>;
};

export const PALETTES: Palette[] = [
  {
    id: "workbench",
    label: "Workbench Grey",
    blurb: "The factory setting. Grey chassis, orange selection, blue desk.",
    swatch: ["#0055aa", "#aaaaaa", "#ffffff", "#ff8800", "#000000"],
    tokens: {},
  },
  {
    id: "amber",
    label: "Amber CRT",
    blurb: "A monochrome terminal that ran warm and never quite cooled down.",
    swatch: ["#2a1a06", "#c4a878", "#fff4e0", "#ffaa22", "#1a1206"],
    tokens: {
      "--wb-blue": "#2a1a06",
      "--wb-blue-2": "#1a1004",
      "--wb-blue-3": "#3a2408",
      "--wb-steel": "#7a5520",
      "--wb-gray-0": "#e0cba8",
      "--wb-gray": "#c4a878",
      "--wb-gray-2": "#9a8055",
      "--wb-gray-3": "#5d4a2c",
      "--wb-white": "#fff4e0",
      "--wb-black": "#1a1206",
      "--wb-orange": "#ffaa22",
      "--wb-orange-d": "#c47708",
      "--wb-red": "#cc5522",
      "--wb-red-d": "#883311",
      "--wb-teal": "#aa8833",
      "--wb-teal-d": "#776622",
      "--wb-tan": "#d8b878",
      "--wb-tan-d": "#9c8048",
      "--wb-purple": "#a08040",
      "--wb-purple-d": "#6d5528",
      "--wb-yellow": "#ffdd88",
      "--wb-link": "#a06a10",
    },
  },
  {
    id: "phosphor",
    label: "Green Phosphor",
    blurb: "Every pixel the same shade of green, the way the first ones were.",
    swatch: ["#04180c", "#8cbc98", "#e8ffe8", "#55ee77", "#04120a"],
    tokens: {
      "--wb-blue": "#04180c",
      "--wb-blue-2": "#020f07",
      "--wb-blue-3": "#082414",
      "--wb-steel": "#2a6640",
      "--wb-gray-0": "#b8dcc0",
      "--wb-gray": "#8cbc98",
      "--wb-gray-2": "#5f8a6c",
      "--wb-gray-3": "#33513c",
      "--wb-white": "#e8ffe8",
      "--wb-black": "#04120a",
      "--wb-orange": "#55ee77",
      "--wb-orange-d": "#2f9a4c",
      "--wb-red": "#66cc55",
      "--wb-red-d": "#3d8833",
      "--wb-teal": "#33cc88",
      "--wb-teal-d": "#1f8a5a",
      "--wb-tan": "#9cc4a0",
      "--wb-tan-d": "#688a6c",
      "--wb-purple": "#77bb99",
      "--wb-purple-d": "#4a7c66",
      "--wb-yellow": "#aaff99",
      "--wb-link": "#1f7a44",
    },
  },
  {
    id: "paper",
    label: "Paper White",
    blurb: "Lights on. For anyone who reads better with more of it.",
    swatch: ["#d8d4c8", "#ebe8e0", "#ffffff", "#ff8800", "#17170f"],
    tokens: {
      "--wb-blue": "#d8d4c8",
      "--wb-blue-2": "#c8c4b8",
      "--wb-blue-3": "#e4e0d4",
      "--wb-steel": "#8a8578",
      "--wb-gray-0": "#ffffff",
      "--wb-gray": "#ebe8e0",
      "--wb-gray-2": "#b8b4a8",
      "--wb-gray-3": "#6c6858",
      "--wb-white": "#ffffff",
      "--wb-black": "#17170f",
      "--wb-link": "#1a4fa0",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    blurb: "Cool indigo and violet, for the small hours.",
    swatch: ["#141a33", "#949ac0", "#eef0ff", "#9d7cff", "#0c0e1c"],
    tokens: {
      "--wb-blue": "#141a33",
      "--wb-blue-2": "#0d1124",
      "--wb-blue-3": "#1e2647",
      "--wb-steel": "#47528a",
      "--wb-gray-0": "#b6bcd8",
      "--wb-gray": "#949ac0",
      "--wb-gray-2": "#6a7098",
      "--wb-gray-3": "#3c405e",
      "--wb-white": "#eef0ff",
      "--wb-black": "#0c0e1c",
      "--wb-orange": "#9d7cff",
      "--wb-orange-d": "#6a4fc4",
      "--wb-red": "#d05a8a",
      "--wb-red-d": "#8e3a5e",
      "--wb-teal": "#4fc4c4",
      "--wb-teal-d": "#2d8a8a",
      "--wb-tan": "#a9a2cc",
      "--wb-tan-d": "#726c94",
      "--wb-purple": "#b18cff",
      "--wb-purple-d": "#7355c4",
      "--wb-yellow": "#ffd98a",
      "--wb-link": "#4535a0",
    },
  },
  {
    id: "hotpink",
    label: "Hot Pink",
    blurb: "Loud on purpose. Turn the brightness down first.",
    swatch: ["#2c0a24", "#f0a8cc", "#fff0f8", "#ff3399", "#200414"],
    tokens: {
      "--wb-blue": "#2c0a24",
      "--wb-blue-2": "#1d0618",
      "--wb-blue-3": "#3d0f32",
      "--wb-steel": "#a03878",
      "--wb-gray-0": "#ffd0e8",
      "--wb-gray": "#f0a8cc",
      "--wb-gray-2": "#bd7a9e",
      "--wb-gray-3": "#7a4463",
      "--wb-white": "#fff0f8",
      "--wb-black": "#200414",
      "--wb-orange": "#ff3399",
      "--wb-orange-d": "#c2166e",
      "--wb-red": "#ff5566",
      "--wb-red-d": "#c22a44",
      "--wb-teal": "#33dddd",
      "--wb-teal-d": "#1f9a9a",
      "--wb-tan": "#ffb8a0",
      "--wb-tan-d": "#c47f68",
      "--wb-purple": "#cc66ff",
      "--wb-purple-d": "#9333c4",
      "--wb-yellow": "#ffe066",
      "--wb-link": "#a3155c",
    },
  },
];

export type Pattern = {
  id: string;
  label: string;
  blurb: string;
  rows: string[];
};

export const PATTERNS: Pattern[] = [
  {
    id: "checker",
    label: "Checker",
    blurb: "The factory backdrop. Two blues alternating every pixel.",
    rows: ["AB", "BA"],
  },
  {
    id: "flat",
    label: "Flat",
    blurb: "A quarter-strength dither. Texture you feel more than see.",
    rows: ["AB", "AA"],
  },
  {
    id: "weave",
    label: "Weave",
    blurb: "Two-by-two blocks, like coarse cloth held close to the eye.",
    rows: ["AABB", "AABB", "BBAA", "BBAA"],
  },
  {
    id: "solid",
    label: "Solid",
    blurb: "No pattern at all. One flat colour, wall to wall.",
    rows: ["A"],
  },
];

export const DEFAULT_PALETTE = PALETTES[0].id;
export const DEFAULT_PATTERN = PATTERNS[0].id;

export function findPalette(id: string): Palette | undefined {
  return PALETTES.find((p) => p.id === id);
}

export function findPattern(id: string): Pattern | undefined {
  return PATTERNS.find((p) => p.id === id);
}

type Run = { x: number; width: number; fill: string };

function rowRuns(row: string, colorA: string, colorB: string): Run[] {
  const runs: Run[] = [];
  let x = 0;
  while (x < row.length) {
    const ch = row[x];
    let width = 1;
    while (x + width < row.length && row[x + width] === ch) width++;
    runs.push({ x, width, fill: ch === "B" ? colorB : colorA });
    x += width;
  }
  return runs;
}

export function patternSvg(pattern: Pattern, colorA: string, colorB: string): string {
  const w = pattern.rows[0].length;
  const h = pattern.rows.length;
  const rects = pattern.rows
    .map((row, y) =>
      rowRuns(row, colorA, colorB)
        .map((run) => `<rect x='${run.x}' y='${y}' width='${run.width}' height='1' fill='${run.fill}'/>`)
        .join(""),
    )
    .join("");
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${rects}</svg>`;
}

export function patternImage(pattern: Pattern, colorA: string, colorB: string): string {
  const svg = patternSvg(pattern, colorA, colorB).replace(/#/g, "%23");
  return `url("data:image/svg+xml;utf8,${svg}")`;
}

export function patternSize(pattern: Pattern): string {
  return `${pattern.rows[0].length}px ${pattern.rows.length}px`;
}

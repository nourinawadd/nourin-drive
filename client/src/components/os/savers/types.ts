export type SaverColors = Record<string, string>;

export type SaverScene = {
  resize: (width: number, height: number) => void;
  frame: (dt: number) => void;
};

export type SaverFactory = (ctx: CanvasRenderingContext2D, colors: SaverColors) => SaverScene;

const FALLBACK: SaverColors = {
  "--wb-black": "#000000",
  "--wb-white": "#ffffff",
  "--wb-gray-0": "#cfcfcf",
  "--wb-gray-3": "#555555",
  "--wb-red": "#cc3333",
  "--wb-purple": "#8866cc",
  "--wb-purple-d": "#553388",
  "--wb-orange": "#ff8800",
  "--wb-teal": "#22aa77",
  "--wb-blue": "#0055aa",
};

export function readColors(): SaverColors {
  const out: SaverColors = { ...FALLBACK };
  if (typeof window === "undefined") return out;
  const style = getComputedStyle(document.documentElement);
  for (const name of Object.keys(FALLBACK)) {
    const value = style.getPropertyValue(name).trim();
    if (value) out[name] = value;
  }
  return out;
}

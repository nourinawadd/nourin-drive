import { boing } from "./boing";
import { starfield } from "./starfield";
import type { SaverFactory } from "./types";

export const SAVER_SCENES: Record<string, SaverFactory> = {
  boing,
  stars: starfield,
};

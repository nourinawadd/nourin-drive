export type Pose =
  | "enter"
  | "walk"
  | "idle"
  | "sit"
  | "nap"
  | "fall"
  | "climb"
  | "held"
  | "happy";

export const POSE_FRAMES: Record<Pose, string[]> = {
  enter: ["WALK_A", "WALK_B"],
  walk: ["WALK_A", "WALK_B"],
  idle: ["WALK_A"],
  sit: ["SIT"],
  nap: ["NAP"],
  fall: ["FALL"],
  climb: ["WALK_A", "WALK_B"],
  held: ["FALL"],
  happy: ["HAPPY"],
};

export const POSE_FPS: Record<Pose, number> = {
  enter: 7,
  walk: 7,
  idle: 0,
  sit: 0,
  nap: 0,
  fall: 0,
  climb: 9,
  held: 0,
  happy: 0,
};

export const FRAME_NAMES = ["WALK_A", "WALK_B", "SIT", "NAP", "FALL", "HAPPY"] as const;
export type FrameName = (typeof FRAME_NAMES)[number];

export const PET_GRID = 16;
export const PET_SCALE = 3;
export const SPRITE_SIZE = PET_GRID * PET_SCALE;

import { FLOOR_ID, findSurface, landingBelow, supports, type Surface } from "./surfaces";
import { POSE_FPS, POSE_FRAMES, SPRITE_SIZE, type Pose } from "./poses";

export type PetState = {
  x: number;
  y: number;
  facing: 1 | -1;
  pose: Pose;
  frame: number;
  surfaceId: string | null;
};

export type Brain = {
  step: (dt: number, surfaces: Surface[], vw: number, vh: number) => PetState;
  state: () => PetState;
  poke: () => void;
  grab: (x: number, y: number) => void;
  moveTo: (x: number, y: number) => void;
  release: () => void;
  callHome: (x: number) => void;
};

const HALF_W = SPRITE_SIZE / 2;
const WALK_SPEED = 30;
const GRAVITY = 1100;
const MAX_FALL = 900;
const EDGE_TURN = 0.82;
const HAPPY_TIME = 1.3;
const CALL_TIME = 30;
const HOP_REACH = 130;
const HOP_RISE = 10;
const HOP_CLEAR = 14;
const HOP_CHANCE = 0.012;
const HOP_COOLDOWN = 1.6;
const CLIMB_SPEED = 62;
const CLIMB_GRAB = HALF_W + 10;
const CLIMB_LEAP = 220;
const CLIMB_CHANCE = 0.02;

type Weighted = { pose: Pose; weight: number; min: number; max: number };

const RESTING: Weighted[] = [
  { pose: "walk", weight: 46, min: 3, max: 9 },
  { pose: "idle", weight: 18, min: 1, max: 3 },
  { pose: "sit", weight: 21, min: 4, max: 10 },
  { pose: "nap", weight: 15, min: 10, max: 26 },
];

type Options = {
  x: number;
  facing: 1 | -1;
  vw: number;
  vh: number;
  rng?: () => number;
};

export function makeBrain({ x: startX, facing: startFacing, vw, vh, rng = Math.random }: Options): Brain {
  let x = startX;
  let y = vh;
  let facing: 1 | -1 = startFacing;
  let pose: Pose = "enter";
  let surfaceId: string | null = FLOOR_ID;
  let leftSurface: string | null = null;
  let vy = 0;
  let timer = 0;
  let frame = 0;
  let frameAcc = 0;
  let target: number | null = startX + startFacing * vw * (0.2 + rng() * 0.3);
  let hopCool = HOP_COOLDOWN;
  let climbTo: Surface | null = null;

  function span(min: number, max: number): number {
    return min + rng() * (max - min);
  }

  function restingPose(): Weighted {
    const total = RESTING.reduce((sum, r) => sum + r.weight, 0);
    let roll = rng() * total;
    for (const r of RESTING) {
      roll -= r.weight;
      if (roll <= 0) return r;
    }
    return RESTING[0];
  }

  function setPose(next: Pose, duration?: number) {
    pose = next;
    frame = 0;
    frameAcc = 0;
    timer = duration ?? 1;
  }

  function wander() {
    const pick = restingPose();
    if (pick.pose === "walk" && rng() < 0.5) facing = facing === 1 ? -1 : 1;
    setPose(pick.pose, span(pick.min, pick.max));
  }

  function startFall() {
    leftSurface = surfaceId;
    surfaceId = null;
    vy = 0;
    setPose("fall", 0);
  }

  function hopTarget(surfaces: Surface[], from: number): Surface | null {
    let best: Surface | null = null;
    for (const s of surfaces) {
      if (!supports(s, x)) continue;
      const rise = from - s.top;
      if (rise < HOP_RISE || rise > HOP_REACH) continue;
      if (!best || s.top > best.top) best = s;
    }
    return best;
  }

  function climbTarget(surfaces: Surface[], from: number): Surface | null {
    let best: Surface | null = null;
    for (const s of surfaces) {
      if (from - s.top < HOP_RISE) continue;
      if (s.bottom < from - CLIMB_LEAP) continue;
      const edge = Math.abs(x - s.left) <= CLIMB_GRAB || Math.abs(x - s.right) <= CLIMB_GRAB;
      if (!edge) continue;
      if (!best || s.top > best.top) best = s;
    }
    return best;
  }

  function startClimb(surface: Surface) {
    climbTo = surface;
    surfaceId = null;
    leftSurface = null;
    vy = 0;
    x = Math.abs(x - surface.left) <= CLIMB_GRAB ? surface.left + HALF_W : surface.right - HALF_W;
    facing = (Math.abs(x - surface.left) < Math.abs(x - surface.right) ? 1 : -1) as 1 | -1;
    setPose("climb", 0);
  }

  function hop(rise: number) {
    leftSurface = null;
    surfaceId = null;
    vy = -Math.sqrt(2 * GRAVITY * (rise + HOP_CLEAR));
    hopCool = HOP_COOLDOWN;
    setPose("fall", 0);
  }

  function land(surface: Surface) {
    y = surface.top;
    surfaceId = surface.id;
    leftSurface = null;
    vy = 0;
    hopCool = HOP_COOLDOWN;
    wander();
  }

  function turnAt(surface: Surface, dir: 1 | -1) {
    facing = (dir === 1 ? -1 : 1) as 1 | -1;
    x = dir === 1 ? surface.right - HALF_W : surface.left + HALF_W;
  }

  function atEdge(surface: Surface, dir: 1 | -1) {
    if (surface.id === FLOOR_ID) {
      turnAt(surface, dir);
      target = null;
      return;
    }
    if (target !== null) return;
    if (rng() < EDGE_TURN) turnAt(surface, dir);
  }

  function advanceFrame(dt: number) {
    const fps = POSE_FPS[pose];
    const count = POSE_FRAMES[pose].length;
    if (fps <= 0 || count <= 1) {
      frame = 0;
      return;
    }
    frameAcc += dt;
    const stepSize = 1 / fps;
    while (frameAcc >= stepSize) {
      frameAcc -= stepSize;
      frame = (frame + 1) % count;
    }
  }

  function step(dt: number, surfaces: Surface[], viewW: number, viewH: number): PetState {
    if (pose === "held") {
      advanceFrame(dt);
      return snapshot();
    }

    if (pose !== "fall" && pose !== "climb") {
      const surface = findSurface(surfaces, surfaceId);
      const footed = surface && (pose === "enter" || supports(surface, x));
      if (footed) y = surface.top;
      else startFall();
    }

    if (pose === "climb") {
      const goal = findSurface(surfaces, climbTo ? climbTo.id : null);
      if (!goal) {
        climbTo = null;
        startFall();
      } else {
        climbTo = goal;
        y -= CLIMB_SPEED * dt;
        if (y <= goal.top) {
          y = goal.top;
          x = Math.min(Math.max(x, goal.left + HALF_W), goal.right - HALF_W);
          climbTo = null;
          land(goal);
        }
      }
    }

    if (pose === "fall") {
      vy = Math.min(vy + GRAVITY * dt, MAX_FALL);
      const from = y;
      y += vy * dt;
      const landing = vy > 0 ? landingBelow(surfaces, x, from, y, leftSurface) : null;
      if (landing) {
        land(landing);
      } else if (y >= viewH) {
        const floor = findSurface(surfaces, FLOOR_ID);
        y = viewH;
        surfaceId = FLOOR_ID;
        leftSurface = null;
        vy = 0;
        if (floor) land(floor);
        else wander();
      }
    } else if (pose === "walk" || pose === "enter") {
      x += WALK_SPEED * facing * dt;

      timer -= dt;
      if (target !== null) {
        const arrived = facing === 1 ? x >= target : x <= target;
        if (arrived || timer <= 0) {
          target = null;
          wander();
        }
      } else if (timer <= 0) {
        wander();
      }

      const surface = pose === "walk" ? findSurface(surfaces, surfaceId) : null;
      if (surface) {
        hopCool -= dt;
        if (hopCool <= 0 && rng() < HOP_CHANCE) {
          const up = hopTarget(surfaces, surface.top);
          if (up) hop(surface.top - up.top);
        }
        if (pose === "walk" && hopCool <= 0 && rng() < CLIMB_CHANCE) {
          const ledge = climbTarget(surfaces, surface.top);
          if (ledge) startClimb(ledge);
        }
        if (x + HALF_W > surface.right) atEdge(surface, 1);
        else if (x - HALF_W < surface.left) atEdge(surface, -1);
      }
    } else if (pose !== "climb") {
      timer -= dt;
      if (timer <= 0) wander();
    }

    if (pose !== "enter") {
      x = Math.min(Math.max(x, HALF_W), Math.max(HALF_W, viewW - HALF_W));
    }
    y = Math.min(Math.max(y, 0), viewH);

    advanceFrame(dt);
    return snapshot();
  }

  function snapshot(): PetState {
    return { x, y, facing, pose, frame, surfaceId };
  }

  return {
    step,
    state: snapshot,
    poke: () => {
      if (pose === "held" || pose === "fall" || pose === "climb") return;
      setPose("happy", HAPPY_TIME);
    },
    grab: (px, py) => {
      climbTo = null;
      leftSurface = null;
      surfaceId = null;
      target = null;
      x = px;
      y = py;
      setPose("held", 0);
    },
    moveTo: (px, py) => {
      if (pose !== "held") return;
      x = px;
      y = py;
    },
    release: () => {
      if (pose !== "held") return;
      startFall();
    },
    callHome: (tx) => {
      if (pose === "held" || pose === "fall" || pose === "climb") return;
      target = tx;
      facing = (tx >= x ? 1 : -1) as 1 | -1;
      setPose("walk", CALL_TIME);
    },
  };
}

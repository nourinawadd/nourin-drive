import petData from "@/data/pet-grids.json";
import { gridRects } from "@/components/os/pixelGrid";
import { PET_GRID, POSE_FRAMES, SPRITE_SIZE, type Pose } from "./poses";
import type { PetId } from "@/data/pets";

type PetGrid = { w: number; h: number; scale: number; rows: string[] };

export const PET_GRIDS = (petData as unknown as { grids: Record<string, PetGrid> }).grids;

export function gridName(pet: PetId, pose: Pose, frame: number): string {
  const names = POSE_FRAMES[pose];
  return `${pet.toUpperCase()}_${names[frame % names.length]}`;
}

export function gridFor(pet: PetId, pose: Pose, frame: number): PetGrid | undefined {
  return PET_GRIDS[gridName(pet, pose, frame)];
}

export function PetSprite({
  pet,
  pose,
  frame,
  facing,
}: {
  pet: PetId;
  pose: Pose;
  frame: number;
  facing: 1 | -1;
}) {
  const grid = gridFor(pet, pose, frame);
  if (!grid) return null;

  const rects = gridRects(grid.rows);

  return (
    <svg
      width={SPRITE_SIZE}
      height={SPRITE_SIZE}
      viewBox={`0 0 ${PET_GRID} ${PET_GRID}`}
      shapeRendering="crispEdges"
      aria-hidden
      style={{ display: "block" }}
    >
      {facing === -1 ? (
        <g transform={`translate(${PET_GRID} 0) scale(-1 1)`}>{rects}</g>
      ) : (
        rects
      )}
    </svg>
  );
}

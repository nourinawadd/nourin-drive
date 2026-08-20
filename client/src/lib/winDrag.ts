export const WIN_DRAG_EVENT = "wb:win-drag";

export type WinDragDetail = { id: string; active: boolean };

export function emitWinDrag(id: string, active: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<WinDragDetail>(WIN_DRAG_EVENT, { detail: { id, active } }));
}

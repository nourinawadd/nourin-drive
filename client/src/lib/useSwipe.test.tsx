import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSwipe } from "@/lib/useSwipe";

const onSwipe = vi.fn();

function Surface({ enabled = true }: { enabled?: boolean }) {
  const handlers = useSwipe({ enabled, onSwipe });
  return (
    <div data-testid="surface" data-attached={handlers ? "yes" : "no"} {...handlers}>
      surface
    </div>
  );
}

const surface = () => screen.getByTestId("surface");

/** A full touch drag from (200, 300) by (dx, dy). */
function drag(dx: number, dy = 0, pointerType = "touch") {
  const el = surface();
  fireEvent.pointerDown(el, { pointerType, pointerId: 1, clientX: 200, clientY: 300 });
  fireEvent.pointerUp(el, { pointerType, pointerId: 1, clientX: 200 + dx, clientY: 300 + dy });
}

describe("useSwipe", () => {
  beforeEach(() => onSwipe.mockClear());

  // Vitest runs without globals here, so Testing Library can't register its own
  // cleanup; without this each render would pile up in the same document.
  afterEach(cleanup);

  it("reports a left swipe as 1 and a right swipe as -1", () => {
    render(<Surface />);
    drag(-80);
    expect(onSwipe).toHaveBeenLastCalledWith(1);
    drag(80);
    expect(onSwipe).toHaveBeenLastCalledWith(-1);
    expect(onSwipe).toHaveBeenCalledTimes(2);
  });

  it("ignores a drag that's too short or more vertical than sideways", () => {
    render(<Surface />);
    drag(-47);
    drag(-60, 80);
    drag(-60, 60);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("ignores a mouse drag", () => {
    render(<Surface />);
    drag(-120, 0, "mouse");
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("drops the gesture on pointercancel", () => {
    render(<Surface />);
    const el = surface();
    fireEvent.pointerDown(el, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 300 });
    fireEvent.pointerCancel(el, { pointerType: "touch", pointerId: 1 });
    fireEvent.pointerUp(el, { pointerType: "touch", pointerId: 1, clientX: 50, clientY: 300 });
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("ignores a lift from a different finger", () => {
    render(<Surface />);
    const el = surface();
    fireEvent.pointerDown(el, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 300 });
    fireEvent.pointerUp(el, { pointerType: "touch", pointerId: 2, clientX: 50, clientY: 300 });
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("returns no handlers when disabled", () => {
    render(<Surface enabled={false} />);
    expect(surface().dataset.attached).toBe("no");
    drag(-120);
    expect(onSwipe).not.toHaveBeenCalled();
  });
});

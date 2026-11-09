import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContextTrigger, type ContextPoint } from "@/lib/useContextTrigger";

const onMenu = vi.fn<(p: ContextPoint) => void>();
const onClick = vi.fn();

function Item({ label = "item", handler = onMenu }: { label?: string; handler?: (p: ContextPoint) => void }) {
  const trigger = useContextTrigger(handler);
  return (
    <div {...trigger} onClick={onClick}>
      {label}
    </div>
  );
}

const touch = { pointerType: "touch", pointerId: 1, isPrimary: true };
const down = (el: Element, x = 10, y = 20) => fireEvent.pointerDown(el, { ...touch, clientX: x, clientY: y });
const move = (el: Element, x: number, y: number) => fireEvent.pointerMove(el, { ...touch, clientX: x, clientY: y });
const up = (el: Element) => fireEvent.pointerUp(el, touch);
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("useContextTrigger", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    onMenu.mockClear();
    onClick.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("fires after 500ms of a still touch, at the touch point", () => {
    render(<Item />);
    const el = screen.getByText("item");
    down(el, 10, 20);
    wait(499);
    expect(onMenu).not.toHaveBeenCalled();
    wait(1);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledWith({ clientX: 10, clientY: 20 });
  });

  it("doesn't fire when the finger lifts early", () => {
    render(<Item />);
    const el = screen.getByText("item");
    down(el);
    wait(300);
    up(el);
    wait(500);
    expect(onMenu).not.toHaveBeenCalled();
  });

  it("tolerates a small wobble but cancels past the slop", () => {
    render(<Item />);
    const el = screen.getByText("item");
    down(el, 10, 20);
    move(el, 14, 23); // 5px
    wait(500);
    expect(onMenu).toHaveBeenCalledTimes(1);

    onMenu.mockClear();
    down(el, 10, 20);
    move(el, 10, 40); // 20px: a scroll
    wait(500);
    expect(onMenu).not.toHaveBeenCalled();
  });

  it("cancels when the browser takes the gesture over", () => {
    render(<Item />);
    const el = screen.getByText("item");
    down(el);
    fireEvent.pointerCancel(el, touch);
    wait(500);
    expect(onMenu).not.toHaveBeenCalled();
  });

  it("swallows the click after a long press, then lets the next one through", () => {
    render(<Item />);
    const el = screen.getByText("item");
    down(el);
    wait(500);
    up(el);
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();

    down(el);
    up(el);
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses Android's native contextmenu as the long press, once", () => {
    render(<Item />);
    const el = screen.getByText("item");
    down(el);
    wait(400);
    const e = fireEvent.contextMenu(el, { clientX: 11, clientY: 21 });
    expect(e).toBe(false); // default prevented
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledWith({ clientX: 11, clientY: 21 });
    wait(500);
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it("ignores a late native contextmenu after the timer fired", () => {
    render(<Item />);
    const el = screen.getByText("item");
    down(el);
    wait(500);
    fireEvent.contextMenu(el);
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it("handles a mouse right-click like callers do today", () => {
    render(<Item />);
    const el = screen.getByText("item");
    fireEvent.pointerDown(el, { pointerType: "mouse", button: 2, clientX: 5, clientY: 6 });
    wait(1000);
    expect(onMenu).not.toHaveBeenCalled(); // no timer for a mouse

    const e = fireEvent.contextMenu(el, { clientX: 5, clientY: 6 });
    expect(e).toBe(false);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledWith({ clientX: 5, clientY: 6 });
  });

  it("lets the innermost of nested triggers have the event", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    function Nested() {
      const o = useContextTrigger(outer);
      const i = useContextTrigger(inner);
      return (
        <div {...o}>
          <span {...i}>inner</span>
        </div>
      );
    }
    render(<Nested />);
    const el = screen.getByText("inner");

    fireEvent.contextMenu(el);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();

    down(el);
    wait(500);
    expect(inner).toHaveBeenCalledTimes(2);
    expect(outer).not.toHaveBeenCalled();
  });

  it("clears its timer on unmount", () => {
    const { unmount } = render(<Item />);
    down(screen.getByText("item"));
    unmount();
    wait(500);
    expect(onMenu).not.toHaveBeenCalled();
  });
});

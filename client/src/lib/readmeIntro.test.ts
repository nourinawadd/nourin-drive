import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWindowStore } from "@/context/windowStore";
import { hasDeepLink } from "@/lib/deepLink";
import { KEY_README_SEEN } from "@/lib/localStore";
import { README_DELAY_MS, useReadmeAfterBoot } from "@/lib/readmeIntro";
import { playSfx } from "@/lib/sfx";

vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/lib/deepLink", () => ({ hasDeepLink: vi.fn(() => false) }));

const readmes = () => useWindowStore.getState().windows.filter((w) => w.appId === "readme");
const seen = () => window.localStorage.getItem(KEY_README_SEEN);
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const boot = (booted = true) => renderHook(({ b }) => useReadmeAfterBoot(b), { initialProps: { b: booted } });

describe("useReadmeAfterBoot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    useWindowStore.setState({ windows: [] });
    vi.mocked(hasDeepLink).mockReturnValue(false);
    vi.mocked(playSfx).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("opens the readme after the delay on a first visit and remembers it", () => {
    boot();
    advance(README_DELAY_MS - 1);
    expect(readmes()).toHaveLength(0);
    expect(seen()).toBeNull();

    advance(1);
    expect(readmes()).toHaveLength(1);
    expect(seen()).toBe("1");
    expect(playSfx).toHaveBeenCalledWith("open");
  });

  it("stays shut for a returning visitor", () => {
    window.localStorage.setItem(KEY_README_SEEN, "1");
    boot();
    advance(README_DELAY_MS * 5);
    expect(useWindowStore.getState().windows).toHaveLength(0);
    expect(playSfx).not.toHaveBeenCalled();
  });

  it("does not reopen after a refresh", () => {
    const first = boot();
    advance(README_DELAY_MS);
    expect(readmes()).toHaveLength(1);

    first.unmount();
    useWindowStore.setState({ windows: [] });

    boot();
    advance(README_DELAY_MS * 5);
    expect(readmes()).toHaveLength(0);
  });

  it("waits for the disk to boot", () => {
    const hook = boot(false);
    advance(README_DELAY_MS * 5);
    expect(readmes()).toHaveLength(0);

    hook.rerender({ b: true });
    advance(README_DELAY_MS);
    expect(readmes()).toHaveLength(1);
  });

  it("skips a deep link visit without marking the readme seen", () => {
    vi.mocked(hasDeepLink).mockReturnValue(true);
    boot();
    advance(README_DELAY_MS * 5);
    expect(readmes()).toHaveLength(0);
    expect(seen()).toBeNull();
  });

  it("skips when a window is already open without marking the readme seen", () => {
    boot();
    act(() => {
      useWindowStore.getState().openApp("blog");
    });
    advance(README_DELAY_MS);
    expect(readmes()).toHaveLength(0);
    expect(seen()).toBeNull();
  });

  it("does nothing if the visitor leaves before the delay", () => {
    const hook = boot();
    advance(README_DELAY_MS - 1);
    hook.unmount();
    advance(README_DELAY_MS * 5);
    expect(readmes()).toHaveLength(0);
    expect(seen()).toBeNull();
  });

  it("still opens when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    boot();
    expect(() => advance(README_DELAY_MS)).not.toThrow();
    expect(readmes()).toHaveLength(1);
  });

  it("opens only one readme across rerenders", () => {
    const hook = boot();
    hook.rerender({ b: true });
    advance(README_DELAY_MS / 2);
    hook.rerender({ b: true });
    advance(README_DELAY_MS * 5);
    expect(readmes()).toHaveLength(1);
  });
});

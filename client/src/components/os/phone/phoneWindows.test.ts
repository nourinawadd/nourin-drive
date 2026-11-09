import { beforeEach, describe, expect, it } from "vitest";
import { topWindow } from "@/components/os/phone/phoneWindows";
import { useWindowStore } from "@/context/windowStore";
import type { WindowInstance } from "@/types/window";

const win = (id: string, z: number, minimized = false): WindowInstance => ({
  id,
  appId: "readme",
  title: id,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  z,
  minimized,
  maximized: false,
});

describe("topWindow", () => {
  it("is null with no windows", () => {
    expect(topWindow([])).toBeNull();
  });

  it("picks the highest z", () => {
    expect(topWindow([win("a", 2), win("b", 5), win("c", 3)])?.id).toBe("b");
  });

  it("skips minimised windows", () => {
    expect(topWindow([win("a", 2), win("b", 5, true)])?.id).toBe("a");
    expect(topWindow([win("a", 2, true)])).toBeNull();
  });

  describe("against the real store", () => {
    beforeEach(() => {
      useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
    });

    const top = () => topWindow(useWindowStore.getState().windows)?.appId ?? null;

    it("follows opening, refocusing and closing", () => {
      const { openApp, closeWin } = useWindowStore.getState();
      const readme = openApp("readme");
      openApp("guestbook");
      expect(top()).toBe("guestbook");

      // Opening a singleton that's already open refocuses it, so it comes forward.
      openApp("readme");
      expect(top()).toBe("readme");

      // Closing the top window reveals the one beneath: the free back stack.
      closeWin(readme);
      expect(top()).toBe("guestbook");
    });
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Gallery } from "@/components/apps/Gallery";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { PHOTOS } from "@/data/gallery";

// useIsPhone sits on top of the mocked useShellMode; the real one would see null.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});

// The gallery is generated from public/; the tests need at least three photos
// so stepping both ways (and wrapping) is distinguishable.
const enough = PHOTOS.length >= 3;
const first = PHOTOS[0];
const second = PHOTOS[1];
const last = PHOTOS[PHOTOS.length - 1];

// The lightbox is the panel holding the close button; its <img> is the photo.
const closeBtn = () => screen.queryByRole("button", { name: "×" });
const shownSrc = () => closeBtn()?.closest("div[style*='flex-direction: column']")?.querySelector("img")?.getAttribute("src");
const open = () => render(<Gallery payload={{ focusId: first.id }} />);

describe.runIf(enough)("Gallery", () => {
  afterEach(cleanup);

  describe("on the desktop", () => {
    beforeEach(() => vi.mocked(useShellMode).mockReturnValue("desktop"));

    it("opens on the photo a deep link asked for", () => {
      open();
      expect(shownSrc()).toBe(first.src);
    });

    it("steps with the arrow keys and closes on Escape", () => {
      open();
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(shownSrc()).toBe(second.src);
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(shownSrc()).toBe(last.src);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(closeBtn()).toBeNull();
    });

    it("ignores a mouse drag across the image", () => {
      open();
      const img = document.querySelector(`img[src="${first.src}"][style*='contain']`)!;
      fireEvent.pointerDown(img, { pointerType: "mouse", pointerId: 1, clientX: 200, clientY: 100 });
      fireEvent.pointerUp(img, { pointerType: "mouse", pointerId: 1, clientX: 50, clientY: 100 });
      expect(shownSrc()).toBe(first.src);
    });
  });

  describe("on a phone", () => {
    beforeEach(() => vi.mocked(useShellMode).mockReturnValue("phone"));

    const drag = (dx: number, dy = 0) => {
      const img = document.querySelector(`img[src="${shownSrc()}"][style*='contain']`)!;
      fireEvent.pointerDown(img, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 300 });
      fireEvent.pointerUp(img, { pointerType: "touch", pointerId: 1, clientX: 200 + dx, clientY: 300 + dy });
    };

    it("swipes left for the next photo and right for the previous, wrapping", () => {
      open();
      drag(-120);
      expect(shownSrc()).toBe(second.src);
      drag(120);
      drag(120);
      expect(shownSrc()).toBe(last.src);
    });

    it("ignores a short wobble and a mostly vertical drag", () => {
      open();
      drag(-30);
      expect(shownSrc()).toBe(first.src);
      drag(-60, 140);
      expect(shownSrc()).toBe(first.src);
    });

    it("drops the gesture when the browser takes it over", () => {
      open();
      const img = document.querySelector(`img[src="${first.src}"][style*='contain']`)!;
      fireEvent.pointerDown(img, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 300 });
      fireEvent.pointerCancel(img, { pointerType: "touch", pointerId: 1 });
      fireEvent.pointerUp(img, { pointerType: "touch", pointerId: 1, clientX: 50, clientY: 300 });
      expect(shownSrc()).toBe(first.src);
    });

    it("closes with ×", () => {
      open();
      fireEvent.click(closeBtn()!);
      expect(closeBtn()).toBeNull();
    });
  });
});

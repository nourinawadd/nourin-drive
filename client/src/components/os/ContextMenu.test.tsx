import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenu, type MenuItem } from "@/components/os/ContextMenu";
import { useShellMode } from "@/components/os/ShellModeProvider";

vi.mock("@/components/os/ShellModeProvider", () => ({ useShellMode: vi.fn() }));

const onClose = vi.fn();
const onOpen = vi.fn();
const onPalette = vi.fn();

const items: MenuItem[] = [
  { kind: "item", label: "Open", onSelect: onOpen },
  { kind: "separator" },
  { kind: "submenu", label: "Palette", items: [{ kind: "item", label: "Amber", onSelect: onPalette }] },
];

const show = () => render(<ContextMenu x={40} y={60} items={items} onClose={onClose} />);

describe("ContextMenu", () => {
  beforeEach(() => {
    onClose.mockClear();
    onOpen.mockClear();
    onPalette.mockClear();
  });

  afterEach(cleanup);

  describe.each(["desktop", null] as const)("in %s mode", (mode) => {
    beforeEach(() => vi.mocked(useShellMode).mockReturnValue(mode));

    it("floats at the pointer, as before", () => {
      show();
      const menu = screen.getAllByRole("menu")[0];
      expect(menu.style.position).toBe("fixed");
      expect(menu.style.left).toBe("40px");
      expect(menu.style.top).toBe("60px");
      expect(screen.getByRole("menuitem", { name: "Open" })).toBeTruthy();
    });

    it("keeps the desktop close rules: outside pointerdown and scroll", () => {
      show();
      fireEvent.pointerDown(window);
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.scroll(window);
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe("on a phone", () => {
    beforeEach(() => vi.mocked(useShellMode).mockReturnValue("phone"));

    const backdrop = () => screen.getByRole("menu").parentElement!;

    it("renders a bottom sheet, ignoring x/y", () => {
      show();
      const sheet = screen.getByRole("menu");
      expect(sheet.style.bottom).toBe("0px");
      expect(sheet.style.left).toBe("0px");
      expect(backdrop().style.position).toBe("fixed");
    });

    it("picks an item: runs it, then closes", () => {
      show();
      fireEvent.click(screen.getByRole("menuitem", { name: "Open" }));
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on a tap that starts and ends on the backdrop", () => {
      show();
      fireEvent.pointerDown(backdrop());
      fireEvent.click(backdrop());
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("ignores the release of the long press that opened it", () => {
      show();
      // The opening gesture went down before the sheet existed, so its click
      // arrives without a pointerdown on the backdrop.
      fireEvent.click(backdrop());
      expect(onClose).not.toHaveBeenCalled();
    });

    it("doesn't close on scroll, resize or an outside pointerdown", () => {
      show();
      fireEvent.scroll(screen.getByRole("menu"));
      fireEvent.scroll(window);
      fireEvent(window, new Event("resize"));
      fireEvent.pointerDown(window);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on Escape", () => {
      show();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("folds a submenu open in place", () => {
      show();
      expect(screen.queryByRole("menuitem", { name: "Amber" })).toBeNull();
      fireEvent.click(screen.getByRole("menuitem", { name: /Palette/ }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Amber" }));
      expect(onPalette).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

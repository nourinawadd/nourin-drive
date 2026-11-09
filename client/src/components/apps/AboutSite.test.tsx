import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AboutSite } from "@/components/apps/AboutSite";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { useWindowStore } from "@/context/windowStore";
import { KEY_README_SEEN } from "@/lib/localStore";

vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));
// useIsPhone sits on top of the mocked useShellMode; the real one would see null.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});

const opened = () => useWindowStore.getState().windows.map((w) => w.appId);
const showInside = () => {
  render(<AboutSite />);
  fireEvent.click(screen.getByRole("tab", { name: "What's Inside" }));
};

describe("AboutSite", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
    vi.mocked(useShellMode).mockReturnValue("desktop");
  });

  afterEach(cleanup);

  it("marks the readme seen when opened by hand", () => {
    expect(window.localStorage.getItem(KEY_README_SEEN)).toBeNull();
    render(<AboutSite />);
    expect(window.localStorage.getItem(KEY_README_SEEN)).toBe("1");
  });

  describe("on the desktop", () => {
    it("selects on click and opens on double-click", () => {
      showInside();
      const profile = screen.getByText("User Profile");
      fireEvent.click(profile);
      expect(opened()).toEqual([]);
      fireEvent.doubleClick(profile);
      expect(opened()).toEqual(["profile"]);
    });

    it("lists Sticky Notes and says the drives are on the left", () => {
      showInside();
      expect(screen.getByText("Sticky Notes")).toBeTruthy();
      expect(screen.queryByText("ON A COMPUTER")).toBeNull();
      fireEvent.click(screen.getByRole("tab", { name: "Getting Around" }));
      expect(screen.getByText(/Double-click a drive on the left/)).toBeTruthy();
    });
  });

  describe("on a phone", () => {
    beforeEach(() => vi.mocked(useShellMode).mockReturnValue("phone"));

    it("opens an app with one tap", () => {
      showInside();
      fireEvent.click(screen.getByText("User Profile"));
      expect(opened()).toEqual(["profile"]);
    });

    it("marks desktop-only apps but still opens them", () => {
      showInside();
      const shell = screen.getByText("Shell").parentElement!;
      expect(shell.textContent).toContain("ON A COMPUTER");
      fireEvent.click(screen.getByText("Shell"));
      expect(opened()).toEqual(["terminal"]);
    });

    it("leaves Sticky Notes out and uses phone wording", () => {
      showInside();
      expect(screen.queryByText("Sticky Notes")).toBeNull();
      expect(screen.getByText(/tap to open/)).toBeTruthy();
      expect(screen.getByText(/from the end of its tabs/)).toBeTruthy();
      fireEvent.click(screen.getByRole("tab", { name: "Getting Around" }));
      expect(screen.getByText(/Tap a drive to open it/)).toBeTruthy();
    });
  });
});

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { PhoneShell } from "@/components/os/phone/PhoneShell";
import { useWindowStore } from "@/context/windowStore";

// useIsPhone is defined on top of the mocked useShellMode: the real one would
// call the real (unmocked) useShellMode inside the module and always see null.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});
// Keep the real module (SfxEngine's store needs its setters) but silence the
// two calls that would reach for Web Audio, which jsdom doesn't have.
vi.mock("@/lib/sfx", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sfx")>()),
  playSfx: vi.fn(),
  unlockSfx: vi.fn(),
}));
vi.mock("@/lib/deepLink", () => ({ hasDeepLink: vi.fn(() => false), deepLinkParams: () => new URLSearchParams() }));

const resetStore = () => useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });

describe("PhoneShell", () => {
  beforeEach(() => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    window.localStorage.clear();
    resetStore();
  });

  afterEach(() => {
    cleanup();
    resetStore();
    vi.useRealTimers();
  });

  const boot = () => {
    render(<PhoneShell />);
    fireEvent.click(screen.getByRole("button", { name: /insert the workbench disk/i }));
  };
  const tile = () => screen.getByRole("button", { name: /Start Here:/ });

  it("shows a launcher with only the enabled apps, in drive order", () => {
    boot();
    const apps = screen.getByRole("navigation", { name: "Apps" });
    const labels = [...apps.querySelectorAll("button")].map((b) => b.textContent);
    expect(labels).toEqual([
      "Start Here:", "User:", "Projects:", "Games:", "Photos:", "Blog:",
      "Library:", "Guestbook:", "Music:", "Prefs:",
    ]);
  });

  it("opens an app full screen on tap, and back returns to the launcher", () => {
    boot();
    fireEvent.click(tile());
    expect(screen.getByRole("heading", { name: "About This Site" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Apps" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("navigation", { name: "Apps" })).toBeTruthy();
  });

  it("shows the needs-a-computer screen for a hidden app", () => {
    boot();
    act(() => {
      useWindowStore.getState().openApp("terminal");
    });
    expect(screen.getByText("This one needs a computer")).toBeTruthy();
  });

  it("opens the drive's action sheet on a long press, without opening the app", () => {
    vi.useFakeTimers();
    boot();
    const el = tile();
    fireEvent.pointerDown(el, { pointerType: "touch", pointerId: 1, isPrimary: true, clientX: 50, clientY: 80 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(el, { pointerType: "touch", pointerId: 1, isPrimary: true });
    fireEvent.click(el); // the lifting finger's click, which must be swallowed

    expect(useWindowStore.getState().windows).toHaveLength(0);
    fireEvent.click(screen.getByRole("menuitem", { name: "Open" }));
    expect(useWindowStore.getState().windows.map((w) => w.appId)).toEqual(["readme"]);
  });
});

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileGate } from "@/components/os/MobileGate";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { PhoneShell } from "@/components/os/phone/PhoneShell";
import { useWindowStore } from "@/context/windowStore";
import { hasDeepLink } from "@/lib/deepLink";

vi.mock("@/components/os/ShellModeProvider", () => ({ useShellMode: vi.fn() }));
// Keep the real module (SfxEngine's store needs its setters) but silence the
// two calls that would reach for Web Audio, which jsdom doesn't have.
vi.mock("@/lib/sfx", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sfx")>()),
  playSfx: vi.fn(),
  unlockSfx: vi.fn(),
}));
vi.mock("@/lib/deepLink", () => ({ hasDeepLink: vi.fn(() => false), deepLinkParams: () => new URLSearchParams() }));
vi.mock("@/components/os/mobile/MobileReader", () => ({ MobileReader: () => <div>lite reader</div> }));
vi.mock("@/components/os/mobile/MobileScreen", () => ({ MobileScreen: () => <div>lite landing</div> }));

const resetStore = () => useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });

describe("MobileGate", () => {
  const gate = () =>
    render(
      <MobileGate phone={<div>phone shell</div>}>
        <div>desktop</div>
      </MobileGate>,
    );

  beforeEach(() => vi.mocked(hasDeepLink).mockReturnValue(false));
  afterEach(cleanup);

  it("renders nothing while the mode is unknown", () => {
    vi.mocked(useShellMode).mockReturnValue(null);
    const { container } = gate();
    expect(container.innerHTML).toBe("");
  });

  it("renders the desktop in desktop mode", () => {
    vi.mocked(useShellMode).mockReturnValue("desktop");
    gate();
    expect(screen.getByText("desktop")).toBeTruthy();
    expect(screen.queryByText("phone shell")).toBeNull();
  });

  it("renders the phone shell in phone mode", () => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    gate();
    expect(screen.getByText("phone shell")).toBeTruthy();
  });

  it("sends a deep link to the lite reader, even in phone mode", () => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    vi.mocked(hasDeepLink).mockReturnValue(true);
    gate();
    expect(screen.getByText("lite reader")).toBeTruthy();
  });

  it("renders the lite landing page in lite mode", () => {
    vi.mocked(useShellMode).mockReturnValue("lite");
    gate();
    expect(screen.getByText("lite landing")).toBeTruthy();
  });
});

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

  it("shows a launcher with only the enabled apps", () => {
    boot();
    const apps = screen.getByRole("navigation", { name: "Apps" });
    expect(apps.querySelectorAll("button")).toHaveLength(1);
    expect(tile()).toBeTruthy();
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

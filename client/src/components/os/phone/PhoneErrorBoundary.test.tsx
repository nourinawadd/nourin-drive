import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { DevCrash, PhoneErrorBoundary } from "@/components/os/phone/PhoneErrorBoundary";
import { PhoneShell } from "@/components/os/phone/PhoneShell";
import { useWindowStore } from "@/context/windowStore";

// Every app is a stub that throws while rendering when the flag is on, since
// these tests are about the frame around an app, not the app.
const crash = vi.hoisted(() => ({ on: false }));
vi.mock("@/components/os/AppRouter", () => ({
  AppRouter: ({ win }: { win: { appId: string } }) => {
    if (crash.on) throw new Error("boom");
    return <div>app {win.appId}</div>;
  },
}));
// The same shell setup as PhoneShell.test.tsx: a phone, no Web Audio, no link.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});
vi.mock("@/lib/sfx", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sfx")>()),
  playSfx: vi.fn(),
  unlockSfx: vi.fn(),
}));
// The shell counts a visit (useCountVisit); keep that off the network.
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  pingGuestbookVisit: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@/lib/deepLink", () => ({ hasDeepLink: vi.fn(() => false), deepLinkParams: () => new URLSearchParams() }));

function Boom(): never {
  throw new Error("boom");
}

// React reports every caught render error to console.error, and jsdom prints
// its own copy unless the window's error event is cancelled. Both are expected
// here, so they're silenced rather than printed.
const cancel = (event: ErrorEvent) => event.preventDefault();
const resetStore = () => useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
let quiet: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  quiet = vi.spyOn(console, "error").mockImplementation(() => {});
  window.addEventListener("error", cancel);
  vi.mocked(useShellMode).mockReturnValue("phone");
  window.localStorage.clear();
  resetStore();
  crash.on = false;
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  cleanup();
  window.removeEventListener("error", cancel);
  quiet.mockRestore();
  resetStore();
});

describe("PhoneErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <PhoneErrorBoundary fallback={<div>fallback</div>}>
        <div>children</div>
      </PhoneErrorBoundary>,
    );
    expect(screen.getByText("children")).toBeTruthy();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  it("renders the fallback in place of children that throw", () => {
    render(
      <PhoneErrorBoundary fallback={<div>fallback</div>}>
        <div>before</div>
        <Boom />
      </PhoneErrorBoundary>,
    );
    expect(screen.getByText("fallback")).toBeTruthy();
    expect(screen.queryByText("before")).toBeNull();
  });
});

describe("PhoneFrame safety net", () => {
  const boot = () => {
    render(<PhoneShell />);
    fireEvent.click(screen.getByRole("button", { name: /insert the workbench disk/i }));
  };
  const launcher = () => screen.queryByRole("navigation", { name: "Apps" });
  const startHere = () => screen.getByRole("button", { name: /Start Here:/ });
  const card = () => screen.getByText("This app hit a problem").closest(".wb-phone-card") as HTMLElement;

  it("shows a problem card for an app that crashes, and keeps the shell", () => {
    crash.on = true;
    boot();
    fireEvent.click(startHere());
    expect(card()).toBeTruthy();
    // The frame's own title bar and its Back gadget are still there.
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Back" })).toHaveLength(2);
    expect(screen.queryByText(/hit a problem, so here/)).toBeNull();
  });

  it("closes the crashed app on Back, and the launcher still opens apps", () => {
    crash.on = true;
    boot();
    fireEvent.click(startHere());
    const appId = useWindowStore.getState().windows[0].appId;
    fireEvent.click(within(card()).getByRole("button", { name: "Back" }));
    expect(useWindowStore.getState().windows).toEqual([]);
    expect(launcher()).toBeTruthy();

    // A new window is a new frame, so it gets a fresh boundary: once the app
    // stops throwing, it opens normally instead of showing the old card.
    crash.on = false;
    fireEvent.click(startHere());
    expect(screen.getByText(`app ${appId}`)).toBeTruthy();
    expect(screen.queryByText("This app hit a problem")).toBeNull();
  });
});

describe("DevCrash", () => {
  const guarded = () =>
    render(
      <PhoneErrorBoundary fallback={<div>fallback</div>}>
        <DevCrash at="app" />
        <div>children</div>
      </PhoneErrorBoundary>,
    );

  it("renders nothing without a matching ?crash=", () => {
    for (const query of ["", "?crash=shell", "?crash="]) {
      window.history.replaceState(null, "", `/${query}`);
      guarded();
      expect(screen.getByText("children")).toBeTruthy();
      cleanup();
    }
  });

  it("throws into the nearest boundary for a matching ?crash= (outside production)", () => {
    window.history.replaceState(null, "", "/?crash=app");
    guarded();
    expect(screen.getByText("fallback")).toBeTruthy();
  });

  it("with ?crash=app, every app opens on the problem card inside a working shell", () => {
    window.history.replaceState(null, "", "/?crash=app");
    render(<PhoneShell />);
    fireEvent.click(screen.getByRole("button", { name: /insert the workbench disk/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start Here:/ }));
    expect(screen.getByText("This app hit a problem")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Back" })).toHaveLength(2);
  });
});

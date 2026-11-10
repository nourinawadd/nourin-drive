import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileGate } from "@/components/os/MobileGate";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { PhoneShell } from "@/components/os/phone/PhoneShell";
import { useWindowStore } from "@/context/windowStore";
import { mobileSupport } from "@/data/appRegistry";
import { LIBRARY } from "@/data/library";
import { resetDeepLinkCapture } from "@/lib/deepLink";

// useIsPhone sits on top of the mocked useShellMode; the real one would see null.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});
// The real registry, with mobileSupport wrapped so one test can hide an app.
vi.mock("@/data/appRegistry", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/data/appRegistry")>();
  return { ...real, mobileSupport: vi.fn(real.mobileSupport) };
});
// Keep the real module (SfxEngine's store needs its setters) but silence the
// two calls that would reach for Web Audio, which jsdom doesn't have.
vi.mock("@/lib/sfx", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sfx")>()),
  playSfx: vi.fn(),
  unlockSfx: vi.fn(),
}));
vi.mock("@/components/os/mobile/MobileReader", () => ({ MobileReader: () => <div>lite reader</div> }));
vi.mock("@/components/os/mobile/MobileScreen", () => ({ MobileScreen: () => <div>lite landing</div> }));
// The shell test is about which window the link opens, not how the Ereader
// draws (which needs layout jsdom doesn't have).
vi.mock("@/components/os/AppRouter", () => ({
  AppRouter: ({ win }: { win: { appId: string } }) => <div>app {win.appId}</div>,
}));

/** Point the page at a query and drop the capture, as a fresh load would. */
function at(search: string) {
  window.history.replaceState(null, "", `/${search}`);
  resetDeepLinkCapture();
}

const gate = () =>
  render(
    <MobileGate phone={<div>phone shell</div>}>
      <div>desktop</div>
    </MobileGate>,
  );

beforeEach(() => {
  at("");
  useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
});

// Vitest runs without globals here, so Testing Library can't register its own
// cleanup; without this each render would pile up in the same document.
afterEach(cleanup);

describe("MobileGate", () => {
  it("renders nothing while the mode is unknown", () => {
    vi.mocked(useShellMode).mockReturnValue(null);
    const { container } = gate();
    expect(container.innerHTML).toBe("");
  });

  it("renders the desktop in desktop mode, deep link or not", () => {
    vi.mocked(useShellMode).mockReturnValue("desktop");
    gate();
    expect(screen.getByText("desktop")).toBeTruthy();
    cleanup();
    at("?doc=poems/home");
    gate();
    expect(screen.getByText("desktop")).toBeTruthy();
  });

  it("renders the phone shell in phone mode", () => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    gate();
    expect(screen.getByText("phone shell")).toBeTruthy();
  });

  it("renders the lite landing page in lite mode", () => {
    vi.mocked(useShellMode).mockReturnValue("lite");
    gate();
    expect(screen.getByText("lite landing")).toBeTruthy();
  });

  it("keeps the lite reader for a deep link in lite mode", () => {
    vi.mocked(useShellMode).mockReturnValue("lite");
    at("?doc=poems/home");
    gate();
    expect(screen.getByText("lite reader")).toBeTruthy();
  });

  it("opens a doc, photo or post link inside the phone shell", () => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    for (const link of ["?doc=poems/home", "?photo=abc", "?post=hello"]) {
      at(link);
      gate();
      expect(screen.getByText("phone shell")).toBeTruthy();
      cleanup();
    }
  });

  it("sends a link into an app the phone hides to the lite reader", () => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    vi.mocked(mobileSupport).mockReturnValueOnce("hidden");
    at("?doc=poems/home");
    gate();
    expect(screen.getByText("lite reader")).toBeTruthy();
  });
});

describe("PhoneShell with a deep link", () => {
  beforeEach(() => vi.mocked(useShellMode).mockReturnValue("phone"));

  it("opens the document in the Ereader, skips the boot screen, and cleans the URL", () => {
    const doc = LIBRARY[0];
    at(`?doc=${encodeURIComponent(doc.id)}&keep=1`);
    render(<PhoneShell />);

    const windows = useWindowStore.getState().windows;
    expect(windows.map((w) => w.appId)).toEqual(["ereader"]);
    expect(windows[0].payload).toMatchObject({ docId: doc.id, view: "read" });
    expect(screen.getByText("app ereader")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /insert the workbench disk/i })).toBeNull();
    // Only the deep-link param goes; anything else in the query stays.
    expect(window.location.search).toBe("?keep=1");
  });

  it("opens nothing without a link", () => {
    render(<PhoneShell />);
    act(() => {});
    expect(useWindowStore.getState().windows).toEqual([]);
  });
});

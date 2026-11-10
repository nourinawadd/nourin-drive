import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { phoneOpenInterceptor } from "@/components/os/phone/phoneRedirects";
import { setOpenInterceptor, useWindowStore } from "@/context/windowStore";
import { LOCAL_GAMES } from "@/data/games.generated";
import { PROJECTS } from "@/data/projects";
import { trackAppOpen } from "@/lib/analytics";

// Counted, not sent: the tests check who tracks an open, and how many times.
vi.mock("@/lib/analytics", () => ({ trackAppOpen: vi.fn() }));

const apps = () => useWindowStore.getState().windows.map((w) => w.appId);
const site = { payload: { initialUrl: "https://example.com/" } };

// A real local build with an itch page, read from the generated data rather
// than named, so adding or renaming games doesn't break the test.
const built = Object.entries(LOCAL_GAMES)
  .map(([id, b]) => ({ src: b.src, url: PROJECTS.find((p) => p.id === id)?.url }))
  .find((g) => g.src && g.url)!;
const game = { payload: { src: built.src, name: "A game" } };

describe("phoneOpenInterceptor", () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
    open = vi.spyOn(window, "open").mockImplementation(() => null);
    vi.mocked(trackAppOpen).mockClear();
  });

  afterEach(() => {
    setOpenInterceptor(null);
    open.mockRestore();
  });

  it("opens a browser link in a real tab", () => {
    expect(phoneOpenInterceptor("browser", site)).toBe(true);
    expect(open).toHaveBeenCalledWith("https://example.com/", "_blank", "noopener,noreferrer");
  });

  it("leaves a bare Browser open and every other app alone", () => {
    expect(phoneOpenInterceptor("browser")).toBe(false);
    expect(phoneOpenInterceptor("explorer")).toBe(false);
    expect(phoneOpenInterceptor("gallery", { payload: { focusId: "x" } })).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it("stops the store opening a Browser window once registered", () => {
    setOpenInterceptor(phoneOpenInterceptor);
    const id = useWindowStore.getState().openApp("browser", site);
    expect(id).toBe("");
    expect(apps()).toEqual([]);
    expect(open).toHaveBeenCalledTimes(1);

    // Everything else still opens as a window.
    useWindowStore.getState().openApp("explorer");
    expect(apps()).toEqual(["explorer"]);
  });

  it("changes nothing when no shell has registered (the desktop)", () => {
    const id = useWindowStore.getState().openApp("browser", site);
    expect(id).not.toBe("");
    expect(apps()).toEqual(["browser"]);
    expect(open).not.toHaveBeenCalled();
  });

  it("opens a local game build's itch page in a real tab", () => {
    expect(phoneOpenInterceptor("game", game)).toBe(true);
    expect(open).toHaveBeenCalledWith(built.url, "_blank", "noopener,noreferrer");
  });

  it("leaves a game it can't find an itch page for to the hidden-app screen", () => {
    expect(phoneOpenInterceptor("game", { payload: { src: "/games/nope/index.html" } })).toBe(false);
    expect(phoneOpenInterceptor("game")).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it("stops the store opening a game window once registered", () => {
    setOpenInterceptor(phoneOpenInterceptor);
    expect(useWindowStore.getState().openApp("game", game)).toBe("");
    expect(apps()).toEqual([]);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("counts a redirected open once, as a new app_open", () => {
    setOpenInterceptor(phoneOpenInterceptor);
    useWindowStore.getState().openApp("browser", site);
    expect(trackAppOpen).toHaveBeenCalledTimes(1);
    expect(trackAppOpen).toHaveBeenCalledWith("browser", false);

    vi.mocked(trackAppOpen).mockClear();
    useWindowStore.getState().openApp("game", game);
    expect(trackAppOpen).toHaveBeenCalledTimes(1);
    expect(trackAppOpen).toHaveBeenCalledWith("game", false);
  });

  it("doesn't track an open it lets through, since the store tracks those", () => {
    expect(phoneOpenInterceptor("explorer")).toBe(false);
    expect(phoneOpenInterceptor("browser")).toBe(false);
    expect(phoneOpenInterceptor("game", { payload: { src: "/games/nope/index.html" } })).toBe(false);
    expect(trackAppOpen).not.toHaveBeenCalled();

    // Let through to the store, it's tracked exactly once, by the store.
    setOpenInterceptor(phoneOpenInterceptor);
    useWindowStore.getState().openApp("explorer");
    expect(trackAppOpen).toHaveBeenCalledTimes(1);
  });
});

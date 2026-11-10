import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KEY_SHELL_MODE } from "@/lib/localStore";
import {
  NARROW_PX,
  PHONE_SHELL,
  detectShellMode,
  nextOverride,
  parseModeParam,
  resolveShellMode,
  type ShellFlag,
  type ShellInputs,
  type ShellMode,
} from "@/lib/shellMode";

const PHONE = { width: 390, coarse: true };
const DESKTOP = { width: 1440, coarse: false };
const NARROW_MOUSE = { width: 600, coarse: false }; // devtools without touch emulation
const WIDE_TOUCH = { width: 1024, coarse: true };  // tablet, touch laptop

const resolve = (screen: Pick<ShellInputs, "width" | "coarse">, override: ShellInputs["override"], flag: ShellFlag) =>
  resolveShellMode({ ...screen, override, flag });

describe("resolveShellMode", () => {
  // [screen, override, flag, expected] - every row of the roadmap's modes table.
  const table: [string, Pick<ShellInputs, "width" | "coarse">, ShellInputs["override"], ShellFlag, ShellMode][] = [
    ["phone, no override, off", PHONE, null, "off", "lite"],
    ["phone, no override, preview", PHONE, null, "preview", "lite"],
    ["phone, no override, on", PHONE, null, "on", "phone"],
    ["desktop, no override, off", DESKTOP, null, "off", "desktop"],
    ["desktop, no override, preview", DESKTOP, null, "preview", "desktop"],
    ["desktop, no override, on", DESKTOP, null, "on", "desktop"],
    ["narrow mouse window, on", NARROW_MOUSE, null, "on", "desktop"],
    ["wide touch screen, on", WIDE_TOUCH, null, "on", "desktop"],

    ["phone, desktop override", PHONE, "desktop", "on", "desktop"],
    ["phone, desktop override, off", PHONE, "desktop", "off", "desktop"],
    ["desktop, lite override, off", DESKTOP, "lite", "off", "lite"],
    ["phone, lite override, on", PHONE, "lite", "on", "lite"],

    ["desktop, phone override, off: ignored", DESKTOP, "phone", "off", "desktop"],
    ["phone, phone override, off: ignored", PHONE, "phone", "off", "lite"],
    ["desktop, phone override, preview", DESKTOP, "phone", "preview", "phone"],
    ["desktop, phone override, on", DESKTOP, "phone", "on", "phone"],
    ["phone, phone override, preview", PHONE, "phone", "preview", "phone"],
  ];

  it.each(table)("%s", (_label, screen, override, flag, expected) => {
    expect(resolve(screen, override, flag)).toBe(expected);
  });

  it("treats NARROW_PX itself as wide", () => {
    expect(resolve({ width: NARROW_PX - 1, coarse: true }, null, "off")).toBe("lite");
    expect(resolve({ width: NARROW_PX, coarse: true }, null, "off")).toBe("desktop");
  });

  it("ships with the phone shell on", () => {
    expect(PHONE_SHELL).toBe("on");
  });
});

describe("parseModeParam", () => {
  it.each([
    ["?mode=desktop", "desktop"],
    ["?mode=phone", "phone"],
    ["?mode=lite", "lite"],
    ["?mode=auto", "auto"],
    ["?doc=cv&mode=lite", "lite"],
    ["", null],
    ["?doc=cv", null],
    ["?mode=", null],
    ["?mode=tablet", null],
    ["?mode=Desktop", null],
  ])("%s -> %s", (search, expected) => {
    expect(parseModeParam(search)).toBe(expected);
  });
});

describe("nextOverride", () => {
  it("lets a fresh param replace what was stored", () => {
    expect(nextOverride("lite", "desktop")).toBe("lite");
    expect(nextOverride("desktop", null)).toBe("desktop");
  });

  it("clears on auto", () => {
    expect(nextOverride("auto", "lite")).toBeNull();
    expect(nextOverride("auto", null)).toBeNull();
  });

  it("keeps the stored override when there is no param", () => {
    expect(nextOverride(null, "desktop")).toBe("desktop");
    expect(nextOverride(null, "phone")).toBe("phone");
    expect(nextOverride(null, null)).toBeNull();
  });

  it("drops a stored value that isn't a mode", () => {
    expect(nextOverride(null, "tablet")).toBeNull();
    expect(nextOverride(null, "")).toBeNull();
  });
});

describe("detectShellMode", () => {
  const screen = (width: number, coarse: boolean) => {
    vi.stubGlobal("innerWidth", width);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: query === "(pointer: coarse)" && coarse, media: query })),
    );
  };

  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects a phone and a desktop with no query", () => {
    screen(390, true);
    expect(detectShellMode("")).toBe("phone");
    screen(1440, false);
    expect(detectShellMode("")).toBe("desktop");
    expect(window.sessionStorage.getItem(KEY_SHELL_MODE)).toBeNull();
  });

  it("holds an override for the tab and clears it on auto", () => {
    screen(390, true);
    expect(detectShellMode("?mode=desktop")).toBe("desktop");
    expect(window.sessionStorage.getItem(KEY_SHELL_MODE)).toBe("desktop");

    // A reload with the param gone (stripped, or an in-app navigation).
    expect(detectShellMode("")).toBe("desktop");

    expect(detectShellMode("?mode=auto")).toBe("phone");
    expect(window.sessionStorage.getItem(KEY_SHELL_MODE)).toBeNull();
    expect(detectShellMode("")).toBe("phone");
  });

  it("shows the lite page on a desktop with ?mode=lite", () => {
    screen(1440, false);
    expect(detectShellMode("?mode=lite")).toBe("lite");
  });

  // The shipped flag is "on"; the "off" and "preview" behaviour is covered by
  // the resolveShellMode table above. A phone override still works on a
  // desktop-sized screen, which is how the shell is tried from a computer.
  it("opens the phone shell for ?mode=phone and holds it", () => {
    screen(1440, false);
    expect(detectShellMode("?mode=phone")).toBe("phone");
    expect(window.sessionStorage.getItem(KEY_SHELL_MODE)).toBe("phone");
    expect(detectShellMode("")).toBe("phone");
  });

  it("gives real phones the phone shell without an override", () => {
    screen(390, true);
    expect(detectShellMode("")).toBe("phone");
  });

  it("still gives a phone the lite page or the desktop when asked", () => {
    screen(390, true);
    expect(detectShellMode("?mode=lite")).toBe("lite");
    expect(detectShellMode("")).toBe("lite");
    expect(detectShellMode("?mode=desktop")).toBe("desktop");
    expect(detectShellMode("")).toBe("desktop");
  });

  it("keeps the desktop for a narrow window driven by a mouse", () => {
    screen(600, false);
    expect(detectShellMode("")).toBe("desktop");
  });

  it("keeps a working override when the param is a typo", () => {
    screen(390, true);
    detectShellMode("?mode=desktop");
    expect(detectShellMode("?mode=dekstop")).toBe("desktop");
  });

  it("strips mode from the URL and keeps everything else", () => {
    screen(1440, false);
    window.history.replaceState(null, "", "/?doc=cv&mode=lite#top");
    expect(detectShellMode(window.location.search)).toBe("lite");
    expect(window.location.search).toBe("?doc=cv");
    expect(window.location.hash).toBe("#top");

    window.history.replaceState(null, "", "/?mode=desktop");
    detectShellMode(window.location.search);
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/");
  });

  it("strips an unknown mode value too", () => {
    screen(1440, false);
    window.history.replaceState(null, "", "/?mode=tablet");
    detectShellMode(window.location.search);
    expect(window.location.search).toBe("");
  });

  it("leaves history alone when there is no mode param", () => {
    screen(1440, false);
    window.history.replaceState(null, "", "/?doc=cv");
    const replace = vi.spyOn(window.history, "replaceState");
    detectShellMode(window.location.search);
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?doc=cv");
    replace.mockRestore();
  });

  it("falls back to detection when storage throws", () => {
    screen(390, true);
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(detectShellMode("")).toBe("phone");
    expect(detectShellMode("?mode=desktop")).toBe("desktop");
    get.mockRestore();
    set.mockRestore();
  });
});

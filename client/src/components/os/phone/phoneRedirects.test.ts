import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { phoneOpenInterceptor } from "@/components/os/phone/phoneRedirects";
import { setOpenInterceptor, useWindowStore } from "@/context/windowStore";

const apps = () => useWindowStore.getState().windows.map((w) => w.appId);
const site = { payload: { initialUrl: "https://example.com/" } };

describe("phoneOpenInterceptor", () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
    open = vi.spyOn(window, "open").mockImplementation(() => null);
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
});

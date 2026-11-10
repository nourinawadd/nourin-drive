import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The IDs are read when the module loads, so each test sets the env first and
// then imports a fresh copy.
async function load(env: { ga?: string; clarity?: string }) {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", env.ga ?? "");
  vi.stubEnv("NEXT_PUBLIC_CLARITY_PROJECT_ID", env.clarity ?? "");
  vi.resetModules();
  return import("@/lib/analytics");
}

beforeEach(() => {
  delete window.gtag;
  delete window.dataLayer;
  delete window.clarity;
});
afterEach(() => vi.unstubAllEnvs());

describe("shell mode in analytics", () => {
  it("adds shell_mode to GA's app_open", async () => {
    const { setShellMode, trackAppOpen } = await load({ ga: "G-TEST" });
    const gtag = vi.fn();
    window.gtag = gtag;

    setShellMode("phone");
    trackAppOpen("explorer", false);
    expect(gtag).toHaveBeenCalledWith("event", "app_open", {
      app_id: "explorer",
      reused_window: false,
      shell_mode: "phone",
    });
  });

  it("queues the Clarity tag when the tag hasn't loaded yet", async () => {
    const { setShellMode } = await load({ clarity: "abc" });
    setShellMode("desktop");
    expect(window.clarity?.q).toEqual([["set", "shell_mode", "desktop"]]);
  });

  it("uses a Clarity tag that's already there", async () => {
    const { setShellMode } = await load({ clarity: "abc" });
    const clarity = vi.fn();
    window.clarity = clarity;
    setShellMode("lite");
    expect(clarity).toHaveBeenCalledWith("set", "shell_mode", "lite");
  });

  it("touches nothing without the analytics IDs", async () => {
    const { setShellMode, trackAppOpen } = await load({});
    setShellMode("phone");
    trackAppOpen("explorer", false);
    expect(window.clarity).toBeUndefined();
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { deepLinkApps, hasDeepLink, resetDeepLinkCapture } from "@/lib/deepLink";

/** Point the page at a query and drop the capture, as a fresh load would. */
function at(search: string) {
  window.history.replaceState(null, "", `/${search}`);
  resetDeepLinkCapture();
}

describe("deepLink", () => {
  afterEach(() => at(""));

  it("maps each param to the app it opens", () => {
    at("?doc=poems/home");
    expect(deepLinkApps()).toEqual(["ereader"]);
    at("?photo=abc");
    expect(deepLinkApps()).toEqual(["gallery"]);
    at("?post=hello");
    expect(deepLinkApps()).toEqual(["blog"]);
    at("?photo=abc&doc=x&mode=phone");
    expect(deepLinkApps()).toEqual(["ereader", "gallery"]);
  });

  it("sees no link without one, or with an empty value", () => {
    at("?mode=phone");
    expect(hasDeepLink()).toBe(false);
    expect(deepLinkApps()).toEqual([]);
    at("?doc=");
    expect(hasDeepLink()).toBe(false);
    expect(deepLinkApps()).toEqual([]);
  });

  it("keeps the query it first read after the URL is cleaned", () => {
    at("?doc=poems/home");
    expect(hasDeepLink()).toBe(true);
    // What useDeepLink does once it has opened the window.
    window.history.replaceState(null, "", "/");
    expect(hasDeepLink()).toBe(true);
    expect(deepLinkApps()).toEqual(["ereader"]);
  });
});

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePhoneHistory } from "@/components/os/phone/usePhoneHistory";
import { useWindowStore } from "@/context/windowStore";

function Host() {
  usePhoneHistory();
  return null;
}

const store = () => useWindowStore.getState();
const apps = () => store().windows.map((w) => w.appId);
const open = (appId: "explorer" | "properties" | "readme") => act(() => void store().openApp(appId));

describe("usePhoneHistory", () => {
  let push: ReturnType<typeof vi.spyOn>;
  let go: ReturnType<typeof vi.spyOn>;

  /** The state of the k-th entry the hook pushed (1-based). */
  const entry = (k: number) => push.mock.calls[k - 1][0];
  /** What the browser does on Back/Forward: land on an entry and fire popstate. */
  const pop = (state: unknown) => act(() => void window.dispatchEvent(new PopStateEvent("popstate", { state })));

  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
    push = vi.spyOn(window.history, "pushState");
    // jsdom traverses asynchronously; the tests play the browser's part by hand.
    go = vi.spyOn(window.history, "go").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    push.mockRestore();
    go.mockRestore();
  });

  it("pushes nothing while no app is open", () => {
    render(<Host />);
    expect(push).not.toHaveBeenCalled();
  });

  it("pushes one entry per opened app, at the current URL", () => {
    render(<Host />);
    open("explorer");
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][2]).toBe(window.location.href);
    // A refocused singleton isn't a new app.
    open("explorer");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("keeps what's already in the current entry, so Next's marker travels with ours", () => {
    // What Next's app router leaves on the entry the page loaded on.
    window.history.replaceState({ __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ["tree"] }, "");
    render(<Host />);
    open("explorer");
    open("properties");
    expect(entry(1)).toEqual({
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: ["tree"],
      wbPhone: 1,
      load: expect.any(String),
    });
    expect(entry(2)).toMatchObject({ __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ["tree"], wbPhone: 2 });
    expect(entry(2).load).toBe(entry(1).load);

    // Depth still comes from our own keys, with Next's alongside them.
    pop(entry(1));
    expect(apps()).toEqual(["explorer"]);
    window.history.replaceState(null, "");
  });

  it("closes the top window on Back", () => {
    render(<Host />);
    open("explorer");
    open("properties");
    expect(apps()).toEqual(["explorer", "properties"]);

    pop(entry(1));
    expect(apps()).toEqual(["explorer"]);
    // Back closed it, so there's nothing of ours to drop.
    expect(go).not.toHaveBeenCalled();
  });

  it("returns to the launcher after two opens and two Backs", () => {
    render(<Host />);
    open("explorer");
    open("properties");
    pop(entry(1));
    pop(null); // the entry the page loaded on
    expect(apps()).toEqual([]);
    expect(go).not.toHaveBeenCalled();
  });

  it("drops our entry when the back gadget closes an app, without closing another", () => {
    render(<Host />);
    open("explorer");
    open("properties");

    const top = store().windows.find((w) => w.appId === "properties")!;
    act(() => store().closeWin(top.id));
    expect(go).toHaveBeenCalledWith(-1);

    // The popstate our own go(-1) causes.
    pop(entry(1));
    expect(apps()).toEqual(["explorer"]);

    // And a real Back after that still closes exactly one.
    pop(null);
    expect(apps()).toEqual([]);
  });

  it("undoes Forward into an entry whose app is already closed", () => {
    render(<Host />);
    open("explorer");
    pop(null);
    expect(apps()).toEqual([]);

    pop(entry(1));
    expect(go).toHaveBeenCalledWith(-1);
    expect(apps()).toEqual([]);
    pop(null); // the bounce back
    expect(apps()).toEqual([]);
  });

  it("ignores entries left by an earlier load", () => {
    render(<Host />);
    open("explorer");
    // An entry from before a reload: right shape, different load.
    pop({ wbPhone: 3, load: "an-earlier-load" });
    expect(apps()).toEqual([]);
    expect(go).not.toHaveBeenCalled();
    // At the launcher, more of them are no-ops.
    pop({ wbPhone: 2, load: "an-earlier-load" });
    expect(apps()).toEqual([]);
    expect(go).not.toHaveBeenCalled();
  });
});

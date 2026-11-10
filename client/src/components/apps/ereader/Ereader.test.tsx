import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Ereader, type EreaderPayload } from "@/components/apps/ereader/Ereader";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { useWindowStore } from "@/context/windowStore";
import type { LibraryDoc } from "@/data/library";

// useIsPhone sits on top of the mocked useShellMode; the real one would see null.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});

// Every Markdown file in the library today is a poem, which scrolls instead of
// paging, so one long piece is added for the text-paging tests. The rest of the
// library is the real generated data.
// (vi.hoisted, because the mock factory below runs before the module body.)
const LONG = vi.hoisted<LibraryDoc>(() => ({
  id: "writings/test-long",
  shelf: "Writings",
  title: "A long test piece",
  format: "md",
  src: "/library/Writings/test.md",
  fileName: "test.md",
  bytes: 5000,
  body: "word ".repeat(1000),
}));
vi.mock("@/data/library", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/data/library")>();
  return {
    ...real,
    LIBRARY: [...real.LIBRARY, LONG],
    docById: (id: string) => (id === LONG.id ? LONG : real.docById(id)),
  };
});

// jsdom can't lay out multicol text or run pdf.js, so both panes are stubs that
// report a page count the way the real ones do once measured or opened.
vi.mock("./TextPane", () => ({
  TextPane: ({ onPageCount, page }: { onPageCount: (n: number) => void; page: number }) => {
    useEffect(() => onPageCount(5), [onPageCount]);
    return <div data-testid="pane" data-page={page} />;
  },
}));
vi.mock("./PdfPane", () => ({
  PdfPane: ({ onPageCount, page }: { onPageCount: (n: number) => void; page: number }) => {
    useEffect(() => onPageCount(10), [onPageCount]);
    return <div data-testid="pane" data-page={page} />;
  },
}));

// Covers load lazily (IntersectionObserver) and PDF ones render through pdf.js;
// neither exists in jsdom, and covers aren't what's under test.
vi.mock("./DocCover", () => ({ DocCover: () => <span /> }));

const PDF_ID = "books/the-power-of-habit";

// The Ereader reads its state from the payload the window store holds, so render
// it the way the desktop does: from a real window, re-rendering as it changes.
function Host() {
  const win = useWindowStore((s) => s.windows.find((w) => w.appId === "ereader"))!;
  return <Ereader winId={win.id} payload={win.payload} />;
}
const show = (payload: EreaderPayload = {}) => {
  act(() => {
    const id = useWindowStore.getState().openApp("ereader");
    useWindowStore.getState().patchPayload(id, payload);
  });
  render(<Host />);
};
const saved = () =>
  useWindowStore.getState().windows.find((w) => w.appId === "ereader")!.payload as EreaderPayload;

/** A touch swipe across the page by dx; the pane stub sits inside the swipe surface. */
async function swipe(dx: number) {
  const el = await screen.findByTestId("pane");
  fireEvent.pointerDown(el, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 300 });
  fireEvent.pointerUp(el, { pointerType: "touch", pointerId: 1, clientX: 200 + dx, clientY: 300 });
}

beforeAll(() => {
  // ReaderView watches its pane's width to decide on a spread; jsdom has no
  // ResizeObserver, and a width of 0 (no spread) is all these tests need.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
});

// Vitest runs without globals here, so Testing Library can't register its own
// cleanup; without this each render would pile up in the same document.
afterEach(cleanup);

describe("Ereader on the desktop", () => {
  beforeEach(() => vi.mocked(useShellMode).mockReturnValue("desktop"));

  it("keeps the rail, opens a document from the library, and offers Spread", async () => {
    show({ view: "library" });
    expect(screen.getByRole("navigation", { name: "Library sections" })).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Read" })[0]);
    expect(saved().view).toBe("read");
    expect(await screen.findByTestId("pane")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Spread" })).toBeTruthy();
    // The rail stays beside the reader on the desktop.
    expect(screen.getByRole("navigation", { name: "Library sections" })).toBeTruthy();
  });

  it("doesn't turn pages on a swipe", async () => {
    show({ docId: LONG.id });
    await swipe(-120);
    expect(saved().page ?? 0).toBe(0);
  });
});

describe("Ereader on a phone", () => {
  beforeEach(() => vi.mocked(useShellMode).mockReturnValue("phone"));

  it("shows the sections as tabs, and hides them while reading", () => {
    show({ view: "library" });
    expect(screen.queryByRole("navigation", { name: "Library sections" })).toBeNull();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Home", "Library", "Shelves", "Info"]);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");

    fireEvent.click(tabs[2]);
    expect(saved().view).toBe("shelves");

    fireEvent.click(screen.getByRole("tab", { name: /Library/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Read" })[0]);
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("drops Spread from the reader toolbar", async () => {
    show({ docId: LONG.id });
    await screen.findByTestId("pane");
    expect(screen.queryByRole("button", { name: "Spread" })).toBeNull();
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Share" })).toBeTruthy();
  });

  it("turns a paged text document by swiping", async () => {
    show({ docId: LONG.id });
    await swipe(-120);
    expect(saved().page).toBe(1);
    await swipe(-120);
    expect(saved().page).toBe(2);
    await swipe(120);
    expect(saved().page).toBe(1);
  });

  it("turns a PDF by swiping at 100%", async () => {
    show({ docId: PDF_ID, zoom: 1 });
    await swipe(-120);
    expect(saved().page).toBe(1);
  });

  it("leaves a PDF zoomed past 100% to pan, while the edge buttons still turn it", async () => {
    show({ docId: PDF_ID, zoom: 1.5 });
    const pane = await screen.findByTestId("pane");
    expect(pane.parentElement!.className).toBe("");
    await swipe(-120);
    expect(saved().page ?? 0).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(saved().page).toBe(1);
  });
});

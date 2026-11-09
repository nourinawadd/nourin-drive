import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Explorer } from "@/components/apps/Explorer";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { useWindowStore } from "@/context/windowStore";
import { FS_ROOT, type FsFile, type FsFolder, type FsNode } from "@/data/fileTree";

// useIsPhone sits on top of the mocked useShellMode; the real one would see null.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});

// A real folder to open, and a real file whose action opens a window (so the
// test can see it ran), found in the tree rather than hard-coded, since the
// tree is built from generated data.
function* walk(node: FsFolder): Generator<[FsNode, FsFolder]> {
  for (const child of node.children) {
    yield [child, node];
    if (child.kind === "folder") yield* walk(child);
  }
}
const folder = FS_ROOT.children.find((c): c is FsFolder => c.kind === "folder")!;
const [file, fileParent] = [...walk(FS_ROOT)].find(
  ([n]) => n.kind === "file" && ["blog", "gallery", "app"].includes((n as FsFile).action.type),
) as [FsFile, FsFolder];

// Explorer reads its state from the payload the window store holds, so render it
// the way the desktop does: from a real window, re-rendering as it changes.
function Host() {
  const win = useWindowStore((s) => s.windows.find((w) => w.appId === "explorer"))!;
  return <Explorer winId={win.id} payload={win.payload} />;
}
const show = (folderId = FS_ROOT.id) => {
  act(() => {
    const id = useWindowStore.getState().openApp("explorer");
    useWindowStore.getState().patchPayload(id, { folderId });
  });
  render(<Host />);
};
const others = () => useWindowStore.getState().windows.filter((w) => w.appId !== "explorer");
const header = (name: string) => screen.getByText(`Contents of '${name}'`);
// The tree pane lists folders too, so look for items inside the contents pane.
const pane = (name: string) => within(header(name).parentElement!);

describe("Explorer on the desktop", () => {
  beforeEach(() => {
    vi.mocked(useShellMode).mockReturnValue("desktop");
    useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
  });

  afterEach(cleanup);

  it("selects on click and opens a folder on double-click", () => {
    show();
    const cell = pane(FS_ROOT.name).getByRole("button", { name: folder.name });
    fireEvent.click(cell);
    expect(header(FS_ROOT.name)).toBeTruthy();
    fireEvent.doubleClick(cell);
    expect(header(folder.name)).toBeTruthy();
  });

  it("runs a file's action on double-click", () => {
    show(fileParent.id);
    fireEvent.doubleClick(screen.getByRole("button", { name: file.name }));
    expect(others().length).toBe(1);
  });

  it("opens the file menu on right-click, without the pane's menu on top", () => {
    show(fileParent.id);
    const e = fireEvent.contextMenu(screen.getByRole("button", { name: file.name }));
    expect(e).toBe(false);
    expect(screen.getByRole("menuitem", { name: "Open" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Properties" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /View as List/ })).toBeNull();
  });

  it("opens the pane's menu on right-click in empty space", () => {
    show();
    fireEvent.contextMenu(header(FS_ROOT.name).parentElement!);
    expect(screen.getByRole("menuitem", { name: /View as List/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Up One Level" })).toBeTruthy();
  });

  it("does the same in list view: double-click opens, right-click gives the file menu", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /List/ }));
    const row = pane(FS_ROOT.name).getByText(folder.name);
    fireEvent.contextMenu(row);
    expect(screen.getByRole("menuitem", { name: "Properties" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /View as List/ })).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.doubleClick(row);
    expect(header(folder.name)).toBeTruthy();
  });

  it("opens Properties for the file from its menu", () => {
    show(fileParent.id);
    fireEvent.contextMenu(screen.getByRole("button", { name: file.name }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Properties" }));
    const props = others().find((w) => w.appId === "properties");
    expect(props?.title).toBe(`${file.name} Properties`);
    expect((props?.payload as { name: string }).name).toBe(file.name);
  });
});

describe("Explorer on a phone", () => {
  beforeEach(() => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const crumbs = () => within(screen.getByRole("navigation", { name: "Folder path" }));

  it("drops the tree and menu bar, and says tap", () => {
    show();
    expect(screen.queryByText("All Folders")).toBeNull();
    expect(screen.queryByRole("button", { name: "File" })).toBeNull();
    expect(screen.getByText(/tap to open · hold for properties/)).toBeTruthy();
  });

  it("opens a folder with one tap, and a crumb goes back up", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: folder.name }));
    expect(header(folder.name)).toBeTruthy();
    expect(crumbs().getByRole("button", { name: folder.name }).getAttribute("aria-current")).toBe("page");

    fireEvent.click(crumbs().getByRole("button", { name: FS_ROOT.name }));
    expect(header(FS_ROOT.name)).toBeTruthy();
  });

  it("runs a file's action with one tap", () => {
    show(fileParent.id);
    fireEvent.click(screen.getByRole("button", { name: file.name }));
    expect(others().length).toBe(1);
  });

  it("puts type and date under the name in list view", () => {
    show(fileParent.id);
    fireEvent.click(screen.getByRole("button", { name: /List/ }));
    const type = file.date ? `${file.typeLabel} · ${file.date}` : file.typeLabel;
    expect(screen.getByText(type)).toBeTruthy();
  });

  it("opens Properties from a long press", () => {
    vi.useFakeTimers();
    show(fileParent.id);
    const cell = screen.getByRole("button", { name: file.name });
    fireEvent.pointerDown(cell, { pointerType: "touch", pointerId: 1, isPrimary: true, clientX: 9, clientY: 9 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(cell, { pointerType: "touch", pointerId: 1, isPrimary: true });
    fireEvent.click(cell); // the lifting finger's click: must not open the file
    expect(others()).toEqual([]);

    fireEvent.click(screen.getByRole("menuitem", { name: "Properties" }));
    expect(others().map((w) => w.appId)).toEqual(["properties"]);
  });
});

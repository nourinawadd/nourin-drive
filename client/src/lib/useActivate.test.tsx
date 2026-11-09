import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { useActivate } from "@/lib/useActivate";
import type { ShellMode } from "@/lib/shellMode";

vi.mock("@/components/os/ShellModeProvider", () => ({ useShellMode: vi.fn() }));

const onSelect = vi.fn();
const onOpen = vi.fn();

function Item() {
  const activate = useActivate();
  return <div {...activate({ onSelect, onOpen })}>item</div>;
}

const renderIn = (mode: ShellMode | null) => {
  vi.mocked(useShellMode).mockReturnValue(mode);
  render(<Item />);
  return screen.getByText("item");
};

describe("useActivate", () => {
  beforeEach(() => {
    onSelect.mockClear();
    onOpen.mockClear();
  });

  // Vitest runs without globals here, so Testing Library can't register its own
  // cleanup; without this each render would pile up in the same document.
  afterEach(cleanup);

  it.each(["desktop", null] as const)("in %s mode, click selects and double-click opens", (mode) => {
    const item = renderIn(mode);
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.doubleClick(item);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("on a phone, one tap selects and opens", () => {
    const item = renderIn("phone");
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("on a phone, a double tap never opens through dblclick", () => {
    const item = renderIn("phone");
    fireEvent.doubleClick(item);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("works without onSelect", () => {
    vi.mocked(useShellMode).mockReturnValue("phone");
    function Bare() {
      const activate = useActivate();
      return <div {...activate({ onOpen })}>bare</div>;
    }
    render(<Bare />);
    fireEvent.click(screen.getByText("bare"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

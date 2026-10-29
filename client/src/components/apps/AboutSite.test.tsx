import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AboutSite } from "@/components/apps/AboutSite";
import { KEY_README_SEEN } from "@/lib/localStore";

vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));

describe("AboutSite", () => {
  beforeEach(() => window.localStorage.clear());

  it("marks the readme seen when opened by hand", () => {
    expect(window.localStorage.getItem(KEY_README_SEEN)).toBeNull();
    render(<AboutSite />);
    expect(window.localStorage.getItem(KEY_README_SEEN)).toBe("1");
  });
});

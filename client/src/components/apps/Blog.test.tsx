import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Blog } from "@/components/apps/Blog";
import { useShellMode } from "@/components/os/ShellModeProvider";
import { BLOG_URL, POSTS, postUrl } from "@/data/blog";

// useIsPhone sits on top of the mocked useShellMode; the real one would see null.
vi.mock("@/components/os/ShellModeProvider", () => {
  const useShellMode = vi.fn();
  return { useShellMode, useIsPhone: () => useShellMode() === "phone" };
});
// The desktop frame asks the API for post stats; nothing should leave the test.
vi.mock("@/lib/api", () => ({ getPostStats: vi.fn(() => new Promise(() => {})) }));

const show = (payload?: unknown) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Blog winId="w" payload={payload} />
    </QueryClientProvider>,
  );

describe("Blog", () => {
  afterEach(cleanup);

  it("frames the blog on the desktop, as before", () => {
    vi.mocked(useShellMode).mockReturnValue("desktop");
    show();
    expect(screen.getByTitle("Blog").tagName).toBe("IFRAME");
  });

  describe("on a phone", () => {
    const link = () => screen.getByRole("link", { name: /Read the/ }) as HTMLAnchorElement;

    it("hands off to the blog's own site in a new tab, with no iframe", () => {
      vi.mocked(useShellMode).mockReturnValue("phone");
      const { container } = show();
      expect(container.querySelector("iframe")).toBeNull();
      expect(link().getAttribute("href")).toBe(`${BLOG_URL}/`);
      expect(link().target).toBe("_blank");
      expect(link().rel).toContain("noopener");
    });

    it("links straight to a post when it was opened for one", () => {
      vi.mocked(useShellMode).mockReturnValue("phone");
      const post = POSTS[0];
      if (!post) return; // no generated posts in this checkout
      show({ slug: post.slug });
      expect(screen.getByRole("heading", { name: post.title })).toBeTruthy();
      expect(link().getAttribute("href")).toBe(postUrl(post.slug));
    });

    it("honours an explicit url", () => {
      vi.mocked(useShellMode).mockReturnValue("phone");
      show({ url: "https://blog.example/x" });
      expect(link().getAttribute("href")).toBe("https://blog.example/x");
    });
  });
});

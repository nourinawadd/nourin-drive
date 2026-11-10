import { useEffect } from "react";
import { useWindowStore } from "@/context/windowStore";
import { findPost } from "@/data/blog";
import { deepLinkParams } from "@/lib/deepLink";

// Lives here rather than in app/page.tsx so both shells can call it: the
// desktop and the phone shell are siblings under MobileGate, and since Phase 5
// a shared link opens inside whichever one the visitor gets.

/**
 * `?doc=<id>` opens the Ereader on that document - the link the reader's Share
 * button hands out. `?post=<slug>` does the same for a blog post, and
 * `?photo=<id>` opens the Gallery lightbox. The param is
 * stripped afterwards so a reload doesn't reopen the window (and so the URL
 * stays clean once you're in the desktop).
 */
export function useDeepLink() {
  const openApp = useWindowStore((s) => s.openApp);
  useEffect(() => {
    const params = deepLinkParams();
    const docId = params.get("doc");
    const postSlug = params.get("post");
    const photoId = params.get("photo");
    if (!docId && !postSlug && !photoId) return;

    if (docId) openApp("ereader", { payload: { docId, view: "read" } });
    if (photoId) openApp("gallery", { payload: { focusId: photoId } });
    if (postSlug) {
      const post = findPost(postSlug);
      openApp("blog", { payload: { slug: postSlug }, title: post ? post.title : "Blog" });
    }

    params.delete("doc");
    params.delete("post");
    params.delete("photo");
    // These params come from the query captured at load, which may still hold
    // `mode` even though lib/shellMode.ts has already stripped it from the
    // address bar. Without this, writing the rest back would put it right back.
    params.delete("mode");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
  }, [openApp]);
}

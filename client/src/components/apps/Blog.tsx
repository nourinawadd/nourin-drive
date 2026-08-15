"use client";

import { useEffect, useRef, useState } from "react";
import { BLOG_URL, findPost, postUrl } from "@/data/blog";
import { useWindowStore } from "@/context/windowStore";

const LOAD_TIMEOUT_MS = 4000;

export type BlogPayload = { slug?: string; url?: string };

function urlFor(payload: BlogPayload | undefined): string {
  if (payload?.url) return payload.url;
  if (payload?.slug) return postUrl(payload.slug);
  return `${BLOG_URL}/`;
}

export function Blog({ winId, payload }: { winId: string; payload?: unknown }) {
  const patchPayload = useWindowStore((s) => s.patchPayload);

  const p = payload as BlogPayload | undefined;
  const url = urlFor(p);

  const [status, setStatus] = useState<"loading" | "ok" | "blocked">("loading");
  const [nonce, setNonce] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setStatus("loading");
    const t = window.setTimeout(() => setStatus("blocked"), LOAD_TIMEOUT_MS);
    timerRef.current = t;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [url, nonce]);

  function goHome() {
    patchPayload(winId, { slug: undefined, url: undefined });
    setNonce((n) => n + 1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 4 }}>
      <div style={chrome}>
        <button style={chromeBtn} onClick={() => setNonce((n) => n + 1)} title="Reload">⟳</button>
        <button style={chromeBtn} onClick={goHome} title="Blog index">⌂</button>
        <span style={address} title={url}>{url}</span>
        <a style={openBtn} href={url} target="_blank" rel="noopener noreferrer" title="Open in a real browser tab">
          Open ↗
        </a>
      </div>

      <div style={viewport}>
        <iframe
          key={`${url}#${nonce}`}
          src={url}
          title="Blog"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => {
            if (timerRef.current) {
              window.clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setStatus("ok");
          }}
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid var(--wb-black)",
            background: "var(--wb-paper)",
          }}
        />
        {status === "blocked" && <OfflinePanel url={url} />}
        {status === "loading" && <LoadingPanel />}
      </div>
    </div>
  );
}

function OfflinePanel({ url }: { url: string }) {
  const post = (() => {
    const m = url.match(/\/posts\/([^/]+)\.html$/);
    return m ? findPost(m[1]) : undefined;
  })();

  return (
    <div style={overlay}>
      <div style={panel}>
        <strong>The blog didn&apos;t load.</strong>
        <p style={{ margin: "8px 0 12px", fontSize: 13 }}>
          {post ? `“${post.title}” lives at ` : "It lives at "}
          <code>{url}</code>
          {" — it&apos;s a separate site, so it may be down, or not running locally yet."}
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer" style={openTabBtn}>
          Try it in a new tab ↗
        </a>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div style={{ ...overlay, background: "rgba(255,255,255,0.4)" }}>
      <div style={{ ...panel, width: 200 }}>loading…</div>
    </div>
  );
}

const chrome: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: 4,
  paddingBottom: 3,
  borderBottom: "1px solid var(--wb-black)",
};

const chromeBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  padding: "0 10px",
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
  cursor: "pointer",
  color: "var(--wb-black)",
};

const address: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  padding: "2px 6px",
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  color: "var(--wb-black)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const openBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
  padding: "0 10px",
  background: "var(--wb-orange)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-yellow), inset -1px -1px 0 var(--wb-orange-d)",
  color: "var(--wb-black)",
  textDecoration: "none",
};

const viewport: React.CSSProperties = {
  flex: 1,
  position: "relative",
  minHeight: 0,
};

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  background: "var(--wb-white)",
  padding: 16,
};

const panel: React.CSSProperties = {
  width: 360,
  background: "var(--wb-white)",
  border: "2px solid var(--wb-black)",
  padding: 14,
  textAlign: "center",
  boxShadow: "4px 4px 0 var(--wb-black)",
};

const openTabBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  background: "var(--wb-orange)",
  border: "1px solid var(--wb-black)",
  color: "var(--wb-black)",
  textDecoration: "none",
  fontSize: 13,
};

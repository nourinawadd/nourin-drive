"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getBlog, listBlog, type BlogPostSummary } from "@/lib/api";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function Blog() {
  const [selected, setSelected] = useState<string | null>(null);

  const listQ = useQuery({ queryKey: ["blog"], queryFn: listBlog });
  const postQ = useQuery({
    queryKey: ["blog", selected],
    queryFn: () => getBlog(selected!),
    enabled: !!selected,
  });

  return (
    <div style={{ display: "flex", height: "100%", gap: 4 }}>
      <aside style={sidebar}>
        <div style={sidebarHeader}>Posts</div>
        {listQ.isLoading && <div style={msg}>loading…</div>}
        {listQ.isError && <div style={{ ...msg, color: "#a00" }}>could not reach server</div>}
        {listQ.data?.length === 0 && <div style={msg}>no posts yet.</div>}
        {listQ.data?.map((p) => (
          <button
            key={p._id}
            onClick={() => setSelected(p.slug)}
            style={{
              ...postRow,
              background: selected === p.slug ? "var(--wb-orange)" : "transparent",
            }}
          >
            <strong style={{ fontSize: 12 }}>{p.title}</strong>
            <span style={{ fontSize: 10, opacity: 0.7 }}>{fmt(p.createdAt)}</span>
          </button>
        ))}
      </aside>

      <section style={pane}>
        {!selected && <div style={msg}>select a post.</div>}
        {selected && postQ.isLoading && <div style={msg}>loading post…</div>}
        {selected && postQ.isError && <div style={{ ...msg, color: "#a00" }}>could not load post</div>}
        {postQ.data && (
          <article style={article}>
            <header style={{ marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 18 }}>{postQ.data.title}</h1>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {fmt(postQ.data.createdAt)}
                {postQ.data.tags.length > 0 && ` · ${postQ.data.tags.join(", ")}`}
              </div>
            </header>
            <div className="wb-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{postQ.data.content}</ReactMarkdown>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

const sidebar: React.CSSProperties = {
  width: 160,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
  flexShrink: 0,
};
const sidebarHeader: React.CSSProperties = {
  fontSize: 12, fontWeight: "bold", padding: "2px 6px",
  background: "var(--wb-black)", color: "var(--wb-white)",
};
const postRow: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "flex-start",
  padding: "3px 6px", gap: 1,
  border: "none", borderBottom: "1px solid #eee",
  cursor: "pointer", textAlign: "left",
  fontFamily: "var(--wb-font)", color: "var(--wb-black)",
};
const pane: React.CSSProperties = {
  flex: 1, overflow: "auto",
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
  padding: 8, minWidth: 0,
};
const article: React.CSSProperties = { fontFamily: "var(--wb-font)", fontSize: 14 };
const msg: React.CSSProperties = { padding: 8, fontSize: 12, opacity: 0.6 };

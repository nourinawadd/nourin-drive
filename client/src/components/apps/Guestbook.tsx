"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listGuestbook, postGuestbook, type GuestbookEntry } from "@/lib/api";

const EMOJIS = ["★", "♥", "✿", "☻", "♪", "✦", "☼", "✈", "✧", "♫"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function Guestbook() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState<string>("");

  const entriesQ = useQuery({ queryKey: ["guestbook"], queryFn: listGuestbook });

  const mutation = useMutation({
    mutationFn: postGuestbook,
    onSuccess: () => {
      setName("");
      setMessage("");
      setEmoji("");
      qc.invalidateQueries({ queryKey: ["guestbook"] });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    mutation.mutate({ name: name.trim(), message: message.trim(), emoji: emoji || undefined });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 6 }}>
      <form onSubmit={submit} style={form}>
        <div style={row}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            maxLength={40}
            style={{ ...input, flex: 1 }}
          />
          <button type="submit" disabled={mutation.isPending} style={signBtn}>
            {mutation.isPending ? "..." : "Sign"}
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="leave a message"
          maxLength={280}
          rows={2}
          style={{ ...input, resize: "vertical" }}
        />
        <div style={emojiRow}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(emoji === e ? "" : e)}
              style={{
                ...emojiChip,
                background: emoji === e ? "var(--wb-orange)" : "var(--wb-white)",
              }}
            >
              {e}
            </button>
          ))}
        </div>
        {mutation.isError && (
          <div style={errMsg}>
            {(mutation.error as Error)?.message ?? "failed to post"}
          </div>
        )}
      </form>

      <div style={listWrap}>
        {entriesQ.isLoading && <div style={msg}>loading…</div>}
        {entriesQ.isError && <div style={{ ...msg, color: "#a00" }}>could not reach server</div>}
        {entriesQ.data?.length === 0 && <div style={msg}>be the first to sign.</div>}
        {entriesQ.data?.map((e) => <EntryRow key={e._id} entry={e} />)}
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: GuestbookEntry }) {
  return (
    <div style={entryStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        <strong style={{ fontSize: 13 }}>
          {entry.emoji ? <span style={{ marginRight: 4 }}>{entry.emoji}</span> : null}
          {entry.name}
        </strong>
        <span style={{ fontSize: 11, opacity: 0.6 }}>{formatDate(entry.createdAt)}</span>
      </div>
      <div style={{ fontSize: 13, marginTop: 2, whiteSpace: "pre-wrap" }}>{entry.message}</div>
    </div>
  );
}

const form: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  padding: 6,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
};
const row: React.CSSProperties = { display: "flex", gap: 4 };
const input: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 13, padding: "2px 6px",
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
  outline: "none", color: "var(--wb-black)",
};
const signBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 13, padding: "2px 14px",
  background: "var(--wb-orange)", border: "1px solid var(--wb-black)",
  cursor: "pointer", color: "var(--wb-black)",
};
const emojiRow: React.CSSProperties = { display: "flex", gap: 2, flexWrap: "wrap" };
const emojiChip: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 14, padding: "0 6px",
  border: "1px solid var(--wb-black)", cursor: "pointer",
  color: "var(--wb-black)",
};
const errMsg: React.CSSProperties = { fontSize: 11, color: "#a00" };
const listWrap: React.CSSProperties = {
  flex: 1, overflow: "auto",
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
};
const msg: React.CSSProperties = { padding: 8, fontSize: 12, opacity: 0.6 };
const entryStyle: React.CSSProperties = {
  padding: "4px 6px", borderBottom: "1px solid #eee",
};

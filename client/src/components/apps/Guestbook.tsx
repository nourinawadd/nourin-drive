"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiErrorMessage,
  getGuestbookStats,
  listGuestbook,
  postGuestbook,
  type GuestbookEntry,
} from "@/lib/api";
import { markSigned } from "@/components/os/GuestbookStand";

const EMOJIS = ["★", "♥", "✿", "☻", "♪", "✦", "☼", "✈", "✧", "♫"];

const MARQUEE =
  "★ WELCOME TO MY GUESTBOOK ★ PLEASE SIGN BEFORE YOU LEAVE ★ THANKS FOR VISITING ★";

/** An entry is NEW! for two days - long enough that a weekend visitor still sees it. */
const NEW_FOR_MS = 48 * 60 * 60 * 1000;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isNew(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < NEW_FOR_MS;
}

export function Guestbook() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState<string>("");

  const entriesQ = useQuery({ queryKey: ["guestbook"], queryFn: listGuestbook });
  // Same key the desktop stand uses, so react-query serves both from one fetch.
  const statsQ = useQuery({ queryKey: ["guestbook", "stats"], queryFn: getGuestbookStats });

  const mutation = useMutation({
    mutationFn: postGuestbook,
    onSuccess: () => {
      setName("");
      setMessage("");
      setEmoji("");
      // Silences the stand's pulse - it polls this flag.
      markSigned();
      qc.invalidateQueries({ queryKey: ["guestbook"] });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    mutation.mutate({ name: name.trim(), message: message.trim(), emoji: emoji || undefined });
  }

  const entries = entriesQ.data ?? [];
  const total = statsQ.data?.signatures ?? entries.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div className="wb-marquee" aria-hidden>
        <div className="wb-marquee-track">
          <span>{MARQUEE}</span>
          <span>{MARQUEE}</span>
        </div>
      </div>

      <div style={counterLine}>
        <span>
          <strong>{total}</strong> signature{total === 1 ? "" : "s"} in the book
        </span>
        {statsQ.data && (
          <span>
            visitor count: <strong>{statsQ.data.visits}</strong>
          </span>
        )}
      </div>

      <form onSubmit={submit} style={form}>
        <div style={row}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            maxLength={40}
            style={{ ...input, flex: 1 }}
            aria-label="Your name"
          />
          <button type="submit" disabled={mutation.isPending} style={signBtn}>
            {mutation.isPending ? "signing…" : "✎ Sign"}
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="leave a message"
          maxLength={280}
          rows={3}
          style={{ ...input, resize: "vertical" }}
          aria-label="Your message"
        />
        <div style={emojiRow}>
          <span style={emojiLabel}>pick a mark:</span>
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(emoji === e ? "" : e)}
              aria-pressed={emoji === e}
              style={{
                ...emojiChip,
                background: emoji === e ? "var(--wb-orange)" : "var(--wb-white)",
              }}
            >
              {e}
            </button>
          ))}
        </div>
        {mutation.isError && <div style={errMsg}>{apiErrorMessage(mutation.error)}</div>}
      </form>

      <div style={listWrap}>
        {entriesQ.isLoading && <div style={msg}>loading…</div>}
        {entriesQ.isError && <div style={{ ...msg, color: "#a00" }}>could not reach server</div>}
        {!entriesQ.isLoading && !entriesQ.isError && entries.length === 0 && (
          <div style={msg}>be the first to sign.</div>
        )}
        {entries.map((e, i) => (
          <div key={e._id}>
            {i > 0 && <AsciiRule />}
            {/* Entries written before numbering existed have no seq; count back
                from the total instead, which is exact while the list is uncut. */}
            <EntryRow entry={e} fallbackNumber={total - i} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AsciiRule() {
  return (
    <div className="wb-gb-rule" aria-hidden>
      ~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~
    </div>
  );
}

function EntryRow({ entry, fallbackNumber }: { entry: GuestbookEntry; fallbackNumber: number }) {
  const number = entry.seq ?? fallbackNumber;
  return (
    <div style={entryStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
        <div>
          <span className="wb-gb-seq">#{number}</span>{" "}
          <strong style={{ fontSize: 15 }}>
            {entry.emoji ? <span style={{ marginRight: 4 }}>{entry.emoji}</span> : null}
            {entry.name}
          </strong>
          {isNew(entry.createdAt) && (
            <span className="wb-gb-new wb-blink" role="status">
              NEW!
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, opacity: 0.6, whiteSpace: "nowrap" }}>
          {formatDate(entry.createdAt)}
        </span>
      </div>

      <div style={{ fontSize: 15, marginTop: 3, whiteSpace: "pre-wrap", lineHeight: 1.3 }}>
        {entry.message}
      </div>

      {entry.reply && (
        <div className="wb-gb-reply">
          <span className="wb-gb-reply-who">&gt;&gt; webmaster:</span>{" "}
          <span style={{ whiteSpace: "pre-wrap" }}>{entry.reply}</span>
        </div>
      )}
    </div>
  );
}

const counterLine: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", gap: 12,
  fontSize: 14, padding: "0 2px", color: "var(--wb-black)",
};
const form: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 6,
  padding: 8,
  background: "var(--wb-gray)",
  border: "1px solid var(--wb-black)",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
};
const row: React.CSSProperties = { display: "flex", gap: 6 };
const input: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 15, padding: "4px 6px",
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
  outline: "none", color: "var(--wb-black)",
};
const signBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 15, padding: "4px 18px",
  background: "var(--wb-orange)", border: "1px solid var(--wb-black)",
  cursor: "pointer", color: "var(--wb-black)",
};
const emojiRow: React.CSSProperties = { display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" };
const emojiLabel: React.CSSProperties = { fontSize: 14, opacity: 0.75, marginRight: 2 };
const emojiChip: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 16, padding: "1px 7px",
  border: "1px solid var(--wb-black)", cursor: "pointer",
  color: "var(--wb-black)",
};
const errMsg: React.CSSProperties = { fontSize: 14, color: "#a00" };
const listWrap: React.CSSProperties = {
  flex: 1, overflow: "auto",
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
  padding: "2px 8px",
};
const msg: React.CSSProperties = { padding: 8, fontSize: 14, opacity: 0.6 };
const entryStyle: React.CSSProperties = { padding: "6px 2px" };

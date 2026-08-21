"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiErrorMessage,
  deleteComment,
  deleteGuestbookEntry,
  isUnauthorized,
  listAllComments,
  listAllGuestbook,
  replyToComment,
  replyToGuestbook,
  setCommentHidden,
  setGuestbookHidden,
  type BlogComment,
  type ModeratedEntry,
} from "@/lib/api";
import { KEY_ADMIN, clearKey, readJson, writeJson } from "@/lib/localStore";

type Tab = "guestbook" | "comments";

type Row = {
  id: string;
  seq?: number;
  who: string;
  what: string;
  when: string;
  where?: string;
  hidden: boolean;
  reply?: string;
};

const entryRow = (e: ModeratedEntry): Row => ({
  id: e._id,
  seq: e.seq,
  who: e.name || "anonymous",
  what: e.message,
  when: e.createdAt,
  hidden: !!e.hidden,
  reply: e.reply,
});

const commentRow = (c: BlogComment): Row => ({
  id: c._id,
  seq: c.seq,
  who: c.name || "anonymous",
  what: c.message,
  when: c.createdAt,
  where: c.slug,
  hidden: !!c.hidden,
  reply: c.reply,
});

export function Moderation() {
  const [token, setToken] = useState("");
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<Tab>("guestbook");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const saved = readJson<string>(KEY_ADMIN) ?? "";
    setToken(saved);
    setDraft(saved);
  }, []);

  const qc = useQueryClient();

  const entriesQ = useQuery({
    queryKey: ["mod", "guestbook", token],
    queryFn: () => listAllGuestbook(token),
    enabled: !!token && tab === "guestbook",
    retry: false,
  });

  const commentsQ = useQuery({
    queryKey: ["mod", "comments", token],
    queryFn: () => listAllComments(token),
    enabled: !!token && tab === "comments",
    retry: false,
  });

  const active = tab === "guestbook" ? entriesQ : commentsQ;
  const activeError = active.error;

  useEffect(() => {
    if (!activeError) return;
    if (isUnauthorized(activeError)) {
      clearKey(KEY_ADMIN);
      setToken("");
      setNote("that key was rejected");
    } else {
      setNote(apiErrorMessage(activeError));
    }
  }, [activeError]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["mod"] });
    qc.invalidateQueries({ queryKey: ["guestbook"] });
  }

  const hideM = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      tab === "guestbook"
        ? setGuestbookHidden(token, id, hidden)
        : setCommentHidden(token, id, hidden),
    onSuccess: refresh,
    onError: (e) => setNote(apiErrorMessage(e)),
  });

  const replyM = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      tab === "guestbook" ? replyToGuestbook(token, id, reply) : replyToComment(token, id, reply),
    onSuccess: refresh,
    onError: (e) => setNote(apiErrorMessage(e)),
  });

  const delM = useMutation({
    mutationFn: (id: string) =>
      tab === "guestbook" ? deleteGuestbookEntry(token, id) : deleteComment(token, id),
    onSuccess: refresh,
    onError: (e) => setNote(apiErrorMessage(e)),
  });

  const rows: Row[] =
    tab === "guestbook"
      ? (entriesQ.data ?? []).map(entryRow)
      : (commentsQ.data ?? []).map(commentRow);

  const busy = hideM.isPending || replyM.isPending || delM.isPending;

  return (
    <div style={wrap}>
      <div style={bar}>
        <button
          style={{ ...tabBtn, ...(tab === "guestbook" ? tabOn : null) }}
          onClick={() => setTab("guestbook")}
        >
          Guestbook
        </button>
        <button
          style={{ ...tabBtn, ...(tab === "comments" ? tabOn : null) }}
          onClick={() => setTab("comments")}
        >
          Blog comments
        </button>
        <span style={{ flex: 1 }} />
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="admin key"
          style={keyInput}
        />
        <button
          style={tabBtn}
          onClick={() => {
            const next = draft.trim();
            writeJson(KEY_ADMIN, next);
            setToken(next);
            setNote(null);
          }}
        >
          Use key
        </button>
      </div>

      {note && <div style={noteBar}>{note}</div>}

      <div style={list}>
        {!token && <p style={empty}>Paste the admin key to load anything.</p>}
        {token && active.isLoading && <p style={empty}>Loading&hellip;</p>}
        {token && !active.isLoading && !rows.length && <p style={empty}>Nothing here.</p>}
        {rows.map((r) => (
          <Entry
            key={r.id}
            row={r}
            busy={busy}
            onHide={(hidden) => hideM.mutate({ id: r.id, hidden })}
            onReply={(reply) => replyM.mutate({ id: r.id, reply })}
            onDelete={() => delM.mutate(r.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Entry({
  row, busy, onHide, onReply, onDelete,
}: {
  row: Row;
  busy: boolean;
  onHide: (hidden: boolean) => void;
  onReply: (reply: string) => void;
  onDelete: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState(row.reply ?? "");
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ ...card, opacity: row.hidden ? 0.55 : 1 }}>
      <div style={meta}>
        <strong>{row.who}</strong>
        {row.seq != null && <span> #{row.seq}</span>}
        {row.where && <span> &middot; {row.where}</span>}
        <span> &middot; {new Date(row.when).toLocaleDateString()}</span>
        {row.hidden && <span style={hiddenTag}> hidden</span>}
      </div>

      <div style={{ textDecoration: row.hidden ? "line-through" : "none" }}>{row.what}</div>

      {row.reply && !replying && <div style={replyLine}>&rarr; {row.reply}</div>}

      {replying && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            style={replyBox}
            placeholder="Reply as the webmaster"
          />
          <button
            style={btn}
            disabled={busy || !text.trim()}
            onClick={() => { onReply(text.trim()); setReplying(false); }}
          >
            Send
          </button>
          <button style={btn} onClick={() => setReplying(false)}>Cancel</button>
        </div>
      )}

      <div style={actions}>
        <button style={btn} disabled={busy} onClick={() => onHide(!row.hidden)}>
          {row.hidden ? "Show" : "Hide"}
        </button>
        {!replying && (
          <button style={btn} disabled={busy} onClick={() => setReplying(true)}>
            {row.reply ? "Edit reply" : "Reply"}
          </button>
        )}
        {confirming ? (
          <>
            <button
              style={{ ...btn, background: "var(--wb-red)" }}
              disabled={busy}
              onClick={() => { onDelete(); setConfirming(false); }}
            >
              Delete for good
            </button>
            <button style={btn} onClick={() => setConfirming(false)}>Cancel</button>
          </>
        ) : (
          <button style={btn} disabled={busy} onClick={() => setConfirming(true)}>Delete</button>
        )}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  fontFamily: "var(--wb-font)",
  fontSize: 14,
};
const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: 6,
  borderBottom: "1px solid var(--wb-black)",
  background: "var(--wb-gray)",
};
const tabBtn: React.CSSProperties = {
  padding: "3px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  background: "var(--wb-gray)",
  color: "var(--wb-black)",
  border: "1px solid var(--wb-black)",
  cursor: "pointer",
  boxShadow: "inset 1px 1px 0 var(--wb-white), inset -1px -1px 0 var(--wb-gray-2)",
};
const tabOn: React.CSSProperties = { background: "var(--wb-orange)" };
const keyInput: React.CSSProperties = {
  width: 150,
  padding: "3px 6px",
  fontFamily: "inherit",
  fontSize: 13,
  border: "1px solid var(--wb-black)",
  background: "var(--wb-white)",
};
const noteBar: React.CSSProperties = {
  padding: "4px 8px",
  background: "var(--wb-red)",
  color: "var(--wb-white)",
  fontSize: 13,
};
const list: React.CSSProperties = { flex: 1, minHeight: 0, overflowY: "auto", padding: 8 };
const empty: React.CSSProperties = { opacity: 0.7, padding: 8 };
const card: React.CSSProperties = {
  padding: 8,
  marginBottom: 8,
  background: "var(--wb-white)",
  border: "1px solid var(--wb-black)",
};
const meta: React.CSSProperties = { fontSize: 12, opacity: 0.75, marginBottom: 4 };
const hiddenTag: React.CSSProperties = { color: "var(--wb-red)", fontWeight: "bold" };
const replyLine: React.CSSProperties = {
  marginTop: 6,
  paddingLeft: 10,
  borderLeft: "2px solid var(--wb-gray-2)",
  opacity: 0.85,
};
const replyBox: React.CSSProperties = {
  flex: 1,
  fontFamily: "inherit",
  fontSize: 13,
  padding: 4,
  border: "1px solid var(--wb-black)",
  resize: "none",
};
const actions: React.CSSProperties = { display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" };
const btn: React.CSSProperties = { ...tabBtn, fontSize: 12 };

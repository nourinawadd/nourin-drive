"use client";

import { useEffect, useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import { PRESETS, PRESET_GROUPS, type Header, type Method, type Preset } from "@/components/apps/api/presets";

const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type SendState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "done";
      status: number;
      statusText: string;
      ms: number;
      headers: Record<string, string>;
      body: string;
      contentType: string;
    }
  | { kind: "error"; message: string };

export function APIStudio() {
  const [selected, setSelected] = useState<string>(PRESETS[0].id);
  const [method, setMethod] = useState<Method>(PRESETS[0].method);
  const [url, setUrl] = useState<string>(PRESETS[0].url);
  const [headers, setHeaders] = useState<Header[]>(PRESETS[0].headers ?? []);
  const [body, setBody] = useState<string>(PRESETS[0].body ?? "");
  const [tab, setTab] = useState<"headers" | "body">("body");
  const [respTab, setRespTab] = useState<"body" | "headers">("body");
  const [state, setState] = useState<SendState>({ kind: "idle" });

  function loadPreset(p: Preset) {
    setSelected(p.id);
    setMethod(p.method);
    setUrl(p.url);
    setHeaders(p.headers ?? []);
    setBody(p.body ?? "");
    setState({ kind: "idle" });
  }

  async function send() {
    setState({ kind: "loading" });
    const t0 = performance.now();
    try {
      const init: RequestInit = { method };
      if (headers.length) {
        init.headers = Object.fromEntries(
          headers.filter((h) => h.key).map((h) => [h.key, h.value]),
        );
      }
      if (method !== "GET" && method !== "DELETE" && body) {
        init.body = body;
      }
      const res = await fetch(url, init);
      const ms = Math.round(performance.now() - t0);
      const headersOut: Record<string, string> = {};
      res.headers.forEach((v, k) => { headersOut[k] = v; });
      const text = await res.text();
      const contentType = res.headers.get("content-type") ?? "";
      setState({
        kind: "done",
        status: res.status,
        statusText: res.statusText,
        ms,
        headers: headersOut,
        body: text,
        contentType,
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 4 }}>
      {/* sidebar */}
      <aside style={sidebar}>
        <div style={sidebarHeader}>Saved</div>
        {PRESET_GROUPS.map((group) => (
          <div key={group}>
            <div style={groupHeader}>{group}</div>
            {PRESETS.filter((p) => p.group === group).map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p)}
                title={p.url}
                style={{
                  ...presetRow,
                  width: "100%",
                  background: selected === p.id ? "var(--wb-orange)" : "transparent",
                }}
              >
                <span style={methodBadge(p.method)}>{p.method}</span>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* editor + response */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        {/* request line */}
        <div style={{ display: "flex", gap: 4 }}>
          <select value={method} onChange={(e) => setMethod(e.target.value as Method)} style={selectStyle}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            spellCheck={false}
            style={inputStyle}
          />
          <button onClick={send} style={sendBtn} disabled={state.kind === "loading"}>
            {state.kind === "loading" ? "..." : "Send"}
          </button>
        </div>

        {/* request tabs */}
        <div style={tabRow}>
          <Tab active={tab === "body"} onClick={() => setTab("body")}>Body</Tab>
          <Tab active={tab === "headers"} onClick={() => setTab("headers")}>
            Headers {headers.length ? `(${headers.length})` : ""}
          </Tab>
        </div>

        <div style={tabPanel}>
          {tab === "body" ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={method === "GET" ? "(GET requests don't send a body)" : "request body…"}
              style={textareaStyle}
              spellCheck={false}
            />
          ) : (
            <HeadersEditor headers={headers} onChange={setHeaders} />
          )}
        </div>

        {/* response */}
        <div style={respHeader}>
          <strong style={{ fontSize: 12 }}>Response</strong>
          {state.kind === "done" && (
            <>
              <span style={statusBadge(state.status)}>{state.status} {state.statusText}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{state.ms}ms</span>
            </>
          )}
          {state.kind === "error" && <span style={statusBadge(0)}>error</span>}
        </div>

        {state.kind === "done" && (
          <div style={tabRow}>
            <Tab active={respTab === "body"} onClick={() => setRespTab("body")}>Body</Tab>
            <Tab active={respTab === "headers"} onClick={() => setRespTab("headers")}>
              Headers ({Object.keys(state.headers).length})
            </Tab>
          </div>
        )}

        <div style={{ ...tabPanel, flex: 1, overflow: "auto", padding: 0 }}>
          {state.kind === "idle" && <div style={emptyMsg}>send a request to see the response</div>}
          {state.kind === "loading" && <div style={emptyMsg}>loading…</div>}
          {state.kind === "error" && <div style={{ ...emptyMsg, color: "#a00" }}>{state.message}</div>}
          {state.kind === "done" && respTab === "body" && (
            <ResponseBody body={state.body} contentType={state.contentType} />
          )}
          {state.kind === "done" && respTab === "headers" && (
            <pre style={preStyle}>
              {Object.entries(state.headers).map(([k, v]) => `${k}: ${v}`).join("\n")}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function HeadersEditor({ headers, onChange }: { headers: Header[]; onChange: (h: Header[]) => void }) {
  const update = (i: number, patch: Partial<Header>) =>
    onChange(headers.map((h, idx) => idx === i ? { ...h, ...patch } : h));
  const remove = (i: number) => onChange(headers.filter((_, idx) => idx !== i));
  const add = () => onChange([...headers, { key: "", value: "" }]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {headers.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 4 }}>
          <input value={h.key} onChange={(e) => update(i, { key: e.target.value })} placeholder="key"   style={{ ...inputStyle, flex: 1 }} />
          <input value={h.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="value" style={{ ...inputStyle, flex: 2 }} />
          <button onClick={() => remove(i)} style={{ ...sendBtn, background: "var(--wb-gray)" }}>×</button>
        </div>
      ))}
      <button onClick={add} style={{ ...sendBtn, alignSelf: "flex-start", background: "var(--wb-gray)" }}>+ add header</button>
    </div>
  );
}

function ResponseBody({ body, contentType }: { body: string; contentType: string }) {
  const isJson = contentType.includes("json");
  const pretty = useMemo(() => {
    if (!isJson) return body;
    try { return JSON.stringify(JSON.parse(body), null, 2); }
    catch { return body; }
  }, [body, isJson]);

  const highlighted = useMemo(() => {
    if (!isJson) return null;
    return Prism.highlight(pretty, Prism.languages.json, "json");
  }, [pretty, isJson]);

  useEffect(() => {
    // ensure prism's json grammar is loaded (imported at module top)
  }, []);

  if (!isJson) {
    return <pre style={preStyle}>{pretty}</pre>;
  }
  return (
    <pre style={preStyle}>
      <code dangerouslySetInnerHTML={{ __html: highlighted ?? "" }} />
    </pre>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...tabBtn,
        background: active ? "var(--wb-white)" : "var(--wb-gray)",
        borderBottomColor: active ? "var(--wb-white)" : "var(--wb-black)",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- styles ---------- */
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
  fontSize: 12,
  fontWeight: "bold",
  padding: "2px 6px",
  background: "var(--wb-black)",
  color: "var(--wb-white)",
};
const groupHeader: React.CSSProperties = {
  fontSize: 11,
  fontWeight: "bold",
  padding: "1px 6px",
  background: "var(--wb-gray)",
  color: "var(--wb-black)",
  borderTop: "1px solid var(--wb-black)",
  borderBottom: "1px solid var(--wb-black)",
  position: "sticky",
  top: 0,
};
const presetRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "2px 4px",
  border: "none",
  borderBottom: "1px solid var(--wb-gray)",
  cursor: "pointer",
  fontFamily: "var(--wb-font)",
  fontSize: 12,
  color: "var(--wb-black)",
};
function methodBadge(m: Method): React.CSSProperties {
  const colors: Record<Method, string> = {
    GET: "#2a7", POST: "#e80", PUT: "#37a", PATCH: "#a3a", DELETE: "#c33",
  };
  return {
    fontSize: 10,
    padding: "0 4px",
    background: colors[m],
    color: "white",
    border: "1px solid black",
    minWidth: 40,
    textAlign: "center",
  };
}
const selectStyle: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 14, padding: "2px 4px",
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
};
const inputStyle: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 14, padding: "2px 6px", flex: 1,
  background: "var(--wb-white)", border: "1px solid var(--wb-black)", outline: "none",
  minWidth: 0,
};
const sendBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 14, padding: "2px 14px",
  background: "var(--wb-orange)", border: "1px solid var(--wb-black)",
  cursor: "pointer", color: "var(--wb-black)",
};
const tabRow: React.CSSProperties = {
  display: "flex", gap: 2, borderBottom: "1px solid var(--wb-black)",
};
const tabBtn: React.CSSProperties = {
  fontFamily: "var(--wb-font)", fontSize: 12, padding: "1px 10px",
  border: "1px solid var(--wb-black)", borderBottomWidth: 1,
  cursor: "pointer", color: "var(--wb-black)",
};
const tabPanel: React.CSSProperties = {
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
  borderTop: "none", padding: 4,
};
const textareaStyle: React.CSSProperties = {
  width: "100%", minHeight: 80, resize: "vertical",
  fontFamily: "var(--wb-font)", fontSize: 13,
  background: "var(--wb-white)", border: "1px solid var(--wb-black)",
  padding: 4, outline: "none", color: "var(--wb-black)",
};
const respHeader: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, marginTop: 4,
};
function statusBadge(code: number): React.CSSProperties {
  const ok = code >= 200 && code < 300;
  return {
    fontSize: 11, padding: "0 6px",
    background: ok ? "#2a7" : "#c33",
    color: "white", border: "1px solid black",
  };
}
const preStyle: React.CSSProperties = {
  margin: 0, padding: 8, fontFamily: "var(--wb-font)", fontSize: 12,
  whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--wb-black)",
};
const emptyMsg: React.CSSProperties = {
  padding: 12, fontSize: 12, opacity: 0.6,
};

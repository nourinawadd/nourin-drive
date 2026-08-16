"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KEY_SESSION, clearKey, readJson, writeJson } from "./localStore";

export type SessionStatus = "claiming" | "active" | "blocked";

type LockRecord = { id: string; ts: number };

const HEARTBEAT_MS = 2000;
const STALE_MS = 6000;
const CLAIM_CONFIRM_MS = 60;
const BLOCKED_POLL_MS = 1000;

let tabId: string | null = null;

function myId(): string {
  if (tabId) return tabId;
  const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  tabId = uuid;
  return tabId;
}

function readLock(): LockRecord | null {
  const rec = readJson<LockRecord>(KEY_SESSION);
  if (!rec || typeof rec.id !== "string" || typeof rec.ts !== "number") return null;
  return rec;
}

function isFresh(rec: LockRecord): boolean {
  return Date.now() - rec.ts < STALE_MS;
}

export function useSessionLock() {
  const [status, setStatus] = useState<SessionStatus>("claiming");
  const nonce = useRef(0);

  const runClaim = useCallback((force: boolean) => {
    const me = myId();
    const attempt = ++nonce.current;
    const held = readLock();

    if (!force && held && held.id !== me && isFresh(held)) {
      setStatus("blocked");
      return;
    }

    writeJson(KEY_SESSION, { id: me, ts: Date.now() });

    window.setTimeout(() => {
      if (nonce.current !== attempt) return;
      const settled = readLock();
      setStatus(!settled || settled.id === me ? "active" : "blocked");
    }, CLAIM_CONFIRM_MS);
  }, []);

  const claim = useCallback(() => runClaim(false), [runClaim]);
  const steal = useCallback(() => runClaim(true), [runClaim]);

  useEffect(() => {
    runClaim(false);
    return () => {
      nonce.current++;
    };
  }, [runClaim]);

  useEffect(() => {
    if (status !== "active") return;
    const me = myId();

    const beat = () => writeJson(KEY_SESSION, { id: me, ts: Date.now() });
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);

    const release = () => {
      const held = readLock();
      if (!held || held.id === me) clearKey(KEY_SESSION);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== KEY_SESSION) return;
      const held = readLock();
      if (held && held.id !== me && isFresh(held)) setStatus("blocked");
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) runClaim(false);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", release);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", release);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
  }, [status, runClaim]);

  useEffect(() => {
    if (status !== "blocked") return;

    const check = () => {
      const held = readLock();
      if (!held || !isFresh(held)) runClaim(false);
    };

    const timer = window.setInterval(check, BLOCKED_POLL_MS);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === KEY_SESSION) check();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [status, runClaim]);

  return { status, claim, steal };
}

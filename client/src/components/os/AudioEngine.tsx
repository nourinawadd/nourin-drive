"use client";

import { useEffect, useRef } from "react";
import { currentTrack, usePlayerStore } from "@/context/playerStore";

/**
 * The desktop's one and only <audio> element.
 *
 * Mounted on the desktop rather than inside the Music window, because
 * WindowFrame unmounts a minimized window — which used to kill playback mid-song
 * every time you minimized the player. Nothing is rendered; this is the bridge
 * between the element's imperative API and the store's declarative state.
 */
export function AudioEngine() {
  const ref = useRef<HTMLAudioElement>(null);

  const track = usePlayerStore(currentTrack);
  const playing = usePlayerStore((s) => s.playing);
  const volume = usePlayerStore((s) => s.volume);
  const seekRequest = usePlayerStore((s) => s.seekRequest);
  const hydrate = usePlayerStore((s) => s.hydrate);

  const reportTime = usePlayerStore((s) => s.reportTime);
  const reportDuration = usePlayerStore((s) => s.reportDuration);
  const reportPlaying = usePlayerStore((s) => s.reportPlaying);
  const reportError = usePlayerStore((s) => s.reportError);
  const reportEnded = usePlayerStore((s) => s.reportEnded);

  // Storage is read here, in an effect, so the server pass and the first client
  // pass agree — same rule the guestbook stand follows.
  useEffect(() => hydrate(), [hydrate]);

  // Drive play/pause from state. `playing` also flips in response to the
  // element's own play/pause events, so this settles rather than ping-pongs.
  useEffect(() => {
    const a = ref.current;
    if (!a || !track) return;
    if (playing && a.paused) a.play().catch(() => reportError());
    else if (!playing && !a.paused) a.pause();
  }, [playing, track, reportError]);

  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);

  // Seeks arrive as a nonce because `time` is written back by the element on
  // every timeupdate; watching `time` would fight the playhead.
  useEffect(() => {
    const a = ref.current;
    if (!a || !seekRequest) return;
    if (Number.isFinite(a.duration)) a.currentTime = seekRequest.to;
  }, [seekRequest]);

  // OS media keys, headphone buttons and the lock-screen / volume-flyout art.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (!track) {
      ms.metadata = null;
      ms.playbackState = "none";
      return;
    }
    ms.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album ?? track.playlist,
      artwork: track.art ? [{ src: track.art, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    ms.playbackState = playing ? "playing" : "paused";
  }, [track, playing]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const { toggle, next, prev, seek } = usePlayerStore.getState();
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => toggle()],
      ["pause", () => toggle()],
      ["nexttrack", () => next()],
      ["previoustrack", () => prev()],
      ["seekto", (d) => d.seekTime != null && seek(d.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      // Not every browser implements every action; an unsupported one throws.
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* nothing to do — the key just won't work in this browser */
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          /* see above */
        }
      }
    };
  }, []);

  return (
    <audio
      ref={ref}
      src={track?.src}
      preload="metadata"
      onPlay={() => reportPlaying(true)}
      onPause={() => reportPlaying(false)}
      onTimeUpdate={(e) => reportTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => reportDuration(e.currentTarget.duration)}
      onEnded={reportEnded}
      onError={() => track && reportError()}
    />
  );
}

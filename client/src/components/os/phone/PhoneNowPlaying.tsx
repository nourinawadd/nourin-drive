"use client";

import { cover } from "@/components/apps/music/art";
import { PlayerGlyph } from "@/components/apps/music/PlayerBar";
import { currentTrack, usePlayerStore } from "@/context/playerStore";
import { useWindowStore } from "@/context/windowStore";

/**
 * The phone's answer to the desktop leaving the Music window open in a corner:
 * once a track is loaded, a bar along the bottom of the shell keeps it in reach
 * while you look at something else. Play/pause and next work in place; tapping
 * the track opens the player (a singleton, so it comes back as you left it).
 *
 * It only reads and drives playerStore. Playback itself stays in AudioEngine,
 * which is why closing the player never stopped the music in the first place.
 * `hidden` while the Music window is the one on screen, since the full player
 * is already showing all of this.
 */
export function PhoneNowPlaying({ hidden }: { hidden: boolean }) {
  const track = usePlayerStore(currentTrack);
  const playing = usePlayerStore((s) => s.playing);
  const error = usePlayerStore((s) => s.error);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const openApp = useWindowStore((s) => s.openApp);

  if (hidden || !track) return null;

  return (
    <div className="wb-phone-nowplaying" role="region" aria-label="Now playing">
      <button
        type="button"
        className="wb-phone-nowplaying-meta"
        onClick={() => openApp("music")}
        aria-label={`Open the player: ${track.title}`}
      >
        <span className="wb-phone-nowplaying-art" style={cover(track)} aria-hidden />
        <span className="wb-phone-nowplaying-text">
          <strong>{track.title}</strong>
          <span>{error ? "file not found" : track.artist}</span>
        </span>
      </button>
      <button
        type="button"
        className="wb-phone-nowplaying-btn is-primary"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        <PlayerGlyph icon={playing ? "pause" : "play"} size={18} />
      </button>
      <button
        type="button"
        className="wb-phone-nowplaying-btn"
        onClick={() => next()}
        aria-label="Next track"
      >
        <PlayerGlyph icon="next" size={18} />
      </button>
    </div>
  );
}

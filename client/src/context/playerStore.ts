// Playback state for the Music Player, deliberately OUTSIDE the window.
//
// WindowFrame unmounts a minimized window (`if (win.minimized) return null`), so
// while playback lived in the Music component, minimizing the player destroyed
// its <audio> element mid-song and reset the track, position, volume and modes.
// The state lives here and the element lives in <AudioEngine>, mounted on the
// desktop itself — so the music keeps going whether the window is minimized,
// buried, or closed outright.
//
// The queue is an explicit list of track IDs rather than an index into TRACKS.
// With playlists and search, "the next track" means the next one in what you're
// actually listening to, which is rarely the next row of the full library.

import { create } from "zustand";
import { TRACKS, trackById, type Track } from "@/data/tracks";
import { KEY_PLAYER, readJson, writeJson } from "@/lib/localStore";

export type RepeatMode = "off" | "all" | "one";

/** The slice of state worth surviving a reload. Not the position — resuming a
 *  song 2:41 in without asking is startling rather than helpful. */
type Saved = {
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  lastTrackId: string | null;
};

type State = {
  /** Track IDs in play order. Empty until something is started. */
  queue: string[];
  /** Position in `queue`, or -1 for "nothing loaded". */
  pointer: number;
  /** Where the queue came from, for the "now playing from" label. */
  source: string | null;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  error: boolean;
  /** Bumped to ask <AudioEngine> to seek; it can't be driven by `time` alone,
   *  which the element itself writes back on every timeupdate. */
  seekRequest: { to: number; nonce: number } | null;
  /** Set once the settings blob has been read, so the first paint matches SSR. */
  hydrated: boolean;
};

type Actions = {
  /** Start `trackId`, queueing the list it belongs to so next/prev make sense. */
  play: (trackId: string, list: Track[], source: string) => void;
  playList: (list: Track[], source: string) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (to: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  /** Reported by <AudioEngine>; nothing else should write these. */
  reportTime: (time: number) => void;
  reportDuration: (duration: number) => void;
  reportPlaying: (playing: boolean) => void;
  reportError: () => void;
  reportEnded: () => void;
  hydrate: () => void;
};

const DEFAULTS: Saved = { volume: 0.8, shuffle: false, repeat: "off", lastTrackId: null };

/**
 * Fisher-Yates. The old player picked a uniform random index each time and only
 * avoided repeating the current track, so it replayed songs while skipping
 * others entirely. Shuffling the whole queue once and walking it means you hear
 * everything before anything repeats.
 */
function shuffled(ids: string[], first?: string): string[] {
  const rest = first ? ids.filter((id) => id !== first) : [...ids];
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return first ? [first, ...rest] : rest;
}

let seekNonce = 0;

export const usePlayerStore = create<State & Actions>((set, get) => {
  /** Mirror the persisted slice after any change that touches it. */
  const persist = (patch: Partial<Saved> = {}) => {
    const s = get();
    const saved: Saved = {
      volume: s.volume,
      shuffle: s.shuffle,
      repeat: s.repeat,
      lastTrackId: s.queue[s.pointer] ?? null,
      ...patch,
    };
    writeJson(KEY_PLAYER, saved);
  };

  return {
    queue: [],
    pointer: -1,
    source: null,
    playing: false,
    time: 0,
    duration: 0,
    volume: DEFAULTS.volume,
    shuffle: DEFAULTS.shuffle,
    repeat: DEFAULTS.repeat,
    error: false,
    seekRequest: null,
    hydrated: false,

    // Read in an effect, never during render — reading storage inline would make
    // the server pass and the first client pass disagree and break hydration.
    hydrate: () => {
      if (get().hydrated) return;
      const saved = readJson<Partial<Saved>>(KEY_PLAYER) ?? {};
      const volume =
        typeof saved.volume === "number" && saved.volume >= 0 && saved.volume <= 1
          ? saved.volume
          : DEFAULTS.volume;
      const repeat: RepeatMode =
        saved.repeat === "all" || saved.repeat === "one" || saved.repeat === "off"
          ? saved.repeat
          : DEFAULTS.repeat;

      // Cue the last track without playing it: browsers block autoplay anyway,
      // and a song starting by itself on page load is hostile.
      const last = saved.lastTrackId ? trackById(saved.lastTrackId) : undefined;
      const queue = last ? TRACKS.map((t) => t.id) : [];
      const pointer = last ? queue.indexOf(last.id) : -1;

      set({
        volume,
        repeat,
        shuffle: saved.shuffle === true,
        queue,
        pointer,
        source: last ? last.playlist : null,
        duration: last?.duration ?? 0,
        hydrated: true,
      });
    },

    play: (trackId, list, source) => {
      const ids = list.map((t) => t.id);
      if (!ids.includes(trackId)) return;
      const queue = get().shuffle ? shuffled(ids, trackId) : ids;
      set({
        queue,
        pointer: queue.indexOf(trackId),
        source,
        playing: true,
        time: 0,
        duration: trackById(trackId)?.duration ?? 0,
        error: false,
      });
      persist();
    },

    playList: (list, source) => {
      if (!list.length) return;
      get().play(list[0].id, list, source);
    },

    toggle: () => {
      const { pointer, queue, playing } = get();
      // Nothing cued yet: pressing play should start the library, not no-op.
      if (pointer < 0 || !queue.length) {
        if (TRACKS.length) get().playList(TRACKS, "All Tracks");
        return;
      }
      set({ playing: !playing });
    },

    next: (auto = false) => {
      const { queue, pointer, repeat } = get();
      if (pointer < 0 || !queue.length) return;
      if (pointer + 1 < queue.length) {
        set({ pointer: pointer + 1, time: 0, error: false, playing: true });
        persist();
        return;
      }
      if (repeat === "all") {
        // Reshuffle at the wrap so a shuffled queue isn't the same loop forever.
        const wrapped = get().shuffle ? shuffled(queue) : queue;
        set({ queue: wrapped, pointer: 0, time: 0, error: false, playing: true });
        persist();
        return;
      }
      // End of the queue: stop, but keep the last track cued. `auto` means we
      // got here from `ended` rather than a button, and only differs in that a
      // deliberate press at the end should still park you on the last track.
      set({ playing: false, time: auto ? 0 : get().time });
    },

    prev: () => {
      const { queue, pointer, time, repeat } = get();
      if (pointer < 0 || !queue.length) return;
      // Mirror typical players: restart the current track if we're past 3s.
      if (time > 3) {
        get().seek(0);
        return;
      }
      if (pointer - 1 >= 0) {
        set({ pointer: pointer - 1, time: 0, error: false, playing: true });
      } else if (repeat === "all") {
        set({ pointer: queue.length - 1, time: 0, error: false, playing: true });
      } else {
        get().seek(0);
        return;
      }
      persist();
    },

    seek: (to) => set({ time: to, seekRequest: { to, nonce: ++seekNonce } }),

    setVolume: (v) => {
      const volume = Math.min(1, Math.max(0, v));
      set({ volume });
      persist({ volume });
    },

    toggleShuffle: () => {
      const { shuffle, queue, pointer } = get();
      const on = !shuffle;
      // Reshuffle what's left rather than the whole queue, so turning shuffle on
      // mid-song doesn't replay what you've already heard. Turning it off
      // restores the list's natural order from the current track onward.
      let nextQueue = queue;
      let nextPointer = pointer;
      const currentId = queue[pointer];
      if (queue.length) {
        if (on) {
          nextQueue = shuffled(queue, currentId);
        } else {
          const natural = TRACKS.filter((t) => queue.includes(t.id)).map((t) => t.id);
          nextQueue = natural;
        }
        nextPointer = currentId ? nextQueue.indexOf(currentId) : pointer;
      }
      set({ shuffle: on, queue: nextQueue, pointer: nextPointer });
      persist({ shuffle: on });
    },

    cycleRepeat: () => {
      const order: RepeatMode[] = ["off", "all", "one"];
      const repeat = order[(order.indexOf(get().repeat) + 1) % order.length];
      set({ repeat });
      persist({ repeat });
    },

    reportTime: (time) => set({ time }),
    reportDuration: (duration) => set({ duration }),
    reportPlaying: (playing) => set({ playing }),
    reportError: () => set({ error: true, playing: false }),

    reportEnded: () => {
      if (get().repeat === "one") {
        get().seek(0);
        set({ playing: true });
        return;
      }
      get().next(true);
    },
  };
});

/** The track the pointer is on, or null. */
export function currentTrack(s: State): Track | null {
  const id = s.queue[s.pointer];
  return id ? trackById(id) ?? null : null;
}

/** What's coming up, for the queue panel. */
export function upNext(s: State, max = 20): Track[] {
  return s.queue
    .slice(s.pointer + 1, s.pointer + 1 + max)
    .map((id) => trackById(id))
    .filter((t): t is Track => t != null);
}

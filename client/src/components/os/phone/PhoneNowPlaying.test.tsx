import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PhoneNowPlaying } from "@/components/os/phone/PhoneNowPlaying";
import { currentTrack, usePlayerStore } from "@/context/playerStore";
import { useWindowStore } from "@/context/windowStore";
import { TRACKS } from "@/data/tracks";

const initial = usePlayerStore.getState();

const load = () =>
  act(() => {
    usePlayerStore.getState().play(TRACKS[0].id, TRACKS, "All Tracks");
  });

describe("PhoneNowPlaying", () => {
  beforeEach(() => {
    usePlayerStore.setState(initial, true);
    useWindowStore.setState({ windows: [], focusedId: null, zCounter: 1 });
  });

  afterEach(cleanup);

  it("renders nothing until a track is loaded", () => {
    const { container } = render(<PhoneNowPlaying hidden={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows the loaded track", () => {
    load();
    render(<PhoneNowPlaying hidden={false} />);
    expect(screen.getByRole("region", { name: "Now playing" })).toBeTruthy();
    expect(screen.getByText(TRACKS[0].title)).toBeTruthy();
  });

  it("stays out of the way while the player itself is on screen", () => {
    load();
    const { container } = render(<PhoneNowPlaying hidden />);
    expect(container.innerHTML).toBe("");
  });

  it("plays and pauses in place, and skips", () => {
    load();
    render(<PhoneNowPlaying hidden={false} />);
    expect(usePlayerStore.getState().playing).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(usePlayerStore.getState().playing).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(usePlayerStore.getState().playing).toBe(true);

    const before = currentTrack(usePlayerStore.getState())?.id;
    fireEvent.click(screen.getByRole("button", { name: "Next track" }));
    if (TRACKS.length > 1) expect(currentTrack(usePlayerStore.getState())?.id).not.toBe(before);
  });

  it("opens the player when the track is tapped", () => {
    load();
    render(<PhoneNowPlaying hidden={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Open the player/ }));
    expect(useWindowStore.getState().windows.map((w) => w.appId)).toEqual(["music"]);
  });
});

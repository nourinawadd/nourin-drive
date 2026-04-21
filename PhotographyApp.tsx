"use client";

/**
 * PhotographyApp
 *
 * Tries to load real media from /api/instagram via `useInstagramMedia`.
 * Falls back gracefully to static placeholder data when the IG token
 * isn't configured (server returns an empty array + message field).
 *
 * To go live:
 *   1. Create an Instagram app at developers.facebook.com
 *   2. Generate a long-lived token for your personal account
 *   3. Set INSTAGRAM_TOKEN=<token> in server/.env
 *   The server caches responses for 10 minutes to avoid rate limits.
 */

import { useState }           from "react";
import { useInstagramMedia, IgMediaItem } from "@/hooks/useInstagram";
import { Toolbar }            from "@/components/ui/Toolbar";
import { StatusBar }          from "@/components/ui/StatusBar";
import { Tag }                from "@/components/ui/Tag";
import { EmptyState }         from "@/components/ui/EmptyState";
import clsx from "clsx";

// ── Placeholder photos shown when Instagram token isn't configured ──────────
const PLACEHOLDER_PHOTOS = [
  { id: "ph1", media_url: "https://picsum.photos/seed/ph1/900/900", thumbnail_url: "https://picsum.photos/seed/ph1/400/400", caption: "Golden hour, Mansoura",        media_type: "IMAGE" as const, timestamp: "2024-08-01T18:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph2", media_url: "https://picsum.photos/seed/ph2/900/900", thumbnail_url: "https://picsum.photos/seed/ph2/400/400", caption: "Nile at dusk",                 media_type: "IMAGE" as const, timestamp: "2024-07-15T19:30:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph3", media_url: "https://picsum.photos/seed/ph3/900/900", thumbnail_url: "https://picsum.photos/seed/ph3/400/400", caption: "Street patterns",              media_type: "IMAGE" as const, timestamp: "2024-07-02T14:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph4", media_url: "https://picsum.photos/seed/ph4/900/900", thumbnail_url: "https://picsum.photos/seed/ph4/400/400", caption: "University campus, evening",   media_type: "IMAGE" as const, timestamp: "2024-06-20T17:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph5", media_url: "https://picsum.photos/seed/ph5/900/900", thumbnail_url: "https://picsum.photos/seed/ph5/400/400", caption: "Rooftop view",                 media_type: "IMAGE" as const, timestamp: "2024-05-10T20:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph6", media_url: "https://picsum.photos/seed/ph6/900/900", thumbnail_url: "https://picsum.photos/seed/ph6/400/400", caption: "Between buildings",            media_type: "IMAGE" as const, timestamp: "2024-04-01T15:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph7", media_url: "https://picsum.photos/seed/ph7/900/900", thumbnail_url: "https://picsum.photos/seed/ph7/400/400", caption: "Reflections",                  media_type: "IMAGE" as const, timestamp: "2024-03-22T11:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph8", media_url: "https://picsum.photos/seed/ph8/900/900", thumbnail_url: "https://picsum.photos/seed/ph8/400/400", caption: "Sunrise, Delta",               media_type: "IMAGE" as const, timestamp: "2024-02-14T06:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
  { id: "ph9", media_url: "https://picsum.photos/seed/ph9/900/900", thumbnail_url: "https://picsum.photos/seed/ph9/400/400", caption: "Quiet afternoon",              media_type: "IMAGE" as const, timestamp: "2024-01-30T14:00:00Z", permalink: "https://instagram.com/diarydump.jpg" },
] satisfies IgMediaItem[];

type ViewMode = "grid" | "list";

export function PhotographyApp({ windowId }: { windowId: string }) {
  const [view,     setView]     = useState<ViewMode>("grid");
  const [lightbox, setLightbox] = useState<IgMediaItem | null>(null);

  const { data: igData, isLoading, isError } = useInstagramMedia(24);

  // Use real data if available, otherwise placeholders
  const photos: IgMediaItem[] =
    igData && igData.length > 0 ? igData : PLACEHOLDER_PHOTOS;

  const isUsingPlaceholders = !igData || igData.length === 0;

  // Only show images (skip VIDEO thumbnails that might not load)
  const visible = photos.filter((p) => p.media_type !== "VIDEO");

  function getThumb(item: IgMediaItem) {
    return item.thumbnail_url ?? item.media_url;
  }

  return (
    <div className="flex flex-col h-full bg-[#d4d0c8]">
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <Toolbar>
        <button
          className={clsx("btn text-[11px] px-2 py-[2px]", view === "grid" && "shadow-sunken bg-[#bdbbb3]")}
          onClick={() => setView("grid")}
          title="Grid view"
        >
          ⊞ Grid
        </button>
        <button
          className={clsx("btn text-[11px] px-2 py-[2px]", view === "list" && "shadow-sunken bg-[#bdbbb3]")}
          onClick={() => setView("list")}
          title="List view"
        >
          ☰ List
        </button>

        <div className="w-px self-stretch mx-1 bg-[#808080]" />

        <a
          href="https://www.instagram.com/diarydump.jpg/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn text-[11px] px-2 py-[2px]"
        >
          📷 @diarydump.jpg →
        </a>
      </Toolbar>

      {/* ── Placeholder notice ────────────────────────────────────────── */}
      {isUsingPlaceholders && !isLoading && (
        <div className="px-3 py-[4px] text-[10px] bg-[#fffacd] border-b border-[#c8b800] text-[#555] font-sans">
          ℹ️ Showing placeholder photos — add{" "}
          <code className="font-mono bg-[#f5e68a] px-1">INSTAGRAM_TOKEN</code>{" "}
          to <code className="font-mono bg-[#f5e68a] px-1">server/.env</code> to load your real feed.
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="font-mono text-[11px] text-[#888]">Loading photos...</div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto bg-white">
          {visible.length === 0 ? (
            <EmptyState emoji="📸" title="No photos yet" subtitle="Check back soon!" />
          ) : view === "grid" ? (
            <GridView photos={visible} getThumb={getThumb} onOpen={setLightbox} />
          ) : (
            <ListView photos={visible} getThumb={getThumb} onOpen={setLightbox} />
          )}
        </div>
      )}

      <StatusBar
        left={`${visible.length} photo${visible.length !== 1 ? "s" : ""}`}
        right={isUsingPlaceholders ? "placeholder mode" : "live · @diarydump.jpg"}
      />

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {lightbox && (
        <Lightbox
          photo={lightbox}
          all={visible}
          onNavigate={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GridView({
  photos, getThumb, onOpen,
}: {
  photos:   IgMediaItem[];
  getThumb: (item: IgMediaItem) => string;
  onOpen:   (item: IgMediaItem) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-[2px] p-[2px]">
      {photos.map((photo) => (
        <button
          key={photo.id}
          className="relative aspect-square overflow-hidden group cursor-pointer border-0 p-0 bg-[#f0f0f0]"
          onClick={() => onOpen(photo)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getThumb(photo)}
            alt={photo.caption ?? "Photo"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
            {photo.caption && (
              <span className="text-white text-[10px] font-sans text-left leading-tight line-clamp-2">
                {photo.caption}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function ListView({
  photos, getThumb, onOpen,
}: {
  photos:   IgMediaItem[];
  getThumb: (item: IgMediaItem) => string;
  onOpen:   (item: IgMediaItem) => void;
}) {
  return (
    <table className="w-full text-[11px] font-sans border-collapse">
      <thead className="bg-[#ece9e0] border-b border-[#d4d0c8] sticky top-0">
        <tr>
          {["", "Caption", "Type", "Date"].map((h) => (
            <th
              key={h}
              className="text-left px-3 py-[5px] font-bold text-[#333] border-r border-[#d4d0c8] last:border-r-0"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {photos.map((photo) => (
          <tr
            key={photo.id}
            className="border-b border-[#f0ede4] hover:bg-[#d0e4f7] cursor-pointer"
            onClick={() => onOpen(photo)}
          >
            <td className="px-2 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getThumb(photo)}
                alt=""
                className="w-10 h-10 object-cover"
                loading="lazy"
              />
            </td>
            <td className="px-3 py-1 text-[#1a1a1a] max-w-[260px]">
              <span className="line-clamp-2">{photo.caption ?? "—"}</span>
            </td>
            <td className="px-3 py-1 text-[#555] capitalize">{photo.media_type.toLowerCase()}</td>
            <td className="px-3 py-1 text-[#888] font-mono whitespace-nowrap">
              {new Date(photo.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Lightbox({
  photo, all, onNavigate, onClose,
}: {
  photo:       IgMediaItem;
  all:         IgMediaItem[];
  onNavigate:  (item: IgMediaItem) => void;
  onClose:     () => void;
}) {
  const idx  = all.findIndex((p) => p.id === photo.id);
  const prev = all[idx - 1];
  const next = all[idx + 1];

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9998] p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#d4d0c8] max-w-2xl w-full shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="title-bar shrink-0">
          <div className="title-bar-text">📸 {photo.caption ?? "Photo"}</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>

        {/* Image */}
        <div className="bg-black overflow-hidden flex items-center justify-center" style={{ maxHeight: "58vh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.media_url}
            alt={photo.caption ?? "Photo"}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "58vh" }}
          />
        </div>

        {/* Caption + meta */}
        <div className="p-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {photo.caption && (
                <p className="text-[12px] text-[#333] mb-1 leading-relaxed">{photo.caption}</p>
              )}
              <div className="text-[10px] text-[#888] font-mono">
                {new Date(photo.timestamp).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </div>
            </div>
            <a
              href={photo.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn text-[11px] px-2 py-1 shrink-0"
            >
              Instagram →
            </a>
          </div>
        </div>

        {/* Prev / Next */}
        <div className="flex border-t border-[#808080] shrink-0">
          <button
            className="btn flex-1 text-[11px] py-[5px] disabled:opacity-30 rounded-none"
            disabled={!prev}
            onClick={() => prev && onNavigate(prev)}
          >
            ← Prev
          </button>
          <div className="w-px bg-[#808080]" />
          <span className="flex-1 text-center text-[10px] text-[#888] self-center font-mono">
            {idx + 1} / {all.length}
          </span>
          <div className="w-px bg-[#808080]" />
          <button
            className="btn flex-1 text-[11px] py-[5px] disabled:opacity-30 rounded-none"
            disabled={!next}
            onClick={() => next && onNavigate(next)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

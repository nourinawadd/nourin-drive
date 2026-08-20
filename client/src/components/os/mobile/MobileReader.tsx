"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PlaceholderCover } from "@/components/apps/ereader/DocCover";
import { fetchBody } from "@/components/apps/ereader/actions";
import { BLOG_URL, REPO_URL, MobileScreen } from "@/components/os/mobile/MobileScreen";
import { findPost, postUrl } from "@/data/blog";
import { PHOTOS, type Photo } from "@/data/gallery";
import { docById, formatBytes, type LibraryDoc } from "@/data/library";
import { deepLinkParams } from "@/lib/deepLink";
import { triggerDownload } from "@/lib/share";

const COVER_W = 168;

type Target =
  | { kind: "doc"; doc: LibraryDoc }
  | { kind: "photo"; photo: Photo }
  | { kind: "post"; slug: string }
  | null;

function resolveTarget(): Target {
  const params = deepLinkParams();

  const docId = params.get("doc");
  if (docId) {
    const doc = docById(docId);
    if (doc) return { kind: "doc", doc };
  }

  const photoId = params.get("photo");
  if (photoId) {
    const photo = PHOTOS.find((p) => p.id === photoId);
    if (photo) return { kind: "photo", photo };
  }

  const slug = params.get("post");
  if (slug && findPost(slug)) return { kind: "post", slug };

  return null;
}

export function MobileReader() {
  const [target] = useState<Target>(resolveTarget);

  if (!target) return <MobileScreen />;
  if (target.kind === "post") return <PostHandoff slug={target.slug} />;
  if (target.kind === "photo") return <PhotoView photo={target.photo} />;
  return <DocView doc={target.doc} />;
}

function Bar({ title, tag }: { title: string; tag?: string }) {
  return (
    <div className="wb-mobile-bar">
      <span className="wb-mobile-name">{title}</span>
      {tag && <span className="wb-mobile-tag">{tag}</span>}
    </div>
  );
}

function Foot() {
  return (
    <div className="wb-mobile-foot">
      <p>NOURIN: is a desktop simulation.</p>
      <p>There is a whole machine here on a computer.</p>
      <div className="wb-req-gadgets">
        <a className="wb-req-gadget" href={REPO_URL} target="_blank" rel="noreferrer">
          View the Repo
        </a>
        <a className="wb-req-gadget" href={BLOG_URL} target="_blank" rel="noreferrer">
          Read the Blog
        </a>
      </div>
    </div>
  );
}

function PostHandoff({ slug }: { slug: string }) {
  const url = postUrl(slug);

  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div className="wb-mobile">
      <Bar title="Blog" />
      <div className="wb-mobile-card">
        <p>Opening the blog…</p>
        <div className="wb-req-gadgets">
          <a className="wb-req-gadget is-primary" href={url}>
            Read the post
          </a>
        </div>
      </div>
      <Foot />
    </div>
  );
}

function PhotoView({ photo }: { photo: Photo }) {
  return (
    <div className="wb-mobile">
      <Bar title={photo.title} tag={photo.category} />
      <div className="wb-mobile-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.title} />
      </div>
      <Foot />
    </div>
  );
}

function DocView({ doc }: { doc: LibraryDoc }) {
  return (
    <div className="wb-mobile">
      <Bar title={doc.title} tag={doc.shelf} />
      {doc.format === "pdf" ? <PdfCard doc={doc} /> : <TextSheet doc={doc} />}
      <Foot />
    </div>
  );
}

function Byline({ doc }: { doc: LibraryDoc }) {
  return (
    <div className="wb-mobile-byline">
      {doc.author ? `by ${doc.author}` : "Nourin Awad"}
      {doc.date && ` · ${doc.date}`}
    </div>
  );
}

function TextSheet({ doc }: { doc: LibraryDoc }) {
  const [body, setBody] = useState<string | null>(doc.body ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doc.body != null) return;
    let cancelled = false;
    fetchBody(doc)
      .then((text) => { if (!cancelled) setBody(text); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load this document.");
      });
    return () => { cancelled = true; };
  }, [doc]);

  return (
    <div className="wb-paper wb-mobile-sheet">
      <div className="wb-mobile-col">
        <Byline doc={doc} />
        {error ? (
          <p>{error}</p>
        ) : body == null ? (
          <p>Opening…</p>
        ) : doc.format === "md" ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        ) : (
          <pre className="wb-paper-verse">{body}</pre>
        )}
      </div>
    </div>
  );
}

function PdfCard({ doc }: { doc: LibraryDoc }) {
  const height = Math.round(COVER_W * 1.42);

  return (
    <div className="wb-mobile-card">
      <div className="wb-mobile-cover">
        {doc.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.cover} alt="" width={COVER_W} height={height} />
        ) : (
          <PlaceholderCover doc={doc} width={COVER_W} height={height} />
        )}
      </div>
      <p className="wb-mobile-doctitle">{doc.title}</p>
      <Byline doc={doc} />
      {doc.blurb && <p>{doc.blurb}</p>}
      {doc.note && <p className="wb-mobile-note">{doc.note}</p>}
      <p className="wb-req-note">PDF · {formatBytes(doc.bytes)}</p>
      <div className="wb-req-gadgets">
        <a className="wb-req-gadget is-primary" href={doc.src} target="_blank" rel="noreferrer">
          Open PDF
        </a>
        <button
          type="button"
          className="wb-req-gadget"
          onClick={() => triggerDownload(doc.src, doc.fileName)}
        >
          Download
        </button>
      </div>
    </div>
  );
}

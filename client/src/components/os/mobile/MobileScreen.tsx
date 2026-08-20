"use client";

import { BLOG_URL } from "@/data/blog";

export const REPO_URL = "https://github.com/nourinawadd/nourin-drive";
export { BLOG_URL };

export function MobileScreen() {
  return (
    <div
      className="wb-lock wb-desktop-bg is-scrollable"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="wb-mobile-title"
    >
      <div className="wb-req-card">
        <div className="wb-req-title" id="wb-mobile-title">
          System Request
        </div>
        <div className="wb-req-body">
          <div className="wb-disk" aria-hidden />
          <p>NOURIN: is a desktop simulation.</p>
          <p>
            It wants a mouse, a keyboard and room for windows to open, so it does not run on a
            phone.
          </p>
          <p className="wb-req-note">Come back on a computer, or look around the source.</p>
          <div className="wb-req-gadgets">
            <a
              className="wb-req-gadget is-primary"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              View the Repo
            </a>
            <a className="wb-req-gadget" href={BLOG_URL} target="_blank" rel="noreferrer">
              Read the Blog
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ABOUT } from "@/data/about";
import { BLOG_URL } from "@/data/blog";

export const REPO_URL = "https://github.com/nourinawadd/nourin-drive";
export { BLOG_URL };

export function MobileScreen() {
  return (
    <div className="wb-mobile">
      <div className="wb-mobile-bar">
        <span className="wb-mobile-name">{ABOUT.name}</span>
        <span className="wb-mobile-tag">{ABOUT.title}</span>
      </div>
      <div className="wb-mobile-card">
        <p>NOURIN: is a desktop simulation, best explored with a mouse and keyboard.</p>
        <p>{ABOUT.bio[0]}</p>
        <div className="wb-req-gadgets">
          <a className="wb-req-gadget is-primary" href={BLOG_URL} target="_blank" rel="noreferrer">
            Read the Blog
          </a>
          <a className="wb-req-gadget" href={REPO_URL} target="_blank" rel="noreferrer">
            View the Repo
          </a>
          {ABOUT.links.map((link) => (
            <a key={link.url} className="wb-req-gadget" href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
        <p className="wb-req-note">Come back on a computer for the full desktop.</p>
      </div>
    </div>
  );
}

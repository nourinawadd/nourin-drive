"use client";

import { ABOUT } from "@/data/about";
import { BLOG_URL } from "@/data/blog";

export const REPO_URL = "https://github.com/nourinawadd/nourin-drive";
export { BLOG_URL };

// The lite page. Since the launch it's no longer what every phone gets: it's
// the deliberate simple version (`?mode=lite`), the page a link the phone shell
// can't show lands on, and the fallback when the phone shell itself crashes.
// So it says what it is and offers the two other ways in, rather than telling
// the visitor to come back on a computer.
//
// The mode links are plain same-tab links that reload, because the shell mode
// is decided once per load (lib/shellMode.ts). Each forces its mode and sticks
// for the tab, as the phone bar's Desktop link does. `phone` rather than `auto`,
// so the link does what it says on any screen: `auto` would hand the choice back
// to detection, which gives a computer or a large phone in landscape the desktop.

export function MobileScreen({ notice }: {
  /** One line above the card, saying why the visitor is here (the crash fallback). */
  notice?: string;
}) {
  return (
    <div className="wb-mobile">
      <div className="wb-mobile-bar">
        <span className="wb-mobile-name">{ABOUT.name}</span>
        <span className="wb-mobile-tag">{ABOUT.title}</span>
      </div>
      <div className="wb-mobile-card">
        {notice && <p className="wb-mobile-note">{notice}</p>}
        <p>
          This is the simple version of NOURIN-DRIVE:. The full site is a desktop simulation, and
          there&apos;s a phone version of it too.
        </p>
        <p>{ABOUT.bio[0]}</p>
        <div className="wb-req-gadgets">
          <a className="wb-req-gadget is-primary" href={BLOG_URL} target="_blank" rel="noreferrer">
            Read the Blog
          </a>
          <a className="wb-req-gadget" href={REPO_URL} target="_blank" rel="noreferrer">
            View the Repo
          </a>
          {ABOUT.links
            .filter((link) => link.label !== "Sifr Studios")
            .map((link) => (
              <a key={link.url} className="wb-req-gadget" href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
        </div>
        <div className="wb-req-gadgets">
          <a className="wb-req-gadget" href="/?mode=phone">
            Open the phone version
          </a>
          <a className="wb-req-gadget" href="/?mode=desktop">
            Open the full desktop
          </a>
        </div>
      </div>
    </div>
  );
}

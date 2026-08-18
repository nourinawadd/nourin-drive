"use client";

import { useEffect, useState } from "react";

const REPO_URL = "https://github.com/nourinawadd/nourin-drive";
const BLOG_URL = "https://blog.nourin.is-a.dev";

const NARROW_PX = 820;

type Status = "checking" | "mobile" | "desktop";

function useIsMobile(): Status {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const check = () => {
      const narrow = window.innerWidth < NARROW_PX;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      setStatus(narrow && coarse ? "mobile" : "desktop");
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return status;
}

function MobileScreen() {
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

export function MobileGate({ children }: { children: React.ReactNode }) {
  const status = useIsMobile();

  if (status === "checking") return null;
  if (status === "mobile") return <MobileScreen />;
  return <>{children}</>;
}

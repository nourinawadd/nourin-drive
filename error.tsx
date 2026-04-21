"use client";

import { useEffect } from "react";

interface Props {
  error:  Error & { digest?: string };
  reset:  () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("RetroDesk crash:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-[#d4d0c8] flex items-center justify-center p-8 z-[999999]">
      <div className="window max-w-sm w-full shadow-window-focus">
        <div className="title-bar">
          <div className="title-bar-text">⚠️ RetroDesk — Application Error</div>
        </div>
        <div className="window-body p-4 font-sans text-[12px]">
          <div className="flex gap-3 mb-4">
            <span className="text-3xl shrink-0">💥</span>
            <div>
              <p className="font-bold mb-1">RetroDesk OS has encountered a problem.</p>
              <p className="text-[#555]">
                An unexpected error occurred. Your unsaved work may have been lost.
              </p>
            </div>
          </div>

          <div
            className="bg-white border border-[#808080] p-2 mb-4 font-mono text-[10px] text-[#c0392b] overflow-auto max-h-24"
            style={{ boxShadow: "inset 1px 1px #808080" }}
          >
            {error.message || "Unknown error"}
            {error.digest && <div className="text-[#888] mt-1">Digest: {error.digest}</div>}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              className="btn px-4 py-1 text-[11px]"
              onClick={reset}
            >
              🔄 Try Again
            </button>
            <button
              className="btn px-4 py-1 text-[11px]"
              onClick={() => window.location.href = "/"}
            >
              🏠 Restart Desktop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

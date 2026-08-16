"use client";

import { useSessionLock } from "@/lib/sessionLock";

function SessionLockScreen({
  onTakeOver,
  onRetry,
}: {
  onTakeOver: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="wb-lock wb-desktop-bg" role="alertdialog" aria-modal="true" aria-labelledby="wb-lock-title">
      <div className="wb-lock-card">
        <div className="wb-lock-title" id="wb-lock-title">
          System Request
        </div>
        <div className="wb-lock-body">
          <div className="wb-disk" aria-hidden />
          <p>Workbench is already running</p>
          <p>in another window.</p>
          <p className="wb-lock-note">Only one session may run at a time.</p>
          <div className="wb-lock-gadgets">
            <button type="button" className="wb-lock-gadget" onClick={onTakeOver} autoFocus>
              Use This Tab
            </button>
            <button type="button" className="wb-lock-gadget" onClick={onRetry}>
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { status, claim, steal } = useSessionLock();

  if (status === "claiming") return null;
  if (status === "blocked") return <SessionLockScreen onTakeOver={steal} onRetry={claim} />;
  return <>{children}</>;
}

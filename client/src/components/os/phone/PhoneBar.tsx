"use client";

/**
 * The phone shell's one piece of permanent chrome, standing in for the desktop's
 * TopMenubar: the site name and a way out to the full desktop.
 *
 * "Desktop" is a plain link that reloads the page rather than a client-side
 * switch. The shell mode is decided once per load (lib/shellMode.ts), and the
 * reload is what records `?mode=desktop` as this tab's override, so it sticks
 * through later reloads until `?mode=auto` or a new tab.
 */
export function PhoneBar() {
  return (
    <header className="wb-phone-bar">
      <div className="wb-phone-name">NOURIN-DRIVE:</div>
      <a className="wb-phone-gadget" href="/?mode=desktop">
        Desktop
      </a>
    </header>
  );
}

# The phone shell

What the site does on a phone, and how to keep it working when you add to it.
The desktop is a Workbench you drive with a mouse; on a phone, the same apps run
inside a separate shell: a bar along the top, a launcher of drives, and one app
at a time, full screen, with Back.

## The short version

The page decides once per load which of three shells to show:

| Mode | Who gets it | What it is |
| --- | --- | --- |
| `desktop` | anything that isn't a narrow touch screen | the Workbench, windows and all |
| `phone` | narrow touch screens (under 820px wide, with a coarse pointer) | the phone shell |
| `lite` | anyone who asks for it with `?mode=lite` | a single simple page: bio, links, and the way into the other two |

The lite page is also the safety net. A shared link into an app the phone can't
show opens as a page there, and if the phone shell crashes while rendering, the
visitor lands on it with a one-line note instead of a blank screen.

```
client/src/lib/shellMode.ts                  the rule, the overrides, the rollout flag
client/src/components/os/ShellModeProvider.tsx   detects once and hands the answer down
client/src/components/os/MobileGate.tsx      picks the desktop, the phone shell or the lite page
client/src/components/os/phone/              the phone shell: bar, launcher, frame, Back
client/src/components/os/mobile/             the lite page and the lite reader
client/src/data/appRegistry.ts               each app's `mobile` field
```

The decision is never re-made on resize or rotation. A large phone turned
sideways can be wider than 820px, and a shell that swapped to the desktop under
you, throwing away whatever was open, would be worse than one that's the wrong
size until a reload.

## Forcing a mode

Add `?mode=` to any URL:

- `?mode=phone` — the phone shell, on any screen. This is how you try it from a
  computer.
- `?mode=desktop` — the full desktop, even on a phone. The phone bar's Desktop
  link does this.
- `?mode=lite` — the lite page.
- `?mode=auto` — forget any override and let detection choose again.

An override sticks for the tab (it's kept in `sessionStorage` under
`wb:shell-mode`), and the param is taken out of the address bar so a link you
copy doesn't carry it. A new tab starts fresh. A value that isn't a mode is
ignored, so a typo doesn't wipe a working override.

There's no link back from the desktop to the phone shell, because adding one
would change the desktop. On a phone that switched to the desktop, open
`/?mode=auto`, or a new tab.

The whole rollout is one constant, `PHONE_SHELL` in `lib/shellMode.ts`:

- `on` (shipped) — narrow touch screens get the phone shell.
- `preview` — only `?mode=phone` reaches it, and phones get the lite page. Set
  it back to this to undo the launch without reverting anything else.
- `off` — nobody gets it, and `?mode=phone` is ignored.

## Adding an app

Every entry in `APP_REGISTRY` has a required `mobile` field, so a new app has
to say what it does on a phone:

- `native` — it opens full screen in the shell and has been made to work at
  phone size.
- `fallback` — it's in the launcher, but on a phone it hands off to something
  that works there: Blog opens the blog site, Games opens each game's itch.io
  page.
- `hidden` — it's left out of the shell. Its drive isn't in the launcher, and
  if something opens it anyway (an About tile, a link inside another app), the
  shell shows "This one needs a computer" with Back and a link to the desktop.

Start with `hidden`. Switch it once the app works at 360px wide with a thumb.
Nothing else needs registering: the launcher is the drive list with hidden apps
left out, and shared links check the same field.

## Making an app fit a phone

Apps don't get a separate phone version. They ask whether they're in the phone
shell and adjust:

```tsx
const phone = useIsPhone();

<div style={{ ...grid, ...(phone ? gridPhone : null) }}>
```

`useIsPhone()` (from `ShellModeProvider`) is true only inside the phone shell,
so on the desktop every spread is `null` and the style is exactly what it was.
That's the rule for every phone change: with the mode at `desktop`, the output
has to be identical. Keep the desktop object as it is, put the phone changes in
a separate `...Phone` object next to it, and spread it in.

A few habits that keep apps comfortable on a phone:

- **Touch targets are at least 44px** in both directions. That's the smallest
  thing a thumb hits reliably.
- **No hover-only controls.** Anything that appears on hover needs another way
  in on a phone.
- **Inputs are 16px or more.** iOS zooms the page in when a smaller input takes
  focus, and leaves it zoomed. The phone section of `workbench.css` already
  enforces this inside the shell.
- **Fixed widths become `minmax(0, 1fr)`.** A grid column with a 300px minimum
  overflows a 320px phone.
- **Swipe through `useSwipe`** (`lib/useSwipe.ts`) rather than hand-rolled
  pointer handlers. It's what Gallery and the Ereader use, ignores mice and
  mostly-vertical drags, and can be switched off with `enabled`.
- Global phone styles go in the phone-shell section of `workbench.css`, scoped
  under `.wb-phone` so the desktop can't match them.

## Opens that become something else

Some opens make no sense as a window on a phone: an in-site browser inside a
phone's browser, or a 40 MB WebGL build that expects a keyboard. The phone
shell registers an interceptor with the window store
(`components/os/phone/phoneRedirects.ts`). It sees every `openApp` call first
and can take it over:

- a Browser open with a URL opens that URL in a real tab
- a game opens its itch.io page in a tab
- anything else goes through to a normal window

Because it's one function in front of `openApp`, Explorer, the Shell app and
anything added later get the same behaviour without checking the mode
themselves. The desktop never registers one. To redirect a new kind of open,
add a branch there that returns `true` once it has handled it. It runs inside
the tap, so `window.open` isn't blocked as a popup.

## Back

Each app opened on the phone adds a history entry, without changing the URL
(`usePhoneHistory`). The hardware back button on Android, the browser's Back
button and the iOS edge swipe all close the top app, the same as the Back
gadget, and a Back from the launcher leaves the site. Back closes the whole
app, not a view inside it (a document back to the library, say).

The entries carry Next.js's own history state alongside ours, since Next's
router reloads the page for any entry without it. After upgrading Next, open
two apps on a phone and press Back twice. If the shell reboots instead of
returning to the launcher, look there first.

## When something breaks

Two error boundaries keep a crash from blanking the page:

- around the whole shell: a render error anywhere shows the lite page, with
  "The phone version hit a problem, so here's the simple one."
- around each app: a crashing app shows "This app hit a problem" inside its
  frame, and Back and the launcher keep working.

They catch errors thrown while rendering. Errors in click handlers, timers and
promises don't reach them, but those don't unmount anything either.

To see either one on purpose, in a dev build (`npm run dev`):

- `?mode=phone&crash=shell` — the shell crashes, and you get the lite page.
- `?mode=phone&crash=app` — every app crashes as it opens, and you get the
  card.

The `crash` param does nothing in a production build; the code isn't in it.

## Testing in devtools

Chrome's device toolbar (Ctrl+Shift+M) with a phone preset gives you a narrow
screen and a coarse pointer, so a reload with no query gets the phone shell,
the same as a real phone. A narrow window without device emulation still has a
mouse, so it gets the desktop. That's expected, not a bug. Use `?mode=phone`
to see the shell there.

Devtools doesn't show everything. Check these on a real phone:

- hardware Back on Android, and the edge swipe on iOS
- the iOS keyboard pushing the page while typing in the Guestbook
- safe areas: the notch and the home bar, in portrait and landscape
- landscape on a large phone. Wider than 820px it's the desktop, which needs
  `?mode=phone` to get the shell back.
- small tablets in portrait (an iPad mini is 744px). They count as phones.

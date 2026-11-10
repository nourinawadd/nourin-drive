"use client";

import { Component, type ReactNode } from "react";

type Props = {
  /** Rendered in place of the children once any of them throws while rendering. */
  fallback: ReactNode;
  children: ReactNode;
};

type State = { failed: boolean };

/**
 * A safety net for the phone shell. Without one, an error thrown while React
 * renders unmounts the whole tree and leaves a blank page, which on a phone
 * looks like the site is down. With it, the visitor gets the fallback instead:
 * the lite page around the whole shell (MobileGate), and a problem card around
 * a single app (PhoneFrame), so one broken app doesn't take the shell with it.
 *
 * It only catches what React can: errors thrown while rendering, in lifecycle
 * methods and in effects. Errors in event handlers, timers and promises never
 * reach it, but those don't unmount anything either, so the page stays up.
 *
 * It's a class because error boundaries still can't be written as hooks. It
 * logs nothing itself: React already reports a caught error to the console the
 * same way it reports any other, and a second copy would only be noise.
 *
 * The desktop never renders one, so a desktop crash behaves exactly as before.
 */
export class PhoneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * A way to see the safety nets work by hand, since nothing in the site crashes
 * on purpose: in a dev build, `?crash=shell` throws inside the shell's boundary
 * and `?crash=app` inside every app's. Callers render it behind the same
 * `process.env.NODE_ENV !== "production"` check, which the production build
 * replaces with `false`, so neither the element nor this branch ships.
 *
 * It reads the live URL rather than a captured one: nothing strips `crash`, and
 * it only ever renders on the client, after the shell mode is known.
 */
export function DevCrash({ at }: { at: "shell" | "app" }) {
  if (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("crash") === at
  ) {
    throw new Error(`DevCrash: forced ${at} crash from ?crash=${at}`);
  }
  return null;
}

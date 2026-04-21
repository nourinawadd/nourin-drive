/**
 * BaseApp.js — abstract base class that every app extends.
 *
 * Required overrides:
 *   windowDef()  → { title, icon, width, height }
 *   render()     → string  (HTML string for the win-body)
 *
 * Optional overrides:
 *   afterMount() → void   (runs once after HTML is in the DOM)
 *   destroy()    → void   (cleanup: clear timers, remove listeners)
 */

export class BaseApp {
  /** @type {HTMLElement|null} */
  bodyEl = null;

  /**
   * Called by WindowManager. Injects rendered HTML then calls afterMount.
   * @param {HTMLElement} bodyEl
   */
  mount(bodyEl) {
    this.bodyEl = bodyEl;
    bodyEl.innerHTML = this.render();
    this.afterMount?.();
  }

  /**
   * Returns window chrome metadata.
   * @returns {{ title: string, icon: string, width: number, height: number }}
   */
  windowDef() {
    throw new Error(`${this.constructor.name} must implement windowDef()`);
  }

  /**
   * Returns the inner HTML string for the window body.
   * @returns {string}
   */
  render() {
    throw new Error(`${this.constructor.name} must implement render()`);
  }

  /**
   * Optional: runs once after render() HTML is mounted in the DOM.
   * Override in subclass if you need to wire up DOM events.
   */
  afterMount() {}

  /**
   * Optional: cleanup called when the window is closed.
   * Override to clear intervals, remove document listeners, etc.
   */
  destroy() {}

  // ── DOM helpers ───────────────────────────────────────────────────

  /** Query within this app's body. */
  qs(selector)  { return this.bodyEl?.querySelector(selector)          ?? null; }

  /** Query all within this app's body. */
  qsa(selector) { return this.bodyEl ? [...this.bodyEl.querySelectorAll(selector)] : []; }
}

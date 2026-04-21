/**
 * WindowManager.js — creates, focuses, minimizes, and closes windows.
 * One instance per app ID (singletons). Delegates to Window for DOM.
 */

import { Window } from '../components/Window.js';

export class WindowManager {
  #bus;
  #taskbar;
  #registry;
  #layer;
  /** @type {Map<string, { win: Window, app: object }>} */
  #windows  = new Map();
  #zCounter = 100;

  /**
   * @param {{
   *   bus:      import('../utils/events.js').EventBus,
   *   taskbar:  import('./TaskbarManager.js').TaskbarManager,
   *   registry: Record<string, Function>,
   * }} opts
   */
  constructor({ bus, taskbar, registry }) {
    this.#bus      = bus;
    this.#taskbar  = taskbar;
    this.#registry = registry;
    this.#layer    = document.getElementById('window-layer');
  }

  // ── Public API ────────────────────────────────────────────────────

  /**
   * Open an app window (or restore if already open).
   * @param {string} id
   */
  open(id) {
    if (this.#windows.has(id)) {
      const entry = this.#windows.get(id);
      entry.win.unminimize();
      this.focus(id);
      return;
    }

    const AppClass = this.#registry[id];
    if (!AppClass) {
      console.warn(`[WM] No app registered for id: "${id}"`);
      return;
    }

    const app    = new AppClass();
    const winDef = app.windowDef();

    const win = new Window({
      id,
      ...winDef,
      onFocus:    ()  => this.focus(id),
      onClose:    ()  => this.close(id),
      onMinimize: ()  => this.#taskbar.setActive(id, false),
    });

    app.mount(win.bodyEl);

    this.#layer.appendChild(win.el);
    this.#windows.set(id, { win, app });

    this.#taskbar.addButton(id, winDef, {
      onClick: () => this._handleTaskbarClick(id),
    });

    this.focus(id);
  }

  /**
   * Bring a window to front.
   * @param {string} id
   */
  focus(id) {
    if (!this.#windows.has(id)) return;
    const { win } = this.#windows.get(id);

    // Un-focus everything first
    this.#windows.forEach(({ win: w }, k) => {
      w.setFocused(false);
      this.#taskbar.setActive(k, false);
    });

    win.el.style.zIndex = ++this.#zCounter;
    win.setFocused(true);
    this.#taskbar.setActive(id, true);
  }

  /**
   * Close and destroy a window.
   * @param {string} id
   */
  close(id) {
    if (!this.#windows.has(id)) return;
    const { win, app } = this.#windows.get(id);
    app.destroy?.();
    win.el.remove();
    this.#taskbar.removeButton(id);
    this.#windows.delete(id);
  }

  // ── Private ───────────────────────────────────────────────────────

  _handleTaskbarClick(id) {
    if (!this.#windows.has(id)) return;
    const { win } = this.#windows.get(id);
    if (win.isMinimized()) {
      win.unminimize();
      this.focus(id);
    } else if (win.isFocused()) {
      win.minimize();
      this.#taskbar.setActive(id, false);
    } else {
      this.focus(id);
    }
  }
}

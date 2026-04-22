/**
 * TaskbarManager.js — renders the taskbar shell and manages
 * per-window buttons + the system tray clock.
 */

export class TaskbarManager {
  /** @param {{ bus: import('../utils/events.js').EventBus }} opts */
  constructor({ bus }) {
    this.bus      = bus;
    this.el       = null;
    this._appsEl  = null;
    this._buttons = new Map();  // id → HTMLButtonElement
    this._clockEl = null;
  }

  /** @param {HTMLElement} rootEl */
  mount(rootEl) {
    this.el = rootEl;
    this._render();
    this._startClock();
  }

  /**
   * Add a taskbar button for a newly opened window.
   * @param {string}   id
   * @param {{ title: string, icon: string }} def
   * @param {{ onClick: Function }}           handlers
   */
  addButton(id, def, { onClick }) {
    if (this._buttons.has(id)) return;

    const btn = document.createElement('button');
    btn.className     = 'taskbar-btn';
    btn.dataset.winId = id;
    btn.innerHTML     = `
      <span class="taskbar-btn__icon">${def.icon}</span>
      <span class="truncate">${def.title}</span>
    `;
    btn.addEventListener('click', onClick);

    this._appsEl.appendChild(btn);
    this._buttons.set(id, btn);
  }

  /**
   * Remove a taskbar button (when its window is closed).
   * @param {string} id
   */
  removeButton(id) {
    const btn = this._buttons.get(id);
    if (!btn) return;
    btn.remove();
    this._buttons.delete(id);
  }

  /**
   * Highlight / un-highlight a button as active.
   * @param {string}  id
   * @param {boolean} active
   */
  setActive(id, active) {
    const btn = this._buttons.get(id);
    if (!btn) return;
    btn.classList.toggle('active', active);
  }

  // ── Private ───────────────────────────────────────────────────────

  _render() {
    this.el.innerHTML = `
      <button id="start-btn" title="Start">
        <span class="start-logo">◈</span>
        <span>Start</span>
      </button>
      <div class="taskbar-sep"></div>
      <div id="taskbar-apps" class="taskbar-apps"></div>
      <div class="taskbar-tray">
        <span class="tray-icon">🔊</span>
        <span id="clock"></span>
      </div>
    `;

    this._appsEl  = this.el.querySelector('#taskbar-apps');
    this._clockEl = this.el.querySelector('#clock');

    // Start button opens explorer (classic behavior)
    this.el.querySelector('#start-btn').addEventListener('click', () => {
      this.bus.emit('app:open', { id: 'explorer' });
    });
  }

  _startClock() {
    const tick = () => {
      if (!this._clockEl) return;
      const now = new Date();
      const h   = String(now.getHours()).padStart(2, '0');
      const m   = String(now.getMinutes()).padStart(2, '0');
      this._clockEl.textContent = `${h}:${m}`;
    };
    tick();
    setInterval(tick, 10_000);
  }
}

/**
 * Window.js — creates a single draggable, resizable OS window element.
 * Knows nothing about the app it hosts — content is injected via bodyEl.
 */

import { clamp } from '../utils/dom.js';

const MENU_ITEMS = ['File', 'Edit', 'View', 'Help'];

export class Window {
  /** @type {HTMLElement} */  el;
  /** @type {HTMLElement} */  bodyEl;

  #id;
  #onFocus;
  #onClose;
  #onMinimize;
  #focused   = false;
  #minimized = false;
  #maximized = false;
  #savedRect = null;

  /**
   * @param {{
   *   id:         string,
   *   title:      string,
   *   icon:       string,
   *   width:      number,
   *   height:     number,
   *   onFocus:    Function,
   *   onClose:    Function,
   *   onMinimize: Function,
   * }} opts
   */
  constructor({ id, title, icon, width, height, onFocus, onClose, onMinimize }) {
    this.#id         = id;
    this.#onFocus    = onFocus;
    this.#onClose    = onClose;
    this.#onMinimize = onMinimize;

    this.el     = this._build(title, icon, width, height);
    this.bodyEl = this.el.querySelector('.win-body');

    this._bindDrag();
    this._bindResize();
    this._positionDefault(width, height);
  }

  // ── Public API ────────────────────────────────────────────────────

  setFocused(v) {
    this.#focused = v;
    this.el.classList.toggle('focused', v);
  }

  isFocused()   { return this.#focused; }
  isMinimized() { return this.#minimized; }

  minimize() {
    this.#minimized = true;
    this.el.classList.add('minimized');
    this.setFocused(false);
  }

  unminimize() {
    this.#minimized = false;
    this.el.classList.remove('minimized');
  }

  toggleMaximize() {
    const layer = document.getElementById('window-layer');
    if (!this.#maximized) {
      this.#savedRect = {
        left:   this.el.style.left,
        top:    this.el.style.top,
        width:  this.el.style.width,
        height: this.el.style.height,
      };
      Object.assign(this.el.style, {
        left:   '0',
        top:    '0',
        width:  layer.clientWidth  + 'px',
        height: layer.clientHeight + 'px',
      });
      this.#maximized = true;
    } else {
      Object.assign(this.el.style, this.#savedRect);
      this.#maximized = false;
    }
  }

  // ── Build DOM ─────────────────────────────────────────────────────

  _build(title, icon, width, height) {
    const root = document.createElement('div');
    root.className    = 'window';
    root.id           = `win-${this.#id}`;
    root.style.width  = width  + 'px';
    root.style.height = height + 'px';

    root.innerHTML = `
      <div class="win-titlebar" role="banner">
        <span class="win-icon" aria-hidden="true">${icon || ''}</span>
        <span class="win-title">${title}</span>
        <div class="win-controls" role="toolbar">
          <button class="win-btn win-btn--lt" title="Light theme">Lt</button>
          <button class="win-btn win-btn--dk" title="Dark theme">Dk</button>
          <button class="win-btn win-btn--min" title="Minimize" aria-label="Minimize">─</button>
          <button class="win-btn win-btn--max" title="Maximize" aria-label="Maximize">□</button>
          <button class="win-btn win-btn--close" title="Close" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="win-menubar" role="menubar">
        ${MENU_ITEMS.map(m => `<span class="menu-item" role="menuitem" tabindex="-1">${m}</span>`).join('')}
      </div>
      <div class="win-body" role="main"></div>
      <div class="win-resize-handle" aria-hidden="true"></div>
    `;

    // Button wiring
    root.querySelector('.win-btn--close').addEventListener('click', e => {
      e.stopPropagation();
      this.#onClose();
    });
    root.querySelector('.win-btn--min').addEventListener('click', e => {
      e.stopPropagation();
      this.minimize();
      this.#onMinimize();
    });
    root.querySelector('.win-btn--max').addEventListener('click', e => {
      e.stopPropagation();
      this.toggleMaximize();
    });

    // Clicking anywhere on the window focuses it
    root.addEventListener('mousedown', () => this.#onFocus());

    return root;
  }

  // ── Drag ─────────────────────────────────────────────────────────

  _bindDrag() {
    const titlebar = this.el.querySelector('.win-titlebar');
    let active = false, ox = 0, oy = 0;

    titlebar.addEventListener('mousedown', e => {
      if (e.target.closest('.win-controls') || this.#maximized) return;
      active = true;
      ox = e.clientX - this.el.offsetLeft;
      oy = e.clientY - this.el.offsetTop;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!active) return;
      const layer = document.getElementById('window-layer');
      this.el.style.left = clamp(e.clientX - ox, 0, layer.clientWidth  - this.el.offsetWidth)  + 'px';
      this.el.style.top  = clamp(e.clientY - oy, 0, layer.clientHeight - this.el.offsetHeight) + 'px';
    });

    document.addEventListener('mouseup', () => { active = false; });
  }

  // ── Resize ────────────────────────────────────────────────────────

  _bindResize() {
    const handle = this.el.querySelector('.win-resize-handle');
    let active = false, sx = 0, sy = 0, sw = 0, sh = 0;

    handle.addEventListener('mousedown', e => {
      active = true;
      sx = e.clientX; sy = e.clientY;
      sw = this.el.offsetWidth; sh = this.el.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', e => {
      if (!active) return;
      this.el.style.width  = Math.max(300, sw + (e.clientX - sx)) + 'px';
      this.el.style.height = Math.max(220, sh + (e.clientY - sy)) + 'px';
    });

    document.addEventListener('mouseup', () => { active = false; });
  }

  // ── Default position ──────────────────────────────────────────────

  _positionDefault(w, h) {
    const layer  = document.getElementById('window-layer');
    const count  = document.querySelectorAll('.window').length;
    const offset = count * 24;
    this.el.style.left = clamp((layer.clientWidth  - w) / 2 + offset, 40, layer.clientWidth  - w - 40) + 'px';
    this.el.style.top  = clamp((layer.clientHeight - h) / 2 + offset, 20, layer.clientHeight - h - 20) + 'px';
  }
}

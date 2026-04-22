/**
 * Desktop.js — renders desktop icons and manages icon selection.
 * Emits 'app:open' via the bus when an icon is double-clicked.
 *
 * Usage:
 *   const desktop = new Desktop({ bus, icons: DESKTOP_ICONS });
 *   desktop.mount(document.getElementById('desktop'));
 */

import { el } from '../utils/dom.js';

/** Default context menu items for the desktop surface */
const CTX_ITEMS = [
  { label: 'Open File Explorer', emit: 'app:open', data: { id: 'explorer' } },
  { label: 'Open Terminal',      emit: 'app:open', data: { id: 'terminal' } },
  { sep: true },
  { label: 'About This Desktop', emit: 'app:open', data: { id: 'about' } },
];

export class Desktop {
  /**
   * @param {{ bus: import('../utils/events.js').EventBus, icons: DesktopIcon[] }} opts
   * @typedef {{ id: string, label: string, icon: string }} DesktopIcon
   */
  constructor({ bus, icons }) {
    this.bus   = bus;
    this.icons = icons;
    this.el    = null;
    this._selected = null;
  }

  /** @param {HTMLElement} rootEl */
  mount(rootEl) {
    this.el = rootEl;
    this._renderIcons();
    this._bindDesktopEvents();
    this._buildContextMenu();
  }

  // ── Private ─────────────────────────────────────────────────────────

  _renderIcons() {
    this.icons.forEach(icon => {
      const div = el('div', 'desktop-icon');
      div.dataset.id = icon.id;
      div.innerHTML = `
        <div class="desktop-icon__img">${icon.icon}</div>
        <div class="desktop-icon__label">${icon.label}</div>
      `;

      // Single click → select
      div.addEventListener('click', e => {
        e.stopPropagation();
        this._select(div);
      });

      // Double click → open
      div.addEventListener('dblclick', e => {
        e.stopPropagation();
        this.bus.emit('app:open', { id: icon.id });
      });

      this.el.appendChild(div);
    });
  }

  _select(iconEl) {
    // Deselect previous
    if (this._selected) this._selected.classList.remove('selected');
    this._selected = iconEl;
    iconEl.classList.add('selected');
  }

  _bindDesktopEvents() {
    // Clicking blank desktop → deselect
    this.el.addEventListener('click', () => {
      if (this._selected) this._selected.classList.remove('selected');
      this._selected = null;
      this._hideCtx();
    });

    // Right-click → context menu
    this.el.addEventListener('contextmenu', e => {
      if (e.target.closest('.window')) return;
      e.preventDefault();
      this._showCtx(e.clientX, e.clientY);
    });

    document.addEventListener('click', () => this._hideCtx());
  }

  _buildContextMenu() {
    this._ctxEl = document.getElementById('ctx-menu');
    if (!this._ctxEl) return;

    this._ctxEl.innerHTML = CTX_ITEMS.map(item => {
      if (item.sep) return '<div class="ctx-sep"></div>';
      return `<div class="ctx-item" data-emit="${item.emit}" data-id="${item.data?.id ?? ''}">${item.label}</div>`;
    }).join('');

    this._ctxEl.addEventListener('click', e => {
      const item = e.target.closest('.ctx-item');
      if (!item) return;
      const { emit, id } = item.dataset;
      if (emit) this.bus.emit(emit, { id });
      this._hideCtx();
    });
  }

  _showCtx(x, y) {
    if (!this._ctxEl) return;
    this._ctxEl.style.display = 'block';
    // Keep inside viewport
    const w = this._ctxEl.offsetWidth  || 170;
    const h = this._ctxEl.offsetHeight || 120;
    this._ctxEl.style.left = Math.min(x, window.innerWidth  - w - 4) + 'px';
    this._ctxEl.style.top  = Math.min(y, window.innerHeight - h - 4) + 'px';
  }

  _hideCtx() {
    if (this._ctxEl) this._ctxEl.style.display = 'none';
  }
}

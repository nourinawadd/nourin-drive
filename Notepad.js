/**
 * Notepad.js — plain text editor.
 * Will become the Guestbook UI in Step 3 (write to MongoDB via API).
 */

import { BaseApp } from './BaseApp.js';

export class NotepadApp extends BaseApp {
  #timer = null;

  windowDef() {
    return { title: 'Notepad — untitled.txt', icon: '📝', width: 480, height: 360 };
  }

  render() {
    return `
      <div class="notepad-toolbar">
        <button id="np-new">New</button>
        <button id="np-save">Save</button>
        <button id="np-copy">Copy All</button>
      </div>
      <textarea
        class="notepad-textarea"
        id="np-area"
        spellcheck="false"
        placeholder="Start typing…&#10;&#10;(This will become the Guestbook — sign your name!)"
      ></textarea>
      <div class="notepad-status">
        <span id="np-pos">Ln 1, Col 1</span>
        <span id="np-chars">0 chars</span>
        <span>UTF-8</span>
      </div>
    `;
  }

  afterMount() {
    const area   = this.qs('#np-area');
    const posEl  = this.qs('#np-pos');
    const charEl = this.qs('#np-chars');

    const updateStatus = () => {
      const val   = area.value;
      const lines = val.slice(0, area.selectionStart).split('\n');
      posEl.textContent  = `Ln ${lines.length}, Col ${lines.at(-1).length + 1}`;
      charEl.textContent = `${val.length} chars`;
    };

    area.addEventListener('input',     updateStatus);
    area.addEventListener('keyup',     updateStatus);
    area.addEventListener('click',     updateStatus);
    area.addEventListener('selectionchange', updateStatus);

    this.qs('#np-new').addEventListener('click', () => {
      if (area.value && !confirm('Discard changes?')) return;
      area.value = '';
      updateStatus();
    });

    this.qs('#np-save').addEventListener('click', () => {
      const blob = new Blob([area.value], { type: 'text/plain' });
      const a    = Object.assign(document.createElement('a'), {
        href:     URL.createObjectURL(blob),
        download: 'untitled.txt',
      });
      a.click();
      URL.revokeObjectURL(a.href);
    });

    this.qs('#np-copy').addEventListener('click', () => {
      navigator.clipboard?.writeText(area.value);
    });
  }

  destroy() {
    clearTimeout(this.#timer);
  }
}

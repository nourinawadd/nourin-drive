/**
 * Terminal.js — interactive terminal emulator.
 * Supports: help, ls, whoami, cat, clear, open, neofetch, date, echo, pwd.
 * 'open <appId>' fires the app:open event through a stored bus reference.
 */

import { BaseApp } from './BaseApp.js';

const PROMPT = 'nourin@retrodesk:~$ ';

export class TerminalApp extends BaseApp {
  /** @param {import('../utils/events.js').EventBus} [bus] */
  constructor(bus) {
    super();
    this.bus = bus ?? null;
  }

  windowDef() {
    return { title: 'Terminal', icon: '⬛', width: 580, height: 380 };
  }

  render() {
    return `
      <div class="term-body" id="term-body">
        <div class="term-line term-dim">RetroDesk Terminal v1.0 — type <span class="term-cmd">help</span> for commands</div>
        <div class="term-line term-dim">────────────────────────────────────────────</div>
        <div class="term-input-row" id="term-input-row">
          <span class="term-prompt">${PROMPT}</span>
          <input class="term-input" id="term-input" spellcheck="false" autocomplete="off" />
        </div>
      </div>
    `;
  }

  afterMount() {
    this._history = [];
    this._histIdx = -1;
    this._input   = this.qs('#term-input');
    this._body    = this.qs('#term-body');
    this._row     = this.qs('#term-input-row');

    this._input.addEventListener('keydown', e => this._onKey(e));
    this._input.focus();

    // Keep focus when clicking anywhere in terminal
    this._body.addEventListener('click', () => this._input.focus());
  }

  // ── Key handler ───────────────────────────────────────────────────

  _onKey(e) {
    if (e.key === 'Enter') {
      const raw = this._input.value.trim();
      this._input.value = '';
      if (!raw) { this._print(''); return; }

      this._history.unshift(raw);
      this._histIdx = -1;

      this._print(`${PROMPT}${raw}`, 'term-prompt-line');

      const [cmd, ...args] = raw.split(/\s+/);
      const result = this._exec(cmd, args);

      if (result === '__CLEAR__') { this._clear(); return; }
      if (result !== null && result !== undefined) {
        String(result).split('\n').forEach(l => this._print(l, 'term-output'));
      }
      this._print('');

    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this._histIdx < this._history.length - 1) {
        this._histIdx++;
        this._input.value = this._history[this._histIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this._histIdx > 0) {
        this._histIdx--;
        this._input.value = this._history[this._histIdx];
      } else {
        this._histIdx = -1;
        this._input.value = '';
      }
    }
  }

  // ── Commands ──────────────────────────────────────────────────────

  _exec(cmd, args) {
    const cmds = {
      help: () => [
        'Available commands:',
        '  help        show this list',
        '  ls          list files',
        '  pwd         current directory',
        '  whoami      current user',
        '  date        current date & time',
        '  echo [...]  print text',
        '  cat [file]  read a file',
        '  clear       clear screen',
        '  open [app]  open an app window',
        '  neofetch    system info',
      ].join('\n'),

      ls: () =>
        'Documents/  Downloads/  Music/  Pictures/\n' +
        'Projects/   Blog/       Design/  Photography/\n' +
        'README.md   guestbook.txt   ssh_key.pub',

      pwd:    () => '/home/nourin',
      whoami: () => 'nourin',
      date:   () => new Date().toString(),
      echo:   () => args.join(' ') || '',

      cat: () => {
        const f = args[0];
        if (!f) return 'Usage: cat <filename>';
        const files = {
          'README.md':      '# RetroDesk Portfolio\n\nA Win98-style portfolio built on the MERN stack.\nssh nourin.is-a.dev -p 2323',
          'guestbook.txt':  'Sign the guestbook in the Notepad app!\n\n— Alex: "Love the Win98 vibe!"',
          'ssh_key.pub':    'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... nourin@retrodesk',
        };
        return files[f] ?? `cat: ${f}: No such file or directory`;
      },

      clear: () => '__CLEAR__',

      open: () => {
        const id = args[0];
        const known = ['explorer','browser','notepad','about','terminal'];
        if (!id) return 'Usage: open <appId>   (explorer|browser|notepad|about|terminal)';
        if (!known.includes(id)) return `open: "${id}" not found. Try: ${known.join(', ')}`;
        if (this.bus) {
          setTimeout(() => this.bus.emit('app:open', { id }), 80);
          return `Opening ${id}…`;
        }
        return `open: no bus attached`;
      },

      neofetch: () => [
        '      ◈◈◈◈◈◈◈      nourin@retrodesk',
        '    ◈◈◈◈◈◈◈◈◈◈◈    ──────────────────',
        '  ◈◈◈◈◈◈◈◈◈◈◈◈◈◈◈  OS:         RetroDesk OS 1.0',
        '  ◈◈◈  ◈◈◈◈◈  ◈◈◈  Shell:      retrosh 2.1',
        '  ◈◈◈◈◈◈◈◈◈◈◈◈◈◈◈  Resolution: ' + window.innerWidth + 'x' + window.innerHeight,
        '    ◈◈◈◈◈◈◈◈◈◈◈    Theme:      Teal Classic',
        '      ◈◈◈◈◈◈◈      Font:       IBM Plex Mono',
        '                   Stack:      Node · Express · MongoDB',
      ].join('\n'),
    };

    const fn = cmds[cmd];
    if (!fn) return `bash: ${cmd}: command not found`;
    return fn();
  }

  // ── DOM helpers ───────────────────────────────────────────────────

  _print(text, cls = '') {
    const line = document.createElement('div');
    line.className = `term-line${cls ? ' ' + cls : ''}`;
    line.textContent = text;
    this._body.insertBefore(line, this._row);
    this._body.scrollTop = this._body.scrollHeight;
  }

  _clear() {
    this.qsa('.term-line').forEach(l => l.remove());
  }
}

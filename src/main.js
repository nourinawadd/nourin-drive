/**
 * main.js — application entry point.
 *
 * Bootstraps the OS in order:
 *   1. Boot animation
 *   2. Taskbar + Desktop mount
 *   3. Event wiring
 *   4. Auto-open default app
 */

import { EventBus }        from './utils/events.js';
import { Boot }            from './core/Boot.js';
import { Desktop }         from './core/Desktop.js';
import { TaskbarManager }  from './core/TaskbarManager.js';
import { WindowManager }   from './core/WindowManager.js';

import { ExplorerApp }     from './apps/Explorer.js';
import { BrowserApp }      from './apps/Browser.js';
import { NotepadApp }      from './apps/Notepad.js';
import { AboutApp }        from './apps/About.js';
import { TerminalApp }     from './apps/Terminal.js';

// ── App Registry ─────────────────────────────────────────────────────
// Maps desktop icon id → App class. Add new apps here.
const APP_REGISTRY = {
  explorer: ExplorerApp,
  browser:  BrowserApp,
  notepad:  NotepadApp,
  about:    AboutApp,
  // Terminal gets bus injected — wrapped below
};

// ── Desktop Icon Definitions ─────────────────────────────────────────
const DESKTOP_ICONS = [
  { id: 'explorer', label: 'My Files',    icon: '📁' },
  { id: 'browser',  label: 'Browser',     icon: '🌐' },
  { id: 'notepad',  label: 'Notepad',     icon: '📝' },
  { id: 'about',    label: 'About Me',    icon: '👤' },
  { id: 'terminal', label: 'Terminal',    icon: '⬛' },
];

// ── Bootstrap ─────────────────────────────────────────────────────────
async function bootstrap() {
  const bus     = new EventBus();
  const taskbar = new TaskbarManager({ bus });
  const wm      = new WindowManager({ bus, taskbar, registry: buildRegistry(bus) });
  const desktop = new Desktop({ bus, icons: DESKTOP_ICONS });

  taskbar.mount(document.getElementById('taskbar'));
  desktop.mount(document.getElementById('desktop'));

  // Route all app:open events through the window manager
  bus.on('app:open', ({ id }) => wm.open(id));

  // Run boot animation, then auto-open About Me
  const boot = new Boot(document.getElementById('bootscreen'));
  await boot.run();

  wm.open('about');
}

/**
 * Build the registry, injecting the bus into apps that need it (Terminal).
 * @param {EventBus} bus
 */
function buildRegistry(bus) {
  return {
    ...APP_REGISTRY,
    terminal: class extends TerminalApp {
      constructor() { super(bus); }
    },
  };
}

bootstrap();

/**
 * Explorer.js — File Explorer app.
 * Static for now; will later reflect real portfolio sections as folders.
 */

import { BaseApp } from './BaseApp.js';

const SIDEBAR = [
  { section: 'Favorites' },
  { icon: '🖥️',  label: 'Desktop' },
  { icon: '📁',  label: 'Documents' },
  { icon: '⬇️',  label: 'Downloads' },
  { section: 'Portfolio' },
  { icon: '📡',  label: 'API Projects' },
  { icon: '🌐',  label: 'Websites' },
  { icon: '🎨',  label: 'Design Work' },
  { icon: '📷',  label: 'Photography' },
  { section: 'System' },
  { icon: '💽',  label: 'Local Disk (C:)' },
  { icon: '🗑️',  label: 'Recycle Bin' },
];

const FILES = [
  { icon: '📁', name: 'API Projects',  type: 'folder' },
  { icon: '📁', name: 'Websites',      type: 'folder' },
  { icon: '📁', name: 'Design Work',   type: 'folder' },
  { icon: '📁', name: 'Photography',   type: 'folder' },
  { icon: '📁', name: 'Games',         type: 'folder' },
  { icon: '📁', name: 'Blog Posts',    type: 'folder' },
  { icon: '📝', name: 'guestbook.txt', type: 'file' },
  { icon: '📄', name: 'README.md',     type: 'file' },
  { icon: '🔑', name: 'ssh_key.pub',   type: 'file' },
  { icon: '🗑️', name: 'final_final_v3_REAL.mp4', type: 'recycle' },
];

export class ExplorerApp extends BaseApp {
  windowDef() {
    return { title: 'File Explorer', icon: '📁', width: 680, height: 440 };
  }

  render() {
    const sidebarHTML = SIDEBAR.map(item => {
      if (item.section) return `<div class="sidebar-section">${item.section}</div>`;
      return `<div class="sidebar-item">
        <span class="si-icon">${item.icon}</span>
        <span>${item.label}</span>
      </div>`;
    }).join('');

    const filesHTML = FILES.map(f => `
      <div class="file-item" data-name="${f.name}" data-type="${f.type}">
        <div class="file-item__icon">${f.icon}</div>
        <div class="file-item__name">${f.name}</div>
      </div>
    `).join('');

    return `
      <div class="explorer-toolbar">
        <button id="exp-back"    disabled>◀ Back</button>
        <button id="exp-forward" disabled>▶ Fwd</button>
        <button id="exp-up">▲ Up</button>
        <div class="explorer-address">
          <label>Address:</label>
          <input id="exp-addr" class="field-98" value="C:\\Portfolio" readonly>
        </div>
        <button id="exp-go">Go</button>
      </div>

      <div class="explorer-layout">
        <div class="explorer-sidebar">${sidebarHTML}</div>
        <div class="explorer-main" id="exp-main">${filesHTML}</div>
      </div>

      <div class="win-statusbar">
        <span class="status-section">${FILES.length} objects</span>
        <span class="status-section">Ready</span>
      </div>
    `;
  }

  afterMount() {
    // Selection
    this.qsa('.file-item').forEach(item => {
      item.addEventListener('click', () => {
        this.qsa('.file-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
    });

    // Sidebar selection
    this.qsa('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        this.qsa('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }
}

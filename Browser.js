/**
 * Browser.js — integrated iframe browser with a custom homepage.
 * Can navigate to real external URLs (via iframe) or internal app pages.
 */

import { BaseApp } from './BaseApp.js';

const BOOKMARKS = [
  { icon: '📧', title: 'Email',    url: 'mailto:nourinawad@gmail.com',           sub: 'nourinawad@gmail.com' },
  { icon: '💻', title: 'GitHub',   url: 'https://github.com/nourinawadd',         sub: 'github.com/nourinawadd' },
  { icon: '🔗', title: 'LinkedIn', url: 'https://linkedin.com/in/nourinawad',     sub: 'linkedin.com/in/nourinawad' },
  { icon: '🎨', title: 'Behance',  url: 'https://behance.net/nourinawadd',        sub: 'behance.net/nourinawadd' },
  { icon: '📷', title: 'Instagram',url: 'https://instagram.com/diarydump.jpg',    sub: '@diarydump.jpg' },
  { icon: '📡', title: 'API Studio',url: 'https://dev.yousseftawakal.me/studio',  sub: 'internal — open API Studio' },
];

export class BrowserApp extends BaseApp {
  windowDef() {
    return { title: 'Browser', icon: '🌐', width: 780, height: 520 };
  }

  render() {
    const bookmarksHTML = BOOKMARKS.map(b => `
      <div class="browser-bm-card" data-url="${b.url}">
        <h4>${b.icon} ${b.title}</h4>
        <p>${b.sub}</p>
      </div>
    `).join('');

    return `
      <div class="browser-tabs">
        <div class="browser-tab active" id="browser-tab-1">New Tab</div>
        <div class="browser-tab" style="font-size:11px;padding:3px 10px;">＋</div>
      </div>

      <div class="browser-bar">
        <button class="browser-nav-btn" id="br-back"    title="Back"    disabled>◀</button>
        <button class="browser-nav-btn" id="br-forward" title="Forward" disabled>▶</button>
        <button class="browser-nav-btn" id="br-refresh" title="Refresh">↺</button>
        <button class="browser-nav-btn" id="br-home"    title="Home">🏠</button>
        <input  class="browser-url" id="br-url" value="retro://home" />
        <button class="browser-go" id="br-go">Go</button>
      </div>

      <div class="browser-content" id="br-content">
        <div class="browser-home" id="br-home-page">
          <div class="browser-hero">
            <h1>◈ RetroDesk Browser</h1>
            <p>Welcome to the internet — classic edition.</p>
          </div>
          <div class="browser-bookmarks">
            <h3>Bookmarks</h3>
            <div class="browser-bm-grid">${bookmarksHTML}</div>
          </div>
        </div>
      </div>
    `;
  }

  afterMount() {
    const urlInput   = this.qs('#br-url');
    const goBtn      = this.qs('#br-go');
    const homeBtn    = this.qs('#br-home');
    const refreshBtn = this.qs('#br-refresh');
    const content    = this.qs('#br-content');
    const tab        = this.qs('#browser-tab-1');

    const navigate = (url) => {
      if (!url || url === 'retro://home') {
        this._showHome(content, tab);
        urlInput.value = 'retro://home';
        return;
      }

      // External URL — load in iframe
      urlInput.value = url;
      tab.textContent = url.replace(/^https?:\/\//, '').split('/')[0];

      content.innerHTML = `
        <div class="browser-loading">Loading ${url}…</div>
      `;

      setTimeout(() => {
        content.innerHTML = `<iframe src="${url}" title="Browser"></iframe>`;
      }, 200);
    };

    goBtn.addEventListener('click', () => navigate(urlInput.value));
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(urlInput.value); });
    homeBtn.addEventListener('click',    () => navigate('retro://home'));
    refreshBtn.addEventListener('click', () => navigate(urlInput.value));

    // Bookmark clicks
    this.qsa('.browser-bm-card').forEach(card => {
      card.addEventListener('click', () => navigate(card.dataset.url));
    });
  }

  _showHome(content, tab) {
    tab.textContent = 'New Tab';
    content.innerHTML = `
      <div class="browser-home">
        <div class="browser-hero">
          <h1>◈ RetroDesk Browser</h1>
          <p>Welcome to the internet — classic edition.</p>
        </div>
        <div class="browser-bookmarks">
          <h3>Bookmarks</h3>
          <div class="browser-bm-grid">
            ${BOOKMARKS.map(b => `
              <div class="browser-bm-card" data-url="${b.url}">
                <h4>${b.icon} ${b.title}</h4>
                <p>${b.sub}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    // Re-bind bookmark clicks on re-rendered home
    content.querySelectorAll('.browser-bm-card').forEach(card => {
      card.addEventListener('click', () => {
        const urlInput = this.qs('#br-url');
        const navigate = (url) => {
          if (!url || url === 'retro://home') return;
          urlInput.value = url;
          content.innerHTML = `<iframe src="${url}" title="Browser"></iframe>`;
        };
        navigate(card.dataset.url);
      });
    });
  }
}

/**
 * Boot.js — renders and animates the boot screen, then fades out.
 *
 * Usage:
 *   const boot = new Boot(document.getElementById('bootscreen'));
 *   await boot.run();  // resolves once boot animation finishes
 */

const BOOT_LINES = [
  'Initializing kernel',
  'Loading system drivers',
  'Mounting filesystem',
  'Starting network services',
  'Launching desktop environment',
];

const BOOT_DURATION_MS = 2200;   // total before fade-out
const TICK_MS          = 280;    // delay between each log line

export class Boot {
  /** @param {HTMLElement} el */
  constructor(el) {
    this.el = el;
    this._render();
  }

  /** @returns {Promise<void>} */
  run() {
    return new Promise(resolve => {
      // Animate log lines
      const lines = this.el.querySelectorAll('.boot__line');
      lines.forEach((line, i) => {
        setTimeout(() => {
          line.querySelector('.ok').textContent = '[ OK ]';
        }, TICK_MS * (i + 1));
      });

      // Animate progress bar
      const fill = this.el.querySelector('.boot__bar-fill');
      const steps = 20;
      let step = 0;
      const progress = setInterval(() => {
        step++;
        fill.style.width = ((step / steps) * 100) + '%';
        if (step >= steps) clearInterval(progress);
      }, BOOT_DURATION_MS / steps);

      // Fade out and resolve
      setTimeout(() => {
        this.el.style.opacity = '0';
        setTimeout(() => {
          this.el.style.display = 'none';
          resolve();
        }, 550);
      }, BOOT_DURATION_MS);
    });
  }

  _render() {
    this.el.innerHTML = `
      <div class="boot__logo">◈ RETRODESK OS</div>
      <div class="boot__lines">
        ${BOOT_LINES.map(line => `
          <div class="boot__line">
            <span>${line}</span>
            <span class="ok"></span>
          </div>
        `).join('')}
      </div>
      <div class="boot__bar-wrap">
        <div class="boot__bar-fill"></div>
      </div>
    `;
  }
}

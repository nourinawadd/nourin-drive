/**
 * About.js — About Me window.
 * Static bio, tech stack, and links. Easily updated.
 */

import { BaseApp } from './BaseApp.js';

const STACK = [
  'Node.js', 'Express', 'MongoDB', 'REST APIs',
  'React', 'Angular', 'TypeScript', 'JavaScript',
  '.NET', 'Go', 'Git', 'Docker',
];

const LINKS = [
  { icon: '📧', label: 'nourinawad@gmail.com',       href: 'mailto:nourinawad@gmail.com' },
  { icon: '💻', label: 'github.com/nourinawadd',      href: 'https://github.com/nourinawadd' },
  { icon: '🔗', label: 'linkedin.com/in/nourinawad',  href: 'https://linkedin.com/in/nourinawad' },
  { icon: '🎨', label: 'behance.net/nourinawadd',     href: 'https://behance.net/nourinawadd' },
  { icon: '📷', label: '@diarydump.jpg',              href: 'https://instagram.com/diarydump.jpg' },
];

export class AboutApp extends BaseApp {
  windowDef() {
    return { title: 'About Me', icon: '👤', width: 560, height: 420 };
  }

  render() {
    const chipsHTML = STACK.map(s =>
      `<span class="about-chip">${s}</span>`
    ).join('');

    const linksHTML = LINKS.map(l =>
      `<a class="about-link" href="${l.href}" target="_blank" rel="noopener">
        <span class="link-icon">${l.icon}</span>
        <span>${l.label}</span>
      </a>`
    ).join('');

    return `
      <div class="about-body">

        <!-- Left panel -->
        <div class="about-panel">
          <div class="about-avatar">👩‍💻</div>
          <div class="about-name">Nourin Awad</div>
          <div class="about-role">Backend Developer</div>

          <div class="about-stat-group">
            <div class="about-stat">
              <strong>📍 Location</strong>
              Mansoura, Egypt
            </div>
            <div class="about-stat">
              <strong>🎓 Education</strong>
              Communications &amp; Computer Eng.
            </div>
            <div class="about-stat">
              <strong>📊 GPA</strong>
              3.95 / 4.0
            </div>
            <div class="about-stat">
              <strong>✅ Available</strong>
              Open to opportunities
            </div>
          </div>
        </div>

        <!-- Right content -->
        <div class="about-content">
          <div class="about-section-title">Bio</div>
          <p class="about-bio">
            Backend developer from Mansoura, Egypt — focused on building clean,
            scalable APIs and systems. I care a lot about code architecture and
            making things that actually work well under the hood.
            <br><br>
            Currently finishing my Communications &amp; Computer Engineering degree
            while working on personal projects, internships, and this very portfolio
            you're looking at right now.
          </p>

          <div class="about-section-title">Tech Stack</div>
          <div class="about-chips">${chipsHTML}</div>

          <div class="about-section-title">Links</div>
          <div class="about-links">${linksHTML}</div>
        </div>

      </div>
    `;
  }
}

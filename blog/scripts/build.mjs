import {
  readdirSync, readFileSync, writeFileSync, existsSync,
  mkdirSync, rmSync, copyFileSync, statSync, watch,
} from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");

const CONTENT_DIR   = join(ROOT, "content");
const POSTS_DIR     = join(CONTENT_DIR, "posts");
const IMG_DIR       = join(CONTENT_DIR, "img");
const TEMPLATE_DIR  = join(ROOT, "templates");
const STYLE_DIR     = join(ROOT, "styles");
const PUBLIC_DIR    = join(ROOT, "public");
const OUT_DIR       = join(ROOT, "out");
const CLIENT_MANIFEST = join(ROOT, "..", "client", "src", "data", "blog.generated.ts");

const SITE = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8"));

const WORDS_PER_MINUTE = 220;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseFrontmatter(raw) {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };

  const fm = {};
  let lastKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    if (/^\s/.test(line) && lastKey) {
      fm[lastKey] = `${fm[lastKey]} ${line.trim()}`.trim();
      continue;
    }
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    lastKey = line.slice(0, idx).trim();
    fm[lastKey] = line.slice(idx + 1).trim();
  }
  return { fm, body: m[2] ?? "" };
}

function parseTags(value) {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

const isTruthy = (v) => /^(true|yes|1)$/i.test((v ?? "").trim());

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const escXml = (s) => esc(s).replace(/'/g, "&apos;");

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key] ?? "") : "",
  );
}

function longDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function toHtml(markdown) {
  let html = marked.parse(markdown, { gfm: true, breaks: false, mangle: false, headerIds: false });

  html = html.replace(
    /(<img\b[^>]*\bsrc=")([^"]+)(")/g,
    (whole, pre, src, post) =>
      /^(https?:)?\/\//.test(src) || src.startsWith("/") || src.startsWith("data:")
        ? whole
        : `${pre}/img/${src.split("/").map(encodeURIComponent).join("/")}${post}`,
  );

  html = html.replace(
    /<p>\s*(<img\b[^>]*>)\s*<\/p>/g,
    (whole, img) => {
      const title = img.match(/\btitle="([^"]*)"/);
      let caption = title ? title[1] : "";
      const wide = /#wide\s*$/.test(caption);
      if (wide) caption = caption.replace(/#wide\s*$/, "").trim();

      const cleanImg = img.replace(/\s*\btitle="[^"]*"/, "");
      const cls = wide ? "wide" : "";
      const figcaption = caption ? `<figcaption>${caption}</figcaption>` : "";
      return `<figure${cls ? ` class="${cls}"` : ""}>${cleanImg}${figcaption}</figure>`;
    },
  );

  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (whole, level, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const id = slugify(text);
    return `<h${level} id="${id}">${inner}<a class="anchor" href="#${id}" aria-label="link to this section">¶</a></h${level}>`;
  });

  return html.trim();
}

function absolutise(html) {
  return html.replace(/\b(src|href)="\/([^"]*)"/g, (_, attr, path) => `${attr}="${SITE.url}/${path}"`);
}

const cdata = (s) => `<![CDATA[${String(s).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

function readPosts({ drafts = false } = {}) {
  if (!existsSync(POSTS_DIR)) return [];

  const posts = [];
  for (const name of readdirSync(POSTS_DIR)) {
    if (name.startsWith(".") || name.startsWith("_")) continue;
    if (extname(name).toLowerCase() !== ".md") continue;

    const abs = join(POSTS_DIR, name);
    if (!statSync(abs).isFile()) continue;

    const { fm, body } = parseFrontmatter(readFileSync(abs, "utf8"));
    if (isTruthy(fm.draft) && !drafts) continue;

    const stem = basename(name, ".md");
    const dated = stem.match(/^(\d{4}-\d{2}-\d{2})[-_.]?(.*)$/);
    const date = (fm.date || dated?.[1] || "").trim();
    const slug = slugify(fm.slug || dated?.[2] || stem);

    if (!date) {
      console.warn(`[blog] skipping ${name}: no date, and the filename has no YYYY-MM-DD prefix`);
      continue;
    }

    const html = toHtml(body);
    const words = body.replace(/[#*_>`\[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;

    posts.push({
      slug,
      file: name,
      title: fm.title?.trim() || stem,
      date,
      tags: parseTags(fm.tags),
      summary: fm.summary?.trim() || "",
      cover: fm.cover?.trim() || "",
      listening: fm.listening?.trim() || "",
      mood: fm.mood?.trim() || "",
      draft: isTruthy(fm.draft),
      html,
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    });
  }

  posts.sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));
  posts.forEach((p, i) => { p.number = String(i + 1).padStart(3, "0"); });
  return posts;
}

const postPath = (slug) => `/posts/${slug}.html`;
const tagPath  = (tag)  => `/tags/${slugify(tag)}.html`;

function metaLine(post) {
  const parts = [
    `${post.minutes} min read`,
    `${post.words.toLocaleString("en-US")} words`,
  ];
  if (post.listening) parts.push(`♫ ${esc(post.listening)}`);
  if (post.mood) parts.push(`mood: ${esc(post.mood)}`);

  const bits = parts.map((p) => `<span>${p}</span>`).join('<span class="sep">·</span>');
  const tags = post.tags
    .map((t) => `<a class="tag" href="${tagPath(t)}">${esc(t)}</a>`)
    .join(" ");

  return tags ? `${bits}<span class="sep">·</span>${tags}` : bits;
}

function coverBlock(post) {
  if (!post.cover) return "";
  const src = `/img/${post.cover.split("/").map(encodeURIComponent).join("/")}`;
  return `<figure class="cover"><img src="${esc(src)}" alt=""></figure>`;
}

function postNav(prev, next) {
  const left = prev
    ? `<a href="${postPath(prev.slug)}" title="${esc(prev.title)}">&larr; ${esc(prev.title)}</a>`
    : `<span></span>`;
  const right = next
    ? `<a href="${postPath(next.slug)}" title="${esc(next.title)}">${esc(next.title)} &rarr;</a>`
    : `<span></span>`;
  return `${left}<span class="spacer"></span><a href="/random.html">take me somewhere</a><span class="spacer"></span>${right}`;
}

function ogTags({ title, description, canonical, image, type = "website" }) {
  const lines = [
    `<meta property="og:type" content="${esc(type)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:site_name" content="${esc(SITE.title)}">`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
  ];
  if (image) lines.push(`<meta property="og:image" content="${esc(image)}">`);
  return lines.join("\n");
}

function writeOut(relPath, contents) {
  const abs = join(OUT_DIR, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents, "utf8");
  return Buffer.byteLength(contents, "utf8");
}

function copyDir(from, to, skipExt = new Set()) {
  if (!existsSync(from)) return 0;
  let n = 0;
  for (const name of readdirSync(from)) {
    if (name.startsWith(".")) continue;
    if (skipExt.has(extname(name).toLowerCase())) continue;
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) {
      n += copyDir(src, dst, skipExt);
    } else {
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      n++;
    }
  }
  return n;
}

const postBytes = (post) => Buffer.byteLength(post.html, "utf8");

function writeClientManifest(posts, sizes) {
  const rows = posts
    .slice()
    .reverse()
    .map((p) => {
      const fields = [
        `slug: ${JSON.stringify(p.slug)}`,
        `title: ${JSON.stringify(p.title)}`,
        `date: ${JSON.stringify(p.date)}`,
        `number: ${JSON.stringify(p.number)}`,
        `tags: ${JSON.stringify(p.tags)}`,
        `summary: ${JSON.stringify(p.summary)}`,
        `words: ${p.words}`,
        `minutes: ${p.minutes}`,
        `bytes: ${sizes[p.slug] ?? 0}`,
      ];
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");

  const out = `import type { BlogPostMeta } from "./blog";

export const GENERATED_POSTS: BlogPostMeta[] = [
${rows}
];
`;

  try {
    const prev = existsSync(CLIENT_MANIFEST) ? readFileSync(CLIENT_MANIFEST, "utf8") : null;
    if (prev === out) return false;

    mkdirSync(dirname(CLIENT_MANIFEST), { recursive: true });
    writeFileSync(CLIENT_MANIFEST, out, "utf8");
    return true;
  } catch (err) {
    console.warn(`[blog] could not write the client manifest: ${err.message}`);
    return false;
  }
}

function buildFeeds(posts) {
  const newest = posts.slice().reverse().slice(0, 30);
  const updated = newest[0] ? new Date(`${newest[0].date}T12:00:00Z`) : new Date();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${escXml(SITE.title)}</title>
  <link>${escXml(SITE.url)}/</link>
  <description>${escXml(SITE.description)}</description>
  <language>${escXml(SITE.lang)}</language>
  <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
  <atom:link href="${escXml(SITE.url)}/feed.xml" rel="self" type="application/rss+xml"/>
${newest
  .map(
    (p) => `  <item>
    <title>${escXml(p.title)}</title>
    <link>${escXml(SITE.url + postPath(p.slug))}</link>
    <guid isPermaLink="true">${escXml(SITE.url + postPath(p.slug))}</guid>
    <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>
    <dc:creator>${escXml(SITE.author)}</dc:creator>
${p.tags.map((t) => `    <category>${escXml(t)}</category>`).join("\n")}
    <description>${escXml(p.summary)}</description>
    <content:encoded>${cdata(absolutise(p.html))}</content:encoded>
  </item>`,
  )
  .join("\n")}
</channel>
</rss>
`;

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${escXml(SITE.lang)}">
  <title>${escXml(SITE.title)}</title>
  <subtitle>${escXml(SITE.description)}</subtitle>
  <id>${escXml(SITE.url)}/</id>
  <link href="${escXml(SITE.url)}/"/>
  <link href="${escXml(SITE.url)}/atom.xml" rel="self" type="application/atom+xml"/>
  <updated>${updated.toISOString()}</updated>
  <author><name>${escXml(SITE.author)}</name></author>
${newest
  .map(
    (p) => `  <entry>
    <title>${escXml(p.title)}</title>
    <id>${escXml(SITE.url + postPath(p.slug))}</id>
    <link href="${escXml(SITE.url + postPath(p.slug))}"/>
    <published>${new Date(`${p.date}T12:00:00Z`).toISOString()}</published>
    <updated>${new Date(`${p.date}T12:00:00Z`).toISOString()}</updated>
${p.tags.map((t) => `    <category term="${escXml(t)}"/>`).join("\n")}
    <summary>${escXml(p.summary)}</summary>
    <content type="html">${cdata(absolutise(p.html))}</content>
  </entry>`,
  )
  .join("\n")}
</feed>
`;

  writeOut("feed.xml", rss);
  writeOut("atom.xml", atom);
}

export function generate({ drafts = false, manifestOnly = false } = {}) {
  const posts = readPosts({ drafts });

  if (manifestOnly) {
    const sizes = Object.fromEntries(posts.map((p) => [p.slug, postBytes(p)]));
    const changed = writeClientManifest(posts, sizes);
    if (changed) console.log(`[blog] manifest: ${posts.length} post(s) → client/src/data/blog.generated.ts`);
    return posts.length;
  }

  const base    = readFileSync(join(TEMPLATE_DIR, "base.html"), "utf8");
  const tplPost = readFileSync(join(TEMPLATE_DIR, "post.html"), "utf8");
  const tplIndex= readFileSync(join(TEMPLATE_DIR, "index.html"), "utf8");
  const tplEntry= readFileSync(join(TEMPLATE_DIR, "entry.html"), "utf8");
  const tplArch = readFileSync(join(TEMPLATE_DIR, "archive.html"), "utf8");
  const tplTag  = readFileSync(join(TEMPLATE_DIR, "tag.html"), "utf8");

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const common = {
    lang: SITE.lang,
    siteTitle: esc(SITE.title),
    tagline: esc(SITE.tagline),
    desktop: esc(SITE.desktop),
    api: esc(SITE.api),
    apiDev: esc(SITE.apiDev),
    footer: `${esc(SITE.title)} &middot; <a href="/feed.xml">rss</a> &middot; <a href="${esc(SITE.desktop)}">back to the desktop</a>`,
    navIndex: "",
    navArchive: "",
    bodyAttrs: "",
  };

  const page = (vars) => render(base, { ...common, ...vars });

  const newest = posts.slice().reverse();
  const sizes = {};

  posts.forEach((p, i) => {
    const prev = posts[i - 1] ?? null;
    const next = posts[i + 1] ?? null;
    const canonical = SITE.url + postPath(p.slug);

    const content = render(tplPost, {
      number: p.number,
      dateLong: longDate(p.date),
      title: esc(p.title),
      meta: metaLine(p),
      cover: coverBlock(p),
      body: p.html,
      nav: postNav(prev, next),
    });

    const html = page({
      pageTitle: `${esc(p.title)} · ${esc(SITE.title)}`,
      description: esc(p.summary || SITE.description),
      canonical: esc(canonical),
      ogTags: ogTags({
        title: p.title,
        description: p.summary || SITE.description,
        canonical,
        image: p.cover ? `${SITE.url}/img/${encodeURIComponent(p.cover)}` : "",
        type: "article",
      }),
      bodyAttrs: ` data-slug="${esc(p.slug)}"`,
      content,
    });

    writeOut(`posts/${p.slug}.html`, html);
    sizes[p.slug] = postBytes(p);
  });

  const entries = newest
    .map((p) =>
      render(tplEntry, {
        number: p.number,
        dateLong: longDate(p.date),
        slug: p.slug,
        title: esc(p.title),
        meta: metaLine(p),
        summary: esc(p.summary),
      }),
    )
    .join("\n");

  writeOut(
    "index.html",
    page({
      pageTitle: esc(SITE.title),
      description: esc(SITE.description),
      canonical: `${esc(SITE.url)}/`,
      ogTags: ogTags({ title: SITE.title, description: SITE.description, canonical: `${SITE.url}/` }),
      navIndex: ' aria-current="page"',
      content: render(tplIndex, {
        siteTitle: esc(SITE.title),
        tagline: esc(SITE.tagline),
        entries: entries || '  <p class="note">Nothing here yet.</p>',
      }),
    }),
  );

  const byTag = new Map();
  for (const p of newest) {
    for (const t of p.tags) {
      if (!byTag.has(t)) byTag.set(t, []);
      byTag.get(t).push(p);
    }
  }

  for (const [tag, items] of byTag) {
    const rows = items
      .map(
        (p) =>
          `    <li><span class="when">${longDate(p.date)}</span><a href="${postPath(p.slug)}">${esc(p.title)}</a></li>`,
      )
      .join("\n");

    writeOut(
      `tags/${slugify(tag)}.html`,
      page({
        pageTitle: `#${esc(tag)} · ${esc(SITE.title)}`,
        description: `Posts tagged ${esc(tag)}.`,
        canonical: esc(SITE.url + tagPath(tag)),
        ogTags: ogTags({ title: `#${tag}`, description: `Posts tagged ${tag}.`, canonical: SITE.url + tagPath(tag) }),
        content: render(tplTag, {
          tag: esc(tag),
          count: `${items.length} post${items.length === 1 ? "" : "s"}`,
          rows,
        }),
      }),
    );
  }

  const years = new Map();
  for (const p of newest) {
    const y = p.date.slice(0, 4);
    if (!years.has(y)) years.set(y, []);
    years.get(y).push(p);
  }

  const yearBlocks = [...years.entries()]
    .map(
      ([year, items]) => `  <h2 class="year">${year}</h2>
  <ul class="rows">
${items
  .map(
    (p) =>
      `    <li><span class="when">${longDate(p.date)}</span><a href="${postPath(p.slug)}">${esc(p.title)}</a></li>`,
  )
  .join("\n")}
  </ul>`,
    )
    .join("\n");

  const tagCloud = [...byTag.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([t, items]) => `<a class="tag" href="${tagPath(t)}">${esc(t)} ${items.length}</a>`)
    .join(" ");

  writeOut(
    "archive.html",
    page({
      pageTitle: `archive · ${esc(SITE.title)}`,
      description: `Every post on ${esc(SITE.title)}.`,
      canonical: `${esc(SITE.url)}/archive.html`,
      ogTags: ogTags({ title: `archive · ${SITE.title}`, description: SITE.description, canonical: `${SITE.url}/archive.html` }),
      navArchive: ' aria-current="page"',
      content: render(tplArch, {
        count: `${posts.length} post${posts.length === 1 ? "" : "s"}`,
        tags: tagCloud || '<span class="note">no tags yet</span>',
        years: yearBlocks || '  <p class="note">Nothing here yet.</p>',
      }),
    }),
  );

  writeOut(
    "search-index.json",
    JSON.stringify(
      newest.map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        tags: p.tags,
        summary: p.summary,
      })),
    ),
  );

  const slugList = JSON.stringify(posts.map((p) => p.slug));
  writeOut(
    "random.html",
    page({
      pageTitle: `somewhere · ${esc(SITE.title)}`,
      description: esc(SITE.description),
      canonical: `${esc(SITE.url)}/random.html`,
      ogTags: "",
      content: `<section class="sheet"><h1 class="post-title">taking you somewhere&hellip;</h1>
  <p class="note">If nothing happens, <a href="/archive.html">try the archive</a>.</p>
  <script>
    var slugs = ${slugList};
    if (slugs.length) location.replace("/posts/" + slugs[Math.floor(Math.random() * slugs.length)] + ".html");
  </script></section>`,
    }),
  );

  writeOut(
    "404.html",
    page({
      pageTitle: `not found · ${esc(SITE.title)}`,
      description: "There's nothing at this address.",
      canonical: `${esc(SITE.url)}/404.html`,
      ogTags: "",
      content: `<section class="sheet"><div class="post-num-row"><span>404</span><span>&nbsp;</span></div>
  <h1 class="post-title">nothing at this address</h1>
  <hr class="rule">
  <p>Whatever was here has moved, or never was. Try the <a href="/">index</a> or the <a href="/archive.html">archive</a>.</p></section>`,
    }),
  );

  copyDir(STYLE_DIR, join(OUT_DIR, "styles"));
  copyDir(IMG_DIR, join(OUT_DIR, "img"), new Set([".md"]));
  copyDir(PUBLIC_DIR, OUT_DIR);
  copyFileSync(join(ROOT, "blog.js"), join(OUT_DIR, "blog.js"));

  buildFeeds(posts);
  writeClientManifest(posts, sizes);

  const drafted = readPosts({ drafts: true }).length - posts.length;
  console.log(
    `[blog] ${posts.length} post(s), ${byTag.size} tag(s)` +
      (drafted > 0 ? `, ${drafted} draft(s) skipped` : "") +
      ` → out/`,
  );
  return posts.length;
}

function startWatching(opts) {
  let timer = null;
  const rerun = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        generate(opts);
      } catch (err) {
        console.error(`[blog] rebuild failed: ${err.message}`);
      }
    }, 150);
  };

  for (const dir of [CONTENT_DIR, TEMPLATE_DIR, STYLE_DIR, PUBLIC_DIR]) {
    if (existsSync(dir)) watch(dir, { recursive: true }, rerun);
  }
  watch(join(ROOT, "blog.js"), rerun);
  console.log("[blog] watching content/, templates/, styles/ — edits rebuild automatically");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const opts = {
    drafts: process.argv.includes("--drafts"),
    manifestOnly: process.argv.includes("--manifest"),
  };
  generate(opts);
  if (process.argv.includes("--watch")) startWatching({ ...opts, manifestOnly: false });
}

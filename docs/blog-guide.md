# Writing on the blog

The companion to `library-guide.md` and `music-guide.md`, for the thing that
isn't an app: the blog is its own website, deployed on its own, at its own URL.

## The short version

Copy `blog/content/_template.md` into `blog/content/posts/`, name it
`YYYY-MM-DD-some-slug.md`, write, set `draft: false`.

```
blog/content/posts/
    2026-08-15-hello-welcome-in.md      →  /posts/hello-welcome-in.html
    2026-09-02-on-cold-peppers.md       →  /posts/on-cold-peppers.html
```

While `npm run dev` is running the folder is watched, so a post you save
rebuilds itself. Otherwise `npm run blog` from the repo root.

The filename does two jobs: the `YYYY-MM-DD` prefix sets the date, and whatever
follows it becomes the slug - which is the URL, permanently. Rename a published
post and you break its links, so pick the slug once.

## It is a separate site

```
nourin.is-a.dev        the desktop     (client/)
blog.nourin.is-a.dev   the blog        (blog/)
```

Two sites, one repo. The blog is plain static HTML, served by nginx out of
`/var/www/blog` on the Oracle VM - `blog/deploy.sh` builds it and uploads it.
The blog stays up even if the desktop build breaks, and someone can read it
having never found the desktop.

Inside the desktop it shows up in three places, all pointing at the same real
pages: the **Blog** drive icon and dock tile, the **Blog** folder in the File
Explorer (one `.html` file per post - those are the files that actually ship),
and `nourin.is-a.dev/?post=<slug>` as a deep link.

## The frontmatter

| Field | Required | What it does |
| --- | --- | --- |
| `title` | yes | The heading, the `<title>`, the feed entry title |
| `date` | from filename | `YYYY-MM-DD`. Overrides the filename prefix |
| `tags` | no | `life, meta` or `[life, meta]`. Each becomes a page under `/tags/` |
| `summary` | no | The line on the index and in the RSS feed |
| `cover` | no | Filename in `content/img/`, shown full-width above the post |
| `listening` | no | Rendered as `♫ …` under the title |
| `mood` | no | Rendered as `mood: …` under the title |
| `draft` | no | `true` hides it everywhere |
| `slug` | no | Overrides the slug from the filename |

Values are read as `key: value`, split on the **first** colon, so a value can
contain colons. It is not YAML - don't expect nested keys or block syntax. A
value can wrap onto the next line as long as that line is indented:

```
summary:   an introduction, an overshare, and why this
           website exists at all
```

Reading time and word count are worked out for you.

## Images

Drop them in `blog/content/img/` and reference them by filename alone:

```markdown
![my desk](desk.jpg "the scene of the crime")
```

The text in quotes becomes the caption. An image alone in its own paragraph
becomes a `<figure>`; an image mid-sentence stays inline. Add `#wide` to the end
of a caption to break out past the text column:

```markdown
![the whole setup](desk.jpg "everything at once #wide")
```

Sub-folders work - `![x](trips/kuwait.jpg)` ships as `/img/trips/kuwait.jpg`.
Alt text is for people using a screen reader; the caption is for everyone. They
are allowed to say different things.

## Comments

Anyone can comment, with a name or without one - blank shows as *anonymous*.
They're stored in your MongoDB next to the guestbook, and rate-limited to 5 per
15 minutes per person.

You reply as the webmaster, and your reply appears indented under theirs, the
same way the guestbook works:

```bash
curl -X PATCH http://localhost:5000/api/blog/comments/<id>/reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reply":"thank you for reading :)"}'
```

To hide one (soft delete - the numbering stays intact):

```bash
curl -X DELETE http://localhost:5000/api/blog/comments/<id> \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Add `?purge=true` to remove it from the database entirely.

## The feed

`/feed.xml` (RSS 2.0) and `/atom.xml` (Atom) are rebuilt from the same markdown
every time you build. You never touch them.

A reader pastes that URL into a feed reader - Feedly, NetNewsWire, Thunderbird,
a Discord bot - and your posts turn up there when you publish. No account, no
email address handed to you, nothing to send. Every page also carries the
autodiscovery `<link>` tag, so browser extensions offer "subscribe" on their
own.

Both feeds carry the full text of the last 30 posts, so someone can read
everything without leaving their reader.

## What the build makes

```
blog/out/
    index.html              newest first
    posts/<slug>.html       the post
    archive.html            by year, plus the tag list
    tags/<tag>.html         one per tag
    feed.xml  atom.xml      the feeds
    search-index.json       for the search box
    random.html  404.html
    styles/  img/  blog.js  favicon.svg
```

Plus `client/src/data/blog.generated.ts` - the index the desktop's File Explorer
reads. Never edit it; it's rewritten on every build.

`out/` is wiped and rebuilt each time, so a post you delete or rename doesn't
leave an orphaned page behind.

## Running it

```
npm run dev          everything: client :3000, server :5000, blog :4000
npm run blog         build the blog once
npm run blog:serve   serve blog/out on :4000
```

For comments to work locally, `server/.env` needs the blog's origin:

```
BLOG_URL=http://localhost:4000
```

Without it the API rejects the request and the post shows "Couldn't load the
comments". In production set `ALLOWED_ORIGINS` to both real origins.

## Changing how it looks

| What | Where |
| --- | --- |
| Colours, type, spacing, the whole design | `blog/styles/paper.css` |
| Page structure, the top bar, the comment form | `blog/templates/*.html` |
| Site title, tagline, URLs, API address | `blog/site.config.json` |
| Markdown → HTML, feeds, the manifest | `blog/scripts/build.mjs` |

Templates are plain HTML with `{{slot}}` placeholders - no template language to
learn. The palette is the same `--wb-*` set the desktop uses; `--wb-paper*` is
the warm reading stock borrowed from the Ereader.

## When it doesn't work

| Symptom | Cause |
| --- | --- |
| New post doesn't appear | It's still `draft: true`, or the dev server isn't running. Run `npm run blog`. |
| `skipping <file>: no date` | No `date:` and no `YYYY-MM-DD` prefix on the filename. |
| Post appears with the wrong URL | The slug comes from the filename after the date prefix. Rename the file, or set `slug:` explicitly. |
| Image is a broken icon | It isn't in `content/img/`, or the filename's case doesn't match (it matters once deployed, even though Windows ignores it locally). |
| Caption shows `#wide` | The `#wide` must be at the very end of the caption. |
| Comments say "server may be asleep" | The API isn't running, or `BLOG_URL` / `ALLOWED_ORIGINS` doesn't list the blog's origin. |
| Read counter never appears | Same as above - it fails quietly on purpose rather than showing a broken number. |
| Explorer shows no Blog folder | No published posts yet, or `client/src/data/blog.generated.ts` was never generated. Run `npm run blog`. |
| A tag page 404s | Tags are slugified - `Cold Peppers` lives at `/tags/cold-peppers.html`. |

## Quick reference

```
blog/content/posts/YYYY-MM-DD-slug.md   a post
blog/content/img/<file>                 an image, used as ![x](<file>)
blog/content/_template.md               copy this to start

npm run blog        build now
npm run dev         watch + serve, alongside everything else
```

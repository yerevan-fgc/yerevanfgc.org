# Yerevan FGC

Static Astro community bulletin, with English (`/`), Armenian (`/hy/`), and Russian (`/ru/`) pages. UI labels are translated; editorial copy intentionally remains lorem ipsum. No CMS, accounts, or framework runtime is needed.

## Development

Use Node 24 (also used by CI, specified in `.nvmrc`) and `npm ci`. With nvm installed, run `nvm use` first.

```sh
npm run dev -- --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

The dev server normally runs at http://localhost:4321. Use the background commands above rather than a foreground server.

```sh
npm run check
npm run build
npm test
```

Tests inspect the generated `dist` pages, so build before testing.

## GitHub Pages deployment

`.github/workflows/astro.yml` installs locked dependencies with `npm ci`, checks types, builds, and tests the generated pages. Pull requests to `main` run validation only; pushes to `main` and manual runs deploy `dist/` after validation passes.

In repository **Settings → Pages**, select **GitHub Actions** as the source and configure **yerevanfgc.org** as the custom domain, with its DNS pointing to GitHub Pages. The build uses the canonical URL in `src/config/site.ts` and the domain root; it does not override `site` or `base` with GitHub's repository URL. A default `github.io/repository/` deployment would require changes to root-relative asset and locale links throughout the site.

Deployment does not change `site.published`: locales marked `false` remain previews with `noindex`. Update those flags only when their content is ready for search engines.

## Editing guide

### Site settings

Edit `src/config/site.ts`. This is the source of truth for the canonical domain (also consumed by Astro), timezone, Twitter/Discord URLs, venue and Google Maps URLs, automatic event selection, analytics and locale publication status. All settings are public; never store secrets here. `site.logo` holds the header logo (`src`, intrinsic `width`, and intrinsic `height`); it is currently `null` to display the text site title. Set `site.twitterUrl` to the community profile URL to show the Twitter contact link with `public/ui/twitter.png`.

Missing social URLs are omitted. A missing venue or map renders a neutral placeholder. Add the club's name and street address, its directions URL, and the `src` URL from Google Maps → Share → Embed a map. Use the embed URL, not the entire iframe snippet. The real map loads lazily; an address and directions link remain independent of the map.

Analytics is off by default. Set `analytics.measurementId` to a `G-…` ID and `analytics.enabled` to `true` when ready to activate it. Analytics loads only on published locales in production builds.

### Announce the next meetup

1. Copy an existing event, such as `src/content/events/2026-11-07-saturday-mash-69.json`, to a filename in `YYYY-MM-DD-event-title` format, e.g. `2027-01-09-saturday-mash-71.json`. Set `draft: true` while preparing it. The filename is its stable ID.
2. Fill in `translations.en`, `.hy`, and `.ru`: title, tagline, and optional description. The timestamp and venue are shared, not copied across translations.
3. Set `date` to `YYYY-MM-DD` (e.g. `2026-11-07`) and `time` to a same-day 24-hour range such as `15:00 – 20:00`. A plain hyphen is also accepted. Dates display as “Sat, 7 Nov” in English, with localized Armenian/Russian equivalents. Clock times are interpreted in the configured venue timezone (`Asia/Yerevan`), independent of the visitor’s timezone. End must follow start. Set `venueId` to the configured venue ID (`main` initially).
4. Set `draft` to `false`. Optionally supply an `announcementUrl` and a `poster` URL or path under `public/`. Set `posterSize` to its intrinsic `{ "width": 400, "height": 560 }` (adjust for the real asset). The localized event title is used as the poster alt text. Posters link to the full image and are displayed without cropping. Published events require both date and time. A draft entry may leave them `null`.
5. The nearest upcoming non-draft event is selected automatically by its date and time in `site.timezone`. An ongoing event stays selected until it ends; if all events have ended, the most recent one stays visible. No filename reference needs updating.
6. Run the checks above, review all language pages, and deploy the new build.

Draft entries show supplied dates, times, and posters only in unpublished locale previews; announcements remain hidden. Published locales hide draft scheduling details and posters. A published featured event stays visible with its poster, date, time, description, and announcement link even after its scheduled end. Selection is recalculated when the page is rendered: on each production build, or on requests to the development server. The deployed static site needs a rebuild to switch events as time passes. If no non-draft events exist, the event block shows its pending fallback. Existing entries remain available for a future archive, but no archive pages are generated yet.

### Page content, FAQ, and games

- `src/content/pages/en.json`, `hy.json`, and `ru.json` contain only the homepage SEO title, meta description, and FAQ. About us prose is stored in Markdown, separately. Edit them directly; no component changes are necessary.
- FAQ entries have shared, stable IDs. Preserve IDs and order across locales when translating. Each question is a heading followed by an always-visible answer.
- `src/content/games/*.json` contains the games shown in two columns below the event in the right sidebar. Each entry has `order`, `name` (one shared string for all languages), `logo` (image path or URL), and `link` (HTTP/HTTPS URL). Put local logos under `public/` and reference them from `/`, e.g. `/games/example.png`. Set `logo` and `link` to `null` until supplied; missing logos render as text, and missing links render without a clickable target. Add/remove entries to change the list. Game entries are ordered explicitly. Current normalized logos live directly under `public/games/`. Logos are trimmed to their visible bounds, fitted without cropping or stretching to a transparent 228×124 PNG canvas (2× a 114×62 desktop cell), and displayed in two columns.
- `src/content/about/en.md`, `hy.md`, and `ru.md` hold the About us text. The small YAML frontmatter identifies the locale; write normal Markdown below it. The section heading comes from the UI dictionary. The old `introTitle`, `introLead`, and `introBody` fields have been removed.
- `src/content/news/<entry>/en.md`, `hy.md`, and `ru.md` hold each news item. A shared folder identifies translations of the same entry. Frontmatter holds `locale`, `title`, quoted `date` (`YYYY-MM-DD`), `draft`, and optional media metadata; everything below the closing `---` is the article body. The homepage shows the three latest entries in the active language. News drafts (`draft: true`) appear only in the development server (`npm run dev`). Production builds (`npm run build`), including `npm run preview` and GitHub Pages, exclude them regardless of `site.published`. Set `draft: false` to publish a news entry.
- News media remains optional: add `image` with `src`, intrinsic `width`/`height`, `placement` (`thumbnail` or `wide`), and optional `pixelated`. Set `imageAlt` and optional `imageCaption` beside it in frontmatter. Thumbnails sit next to the opening paragraph; wide images follow the first top-level paragraph. Remove `image` for text-only news. Images retain full-size links and stack appropriately on narrow phones.
- `src/i18n/ui.ts` contains functional labels. Its types require each locale to implement every label. Armenian uses the language code `hy`; `AM` is a country code.
- Keep editorial copy as placeholders until the copywriter supplies approved text. Have a native speaker review Armenian/Russian UI translations before launch.

### Publish a language

All locales start with `site.published` set to `false`. They are navigable previews with `noindex`, excluded from the sitemap and SEO language alternates. Do not flip the flag until its page metadata, editorial copy, event text and configuration have been reviewed. Set the corresponding flag to `true`, build, and deploy. Published pages receive self-canonicals and alternate links to other approved locales. Draft/placeholder previews never emit Event JSON-LD; published locales emit it only for a non-draft event with dates and a configured venue name/address. There is no automatic translation or browser-language redirect.

The preview flag is an indexing instruction, not access control. A deployed preview is still publicly readable.

### Design and assets

`src/styles/global.css` begins with editable tokens for colors, fonts, borders and spacing. The chosen stage from `public/backgrounds/` is centered and scaled to cover the viewport without repeating, and stays fixed while content scrolls. The default is `site.defaultBackground` (`/backgrounds/esaka.webp`). Cover preserves its proportions and may crop the edges. Stage selection supplies the `--background-image` token. Size, repeat, position, and attachment remain controlled by the other `--background-*` tokens. The reading surfaces stay opaque for legibility over detailed artwork.

The homepage follows `DESIGN.md`: a modest text header, compact hyperlink navigation, a continuous document-style center with paragraphs and dividers, dated news, a simple games list, plain question-and-answer FAQ entries, and a compact event notice. The detached three-column layout and existing dark palette remain. There are no shared card frames, CTA buttons, stripes, bevels, or text shadows. Typography uses self-hosted Golos Text for English/Russian and Noto Sans Armenian for Armenian. Reading text is 17px on desktop and 18px on mobile. Fonts and OFL licenses live under `public/fonts/`. Editorial copy, including the sample news entries, remains lorem ipsum.

The desktop left sidebar stays at its initial position until scrolling reaches it, then sticks 10px from the viewport top. On short screens it can scroll internally; tablet navigation remains in normal flow. In the single-column mobile layout, only the compact navigation sticks to the top; its title is hidden.

Desktop uses three columns; tablet keeps compact top navigation and a sidebar; mobile order is header, compact sticky navigation, full-width event poster/details, main reading content, then stage selection, games, GIF, and community links. Stage choices wrap into the same two-column link layout as navigation. Anchor scrolling accounts for the actual navigation height. Language links open the selected language at the top of the page. Future event posters, galleries, reports, and Discord can extend this foundation; only the optional Discord link and poster field are wired today.

### Image layout placeholders

Solid black PNGs under `public/placeholders/` preview the header logo, game logos, event poster, and two news image arrangements. They are simple layout assets; all editorial text remains lorem ipsum. The header is configured in `src/config/site.ts`; game logos and the poster are referenced by JSON content entries; news image references live in Markdown frontmatter. Replace those paths and dimensions when actual artwork is ready. Keep photos at normal rendering; use `pixelated: true` for pixel-art news images. The background retains its independent pixelated rendering.

### Footer links and Stage select

`src/content/community/home.json` holds the footer badge links. The sidebar now shows GIF of the week. The badge list is currently empty, so no badge row appears below the map.

The left sidebar contains “Stage select”, a simple text-style list of backgrounds. Entries under `src/content/backgrounds/` contain only `link` (a local path under `/backgrounds/`) and `name`. Names are shared across languages and are derived from filenames with underscores replaced by spaces and words capitalized. To add a stage, put its asset in `public/backgrounds/` and add a JSON entry. Set the default in `src/config/site.ts`; it must reference a content entry.

A chosen stage is saved under the local-storage key `yerevan-fgc:background`, shared across the language routes. It restores in the head before styles paint; deleted or unknown choices fall back to Esaka. Tabs synchronize changes. If storage is blocked, selection still works for the current page; without JavaScript the default stage is used. The active stage is bold and exposed as a pressed button to assistive technology. The former sprite component and configuration have been removed.

### GIF of the week

GIF assets are in `public/gif/` (singular). Each JSON entry under `src/content/gifs/` has three fields: `file` (e.g. `/gif/sol-gunflame.gif`), `name` (shared descriptive alt text), and `source` (the provider URL). The initial alt strings are inferred from filenames and can be edited. All supplied character GIFs are included; `tfg.gif` is the provider banner and is excluded from selection. Dimensions are read from the actual GIF files at build time.

The right sidebar displays the selected animation, “Provided by”, and the linked TFG banner in that order. A small client-side picker in `src/lib/gifs.ts` deterministically selects an entry for the current Monday–Sunday week in the configured community timezone (`Asia/Yerevan`). It recalculates on page load, so refreshes, language switches, and visitors in different timezones see the same selection for that week. No storage or scheduled build is needed. Adding/removing entries can change the current selection. The first entry is a no-JavaScript fallback. A small pause/play control covers both the GIF and animated banner; reduced-motion visitors start paused. Art is never stretched: large GIFs shrink to the sidebar width, and small GIFs retain their intrinsic size. To add another animation, copy an entry and change its three fields.

### Link behavior

Use `src/components/Link.astro` for links, including content-driven URLs. It renders a normal anchor and adds `target="_blank"` and `rel="noopener noreferrer"` to external HTTP/HTTPS links. Internal paths, fragments, and absolute URLs on the site's canonical origin retain normal navigation. Existing `rel` tokens are preserved. The GIF attribution applies the same helper when its URL changes in the browser. Generated-page checks enforce this rule for future links.

### Writing Markdown

Copy an existing news folder to start a new item, then edit each language file. Keep common dates, draft state, and shared media consistent across translations. The filename (`en.md`, `hy.md`, `ru.md`) and frontmatter `locale` must match. No new routes or Astro components are required. Example:

```md
---
locale: "en"
title: "Lorem ipsum"
date: "2026-11-14"
draft: true
---

Lorem ipsum dolor sit amet.

Another paragraph with **emphasis** and [a section link](#faq).

- Lorem ipsum
- Dolor sit amet
```

Keep the date quoted so it remains a string. Use blank lines between paragraphs, not escaped JSON newlines. Do not repeat the section/article title as a `#` heading in the body: About us has its own heading and news titles are rendered from frontmatter. Body subheadings can use `##` in About us and `####` within news. The official Astro Markdown processor renders rich text and uses a small HTML-tree transform for frontmatter media and external links. Markdown links to other sites open in a new tab with `noopener noreferrer`; internal paths and section links stay in the same tab. HTML is built statically; this adds no browser Markdown runtime.

Event metadata: `eventStatus` defaults to `EventScheduled`; use `EventCancelled`, `EventPostponed`, or `EventRescheduled` when appropriate. Each translation may include `description`, which appears in the event block and structured data. The organizer is Yerevan FGC, taken from the site name and canonical URL. Offers and performers are intentionally omitted for casual meetups.

### Event calendar

`/events/`, `/hy/events/`, and `/ru/events/` show upcoming/ongoing events chronologically, followed by past events newest first. The boundary is the event end time in `site.timezone`. Dated draft events appear only in `npm run dev`; undated drafts are omitted until scheduled. Event status labels remain visible for cancelled, postponed, and rescheduled entries. Each row uses the translated title, optional poster, time, venue, and description. Individual event pages and reports are a later step; poster links open the full existing asset. Date grouping refreshes on build for production, as with homepage event selection.

### Client-side navigation

Astro ClientRouter enhances internal links while pages remain statically generated and directly accessible without JavaScript. The stage background is a persistent fixed layer, with the live CSS selection copied before document swaps. Page controls initialize through `onPageLoad` in `src/lib/page-lifecycle.ts`; return a cleanup function for observers and listeners on long-lived objects such as `window` and media queries. Navigation uses no page animation.

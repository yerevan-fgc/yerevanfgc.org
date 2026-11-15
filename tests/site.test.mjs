import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { readMarkdown } from './helpers/markdown.mjs';
import { site, locales, localePath } from '../src/config/site.ts';

// Run after `npm run build`: these check the actual generated pages.
for (const locale of locales) {
  test(`${locale}: generated page has correct language, metadata, links and indexing policy`, async () => {
    const html = await readFile(`dist${localePath(locale)}index.html`, 'utf8');
    assert.match(html, new RegExp(`<html lang="${locale}"`));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, /<main\b/);
    assert.match(html, /name="description"/);
    assert.ok(html.includes(`rel="canonical" href="${new URL(localePath(locale), site.url).href}"`));
    assert.ok(html.includes(`content="${site.published[locale] ? 'index, follow' : 'noindex, follow'}"`));
    if (!site.published[locale]) {
      assert.doesNotMatch(html, /hreflang="x-default"/);
      assert.doesNotMatch(html, /application\/ld\+json/);
      assert.doesNotMatch(html, /googletagmanager\.com/);
    }
    for (const target of locales) {
      const anchor = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).find(tag => tag.includes(`lang="${target}"`));
      assert.ok(anchor?.includes(`href="${localePath(target)}"`));
      assert.ok(anchor?.includes(`hreflang="${target}"`));
    }
    for (const id of ['about','games','faq','location','next-event','main','top']) assert.ok(html.includes(`id="${id}"`));
    assert.doesNotMatch(html, /src="(?:null|undefined)"|href="(?:null|undefined)"/);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'No duplicated HTML IDs');
    for (const match of html.matchAll(/(?:src|href)="(\/(?:fonts\/|_astro\/|background|favicon)[^"?#]+)"/g)) {
      await access(`dist${match[1]}`);
    }
  });
}
test('FAQ identifiers match across translations and remain unique', async () => {
  const pages = await Promise.all(locales.map(l => readFile(`src/content/pages/${l}.json`, 'utf8').then(JSON.parse)));
  const ids = pages[0].faq.map(item => item.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const page of pages) assert.deepEqual(page.faq.map(item => item.id), ids);
});
test('sitemap contains approved locales only', async () => {
  const xml = await readFile('dist/sitemap.xml', 'utf8');
  for (const locale of locales) assert.equal(xml.includes(`<loc>${new URL(localePath(locale), site.url).href}</loc>`), site.published[locale]);
});
test('venue map and directions render when configured, with safe optional fallbacks', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  if (!site.venue.mapEmbedUrl) assert.doesNotMatch(html, /<iframe/);
  else {
    const iframe = html.match(/<iframe\b[^>]*>/)?.[0];
    assert.ok(iframe);
    assert.match(iframe, /loading="lazy"/);
    assert.match(iframe, /title="[^"]+"/);
    assert.ok(iframe.replaceAll('&amp;', '&').includes(`src="${site.venue.mapEmbedUrl}"`));
    assert.ok(html.includes(site.venue.name));
    assert.ok(html.includes(site.venue.address));
    assert.ok(html.replaceAll('&amp;', '&').includes(`href="${site.venue.directionsUrl}"`));
  }
  if (!site.twitterUrl) assert.doesNotMatch(html, /href="https:\/\/(?:www\.)?(?:twitter|x)\.com/);
});

test('news entries render newest first and page fragment links resolve', async () => {
  const files = (await readdir('src/content/news', { recursive: true })).filter(file => file.endsWith('.md'));
  const entries = await Promise.all(files.map(async file => (await readMarkdown(`src/content/news/${file}`)).data));
  for (const locale of locales) {
    const html = await readFile(`dist${localePath(locale)}index.html`, 'utf8');
    const expectedDates = entries.filter(entry => entry.locale === locale && (!entry.draft || !site.published[locale])).map(entry => entry.date).sort().reverse().slice(0, 3);
    const articles = [...html.matchAll(/<article\b[^>]*class="[^"]*news-entry[^"]*"[^>]*>[\s\S]*?<\/article>/g)];
    const actualDates = articles.map(([article]) => article.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1]);
    assert.deepEqual(actualDates, expectedDates);
    assert.equal(html.includes('id="news"'), expectedDates.length > 0);
    for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`), `Missing fragment: ${match[1]}`);
    assert.doesNotMatch(html, /class="button(?: |")/);
  }
});

test('rendered local images have alt attributes, dimensions, and shipped assets', async () => {
  for (const locale of locales) {
    const html = await readFile(`dist${localePath(locale)}index.html`, 'utf8');
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /\balt="[^"]*"/);
      assert.match(tag, /\bwidth="[1-9]\d*"/);
      assert.match(tag, /\bheight="[1-9]\d*"/);
      const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
      if (src?.startsWith('/')) await access(`dist${src}`);
    }
  }
});

test('news supports text-only, thumbnail and wide entries without duplicate headings', async () => {
  for (const locale of locales.filter(l => !site.published[l])) {
    const html = await readFile(`dist${localePath(locale)}index.html`, 'utf8');
    for (const layout of ['news-text-only', 'news-image-thumbnail', 'news-image-wide']) assert.ok(html.includes(layout));
    assert.match(html, /<article[^>]*news-text-only[\s\S]*?<h3>[^<]+<\/h3>/);
  }
});

test('stage selector replaces optional sprite and GIF block renders in each locale', async () => {
  for (const locale of locales) {
    const html = await readFile(`dist${localePath(locale)}index.html`, 'utf8');
    assert.match(html, /class="stage-select"/);
    assert.doesNotMatch(html, /sprite-corner/);
    assert.match(html, /class="gif-week"/);
    assert.doesNotMatch(html, /class="community-corner"/);
    const { badges } = JSON.parse(await readFile('src/content/community/home.json', 'utf8'));
    assert.equal(html.includes('class="badge-links"'), badges.length > 0);
  }
});

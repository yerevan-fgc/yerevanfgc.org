import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { groupEvents } from '../src/lib/events.ts';
import { site, locales, localePath } from '../src/config/site.ts';

test('event calendar sorts both groups and changes at the local end time, with dev-only drafts', () => {
  const entry = (id, date, draft = false) => ({ id, data: { date, time: '15:00 – 20:00', draft } });
  const recent = entry('recent', '2026-11-07');
  const older = entry('older', '2026-10-03');
  const next = entry('next', '2026-12-05');
  const later = entry('later', '2026-12-12');
  const draft = entry('draft', '2026-09-05', true);
  const entries = [later, recent, draft, next, older];
  const now = new Date('2026-12-05T15:59:59Z');
  assert.deepEqual(groupEvents(entries, false, site.timezone, now), { upcoming: [next, later], past: [recent, older] });
  assert.deepEqual(groupEvents(entries, true, site.timezone, now).past, [recent, older, draft]);
  assert.deepEqual(groupEvents(entries, false, site.timezone, new Date('2026-12-05T16:00:00Z')).past, [next, recent, older]);
  assert.deepEqual(groupEvents([], false, site.timezone, now), { upcoming: [], past: [] });
});

test('localized production calendars have correct metadata, working navigation, and no draft examples', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const locale of locales) {
    const path = localePath(locale) + 'events/';
    const html = await readFile(`dist${path}index.html`, 'utf8');
    assert.ok(html.includes(`rel="canonical" href="${new URL(path, site.url).href}"`));
    for (const other of locales) {
      const link = [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag).find(tag => tag.includes(`lang="${other}"`));
      assert.ok(link?.includes(`href="${localePath(other)}events/"`));
    }
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(html.includes('id="upcoming-events"'));
    assert.ok(html.includes('id="past-events"'));
    assert.ok(!html.includes('event-2026-09-05-saturday-mash-67'));
    assert.ok(!html.includes('event-2026-10-03-saturday-mash-68'));
    assert.ok(!html.includes('application/ld+json'), 'Event-specific metadata stays off the listing');
    assert.equal(sitemap.includes(`<loc>${new URL(path, site.url).href}</loc>`), site.published[locale]);
    const home = await readFile(`dist${localePath(locale)}index.html`, 'utf8');
    assert.ok(home.includes(`href="${path}"`));
  }
});

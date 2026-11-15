import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { pickGif, gifWeekKey } from '../src/lib/gifs.ts';
import { gifDimensions } from '../src/lib/gif-assets.ts';
import { gifSchema } from '../src/lib/content-schemas.ts';

async function entries() {
  const files = (await readdir('src/content/gifs')).filter(name => name.endsWith('.json'));
  return Promise.all(files.map(name => readFile(`src/content/gifs/${name}`, 'utf8').then(JSON.parse)));
}

test('weekly picker is stable across refreshes and handles empty/single catalogues', () => {
  const monday = new Date('2026-11-15T20:00:00Z');
  const sunday = new Date('2026-11-22T19:59:59Z');
  const gifs = Array.from({ length: 15 }, (_, i) => `gif-${i}`);
  assert.equal(pickGif([], monday), undefined);
  assert.equal(pickGif(['only'], sunday), 'only');
  assert.equal(pickGif(gifs, monday), pickGif(gifs, sunday));
  assert.equal(pickGif(gifs, monday), pickGif(gifs, new Date('2026-11-16T00:00:00+04:00')));
  const selections = new Set(Array.from({ length: 12 }, (_, week) => pickGif(gifs, new Date(monday.getTime() + week * 7 * 86400000))));
  assert.ok(selections.size > 1, 'Weekly seed changes the selected GIF over time');
});

test('weeks switch at Monday midnight in Yerevan, including year boundaries', () => {
  assert.equal(gifWeekKey(new Date('2026-11-15T19:59:59Z')), '2026-11-09');
  assert.equal(gifWeekKey(new Date('2026-11-15T20:00:00Z')), '2026-11-16');
  assert.equal(gifWeekKey(new Date('2026-11-22T19:59:59Z')), '2026-11-16');
  assert.equal(gifWeekKey(new Date('2026-11-22T20:00:00Z')), '2026-11-23');
  assert.equal(gifWeekKey(new Date('2027-01-01T12:00:00Z')), '2026-12-28');
  assert.equal(gifWeekKey(new Date('2027-01-03T20:00:00Z')), '2027-01-04');
  assert.equal(gifWeekKey(new Date('2026-11-15T20:00:00Z'), 'UTC'), '2026-11-09');
});

test('every supplied character GIF has valid content, readable alt text and real dimensions; the banner is excluded', async () => {
  const records = await entries();
  const files = (await readdir('public/gif')).filter(name => /\.gif$/i.test(name) && name !== 'tfg.gif');
  assert.deepEqual(records.map(gif => gif.file).sort(), files.map(file => `/gif/${file}`).sort());
  for (const gif of records) {
    assert.equal(gifSchema.safeParse(gif).success, true);
    assert.ok(gif.name.trim().length > 0);
    assert.equal(gif.source, 'https://www.fightersgeneration.com');
    const { width, height } = await gifDimensions(gif.file);
    assert.ok(width > 0 && height > 0);
  }
  assert.deepEqual(await gifDimensions('/gif/tfg.gif'), { width: 234, height: 60 });
});

test('GIF content rejects missing names, script URLs and paths outside the GIF directory', async () => {
  const [gif] = await entries();
  assert.equal(gifSchema.safeParse({ ...gif, name: '' }).success, false);
  assert.equal(gifSchema.safeParse({ ...gif, source: 'javascript:alert(1)' }).success, false);
  assert.equal(gifSchema.safeParse({ ...gif, file: '/gif/../../secret.gif' }).success, false);
  await assert.rejects(gifDimensions('/other/file.gif'), /Invalid GIF path/);
});

test('rendered attribution follows the GIF and links its provider banner', async () => {
  for (const path of ['dist/index.html', 'dist/hy/index.html', 'dist/ru/index.html']) {
    const html = await readFile(path, 'utf8');
    assert.ok(html.indexOf('data-selected-gif') < html.indexOf('class="gif-credit"'));
    assert.ok(html.indexOf('class="gif-credit"') < html.indexOf('data-gif-source'));
    assert.match(html, /data-gif-source(?:="[^"]*")?[^>]*href="https:\/\/www\.fightersgeneration\.com"[^>]*><img src="\/gif\/tfg.gif"/);
    assert.match(html, /data-gif-motion hidden/);
  }
});

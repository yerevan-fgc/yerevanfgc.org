import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { externalLinkAttributes } from '../src/lib/links.ts';
import { site } from '../src/config/site.ts';

test('external web links open safely in a new tab while preserving rel tokens', () => {
  for (const href of ['https://www.fightersgeneration.com', 'https://maps.google.com/', '//example.com/path']) {
    assert.deepEqual(externalLinkAttributes(href, site.url), { target: '_blank', rel: 'noopener noreferrer' });
  }
  assert.deepEqual(externalLinkAttributes('https://example.com', site.url, 'nofollow noopener'), {
    target: '_blank', rel: 'nofollow noopener noreferrer',
  });
});
test('internal links and non-web schemes retain normal behavior', () => {
  for (const href of ['/', '/hy/', '#location', '/gif/tfg.gif', `${site.url}/ru/`, 'mailto:hello@example.com', 'tel:+374123456', null, undefined]) {
    assert.deepEqual(externalLinkAttributes(href, site.url), {});
  }
});
test('all rendered external anchors, including directions and TFG, have the shared attributes', async () => {
  for (const file of ['dist/index.html', 'dist/hy/index.html', 'dist/ru/index.html']) {
    const html = await readFile(file, 'utf8');
    let externalCount = 0;
    for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
      const href = tag.match(/\bhref="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
      if (externalLinkAttributes(href, site.url).target) {
        externalCount++;
        assert.match(tag, /target="_blank"/);
        const rel = tag.match(/\brel="([^"]+)"/)?.[1]?.split(/\s+/) ?? [];
        assert.ok(rel.includes('noopener') && rel.includes('noreferrer'));
      } else {
        assert.doesNotMatch(tag, /target="_blank"/);
      }
    }
    assert.ok(externalCount >= 2, 'Directions and TFG links are present');
  }
});

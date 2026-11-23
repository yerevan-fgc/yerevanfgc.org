import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { palettes, defaultPalette, paletteStorageKey } from '../src/config/palettes.ts';
const luminance = hex => {
  const values = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
};
test('every palette keeps body text, secondary text, and links readable on opaque surfaces', () => {
  for (const { name, tokens } of Object.values(palettes)) {
    for (const surface of ['--paper', '--navigation-surface', '--event-surface', '--games-surface']) {
      assert.match(tokens[surface], /^#[\da-f]{6}$/i);
      for (const text of ['--ink','--muted','--link','--link-visited','--accent-bright']) {
        const a = luminance(tokens[text]), b = luminance(tokens[surface]);
        assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05) >= 4.5, `${name}: ${text} against ${surface}`);
      }
    }
  }
});
test('public pages default to blue and offer exactly the two independent colour choices', async () => {
  assert.equal(defaultPalette, 'arcade');
  for (const page of ['dist/index.html','dist/events/index.html','dist/ru/index.html','dist/hy/index.html']) {
    const html = await readFile(page, 'utf8');
    assert.match(html, /<html[^>]*data-palette="arcade"/);
    assert.ok(html.includes(`--paper: ${palettes.arcade.tokens['--paper']}`));
    const buttons = [...html.matchAll(/<button\b[^>]*data-palette="([^"]+)"[^>]*>/g)];
    assert.deepEqual(buttons.map(([, id]) => id), ['arcade', 'after-hours']);
    assert.ok(buttons[0][0].includes('aria-pressed="true"'));
    assert.ok(buttons[1][0].includes('aria-pressed="false"'));
    assert.ok(html.includes('stage-backgrounds'));
    assert.ok(!html.includes('data-palette-preview'));
  }
});
test('early palette restoration accepts saved choices and ignores invalid or unavailable storage', async () => {
  const { runInNewContext } = await import('node:vm');
  const html = await readFile('dist/index.html', 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(([, body]) => body).find(body => body.includes('Object.hasOwn(paletteTokens'));
  assert.ok(script);
  for (const saved of ['arcade', 'after-hours', null, 'amber', '__proto__']) {
    const values = new Map();
    const root = { dataset: { palette: defaultPalette }, style: { setProperty: (key, value) => values.set(key, value) } };
    runInNewContext(script, { document: { documentElement: root }, localStorage: { getItem: key => { assert.equal(key, paletteStorageKey); return saved; } } });
    const expected = saved === 'after-hours' ? saved : defaultPalette;
    assert.equal(root.dataset.palette, expected);
    if (saved && Object.hasOwn(palettes, saved)) assert.equal(values.get('--paper'), palettes[saved].tokens['--paper']);
  }
  assert.doesNotThrow(() => runInNewContext(script, { localStorage: { getItem: () => { throw new Error('blocked'); } } }));
});

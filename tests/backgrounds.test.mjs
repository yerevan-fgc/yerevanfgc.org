import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { backgroundSchema } from '../src/lib/content-schemas.ts';
import { backgroundStorageKey, resolveBackground } from '../src/lib/backgrounds.ts';
import { site, locales, localePath } from '../src/config/site.ts';

async function backgrounds() {
  const files = (await readdir('src/content/backgrounds')).filter(file => file.endsWith('.json'));
  return Promise.all(files.map(file => readFile(`src/content/backgrounds/${file}`, 'utf8').then(JSON.parse)));
}

test('saved stage is used only while it remains in the catalogue', () => {
  const choices = ['/backgrounds/esaka.webp', '/backgrounds/garou.webp'];
  assert.equal(resolveBackground(choices[1], choices, choices[0]), choices[1]);
  for (const saved of [null, '', '/removed.webp', 'https://example.com/background.webp']) {
    assert.equal(resolveBackground(saved, choices, choices[0]), choices[0]);
  }
});

test('stage entries contain valid names/links and shipped assets, including the default', async () => {
  const entries = await backgrounds();
  const assets = (await readdir('public/backgrounds')).filter(file => file.endsWith('.webp'));
  assert.deepEqual(entries.map(entry => entry.link).sort(), assets.map(file => `/backgrounds/${file}`).sort());
  assert.ok(entries.some(entry => entry.link === site.defaultBackground));
  for (const entry of entries) {
    assert.equal(backgroundSchema.safeParse(entry).success, true);
    assert.ok(!entry.name.includes('_'));
    await access(`dist${entry.link}`);
  }
});

test('each language renders all stage choices with Esaka initially selected', async () => {
  const entries = await backgrounds();
  for (const locale of locales) {
    const html = await readFile(`dist${localePath(locale)}index.html`, 'utf8');
    const buttons = [...html.matchAll(/<button\b[^>]*data-background="([^"]+)"[^>]*>/g)];
    assert.equal(buttons.length, entries.length);
    assert.equal(buttons.filter(([tag]) => tag.includes('aria-pressed="true"')).length, 1);
    assert.ok(buttons.find(([, link]) => link === site.defaultBackground)?.[0].includes('aria-pressed="true"'));
  }
});

test('early restore reads storage safely and rejects stale selections before stylesheet load', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  const headScript = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(script => script.includes('localStorage.getItem'));
  assert.ok(headScript);
  assert.ok(html.indexOf(headScript) < html.indexOf('rel="stylesheet"'));
  const entries = await backgrounds();
  const savedStage = entries.find(entry => entry.link !== site.defaultBackground).link;
  for (const saved of [savedStage, '/removed.webp', null, 'blocked']) {
    const calls = [];
    runInNewContext(headScript, {
      localStorage: { getItem(key) {
        assert.equal(key, backgroundStorageKey);
        if (saved === 'blocked') throw new Error('Storage blocked');
        return saved;
      } },
      document: { documentElement: { style: { setProperty: (...args) => calls.push(args) } } },
    });
    assert.equal(calls.length, saved === savedStage ? 1 : 0);
    if (calls.length) assert.deepEqual(calls[0], ['--background-image', `url(${JSON.stringify(savedStage)})`]);
  }
});

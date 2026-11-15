import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { communitySchema } from '../src/lib/content-schemas.ts';

test('community content accepts section/web links and requires every language', async () => {
  const data = JSON.parse(await readFile('src/content/community/home.json', 'utf8'));
  assert.equal(communitySchema.safeParse(data).success, true);
  const label = { en: 'Lorem', hy: 'Lorem', ru: 'Lorem' };
  for (const href of ['#games', 'https://example.com']) {
    assert.equal(communitySchema.safeParse({ ...data, badges: [{ label, href }] }).success, true);
  }
  for (const href of ['javascript:alert(1)', 'data:text/plain,test', '#']) {
    assert.equal(communitySchema.safeParse({ ...data, badges: [{ label, href }] }).success, false);
  }
  assert.equal(communitySchema.safeParse({ ...data, badges: [{ label: { en: 'Lorem' }, href: '#games' }] }).success, false);
});

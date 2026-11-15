import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const expected = ['Street Fighter 6', 'Tekken 8', 'Avatar Legends: The Fighting Game', 'Ultra Street Fighter IV', 'Skullgirls', 'Samurai Shodown', 'Guilty Gear Strive', 'Under Night In-Birth II'];

test('game catalogue follows the requested order with normalized 2x PNG logos', async () => {
  const files = (await readdir('src/content/games')).filter(file => file.endsWith('.json'));
  const entries = await Promise.all(files.map(file => readFile(`src/content/games/${file}`, 'utf8').then(JSON.parse)));
  entries.sort((a,b) => a.order-b.order);
  assert.deepEqual(entries.map(game => game.name), expected);
  for (const game of entries) {
    const png = await readFile(`public${game.logo}`);
    assert.deepEqual([...png.subarray(0,8)], [137,80,78,71,13,10,26,10]);
    assert.equal(png.readUInt32BE(16), 228);
    assert.equal(png.readUInt32BE(20), 124);
  }
  for (const file of ['dist/index.html', 'dist/hy/index.html', 'dist/ru/index.html']) {
    const html = await readFile(file, 'utf8');
    let previous = -1;
    for (const name of expected) {
      const current = html.indexOf(`alt="${name}"`);
      assert.ok(current > previous, `${name} must follow the previous game`);
      previous = current;
    }
  }
});

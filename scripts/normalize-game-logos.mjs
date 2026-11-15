import sharp from 'sharp';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

// 114×62 CSS pixels per desktop cell, exported at 2× for high-density displays.
const width = 228;
const height = 124;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
await mkdir('public/games/normalized', { recursive: true });
for (const file of (await readdir('src/content/games')).filter(file => file.endsWith('.json'))) {
  const game = JSON.parse(await readFile(`src/content/games/${file}`, 'utf8'));
  if (!game.logo?.startsWith('/games/normalized/')) continue;
  const source = resolve('public/games', basename(game.logo));
  const destination = resolve('public', game.logo.slice(1));
  await sharp(source).ensureAlpha().trim({ background: transparent, threshold: 0 })
    .resize(width, height, { fit: 'contain', background: transparent })
    .png({ compressionLevel: 9 }).toFile(destination);
  console.log(`${game.name}: ${width}×${height}`);
}

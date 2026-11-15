import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function gifDimensions(file: string) {
  if (!/^\/gif\/[^/]+\.gif$/i.test(file)) throw new Error(`Invalid GIF path: ${file}`);
  const bytes = await readFile(resolve('public', file.slice(1)));
  if (!['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)) || bytes.length < 10) throw new Error(`Invalid GIF file: ${file}`);
  const width = bytes.readUInt16LE(6);
  const height = bytes.readUInt16LE(8);
  if (!width || !height) throw new Error(`Invalid GIF dimensions: ${file}`);
  return { width, height };
}

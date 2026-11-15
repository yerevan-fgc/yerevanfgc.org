import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
export async function readMarkdown(path) {
  const source = await readFile(path, 'utf8');
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing YAML frontmatter: ${path}`);
  return { data: parse(match[1]), body: match[2].trim() };
}

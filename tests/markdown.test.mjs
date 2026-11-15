import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { unified } from '@astrojs/markdown-remark';
import { rehypeEditorial } from '../src/markdown/rehype-editorial.ts';
import { site, locales } from '../src/config/site.ts';
import { readMarkdown } from './helpers/markdown.mjs';

const renderer = await unified({ rehypePlugins: [[rehypeEditorial, { siteUrl: site.url }]] }).createRenderer({});

test('Markdown renders paragraphs, formatting and lists with the shared external-link policy', async () => {
  const { code } = await renderer.render(`Lorem **ipsum**.\n\n- Lorem\n- Ipsum\n\n[External](https://example.com) [Internal](/ru/) [Section](#faq) [Home](${site.url}/)`, { frontmatter: {} });
  assert.match(code, /<strong>ipsum<\/strong>/);
  assert.match(code, /<ul>/);
  assert.match(code, /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer">External<\/a>/);
  for (const [anchor] of code.matchAll(/<a\b[^>]*>/g)) {
    if (!anchor.includes('example.com')) assert.doesNotMatch(anchor, /target=/);
  }
});

test('frontmatter media keeps thumbnail/wide placement and escapes captions and alt text', async () => {
  for (const placement of ['thumbnail', 'wide']) {
    const { code } = await renderer.render('First paragraph.\n\nSecond paragraph.', { frontmatter: {
      date: '2026-11-14', title: 'Lorem', imageAlt: 'A "quote" & <tag>', imageCaption: '<caption>',
      image: { src: '/placeholders/news-thumbnail.png', width: 320, height: 240, placement },
    } });
    const first = code.indexOf('<p>First paragraph.</p>');
    const figure = code.indexOf('<figure');
    assert.ok(placement === 'thumbnail' ? figure < first : figure > first);
    assert.ok(figure < code.indexOf('<p>Second paragraph.</p>'));
    assert.match(code, /width="320" height="240"/);
    assert.match(code, /<figcaption>&#x3C;caption>/);
    assert.doesNotMatch(code, /<caption>/);
  }
  const textOnly = await renderer.render('Lorem ipsum.', { frontmatter: { date: '2026-11-14', title: 'Lorem' } });
  assert.doesNotMatch(textOnly.code, /<figure/);
});

test('translated Markdown entries retain shared news identities and page JSON contains only metadata/FAQ', async () => {
  const groups = (await readdir('src/content/news', { withFileTypes: true })).filter(entry => entry.isDirectory());
  for (const locale of locales) {
    const about = await readMarkdown(`src/content/about/${locale}.md`);
    assert.equal(about.data.locale, locale);
    assert.ok(about.body.length);
    const page = JSON.parse(await readFile(`src/content/pages/${locale}.json`, 'utf8'));
    assert.ok(!Object.keys(page).some(key => key.startsWith('intro')));
    for (const group of groups) {
      const news = await readMarkdown(`src/content/news/${group.name}/${locale}.md`);
      assert.equal(news.data.locale, locale);
      assert.ok(news.body.length && news.data.title);
    }
  }
});

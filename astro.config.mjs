// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { rehypeEditorial } from './src/markdown/rehype-editorial.ts';
import { site } from './src/config/site.ts';
export default defineConfig({
  site: site.url,
  markdown: { processor: unified({ rehypePlugins: [[rehypeEditorial, { siteUrl: site.url }]] }) },
  trailingSlash: 'always',
  i18n: { defaultLocale: 'en', locales: ['en', 'hy', 'ru'], routing: { prefixDefaultLocale: false } },
});

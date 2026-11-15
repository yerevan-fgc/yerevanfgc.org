import type { Plugin } from 'unified';
import type { Root, Element, Nodes } from 'hast';
import { externalLinkAttributes } from '../lib/links.ts';

type Media = { src: string; width: number; height: number; placement?: string; pixelated?: boolean };
const element = (tagName: string, properties: Element['properties'], children: Element['children'] = []): Element => ({ type: 'element', tagName, properties, children });

/** Render frontmatter media at a document boundary, then apply the site's link policy. */
export const rehypeEditorial: Plugin<[{ siteUrl: string }], Root> = function ({ siteUrl }) {
  return (tree, file) => {
    const metadata = (file.data.astro as { frontmatter?: Record<string, unknown> } | undefined)?.frontmatter ?? {};
    const image = metadata.image as Media | undefined;
    if (metadata.date && image?.src) {
      const figure = element('figure', { className: ['news-figure'] }, [
        element('a', { href: image.src }, [element('img', {
          src: image.src, width: image.width, height: image.height,
          alt: String(metadata.imageAlt ?? metadata.title ?? ''), loading: 'lazy',
          ...(image.pixelated ? { className: ['pixel-art'] } : {}),
        })]),
      ]);
      if (metadata.imageCaption) figure.children.push(element('figcaption', {}, [{ type: 'text', value: String(metadata.imageCaption) }]));
      const paragraph = tree.children.findIndex(node => node.type === 'element' && node.tagName === 'p');
      const position = paragraph < 0 ? tree.children.length : paragraph + (image.placement === 'wide' ? 1 : 0);
      tree.children.splice(position, 0, figure);
    }
    function visit(node: Nodes) {
      if (node.type === 'element' && node.tagName === 'a' && typeof node.properties.href === 'string') {
        const rel = node.properties.rel;
        const attributes = externalLinkAttributes(node.properties.href, siteUrl, Array.isArray(rel) ? rel.join(' ') : typeof rel === 'string' ? rel : undefined);
        if (attributes.target) {
          node.properties.target = attributes.target;
          node.properties.rel = attributes.rel.split(' ');
        }
      }
      if ('children' in node) node.children.forEach(visit);
    }
    visit(tree);
  };
};

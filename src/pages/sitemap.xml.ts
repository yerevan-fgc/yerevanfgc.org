import type { APIRoute } from 'astro';
import { site, locales, localePath } from '../config/site';
export const GET: APIRoute = () => {
  const urls = locales.filter(locale => site.published[locale]).flatMap(locale => ['', 'events/'].map(path => `<url><loc>${new URL(localePath(locale) + path, site.url).href}</loc></url>`)).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
};

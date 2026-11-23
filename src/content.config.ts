import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { eventSchema, communitySchema, gifSchema, backgroundSchema } from './lib/content-schemas';
const events = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/events' }),
  schema: eventSchema,
});
const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages' }),
  schema: z.object({
    locale: z.enum(['en', 'hy', 'ru']), title: z.string(), description: z.string(),
    faq: z.array(z.object({ id: z.string(), question: z.string(), answer: z.string() })),
  }),
});
const games = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/games' }),
  schema: z.object({
    order: z.number(),
    name: z.string().min(1),
    logo: z.string().min(1).nullable().default(null),
    // Percentage of logo height; optical alignment without changing the image file.
    logoOffsetY: z.number().min(-25).max(25).default(0),
    link: z.url({ protocol: /^https?$/ }).nullable().default(null),
  }),
});
const about = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/about' }),
  schema: z.object({ locale: z.enum(['en', 'hy', 'ru']) }),
});
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    locale: z.enum(['en', 'hy', 'ru']), title: z.string().min(1),
    date: z.iso.date(), draft: z.boolean().default(true),
    image: z.object({
      src: z.string().min(1), width: z.number().int().positive(), height: z.number().int().positive(),
      placement: z.enum(['thumbnail', 'wide']).default('thumbnail'), pixelated: z.boolean().default(false),
    }).optional(),
    imageAlt: z.string().optional(), imageCaption: z.string().optional(),
  }),
});
const community = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/community' }),
  schema: communitySchema,
});
const gifs = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/gifs' }),
  schema: gifSchema,
});
const backgrounds = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/backgrounds' }),
  schema: backgroundSchema,
});
export const collections = { events, pages, about, games, news, community, gifs, backgrounds };

import { z } from 'astro/zod';
const localized = <T extends z.ZodType>(schema: T) => z.object({ en: schema, hy: schema, ru: schema });
const eventText = z.object({ title: z.string().min(1), tagline: z.string().min(1), description: z.string().optional(), posterAlt: z.string().optional() });
const timeRange = z.string().trim().regex(/^(?:[01]\d|2[0-3]):[0-5]\d\s*[–—-]\s*(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour range such as 15:00 – 20:00.').transform(value => value.replace(/\s*[–—-]\s*/, ' – ')).nullable();
export const eventSchema = z.object({
    draft: z.boolean().default(true), date: z.iso.date().nullable(), time: timeRange,
    venueId: z.string(), announcementUrl: z.url().optional(), poster: z.string().optional(),
    posterSize: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }).optional(),
    translations: localized(eventText),
  }).superRefine((event, ctx) => {
    if (!event.draft && (!event.date || !event.time)) ctx.addIssue({ code: 'custom', message: 'Published events require a date and time range.' });
    if (event.time) {
      const [start, end] = event.time.split(' – ');
      if (end <= start) ctx.addIssue({ code: 'custom', path: ['time'], message: 'The end time must follow the start time on the same date.' });
    }
  });

// Local section links or public web URLs; no script/data URL targets.
const communityLink = z.object({
  label: localized(z.string().min(1)),
  href: z.union([z.url({ protocol: /^https?$/ }), z.string().regex(/^#[a-z][a-z0-9-]*$/)]),
});
export const communitySchema = z.object({
  badges: z.array(communityLink),
});

export const gifSchema = z.object({
  file: z.string().regex(/^\/gif\/[^/]+\.gif$/i, 'Use a GIF file path under /gif/.'),
  name: z.string().min(1),
  source: z.url({ protocol: /^https?$/ }),
});

export const backgroundSchema = z.object({
  link: z.string().regex(/^\/backgrounds\/[^/]+\.(webp|png|jpe?g|gif)$/i),
  name: z.string().min(1),
});

export const locales = ["en", "hy", "ru"] as const;
export type Locale = (typeof locales)[number];
export const localePath = (locale: Locale) =>
  locale === "en" ? "/" : `/${locale}/`;

// Public configuration only. Do not put secrets in this file.
export const site = {
  name: "Yerevan FGC",
  logo: { src: "/ui/yerevan-fgc.png", width: 858, height: 84 } as { src: string; width: number; height: number } | null,
  url: "https://yerevanfgc.org",
  timezone: "Asia/Yerevan",
  twitterUrl: "https://x.com/YerevanFGC",
  discordUrl: null as string | null,
  defaultBackground: "/backgrounds/garou.webp",
  venue: {
    id: "main",
    name: "Game Hub Club" as string | null,
    address: "5A King Pap St, Yerevan" as string | null,
    mapEmbedUrl:
      "https://www.google.com/maps/embed?origin=mfe&pb=!1m3!3m2!1m1!4s12562889672702253189!3m1!1sen!5m1!1sen" as
        string | null,
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Game+Hub+Club%2C+Yerevan&destination_place_id=ChIJA-6ZipC9akARhVjXpZhZWK4" as
        string | null,
  },
  analytics: { enabled: false, measurementId: null as string | null },
  // Turn on only after real copy and metadata have been reviewed.
  published: { en: true, hy: true, ru: true } satisfies Record<
    Locale,
    boolean
  >,
};

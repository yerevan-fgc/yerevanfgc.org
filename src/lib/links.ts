/** Attributes for web links whose origin differs from this site. */
export function externalLinkAttributes(href: string | URL | null | undefined, siteUrl: string, rel?: string | null) {
  if (!href) return {};
  try {
    const destination = new URL(String(href), siteUrl);
    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin === new URL(siteUrl).origin) return {};
    const tokens = new Set((rel ?? '').split(/\s+/).filter(Boolean));
    tokens.add('noopener');
    tokens.add('noreferrer');
    return { target: '_blank' as const, rel: [...tokens].join(' ') };
  } catch {
    return {};
  }
}

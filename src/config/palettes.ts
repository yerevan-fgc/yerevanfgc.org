// The two public colour schemes; stage backgrounds are chosen independently.
const steppedGradient = (top: string, bottom: string) => {
  const channels = (hex: string) => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
  const start = channels(top), end = channels(bottom);
  return `linear-gradient(180deg, ${Array.from({ length: 14 }, (_, step) => {
    const color = '#' + start.map((value, index) => Math.round(value + (end[index] - value) * step / 13).toString(16).padStart(2, '0')).join('');
    return `${color} ${step * 100 / 14}% ${(step + 1) * 100 / 14}%`;
  }).join(', ')})`;
};
const make = (name: string, colors: string[], top: string, grid: string) => {
  const [paper, muted, accent, bright, link, visited, rule, edge, header, navigation, event, games] = colors;
  return { name, tokens: {
    '--paper': paper, '--paper-muted': navigation, '--ink': '#efeee9', '--muted': muted,
    '--accent': accent, '--accent-hover': bright, '--accent-bright': bright,
    '--link': link, '--link-visited': visited, '--rule': rule, '--edge-light': edge,
    '--header-surface': header, '--header-gradient': steppedGradient(top, header),
    '--navigation-surface': navigation, '--navigation-grid': grid,
    '--event-surface': event, '--games-surface': games, '--rail-surface': games,
    '--heading': '#fff9f0', '--sidebar-heading': '#ffffff', '--subtitle': '#dedde0',
    '--hover': '#ffd08e', '--selection': accent,
  } };
};
export const palettes = {
  arcade: make('Dream Match', ['#0c1425','#b7c7e2','#397cdb','#83baff','#9dd7ff','#c5baff','#344c70','#658ac3','#070e1c','#0d192e','#0e1a2e','#081121'], '#113671', 'rgb(100 170 255 / 7.5%)'),
  'after-hours': make('Satsui no Hado', ['#1b1c21','#b9b9c1','#9d3039','#f18587','#90d3ff','#d3b5ed','#454750','#666975','#100e12','#151c24','#19171c','#111217'], '#491923', 'rgb(144 180 211 / 5%)'),
};
export type PaletteId = keyof typeof palettes;
export const defaultPalette: PaletteId = 'arcade';
export const paletteStorageKey = 'yerevan-fgc:palette';

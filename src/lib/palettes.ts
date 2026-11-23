import { palettes, defaultPalette, type PaletteId } from '../config/palettes';
export function resolvePalette(value: string | null | undefined): PaletteId {
  return value && Object.hasOwn(palettes, value) ? value as PaletteId : defaultPalette;
}
export function applyPalette(root: HTMLElement, id: PaletteId) {
  root.dataset.palette = id;
  Object.entries(palettes[id].tokens).forEach(([key, value]) => root.style.setProperty(key, value));
}

export const backgroundStorageKey = 'yerevan-fgc:background';

export function resolveBackground(saved: string | null, choices: readonly string[], fallback: string) {
  return saved && choices.includes(saved) ? saved : fallback;
}

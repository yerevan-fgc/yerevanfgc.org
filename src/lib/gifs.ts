/** Monday's date in the community timezone, independent of the visitor's locale. */
export function gifWeekKey(date = new Date(), timeZone = 'Asia/Yerevan'): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value);
  const day = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day.toISOString().slice(0, 10);
}

// Change this value to reshuffle the weekly selections for everyone.
const rotationSeed = 'yerevan-fgc-rotation-2';

/** Same catalogue + rotation seed + local week = same selection on every refresh and device. */
export function pickGif<T>(gifs: readonly T[], date = new Date(), timeZone = 'Asia/Yerevan'): T | undefined {
  if (!gifs.length) return undefined;
  let seed = 2166136261;
  for (const character of `${rotationSeed}:${gifWeekKey(date, timeZone)}`) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
  }
  return gifs[(seed >>> 0) % gifs.length];
}

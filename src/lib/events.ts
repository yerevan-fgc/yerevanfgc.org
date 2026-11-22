export interface EventTiming { draft: boolean; date: string | null; time: string | null }

/** Convert a local venue clock time to an ISO timestamp, independent of build-machine timezone. */
function localTimestamp(date: string, time: string, timeZone: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
  });
  let instant = wall;
  for (let i = 0; i < 2; i++) {
    const parts = formatter.formatToParts(new Date(instant));
    const value = (type: string) => Number(parts.find(part => part.type === type)!.value);
    const local = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
    instant = wall - (local - instant);
  }
  return new Date(instant).toISOString();
}

export function eventTimestamps(event: Pick<EventTiming, 'date' | 'time'>, timeZone = 'Asia/Yerevan') {
  if (!event.date || !event.time) return undefined;
  const times = event.time.match(/^(\d{2}:\d{2})\s*[–—-]\s*(\d{2}:\d{2})$/);
  if (!times) return undefined;
  return { start: localTimestamp(event.date, times[1], timeZone), end: localTimestamp(event.date, times[2], timeZone) };
}

export function formatEventDate(date: string, locale: string) {
  const parts = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).formatToParts(new Date(`${date}T12:00:00Z`));
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value('weekday')}, ${value('day')} ${value('month')}`;
}

// The selected published event stays visible when used as the past-event fallback.
export function eventState(event: EventTiming | undefined) {
  return event && !event.draft ? 'featured' : 'pending';
}
/** Prefer the earliest upcoming/ongoing event; otherwise keep the latest past event. */
export function resolveFeatured<T extends { id: string; data: EventTiming & { venueId: string } }>(
  events: T[], venueId: string, timeZone = 'Asia/Yerevan', now = new Date(),
): T | undefined {
  const candidates = events.filter(entry => !entry.data.draft).map(entry => {
    const timing = eventTimestamps(entry.data, timeZone);
    if (!timing) throw new Error(`Published event "${entry.id}" requires a date and time range.`);
    return { entry, start: Date.parse(timing.start), end: Date.parse(timing.end) };
  }).sort((a, b) => a.start - b.start || a.entry.id.localeCompare(b.entry.id));
  const selected = candidates.find(candidate => candidate.end > now.getTime())
    ?? candidates.at(-1);
  if (selected && selected.entry.data.venueId !== venueId) {
    throw new Error(`Unknown venue "${selected.entry.data.venueId}" in featured event.`);
  }
  return selected?.entry;
}

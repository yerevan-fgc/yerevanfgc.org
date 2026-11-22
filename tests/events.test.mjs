import test from 'node:test';
import assert from 'node:assert/strict';
import { eventState, eventTimestamps, formatEventDate, resolveFeatured } from '../src/lib/events.ts';
import { eventSchema } from '../src/lib/content-schemas.ts';

const event = { draft: false, date: '2026-11-15', time: '18:00 – 22:00' };
test('published featured events remain featured regardless of their date', () => {
  for (const date of ['2000-01-01', '2026-11-07', '2099-12-31']) {
    assert.equal(eventState({ ...event, date }), 'featured');
  }
});
test('missing and draft events retain their pending behavior', () => {
  assert.equal(eventState(undefined), 'pending');
  assert.equal(eventState({ ...event, draft: true }), 'pending');
  assert.equal(eventState({ draft: true, date: null, time: null }), 'pending');
});
test('local date/time derives timezone-correct timestamps for metadata, including midnight', () => {
  assert.deepEqual(eventTimestamps({ date: '2026-11-07', time: '15:00 – 20:00' }), {
    start: '2026-11-07T11:00:00.000Z', end: '2026-11-07T16:00:00.000Z',
  });
  assert.deepEqual(eventTimestamps({ date: '2026-11-07', time: '00:00 – 02:00' }), {
    start: '2026-11-06T20:00:00.000Z', end: '2026-11-06T22:00:00.000Z',
  });
  assert.equal(eventTimestamps(event, 'UTC').start, '2026-11-15T18:00:00.000Z');
  assert.equal(eventTimestamps({ date: null, time: null }), undefined);
});
test('event dates have localized weekday/day/month labels without year or timezone drift', () => {
  assert.equal(formatEventDate('2026-11-07', 'en'), 'Sat, 7 Nov');
  assert.equal(formatEventDate('2026-11-07', 'hy'), 'շբթ, 7 նոյ');
  assert.equal(formatEventDate('2026-11-07', 'ru'), 'сб, 7 нояб.');
  assert.equal(formatEventDate('2027-01-01', 'en'), 'Fri, 1 Jan');
});
test('featured event selects upcoming or ongoing events, then falls back to latest past event', () => {
  const entry = (id, date, draft = false) => ({ id, data: { draft, date, time: '15:00 – 20:00', venueId: 'main' } });
  const past = entry('past', '2026-11-07');
  const next = entry('next', '2026-12-05');
  const later = entry('later', '2026-12-12');
  const draft = entry('draft', '2026-11-23', true);
  const entries = [later, draft, past, next];
  const select = date => resolveFeatured(entries, 'main', 'Asia/Yerevan', new Date(date));
  assert.equal(select('2026-11-22T12:00:00Z'), next);
  assert.equal(select('2026-12-05T15:59:59Z'), next, 'Keep an ongoing event until its local end time');
  assert.equal(select('2026-12-05T16:00:00Z'), later);
  assert.equal(select('2027-01-01T00:00:00Z'), later);
  assert.equal(resolveFeatured([], 'main'), undefined);
  assert.equal(resolveFeatured([draft], 'main'), undefined);
  assert.throws(() => resolveFeatured([next], 'elsewhere'), /Unknown venue/);
});
test('event schema validates date and 24-hour ranges, normalizing dash variants', () => {
  const text = { title: 'Lorem ipsum', tagline: 'Dolor sit amet.' };
  const data = { ...event, venueId: 'main', translations: { en: text, hy: text, ru: text } };
  assert.equal(eventSchema.safeParse(data).success, true);
  for (const tagline of ['', '   ']) {
    const blankText = { ...text, tagline };
    const parsed = eventSchema.parse({ ...data, translations: { en: blankText, hy: blankText, ru: blankText } });
    assert.equal(parsed.translations.en.tagline, '');
  }
  for (const time of ['15:00 – 20:00', '15:00-20:00', '15:00 — 20:00']) {
    assert.equal(eventSchema.parse({ ...data, time }).time, '15:00 – 20:00');
  }
  for (const time of [null, '20:00 – 15:00', '15:00 – 15:00', '25:00 – 26:00', '15:60 – 20:00', '3pm–8pm']) {
    assert.equal(eventSchema.safeParse({ ...data, time }).success, false);
  }
  for (const date of [null, '2026-02-30', '07/11/2026']) {
    assert.equal(eventSchema.safeParse({ ...data, date }).success, false);
  }
  assert.equal(eventSchema.safeParse({ ...data, translations: { en: text, ru: text } }).success, false);
  assert.equal(eventSchema.safeParse({ ...data, draft: true, date: null, time: null }).success, true);
});

import { describe, expect, it } from 'vitest';
import { enumerateDates } from './date-range.js';

describe('enumerateDates', () => {
  it('returns a single date when from === to', () => {
    expect(enumerateDates('20260214', '20260214')).toEqual(['20260214']);
  });

  it('returns every date in between, inclusive', () => {
    expect(enumerateDates('20260213', '20260216')).toEqual([
      '20260213',
      '20260214',
      '20260215',
      '20260216',
    ]);
  });

  it('crosses a month boundary correctly', () => {
    expect(enumerateDates('20260228', '20260302')).toEqual([
      '20260228',
      '20260301',
      '20260302',
    ]);
  });

  it('throws when from is after to', () => {
    expect(() => enumerateDates('20260216', '20260210')).toThrow(
      /is after/,
    );
  });

  it('throws on a malformed date', () => {
    expect(() => enumerateDates('2026-02-10', '20260212')).toThrow(
      /invalid date/,
    );
  });
});

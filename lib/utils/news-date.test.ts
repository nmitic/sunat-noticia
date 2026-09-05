import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { formatAbsoluteDate, formatFullDate, toLima } from './news-date';

/**
 * These assert literal Peruvian wall-clock strings rather than recomputing the
 * expectation with the same helper, which would pass just as happily with the
 * server-timezone bug in place.
 *
 * Run the suite under TZ=UTC (as production does) to see them bite: without the
 * Lima conversion, 21:00 on the 5th renders as 02:00 on the 6th.
 */
describe('formatFullDate — always Lima, never the server clock', () => {
  it('renders an evening Lima window as an evening', () => {
    // 02:00Z on the 6th is 21:00 on the 5th in Lima.
    assert.equal(
      formatFullDate(new Date('2025-09-06T02:00:00Z')),
      '5 de septiembre de 2025, 21:00'
    );
  });

  it('accepts the -05:00 timestamps the outage parser writes', () => {
    assert.equal(
      formatFullDate(new Date('2025-09-05T21:00:00-05:00')),
      '5 de septiembre de 2025, 21:00'
    );
  });

  it('keeps a pre-dawn window on the right calendar day', () => {
    // 04:00Z is 23:00 the previous day in Lima — the date must roll back too.
    assert.equal(
      formatFullDate(new Date('2025-07-02T04:00:00Z')),
      '1 de julio de 2025, 23:00'
    );
  });
});

describe('formatAbsoluteDate', () => {
  it('spells out an older date in Lima time', () => {
    assert.equal(
      formatAbsoluteDate(new Date('2025-09-06T02:00:00Z')),
      '5 de septiembre de 2025, 21:00'
    );
  });

  it('says "Hoy" against Lima\'s calendar day, not the server\'s', () => {
    // Built from Lima's current date so the assertion holds in any zone: at
    // 20:00 Lima it is already tomorrow in UTC, and a server-clock comparison
    // would call this "Ayer".
    const nowInLima = toLima(new Date());
    const todayAtEight = new Date(
      Date.UTC(nowInLima.getFullYear(), nowInLima.getMonth(), nowInLima.getDate(), 20 + 5, 0)
    );

    assert.match(formatAbsoluteDate(todayAtEight), /^Hoy, 20:00$/);
  });
});

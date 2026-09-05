import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  affectedServices,
  computeStatus,
  isActive,
  isUpcoming,
  kindToLevel,
  levelRank,
  partitionIncidents,
  placeIncident,
  type OutageItem,
} from './status';
import type { StructuredOutage } from './types';

function outage(patch: Partial<StructuredOutage> = {}): StructuredOutage {
  return {
    kind: 'MANTENIMIENTO',
    startsAt: null,
    endsAt: null,
    inProgress: false,
    services: [],
    scope: null,
    cause: null,
    confidence: { window: 'parsed', services: 'parsed', kind: 'parsed' },
    source: 'auto',
    ...patch,
  };
}

/** A fixed instant to evaluate against, so nothing here depends on the clock. */
const NOW = new Date('2026-09-05T15:00:00-05:00');

function hoursFromNow(hours: number): string {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function item(patch: Partial<OutageItem> & { structuredData: StructuredOutage }): OutageItem {
  return {
    id: 'abc123',
    title: 'Comunicado',
    sourceUrl: null,
    originalDate: NOW,
    ...patch,
  };
}

describe('isActive — a stated end wins over inProgress', () => {
  it('treats an elapsed window as over even when the notice said it was in progress', () => {
    const data = outage({
      inProgress: true,
      startsAt: hoursFromNow(-30),
      endsAt: hoursFromNow(-6),
    });

    assert.equal(isActive(data, NOW), false);
  });

  it('stays active while inside a stated window', () => {
    const data = outage({ inProgress: true, startsAt: hoursFromNow(-1), endsAt: hoursFromNow(2) });

    assert.equal(isActive(data, NOW), true);
  });
});

describe('isActive — open-ended notices and the staleness guard', () => {
  it('believes a fresh notice with no window at all', () => {
    assert.equal(isActive(outage({ inProgress: true }), NOW), true);
  });

  it('believes one published two hours ago', () => {
    const data = outage({ inProgress: true });
    const originalDate = new Date(NOW.getTime() - 2 * 60 * 60 * 1000);

    assert.equal(isActive(data, NOW, { originalDate }), true);
  });

  it('stops believing one published forty hours ago', () => {
    const data = outage({ inProgress: true });
    const originalDate = new Date(NOW.getTime() - 40 * 60 * 60 * 1000);

    assert.equal(isActive(data, NOW, { originalDate }), false);
  });

  it('honours a caller-supplied window', () => {
    const data = outage({ inProgress: true });
    const originalDate = new Date(NOW.getTime() - 40 * 60 * 60 * 1000);

    assert.equal(isActive(data, NOW, { originalDate, maxAgeHours: 72 }), true);
  });

  it('skips the guard entirely when no originalDate is given', () => {
    assert.equal(isActive(outage({ inProgress: true }), NOW, {}), true);
  });
});

describe('isActive — plain windows', () => {
  it('is active between start and end', () => {
    const data = outage({ startsAt: hoursFromNow(-1), endsAt: hoursFromNow(1) });

    assert.equal(isActive(data, NOW), true);
  });

  it('is not active before the start', () => {
    const data = outage({ startsAt: hoursFromNow(3), endsAt: hoursFromNow(9) });

    assert.equal(isActive(data, NOW), false);
  });

  it('includes both boundaries', () => {
    const startsNow = outage({ startsAt: NOW.toISOString(), endsAt: hoursFromNow(4) });
    const endsNow = outage({ startsAt: hoursFromNow(-4), endsAt: NOW.toISOString() });

    assert.equal(isActive(startsNow, NOW), true);
    assert.equal(isActive(endsNow, NOW), true);
  });

  it('assumes a bounded run for a start with no stated end', () => {
    const justStarted = outage({ startsAt: hoursFromNow(-2) });
    const longPast = outage({ startsAt: hoursFromNow(-20) });

    assert.equal(isActive(justStarted, NOW), true);
    assert.equal(isActive(longPast, NOW), false);
  });

  it('is not active with no window and no in-progress phrasing', () => {
    assert.equal(isActive(outage(), NOW), false);
  });
});

describe('isActive — malformed input', () => {
  it('returns false instead of throwing on an unparseable timestamp', () => {
    assert.equal(isActive(outage({ startsAt: 'no es una fecha' }), NOW), false);
  });

  it('ignores an unparseable end rather than closing the incident', () => {
    const data = outage({ inProgress: true, endsAt: 'tampoco' });

    assert.equal(isActive(data, NOW), true);
  });
});

describe('isActive — the Lima offset survives the server timezone', () => {
  it('compares instants, not wall clocks', () => {
    // 21:00 Lima on the 5th is 02:00 UTC on the 6th. Both operands below are
    // the same instant written two ways; the window must contain it.
    const data = outage({
      startsAt: '2026-09-05T21:00:00-05:00',
      endsAt: '2026-09-06T07:00:00-05:00',
    });

    assert.equal(isActive(data, new Date('2026-09-06T02:00:00Z')), true);
    assert.equal(isActive(data, new Date('2026-09-06T13:00:00Z')), false);
  });
});

describe('isUpcoming', () => {
  it('is true for a window that has not started', () => {
    assert.equal(isUpcoming(outage({ startsAt: hoursFromNow(5) }), NOW), true);
  });

  it('is false once something is already happening', () => {
    const data = outage({ inProgress: true, startsAt: hoursFromNow(5) });

    assert.equal(isUpcoming(data, NOW), false);
  });

  it('is false for a start in the past, and for no start at all', () => {
    assert.equal(isUpcoming(outage({ startsAt: hoursFromNow(-5) }), NOW), false);
    assert.equal(isUpcoming(outage(), NOW), false);
  });
});

describe('kindToLevel and levelRank', () => {
  it('maps every kind', () => {
    assert.equal(kindToLevel('INDISPONIBILIDAD'), 'indisponible');
    assert.equal(kindToLevel('INTERMITENCIA'), 'degradado');
    assert.equal(kindToLevel('MANTENIMIENTO'), 'mantenimiento');
    assert.equal(kindToLevel('DESCONOCIDO'), 'incidencia');
  });

  it('ranks an unclassified incident above announced maintenance', () => {
    assert.ok(levelRank('indisponible') < levelRank('degradado'));
    assert.ok(levelRank('degradado') < levelRank('incidencia'));
    assert.ok(levelRank('incidencia') < levelRank('mantenimiento'));
    assert.ok(levelRank('mantenimiento') < levelRank('operativo'));
  });
});

describe('affectedServices', () => {
  it('dedupes across case, keeping the first spelling', () => {
    const items = [
      item({ structuredData: outage({ services: ['SOL'] }) }),
      item({ structuredData: outage({ services: ['sol'] }) }),
    ];

    assert.deepEqual(affectedServices(items), ['SOL']);
  });

  it('dedupes across accents and spacing', () => {
    const items = [
      item({ structuredData: outage({ services: ['Declaración  Anual'] }) }),
      item({ structuredData: outage({ services: ['declaracion anual'] }) }),
    ];

    assert.deepEqual(affectedServices(items), ['Declaración  Anual']);
  });

  it('trims and drops blank entries', () => {
    const items = [
      item({ structuredData: outage({ services: ['  Mesa de Partes  ', '', '   '] }) }),
    ];

    assert.deepEqual(affectedServices(items), ['Mesa de Partes']);
  });

  it('preserves order and returns nothing for no services', () => {
    const items = [item({ structuredData: outage({ services: ['SOL', 'SIRE', 'MPV'] }) })];

    assert.deepEqual(affectedServices(items), ['SOL', 'SIRE', 'MPV']);
    assert.deepEqual(affectedServices([]), []);
  });
});

describe('placeIncident', () => {
  const row = (
    structuredData: StructuredOutage | null,
    originalDate: Date = NOW
  ): { structuredData: StructuredOutage | null; originalDate: Date } => ({
    structuredData,
    originalDate,
  });

  it('calls an unreviewed notice pending rather than guessing', () => {
    assert.equal(placeIncident(row(null), NOW), 'unreviewed');
  });

  it('separates an announced future window from something running', () => {
    assert.equal(
      placeIncident(row(outage({ startsAt: hoursFromNow(30), endsAt: hoursFromNow(36) })), NOW),
      'scheduled'
    );
    assert.equal(placeIncident(row(outage({ inProgress: true })), NOW), 'ongoing');
  });

  it('calls an elapsed window past', () => {
    assert.equal(
      placeIncident(row(outage({ startsAt: hoursFromNow(-9), endsAt: hoursFromNow(-3) })), NOW),
      'past'
    );
  });
});

describe('partitionIncidents', () => {
  const row = (id: string, structuredData: StructuredOutage | null) => ({
    id,
    structuredData,
    originalDate: NOW,
  });

  it('keeps announced-but-not-started windows out of the history', () => {
    const { upcoming, history } = partitionIncidents(
      [
        row('futuro', outage({ startsAt: hoursFromNow(48), endsAt: hoursFromNow(52) })),
        row('pasado', outage({ startsAt: hoursFromNow(-20), endsAt: hoursFromNow(-14) })),
        row('curso', outage({ inProgress: true })),
      ],
      NOW
    );

    assert.deepEqual(
      upcoming.map((entry) => entry.id),
      ['futuro']
    );
    assert.deepEqual(
      history.map((entry) => entry.id),
      ['pasado', 'curso']
    );
  });

  it('orders announced windows soonest first', () => {
    const { upcoming } = partitionIncidents(
      [
        row('semana', outage({ startsAt: hoursFromNow(120) })),
        row('manana', outage({ startsAt: hoursFromNow(20) })),
        row('tarde', outage({ startsAt: hoursFromNow(60) })),
      ],
      NOW
    );

    assert.deepEqual(
      upcoming.map((entry) => entry.id),
      ['manana', 'tarde', 'semana']
    );
  });

  it('leaves unreviewed notices in the history, where they may still be current', () => {
    const { upcoming, history } = partitionIncidents([row('pendiente', null)], NOW);

    assert.deepEqual(upcoming, []);
    assert.deepEqual(
      history.map((entry) => entry.id),
      ['pendiente']
    );
  });
});

describe('computeStatus', () => {
  it('reports operativo when nothing is active', () => {
    const status = computeStatus([], NOW);

    assert.equal(status.level, 'operativo');
    assert.equal(status.primary, null);
    assert.deepEqual(status.active, []);
    assert.deepEqual(status.affectedServices, []);
  });

  it('stays operativo when every window is still ahead, and lists them soonest first', () => {
    const later = item({
      id: 'later',
      structuredData: outage({ startsAt: hoursFromNow(10), endsAt: hoursFromNow(12) }),
    });
    const sooner = item({
      id: 'sooner',
      structuredData: outage({ startsAt: hoursFromNow(3), endsAt: hoursFromNow(5) }),
    });

    const status = computeStatus([later, sooner], NOW);

    assert.equal(status.level, 'operativo');
    assert.deepEqual(
      status.upcoming.map((entry) => entry.id),
      ['sooner', 'later']
    );
  });

  it('lets the most severe active outage decide the level', () => {
    const maintenance = item({
      id: 'mantenimiento',
      structuredData: outage({ kind: 'MANTENIMIENTO', inProgress: true }),
    });
    const down = item({
      id: 'indisponible',
      structuredData: outage({ kind: 'INDISPONIBILIDAD', inProgress: true }),
    });

    const status = computeStatus([maintenance, down], NOW);

    assert.equal(status.level, 'indisponible');
    assert.equal(status.primary?.id, 'indisponible');
    assert.deepEqual(
      status.active.map((entry) => entry.id),
      ['indisponible', 'mantenimiento']
    );
  });

  it('prefers an intermittency over maintenance', () => {
    const status = computeStatus(
      [
        item({ id: 'm', structuredData: outage({ kind: 'MANTENIMIENTO', inProgress: true }) }),
        item({ id: 'i', structuredData: outage({ kind: 'INTERMITENCIA', inProgress: true }) }),
      ],
      NOW
    );

    assert.equal(status.level, 'degradado');
  });

  it('prefers an unclassified incident over maintenance', () => {
    const status = computeStatus(
      [
        item({ id: 'm', structuredData: outage({ kind: 'MANTENIMIENTO', inProgress: true }) }),
        item({ id: 'd', structuredData: outage({ kind: 'DESCONOCIDO', inProgress: true }) }),
      ],
      NOW
    );

    assert.equal(status.level, 'incidencia');
    assert.equal(status.primary?.id, 'd');
  });

  it('aggregates services with the worst outage first', () => {
    const status = computeStatus(
      [
        item({
          id: 'm',
          structuredData: outage({
            kind: 'MANTENIMIENTO',
            inProgress: true,
            services: ['Mesa de Partes', 'SOL'],
          }),
        }),
        item({
          id: 'd',
          structuredData: outage({
            kind: 'INDISPONIBILIDAD',
            inProgress: true,
            services: ['SOL', 'SIRE'],
          }),
        }),
      ],
      NOW
    );

    assert.deepEqual(status.affectedServices, ['SOL', 'SIRE', 'Mesa de Partes']);
  });

  it('excludes outages whose window has elapsed', () => {
    const expired = item({
      structuredData: outage({ startsAt: hoursFromNow(-9), endsAt: hoursFromNow(-3) }),
    });

    const status = computeStatus([expired], NOW);

    assert.equal(status.level, 'operativo');
    assert.deepEqual(status.active, []);
  });

  it('applies the staleness guard to open-ended notices', () => {
    const stale = item({
      structuredData: outage({ kind: 'INDISPONIBILIDAD', inProgress: true }),
      originalDate: new Date(NOW.getTime() - 40 * 60 * 60 * 1000),
    });

    assert.equal(computeStatus([stale], NOW).level, 'operativo');
    assert.equal(computeStatus([stale], NOW, { maxAgeHours: 72 }).level, 'indisponible');
  });

  it('reports back the instant it was given', () => {
    assert.equal(computeStatus([], NOW).evaluatedAt, NOW);
  });
});

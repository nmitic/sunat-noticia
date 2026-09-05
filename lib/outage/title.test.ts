import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { displayTitle, outageTitle } from './title';
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

describe('outageTitle — kind leads the headline', () => {
  it('names the kind when nothing else is known', () => {
    assert.equal(outageTitle(outage({ kind: 'INTERMITENCIA' })), 'Intermitencia');
    assert.equal(
      outageTitle(outage({ kind: 'INDISPONIBILIDAD' })),
      'Servicios no disponibles'
    );
  });

  it('declines to invent a headline when the kind is undetermined', () => {
    assert.equal(outageTitle(outage({ kind: 'DESCONOCIDO', services: ['SOL'] })), null);
  });
});

describe('outageTitle — services', () => {
  it('names a single service', () => {
    assert.equal(
      outageTitle(outage({ kind: 'INTERMITENCIA', services: ['Mesa de Partes Virtual'] })),
      'Intermitencia en Mesa de Partes Virtual'
    );
  });

  it('joins exactly two with "y"', () => {
    assert.equal(
      outageTitle(outage({ kind: 'INTERMITENCIA', services: ['SOL', 'MPV'] })),
      'Intermitencia en SOL y MPV'
    );
  });

  it('counts the tail beyond two rather than listing it', () => {
    assert.equal(
      outageTitle(outage({ kind: 'INTERMITENCIA', services: ['SOL', 'MPV', 'SIGERI', 'Actas'] })),
      'Intermitencia en SOL y 3 servicios más'
    );
  });

  it('ignores blank service entries', () => {
    assert.equal(
      outageTitle(outage({ kind: 'INTERMITENCIA', services: ['  ', 'SOL'] })),
      'Intermitencia en SOL'
    );
  });
});

describe('outageTitle — when', () => {
  it('says "en curso" for something already happening', () => {
    const title = outageTitle(
      outage({ kind: 'INTERMITENCIA', services: ['SOL'], inProgress: true })
    );

    assert.equal(title, 'Intermitencia en SOL — en curso');
  });

  it('formats the start the same way the summary panel does', () => {
    // Both go through date-fns with the `es` locale, so the headline and the
    // panel directly beneath it can never disagree about the same instant.
    const startsAt = '2025-09-05T21:00:00-05:00';
    const expected = `${format(new Date(startsAt), "d 'de' MMMM, HH:mm", { locale: es })} h`;

    assert.equal(
      outageTitle(outage({ services: ['SOL'], startsAt })),
      `Mantenimiento programado en SOL — ${expected}`
    );
  });

  it('omits the window when no start was stated', () => {
    assert.equal(
      outageTitle(outage({ kind: 'INTERMITENCIA', services: ['SOL'] })),
      'Intermitencia en SOL'
    );
  });

  it('omits the window rather than throwing on an unparseable date', () => {
    assert.equal(
      outageTitle(outage({ kind: 'INTERMITENCIA', services: ['SOL'], startsAt: 'nonsense' })),
      'Intermitencia en SOL'
    );
  });
});

describe('displayTitle', () => {
  const scraped = 'Le informamos que desde las 21:00 horas del sábado 05/09 hasta las 07:00';

  it('keeps the stored title when there is no structured data', () => {
    assert.equal(displayTitle({ title: scraped }), scraped);
    assert.equal(displayTitle({ title: scraped, structuredData: null }), scraped);
  });

  it('replaces the scraped sentence once outage data is approved', () => {
    const structuredData = outage({ services: ['SOL'], startsAt: '2025-09-05T21:00:00-05:00' });

    assert.equal(displayTitle({ title: scraped, structuredData }), outageTitle(structuredData));
    assert.notEqual(displayTitle({ title: scraped, structuredData }), scraped);
  });

  it('falls back to the stored title when the kind is undetermined', () => {
    const title = displayTitle({
      title: scraped,
      structuredData: outage({ kind: 'DESCONOCIDO' }),
    });

    assert.equal(title, scraped);
  });
});

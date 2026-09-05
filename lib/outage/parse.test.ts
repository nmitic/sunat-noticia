import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseOutage } from './parse';

/**
 * Fixtures are the real bodies of notices published at
 * sunat.gob.pe/mensajes, kept verbatim (including the "setiembre" spelling and
 * the inconsistent "a. m." spacing) so the parser is pinned against what SUNAT
 * actually writes rather than a tidied-up version of it.
 *
 * Run with: npm test
 */

/** The notice's own publication date, as stored in `originalDate`. */
const on = (year: number, month: number, day: number) => new Date(year, month - 1, day);

describe('parseOutage — scheduled maintenance with a full window', () => {
  const content = `Estimado(a) contribuyente:

Le informamos que desde las 21:00 horas del sábado 5 de setiembre hasta las 07:00 horas del domingo 6 de setiembre se tiene previsto realizar trabajos de mantenimiento en la plataforma informática de la SUNAT, por lo que no estarán disponibles los siguientes servicios para los contribuyentes de la Intendencia Lima:

Mis Trámites y Consultas
Consulta de RUC en Línea
Otras declaraciones y solicitudes: Mis Devoluciones
Mis declaraciones y pagos

Le recomendamos tomar sus previsiones. Agradecemos su comprensión.`;

  const result = parseOutage(content, on(2026, 9, 4));

  it('classifies planned work as MANTENIMIENTO', () => {
    assert.equal(result.kind, 'MANTENIMIENTO');
  });

  it('reads both ends of the window at the Lima offset', () => {
    assert.equal(result.startsAt, '2026-09-05T21:00:00-05:00');
    assert.equal(result.endsAt, '2026-09-06T07:00:00-05:00');
    assert.equal(result.confidence.window, 'parsed');
  });

  it('collects every listed service, including one containing a colon', () => {
    assert.deepEqual(result.services, [
      'Mis Trámites y Consultas',
      'Consulta de RUC en Línea',
      'Otras declaraciones y solicitudes: Mis Devoluciones',
      'Mis declaraciones y pagos',
    ]);
  });

  it('captures the regional scope', () => {
    assert.equal(result.scope, 'Intendencia Lima');
  });

  it('is not in progress — the window is in the future', () => {
    assert.equal(result.inProgress, false);
  });

  it('reports itself as unedited', () => {
    assert.equal(result.source, 'auto');
  });
});

describe('parseOutage — intermitencia already happening, no window', () => {
  const content = `Estimado(a) contribuyente:

Le informamos que en estos momentos estamos presentando intermitencia en los siguientes servicios:

Mesa de Partes Virtual - MPV
Actas electrónicas
SIGERI
Expedientes virtuales

Nuestro equipo técnico viene trabajando para resolverlo. Disculpe las molestias.`;

  const result = parseOutage(content, on(2026, 9, 2));

  it('classifies degraded service as INTERMITENCIA', () => {
    assert.equal(result.kind, 'INTERMITENCIA');
  });

  it('marks the window missing rather than inventing one', () => {
    assert.equal(result.startsAt, null);
    assert.equal(result.endsAt, null);
    assert.equal(result.confidence.window, 'missing');
  });

  it('flags it as in progress from the phrasing alone', () => {
    assert.equal(result.inProgress, true);
  });

  it('stops the list at the closing courtesy', () => {
    assert.deepEqual(result.services, [
      'Mesa de Partes Virtual - MPV',
      'Actas electrónicas',
      'SIGERI',
      'Expedientes virtuales',
    ]);
  });
});

describe('parseOutage — 12-hour times with inconsistent meridiem spacing', () => {
  const content = `Estimado(a) contribuyente:

Le informamos que desde las 21:00 p.m. del sábado 05/09 hasta las 07:00 a. m. del domingo 06 se tiene previsto realizar trabajos de mantenimiento en los aplicativos de IQBF en SOL.`;

  const result = parseOutage(content, on(2026, 9, 4));

  it('reads "a. m." and "p.m." despite the spacing', () => {
    assert.ok(result.startsAt?.startsWith('2026-09-05T21:00'), `got ${result.startsAt}`);
    assert.ok(result.endsAt?.startsWith('2026-09-06T07:00'), `got ${result.endsAt}`);
  });

  it('recognises a subsystem scope', () => {
    assert.equal(result.scope, 'IQBF en SOL');
  });
});

describe('parseOutage — relative "hoy" and a day missing its month', () => {
  const content = `Estimado(a) contribuyente:

Le informamos que desde las 22:00 horas de hoy, jueves 02 de julio, hasta las 02:00 horas del viernes 03 de julio, no estarán disponibles los siguientes servicios:

Gestión de Proveedores de la Plataforma de Conformidad (Factoring)
Emisión de Comprobantes No Domiciliados
Programa de Envío de Información (PEI) Web

Agradecemos su comprensión.`;

  const result = parseOutage(content, on(2026, 7, 2));

  it('resolves the window across midnight', () => {
    assert.equal(result.startsAt, '2026-07-02T22:00:00-05:00');
    assert.equal(result.endsAt, '2026-07-03T02:00:00-05:00');
  });

  it('keeps parenthesised service names intact', () => {
    assert.deepEqual(result.services, [
      'Gestión de Proveedores de la Plataforma de Conformidad (Factoring)',
      'Emisión de Comprobantes No Domiciliados',
      'Programa de Envío de Información (PEI) Web',
    ]);
  });
});

describe('parseOutage — a weekday with no month inherits from its sibling', () => {
  const content = `Le informamos que desde las 22:00 horas del viernes 30 hasta las 06:00 horas del sábado 31 de enero se tiene previsto realizar trabajos de mantenimiento.`;

  const result = parseOutage(content, on(2026, 1, 30));

  it('borrows January from the end of the window', () => {
    assert.equal(result.startsAt, '2026-01-30T22:00:00-05:00');
    assert.equal(result.endsAt, '2026-01-31T06:00:00-05:00');
    assert.equal(result.confidence.window, 'parsed');
  });
});

describe('parseOutage — "entre las X y las Y" sharing one date', () => {
  const content = `Le informamos que entre las 01:00 y 03:00 horas del martes 28 de enero se tiene previsto realizar actualizaciones en el aplicativo del Sistema de emisión electrónica.`;

  const result = parseOutage(content, on(2026, 1, 27));

  it('applies the single stated date to both endpoints', () => {
    assert.equal(result.startsAt, '2026-01-28T01:00:00-05:00');
    assert.equal(result.endsAt, '2026-01-28T03:00:00-05:00');
  });
});

describe('parseOutage — date-first ordering', () => {
  const content = `Le informamos que el sábado 27 de junio desde las 14:00 horas hasta el domingo 28 de junio 14:00 horas se realizará mantenimiento de la plataforma, por lo que no estará disponible el servicio de Pagos en línea.`;

  const result = parseOutage(content, on(2026, 6, 26));

  it('handles the date preceding the time on both halves', () => {
    assert.equal(result.startsAt, '2026-06-27T14:00:00-05:00');
    assert.equal(result.endsAt, '2026-06-28T14:00:00-05:00');
  });
});

describe('parseOutage — suspension with no window and no list', () => {
  const content = `Estimada(o) contribuyente:

Le informamos que el servicio de emisión de Certificados Digitales Tributarios (CDT) ubicado en SUNAT Operaciones en Línea (SOL), se encuentra temporalmente suspendido debido a trabajos de mantenimiento.

Ofrecemos disculpas por los inconvenientes.`;

  const result = parseOutage(content, on(2026, 1, 6));

  it('classifies it as INDISPONIBILIDAD ahead of the maintenance mention', () => {
    assert.equal(result.kind, 'INDISPONIBILIDAD');
  });

  it('marks the missing pieces rather than guessing', () => {
    assert.equal(result.confidence.window, 'missing');
    assert.equal(result.confidence.services, 'missing');
    assert.deepEqual(result.services, []);
  });

  it('still detects that it is currently in effect', () => {
    assert.equal(result.inProgress, true);
  });
});

describe('parseOutage — third-party cause', () => {
  const content = `Le informamos que RENIEC ha comunicado la suspensión temporal de sus servicios, lo que viene afectando el aplicativo del Sorteo de Comprobantes de Pago.`;

  const result = parseOutage(content, on(2026, 7, 11));

  it('attributes the outage to the external body', () => {
    assert.ok(result.cause?.startsWith('RENIEC'), `got ${result.cause}`);
  });

  it('is in progress', () => {
    assert.equal(result.inProgress, true);
  });
});

describe('parseOutage — December to January rollover', () => {
  const content = `Le informamos que desde las 22:00 horas del miércoles 31 de diciembre hasta las 06:00 horas del jueves 1 de enero se tiene previsto realizar trabajos de mantenimiento.`;

  const result = parseOutage(content, on(2026, 12, 31));

  it('rolls the end of the window into the following year', () => {
    assert.equal(result.startsAt, '2026-12-31T22:00:00-05:00');
    assert.equal(result.endsAt, '2027-01-01T06:00:00-05:00');
  });
});

describe('parseOutage — unrecognisable text', () => {
  const result = parseOutage('Estimado(a) contribuyente:\n\nGracias por su atención.', on(2026, 5, 1));

  it('returns DESCONOCIDO with everything flagged rather than throwing', () => {
    assert.equal(result.kind, 'DESCONOCIDO');
    assert.equal(result.confidence.kind, 'missing');
    assert.equal(result.confidence.window, 'missing');
    assert.equal(result.confidence.services, 'missing');
    assert.deepEqual(result.services, []);
    assert.equal(result.startsAt, null);
  });
});

describe('parseOutage — timezone independence', () => {
  const content = `Le informamos que desde las 21:00 horas del sábado 5 de setiembre hasta las 07:00 horas del domingo 6 de setiembre se realizarán trabajos de mantenimiento.`;

  it('emits the same instant regardless of the notice date object being UTC', () => {
    // The same calendar day expressed two ways: a local-midnight Date (what the
    // scraper builds) and an explicit UTC instant. Both must yield the same
    // window, because the offset is written by hand rather than read from the
    // host.
    const fromLocal = parseOutage(content, on(2026, 9, 4));
    const fromUtc = parseOutage(content, new Date('2026-09-04T05:00:00Z'));

    assert.equal(fromLocal.startsAt, fromUtc.startsAt);
    assert.equal(fromLocal.startsAt, '2026-09-05T21:00:00-05:00');
  });
});

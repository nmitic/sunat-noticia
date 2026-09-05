import { ListChecks } from 'lucide-react';

import { pluralize, UI_TEXT } from '@/lib/utils/constants';

/**
 * The services named by whatever is running right now, pooled across every
 * active notice.
 *
 * The names are printed exactly as SUNAT wrote them. Normalising them into a
 * canonical service list would mean inventing a taxonomy SUNAT does not
 * publish, and misnaming an affected service is worse than showing two entries
 * that a reader can tell apart themselves.
 */
export function AffectedServices({ services }: { services: string[] }) {
  return (
    <section aria-labelledby="servicios-afectados">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="servicios-afectados" className="text-lg font-semibold tracking-tight">
          {UI_TEXT.status.services.heading}
        </h2>

        {services.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            {pluralize(
              services.length,
              UI_TEXT.status.services.countOne,
              UI_TEXT.status.services.countMany
            )}
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {UI_TEXT.status.services.description}
      </p>

      {services.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <li
              key={service}
              className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
            >
              <ListChecks
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0">{service}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <ListChecks className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            {UI_TEXT.status.services.empty}
          </p>
        </div>
      )}
    </section>
  );
}

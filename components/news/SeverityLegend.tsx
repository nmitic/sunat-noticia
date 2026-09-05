import { NewsFlag } from '@/lib/db/schema';
import { getFlagDotClasses } from '@/lib/utils/badges';
import { getFlagLabel } from '@/lib/utils/constants';

// Severity order, most urgent first — matches the filter bar.
const LEGEND_FLAGS: NewsFlag[] = [
  'URGENTE',
  'CAIDA_SISTEMA',
  'IMPORTANTE',
  'ACTUALIZACION',
  'SALA_PRENSA',
];

/**
 * Makes the card accent colours learnable instead of decorative.
 */
export function SeverityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="font-medium">Etiquetas:</span>
      {LEGEND_FLAGS.map((flag) => (
        <span key={flag} className="inline-flex items-center gap-1.5">
          <span
            className={`size-2 rounded-full ${getFlagDotClasses(flag)}`}
            aria-hidden="true"
          />
          {getFlagLabel(flag)}
        </span>
      ))}
    </div>
  );
}

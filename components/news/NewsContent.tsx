'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface NewsContentProps {
  content: string;
  /** Below this length the text is short enough to always show in full. */
  clampThreshold?: number;
}

/**
 * Renders scraped article text as paragraphs, clamped to a few lines with an
 * inline expander.
 *
 * Content now holds the full comunicado rather than a one-line summary, so the
 * feed would otherwise become unscannable — but the whole text is present in
 * the DOM either way, which keeps it selectable and indexable.
 */
export function NewsContent({ content, clampThreshold = 260 }: NewsContentProps) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();

  const paragraphs = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  const needsClamp = content.length > clampThreshold || paragraphs.length > 2;

  return (
    <div className="space-y-2">
      <div
        id={regionId}
        className={
          expanded
            ? 'space-y-3 text-sm leading-relaxed text-muted-foreground'
            : 'line-clamp-3 space-y-3 text-sm leading-relaxed text-muted-foreground'
        }
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={regionId}
          className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-foreground/80 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
          <ChevronDown
            className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

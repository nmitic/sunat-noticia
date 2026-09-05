import Image from 'next/image';
import { ArrowRight, Download, Inbox, Clock, Bot, Building2, Shield } from 'lucide-react';
import { AD_UNITS, adHref, type AdFeature, type AdSlug } from './adUnits';

function FeatureIcon({ icon, className }: { icon: AdFeature['icon']; className?: string }) {
  switch (icon) {
    case 'download':
      return <Download className={className} aria-hidden="true" />;
    case 'inbox':
      return <Inbox className={className} aria-hidden="true" />;
    case 'clock':
      return <Clock className={className} aria-hidden="true" />;
    case 'bot':
      return <Bot className={className} aria-hidden="true" />;
    case 'building':
      return <Building2 className={className} aria-hidden="true" />;
    case 'shield':
      return <Shield className={className} aria-hidden="true" />;
  }
}

interface PerunioAdProps {
  slug: AdSlug;
  variant?: 'feature' | 'compact';
  className?: string;
}

/**
 * Perunio promotional panel for the sidebar rail.
 *
 * Uses --primary (coral) exclusively — the news severity ramp deliberately
 * avoids that hue so promotional and editorial content never look alike.
 * Every unit is labelled "Publicidad".
 */
export function PerunioAd({ slug, variant = 'feature', className = '' }: PerunioAdProps) {
  const unit = AD_UNITS[slug];
  const href = adHref(unit);

  return (
    <aside className={className} aria-label="Publicidad">
      <p className="mb-1.5 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        Publicidad
      </p>

      {variant === 'feature' ? (
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          className="group block rounded-lg border bg-card/50 p-4 shadow-sm backdrop-blur transition-all hover:border-primary/40 hover:shadow-md"
        >
          <Image
            src="/logo/fulllogo_transparent_nobuffer.png"
            alt="Perunio"
            width={180}
            height={60}
            className="h-7 w-auto"
          />

          {unit.eyebrow && (
            <p className="mt-3 text-[11px] font-semibold tracking-wide text-primary uppercase">
              {unit.eyebrow}
            </p>
          )}

          <h3 className="mt-1 text-lg leading-tight font-extrabold tracking-tight text-balance">
            {unit.headline}
            {unit.headlineAccent && (
              <>
                <br />
                <span className="bg-linear-to-r from-orange-500 via-primary to-pink-500 bg-clip-text text-transparent">
                  {unit.headlineAccent}
                </span>
              </>
            )}
          </h3>

          {unit.body && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{unit.body}</p>
          )}

          {unit.features && (
            // Six modules kept compact so the rail unit doesn't run long
            <ul className="mt-4 grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-1">
              {unit.features.map((feature) => (
                <li key={feature.label} className="flex items-center gap-2">
                  <span className="shrink-0 rounded-full bg-primary/10 p-1">
                    <FeatureIcon icon={feature.icon} className="size-3 text-primary" />
                  </span>
                  <span className="text-[13px] leading-snug text-foreground/90">
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <span className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all group-hover:shadow-xl group-hover:shadow-primary/40">
            {unit.cta}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>

          {unit.trustLine && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground">{unit.trustLine}</p>
          )}
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          className="group flex items-center gap-3 rounded-lg border bg-card/50 p-3 shadow-sm backdrop-blur transition-all hover:border-primary/40 hover:shadow-md"
        >
          <span className="shrink-0 rounded-full bg-primary/10 p-2">
            <FeatureIcon icon={unit.compactIcon ?? 'bot'} className="size-4 text-primary" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm leading-snug font-semibold">{unit.headline}</span>
            <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-primary">
              {unit.cta}
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </a>
      )}
    </aside>
  );
}

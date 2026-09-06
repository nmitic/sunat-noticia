'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Newspaper } from 'lucide-react';

import Logo from '../Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UI_TEXT } from '@/lib/utils/constants';

interface HeaderProps {
  isAdmin?: boolean;
}

/**
 * The two public sections are peers, so they are announced as a pair rather
 * than the feed hanging off the logo's status page as a lone text link. The
 * logo is a mark only — it no longer doubles as the way into Estado.
 */
const SECTIONS = [
  { href: '/', label: UI_TEXT.nav.status, icon: Activity },
  { href: '/noticias', label: UI_TEXT.nav.news, icon: Newspaper },
] as const;

export function Header({ isAdmin = false }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center transition-opacity hover:opacity-80"
            aria-label="Ir a la página principal"
          >
            <Logo className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-2">
            <nav aria-label="Secciones" className="flex items-center gap-1">
              {SECTIONS.map(({ href, label, icon: Icon }) => {
                // Article pages live under /noticias/[slug], so the feed stays
                // marked while reading one. Estado matches only exactly.
                const isActive =
                  href === '/' ? pathname === '/' : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors sm:px-3',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {isAdmin && (
              <>
                <span className="h-6 w-px bg-border" aria-hidden="true" />
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/noticias">Panel Admin</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

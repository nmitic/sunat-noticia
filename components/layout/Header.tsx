'use client';

import Link from 'next/link';
import Logo from '../Logo';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  isAdmin?: boolean;
}

export function Header({ isAdmin = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
            aria-label="Ir a la página principal"
          >
            <Logo className="h-7 w-auto" />
            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <span className="hidden text-sm font-semibold tracking-tight sm:block">
              SUNAT Noticias
            </span>
          </Link>

          {isAdmin && (
            <nav className="flex items-center">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/noticias">Panel Admin</Link>
              </Button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

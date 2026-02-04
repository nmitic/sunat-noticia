'use client';

import Link from 'next/link';
import Logo from '../Logo';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur supports-backdrop-filter:bg-gray-50/60 dark:supports-backdrop-filter:bg-gray-900/60 print:hidden">
      <div className="container mx-auto px-4 py-1 sm:py-2 sm:px-6 lg:px-8">
        <div className="flex h-10 sm:h-16 items-center justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
            aria-label="Ir a la página principal"
          >
            <Logo className="h-8 sm:h-14 w-auto text-gray-900 dark:text-gray-100" />
          </Link>

          {/* Optional: Add navigation items here in the future */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Future navigation items */}
          </nav>
        </div>
      </div>
    </header>
  );
}

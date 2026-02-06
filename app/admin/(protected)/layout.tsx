import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';

export const metadata = {
  title: 'Panel Administrativo - SUNAT Noticias',
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="dark:bg-gray-900 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Inicio
              </Link>
              <span className="font-bold text-sm text-gray-600 dark:text-gray-300">{session.user?.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

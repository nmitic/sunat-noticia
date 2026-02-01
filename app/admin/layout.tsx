import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';

export const metadata = {
  title: 'Panel Administrativo - SUNAT Noticias',
};

export default async function AdminLayout({
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
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/noticias" className="text-xl font-bold">
                SUNAT Noticias Admin
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/admin/noticias"
                  className="hover:text-blue-200 transition-colors"
                >
                  Noticias Pendientes
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{session.user?.email}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

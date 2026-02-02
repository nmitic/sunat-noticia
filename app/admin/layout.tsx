import { ReactNode } from 'react';

export const metadata = {
  title: 'Panel Administrativo - SUNAT Noticias',
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

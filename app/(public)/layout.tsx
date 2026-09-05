import { ReactNode } from 'react';

/**
 * Shared shell for the public segment. Header and footer are rendered by the
 * page rather than here, because the embed route nests under this layout and
 * must stay chrome-free for third-party sites.
 */
export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">{children}</main>
    </div>
  );
}

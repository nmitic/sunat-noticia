import { ReactNode } from 'react';

export default function EmbeddedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

import { ReactNode } from 'react';

/**
 * Shell shared by every embed: an opaque background, so a host page's own
 * colours never show through the frame.
 *
 * Width and padding deliberately belong to each page rather than to this
 * layout. The feed holds wide cards and wants `max-w-4xl`; the estado panel is
 * a compact two-section widget that would float in the middle of that. A nested
 * route cannot escape a parent layout, so the wrapper has to sit one level down.
 */
export default function EmbeddedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="bg-background">{children}</div>;
}

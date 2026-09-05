'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  /** Absolute or root-relative; resolved against the current origin. */
  url: string;
}

/**
 * Share control for an article page.
 *
 * Prefers the native share sheet where it exists (mobile), and falls back to
 * copying the link. The URL is resolved on the client so the button works
 * across localhost, preview and production without a configured base URL.
 */
export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleShare = async () => {
    const absolute = new URL(url, window.location.origin).toString();

    // Checked at click time rather than on mount: reading it during render
    // would differ between server and client, and an effect to sync it just
    // to pick an icon is not worth the extra render pass.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url: absolute });
        return;
      } catch {
        // Dismissing the share sheet rejects; fall through to copying rather
        // than leaving the click with no effect.
      }
    }

    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
    } catch {
      console.error('No se pudo copiar el enlace');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      aria-live="polite"
      title="Compartir esta noticia"
    >
      {copied ? <Check /> : <Share2 />}
      {copied ? 'Enlace copiado' : 'Compartir'}
    </Button>
  );
}

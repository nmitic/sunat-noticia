'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UI_TEXT } from '@/lib/utils/constants';
import { Mail, CheckCircle2 } from 'lucide-react';

/**
 * Shared submit logic for both placements.
 */
function useSubscription() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('¡Suscripción exitosa! Gracias por su confianza.');
        setEmail('');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.error || 'Error al suscribirse');
      }
    } catch {
      setStatus('error');
      setMessage('Error al suscribirse. Intenta de nuevo.');
    }
  }

  return { email, setEmail, status, message, handleSubmit };
}

/**
 * Sidebar card. Rendered inside the sticky right rail on lg and up.
 */
export function EmailSubscriptionCard() {
  const { email, setEmail, status, message, handleSubmit } = useSubscription();

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary/10 p-1.5">
          <Mail className="size-4 text-primary" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold">{UI_TEXT.public.subscribe}</h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Recibe las alertas y comunicados oficiales de SUNAT en tu correo.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
        <Input
          type="email"
          placeholder={UI_TEXT.public.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          aria-label="Correo electrónico"
        />
        <Button type="submit" disabled={status === 'loading'} className="w-full">
          {status === 'loading' ? 'Enviando...' : UI_TEXT.public.subscribeButton}
        </Button>
      </form>

      {status === 'success' && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {message}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-sm font-medium text-destructive">{message}</p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Sin spam. Puedes darte de baja en cualquier momento.
      </p>
    </section>
  );
}

/**
 * Fixed bottom bar for small screens, plus the spacer that keeps it from
 * covering the end of the feed.
 */
export function EmailSubscriptionBar() {
  const { email, setEmail, status, message, handleSubmit } = useSubscription();

  return (
    <>
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder={UI_TEXT.public.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              aria-label="Correo electrónico"
              className="h-9 min-w-0 flex-1"
            />
            <Button type="submit" size="sm" disabled={status === 'loading'} className="h-9">
              {status === 'loading' ? 'Enviando...' : UI_TEXT.public.subscribeButton}
            </Button>
          </form>

          {status === 'success' && (
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {message}
            </p>
          )}
          {status === 'error' && (
            <p className="mt-2 text-xs font-medium text-destructive">{message}</p>
          )}
        </div>
      </div>

      {/* Keeps the last card clear of the fixed bar */}
      <div className="h-20 lg:hidden" />
    </>
  );
}

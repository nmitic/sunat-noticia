'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UI_TEXT } from '@/lib/utils/constants';

export function EmailSubscriptionForm() {
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
        setMessage('¡Suscripción exitosa! Revisa tu correo.');
        setEmail('');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.error || 'Error al suscribirse');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error al suscribirse. Intenta de nuevo.');
    }
  }

  // Desktop sidebar layout
  const desktopContent = (
    <div className="hidden lg:block lg:w-80">
      <div className="sticky top-20 rounded-lg bg-gray-50 dark:bg-gray-800 p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          {UI_TEXT.public.subscribe}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={UI_TEXT.public.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
            className="w-full rounded-lg border border-input bg-gray-50 dark:bg-gray-900 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Enviando...' : UI_TEXT.public.subscribeButton}
          </button>
        </form>

        {status === 'success' && (
          <p className="text-sm font-medium text-green-600 mt-3">{message}</p>
        )}
        {status === 'error' && (
          <p className="text-sm font-medium text-red-600 mt-3">{message}</p>
        )}
      </div>
    </div>
  );

  // Mobile sticky footer layout
  const mobileContent = (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-800 border-t border-border shadow-lg z-40">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              placeholder={UI_TEXT.public.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              className="flex-1 min-w-0 rounded border border-input bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="whitespace-nowrap rounded bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : UI_TEXT.public.subscribeButton}
            </button>
          </form>
          {status === 'success' && (
            <p className="text-xs font-medium text-green-600 mt-2">{message}</p>
          )}
          {status === 'error' && (
            <p className="text-xs font-medium text-red-600 mt-2">{message}</p>
          )}
        </div>
      </div>

      {/* Add bottom padding on mobile to account for sticky form */}
      <div className="lg:hidden h-20" />
    </>
  );

  return (
    <>
      {desktopContent}
      {mobileContent}
    </>
  );
}

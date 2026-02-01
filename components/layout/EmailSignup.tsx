'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UI_TEXT } from '@/lib/utils/constants';

export function EmailSignup() {
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

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {UI_TEXT.public.subscribe}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={UI_TEXT.public.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Enviando...' : UI_TEXT.public.subscribeButton}
          </Button>
        </div>

        {status === 'success' && (
          <p className="text-sm font-medium text-green-600">{message}</p>
        )}
        {status === 'error' && (
          <p className="text-sm font-medium text-red-600">{message}</p>
        )}
      </form>
    </div>
  );
}

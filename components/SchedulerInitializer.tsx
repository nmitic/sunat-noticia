'use client';

import { useEffect } from 'react';

export function SchedulerInitializer() {
  useEffect(() => {
    // Initialize scheduler when app loads
    fetch('/api/scheduler/init', { method: 'POST' })
      .catch((err) => console.error('Failed to initialize scheduler:', err));
  }, []);

  return null;
}

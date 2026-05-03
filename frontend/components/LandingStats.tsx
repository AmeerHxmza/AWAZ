"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { PublicStats } from '@/lib/types';

export function LandingStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<PublicStats>('/stats/public');
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface-card p-6 animate-pulse h-[5.5rem] bg-stone-50/80" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Reports filed', value: stats.total_complaints },
    { label: 'Resolved', value: stats.resolved },
    { label: 'Routed to authorities', value: stats.authorities_notified },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
      {cards.map((c) => (
        <div key={c.label} className="surface-card-interactive p-6">
          <p className="label-caps">{c.label}</p>
          <p className="mt-3 text-[1.75rem] sm:text-[2rem] font-semibold tabular-nums text-[var(--app-navy)] tracking-tight">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from 'react';
import api, { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Complaint } from '@/lib/types';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'water', label: 'Water' },
  { value: 'sewage', label: 'Sewage' },
  { value: 'road', label: 'Roads' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'other', label: 'Other' },
];

const fieldLabel = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500';
const control =
  'rounded-sm border border-stone-300 px-3 py-2 text-sm bg-white min-w-[180px] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/15 focus-visible:border-stone-500';

export default function HeatmapPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const isCitizen = Boolean(user && role !== 'admin');

  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [myMapHtml, setMyMapHtml] = useState<string | null>(null);
  const [myMapLoading, setMyMapLoading] = useState(false);
  const [myMapError, setMyMapError] = useState<string | null>(null);
  const [myGeoReports, setMyGeoReports] = useState<Complaint[]>([]);

  const publicIframeSrc = useMemo(() => {
    const u = new URL(`${API_BASE_URL}/heatmap/`);
    if (category) u.searchParams.set('category', category);
    if (dateFrom) u.searchParams.set('date_from', new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      u.searchParams.set('date_to', end.toISOString());
    }
    return u.toString();
  }, [category, dateFrom, dateTo]);

  useEffect(() => {
    if (!isCitizen) return;
    let cancelled = false;
    setMyMapLoading(true);
    setMyMapError(null);
    (async () => {
      try {
        const [mapRes, complaintsRes] = await Promise.all([
          api.get<string>('/heatmap/me', { responseType: 'text' }),
          api.get<Complaint[]>('/complaints/'),
        ]);
        if (cancelled) return;
        setMyMapHtml(mapRes.data);
        setMyGeoReports(
          complaintsRes.data.filter((c) => c.latitude != null && c.longitude != null),
        );
      } catch {
        if (!cancelled) {
          setMyMapError('Could not load your map. Try again later.');
          setMyMapHtml(null);
        }
      } finally {
        if (!cancelled) setMyMapLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCitizen]);

  if (authLoading) {
    return (
      <p className="text-center py-16 text-stone-500 text-sm max-w-6xl mx-auto">Loading…</p>
    );
  }

  if (isCitizen) {
    return (
      <div className="flex flex-col gap-5 h-[calc(100vh-10rem)] min-h-[480px] w-full max-w-6xl mx-auto">
        <div className="surface-card p-6 sm:p-7 shrink-0">
          <p className="label-caps mb-2">Your locations</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Heatmap</h1>
          <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
            Only reports you filed are shown. Pins appear when a submission included GPS coordinates (location enabled
            when filing).
          </p>
          {myGeoReports.length > 0 && (
            <ul className="mt-4 text-sm text-stone-700 space-y-2 border-t border-stone-200 pt-4">
              {myGeoReports.map((c) => (
                <li key={c.id} className="flex flex-wrap gap-x-3 gap-y-1">
                  <a href={`/status/${c.id}`} className="link-subtle font-semibold">
                    #{c.id} · {c.title || 'Untitled'}
                  </a>
                  <span className="text-stone-500 font-mono text-xs tabular-nums">
                    {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1 rounded-sm overflow-hidden border border-stone-300 bg-stone-100 min-h-[400px]">
          {myMapLoading && (
            <div className="w-full h-full min-h-[400px] flex items-center justify-center text-stone-500 text-sm">
              Loading your map…
            </div>
          )}
          {!myMapLoading && myMapError && (
            <div className="w-full h-full min-h-[400px] flex items-center justify-center text-red-800 text-sm px-4 text-center">
              {myMapError}
            </div>
          )}
          {!myMapLoading && !myMapError && myMapHtml !== null && (
            <iframe
              title="Your reported locations"
              className="w-full h-full min-h-[400px] border-0 bg-white"
              srcDoc={myMapHtml}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-10rem)] min-h-[480px] w-full max-w-6xl mx-auto">
      <div className="surface-card p-6 sm:p-7 shrink-0">
        <p className="label-caps mb-2">Geographic view</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Issue heatmap</h1>
        <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          City-wide view of filed reports. Filter by category and filing date. Only reports with GPS coordinates appear
          on the map.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-4 sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hm-cat" className={fieldLabel}>
              Category
            </label>
            <select
              id="hm-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={control}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value || 'all'} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hm-from" className={fieldLabel}>
              From
            </label>
            <input
              id="hm-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={control}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hm-to" className={fieldLabel}>
              To
            </label>
            <input
              id="hm-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={control}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-sm font-medium text-stone-900 border border-stone-300 rounded-sm px-4 py-2 hover:bg-stone-50 self-start sm:self-auto"
          >
            Clear filters
          </button>
        </div>
      </div>
      <div className="flex-1 rounded-sm overflow-hidden border border-stone-300 bg-stone-100 min-h-[400px]">
        <iframe
          key={publicIframeSrc}
          src={publicIframeSrc}
          className="w-full h-full min-h-[400px] border-0 bg-white"
          title="AWAZ — civic issues heatmap"
        />
      </div>
    </div>
  );
}

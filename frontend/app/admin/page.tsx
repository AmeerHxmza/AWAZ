"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <p className="text-center py-20 text-stone-500 text-sm font-medium">Loading system metrics…</p>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="label-caps mb-2">AWAZ · Admin</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">System overview</h1>
          <p className="text-sm text-stone-600 mt-2 max-w-xl">
            Volume and status distribution across all filed reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/complaints"
            className="text-sm font-semibold text-white bg-[var(--app-navy)] border border-[var(--app-navy)] rounded-sm px-4 py-2 hover:bg-[var(--app-navy-hover)] hover:border-[var(--app-navy-hover)] transition-colors"
          >
            Manage complaints
          </Link>
          <Link
            href="/admin/users"
            className="text-sm font-medium text-stone-800 border border-stone-300 rounded-sm px-4 py-2 hover:bg-stone-50"
          >
            Users
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5">
          <h3 className="label-caps">Total reports</h3>
          <p className="text-3xl font-semibold tabular-nums text-stone-900 mt-3">
            {stats?.total_complaints || 0}
          </p>
        </div>

        <div className="surface-card p-5">
          <h3 className="label-caps">Pending assignment</h3>
          <p className="text-3xl font-semibold tabular-nums text-amber-900 mt-3">
            {(stats?.by_status?.pending || 0) + (stats?.by_status?.submitted || 0)}
          </p>
        </div>

        <div className="surface-card p-5">
          <h3 className="label-caps">Escalated</h3>
          <p className="text-3xl font-semibold tabular-nums text-red-900 mt-3">
            {stats?.by_status?.escalated || 0}
          </p>
        </div>

        <div className="surface-card p-5">
          <h3 className="label-caps">Resolved</h3>
          <p className="text-3xl font-semibold tabular-nums text-emerald-900 mt-3">
            {stats?.by_status?.resolved || 0}
          </p>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/80">
          <h3 className="text-sm font-semibold text-stone-900">Reports by category</h3>
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-white">
              <th className="px-5 py-3 label-caps font-semibold">Category</th>
              <th className="px-5 py-3 label-caps font-semibold">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats?.by_category || {}).map(([cat, count]: [string, any]) => (
              <tr key={cat} className="border-b border-stone-100 hover:bg-stone-50/60">
                <td className="px-5 py-3 font-medium text-stone-900 capitalize">{cat}</td>
                <td className="px-5 py-3 tabular-nums text-stone-700">{count}</td>
              </tr>
            ))}
            {Object.keys(stats?.by_category || {}).length === 0 && (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-stone-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

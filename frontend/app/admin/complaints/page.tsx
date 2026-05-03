"use client";

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Complaint } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const STATUSES: Complaint['status'][] = [
  'pending',
  'submitted',
  'acknowledged',
  'resolved',
  'escalated',
];

const selectFilter =
  'rounded-sm border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/15';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ category: string; status: string }>({ category: '', status: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;
      const res = await api.get<Complaint[]>('/complaints/all', { params });
      setComplaints(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter.category, filter.status]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: number, status: Complaint['status']) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      void load();
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const remove = async (id: number) => {
    if (!confirm(`Delete complaint #${id}?`)) return;
    try {
      await api.delete(`/complaints/${id}`);
      void load();
    } catch (e) {
      console.error(e);
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="label-caps mb-2">Registry</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">All complaints</h1>
          <p className="text-sm text-stone-600 mt-2">Filter, update status, or remove records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={selectFilter}
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All categories</option>
            <option value="water">Water</option>
            <option value="sewage">Sewage</option>
            <option value="road">Road</option>
            <option value="garbage">Garbage</option>
            <option value="other">Other</option>
          </select>
          <select
            className={selectFilter}
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-500 text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto surface-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/90 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 label-caps font-semibold">ID</th>
                <th className="px-4 py-3 label-caps font-semibold">Title</th>
                <th className="px-4 py-3 label-caps font-semibold">Category</th>
                <th className="px-4 py-3 label-caps font-semibold">Status</th>
                <th className="px-4 py-3 label-caps font-semibold">Authority</th>
                <th className="px-4 py-3 label-caps font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-600">{c.id}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate font-medium text-stone-900">{c.title}</td>
                  <td className="px-4 py-3 capitalize text-stone-600">{c.category || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-sm border border-stone-300 px-2 py-1 text-xs bg-white max-w-[140px] focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
                      value={c.status}
                      onChange={(e) => void updateStatus(c.id, e.target.value as Complaint['status'])}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-stone-600 max-w-[160px] truncate">{c.authority || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/status/${c.id}`} className="link-subtle text-xs font-semibold no-underline hover:underline">
                        View
                      </Link>
                      <Button
                        type="button"
                        variant="danger"
                        className="!py-1 !px-2 text-xs"
                        onClick={() => void remove(c.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {complaints.length === 0 && (
            <p className="p-8 text-center text-stone-500 text-sm">No complaints match filters.</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/Button';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>('/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const deactivate = async (id: number) => {
    if (!confirm(`Deactivate user #${id}?`)) return;
    try {
      await api.put(`/admin/users/${id}/deactivate`);
      void load();
    } catch (e) {
      console.error(e);
      alert('Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6">
        <p className="label-caps mb-2">Directory</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Users</h1>
        <p className="text-sm text-stone-600 mt-2">Account roles and status.</p>
      </div>

      {loading ? (
        <p className="text-stone-500 text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto surface-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/90 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 label-caps font-semibold">ID</th>
                <th className="px-4 py-3 label-caps font-semibold">Name</th>
                <th className="px-4 py-3 label-caps font-semibold">Email</th>
                <th className="px-4 py-3 label-caps font-semibold">Role</th>
                <th className="px-4 py-3 label-caps font-semibold">Active</th>
                <th className="px-4 py-3 label-caps font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-600">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm border ${
                        u.role === 'admin'
                          ? 'bg-amber-50 text-amber-950 border-amber-200/80'
                          : 'bg-stone-50 text-stone-800 border-stone-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{u.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    {u.is_active && u.role !== 'admin' && (
                      <Button
                        type="button"
                        variant="outline"
                        className="!py-1 !px-2 text-xs"
                        onClick={() => void deactivate(u.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import type { User } from '@/lib/types';

function formatJoined(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function AccountSummary({ user }: { user: User | null }) {
  if (!user) {
    return (
      <div className="surface-card p-6">
        <p className="text-sm text-stone-500">Loading account…</p>
      </div>
    );
  }

  const roleLabel = user.role === 'admin' ? 'Administrator' : 'Citizen';

  return (
    <div className="surface-card p-6 h-fit lg:sticky lg:top-8">
      <h2 className="label-caps mb-4">Account</h2>
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Full name</dt>
          <dd className="mt-1 font-medium text-stone-900">{user.full_name || '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Email</dt>
          <dd className="mt-1 text-stone-800 break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Role</dt>
          <dd className="mt-1 font-medium text-stone-900">{roleLabel}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Account status</dt>
          <dd className="mt-1 font-medium text-stone-900">{user.is_active ? 'Active' : 'Inactive'}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Member since</dt>
          <dd className="mt-1 text-stone-800">{formatJoined(user.created_at)}</dd>
        </div>
      </dl>
    </div>
  );
}

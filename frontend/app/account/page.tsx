"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AccountSummary } from '@/components/AccountSummary';
import { useAuth } from '@/context/AuthContext';

export default function CitizenAccountPage() {
  const router = useRouter();
  const { user, role, refreshUser, isLoading } = useAuth();

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!isLoading && role === 'admin') {
      router.replace('/admin/account');
    }
  }, [isLoading, role, router]);

  if (isLoading || role === 'admin') {
    return <p className="text-center py-16 text-stone-500 text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div className="border-b border-stone-200 pb-6">
        <p className="label-caps mb-2">AWAZ</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Account</h1>
        <p className="text-sm text-stone-600 mt-2">
          Profile for your citizen login. Reports and the map are under their own tabs.
        </p>
      </div>
      <AccountSummary user={user} />
    </div>
  );
}

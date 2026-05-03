"use client";

import { useEffect } from 'react';
import { AccountSummary } from '@/components/AccountSummary';
import { useAuth } from '@/context/AuthContext';

export default function AdminAccountPage() {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <div className="space-y-8 max-w-xl">
      <div className="border-b border-stone-200 pb-6">
        <p className="label-caps mb-2">AWAZ · Admin</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Your account</h1>
        <p className="text-sm text-stone-600 mt-2">
          Profile details for your administrator login. To manage the platform, use the other console sections.
        </p>
      </div>
      <AccountSummary user={user} />
    </div>
  );
}

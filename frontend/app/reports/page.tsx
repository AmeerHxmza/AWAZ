"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Complaint } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

const badgeBase =
  'inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm border';

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className={`${badgeBase} bg-amber-50 text-amber-900 border-amber-200/80`}>Pending</span>;
    case 'submitted':
      return <span className={`${badgeBase} bg-sky-50 text-sky-950 border-sky-200/80`}>Submitted</span>;
    case 'acknowledged':
      return (
        <span className={`${badgeBase} bg-violet-50 text-violet-950 border-violet-200/80`}>Acknowledged</span>
      );
    case 'escalated':
      return <span className={`${badgeBase} bg-red-50 text-red-900 border-red-200/80`}>Escalated</span>;
    case 'resolved':
      return (
        <span className={`${badgeBase} bg-emerald-50 text-emerald-900 border-emerald-200/80`}>Resolved</span>
      );
    default:
      return <span className={`${badgeBase} bg-stone-100 text-stone-700 border-stone-200`}>Unknown</span>;
  }
}

export default function ReportsPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      router.replace('/admin');
    }
  }, [authLoading, role, router]);

  useEffect(() => {
    if (authLoading || role === 'admin') return;
    const fetchComplaints = async () => {
      try {
        const res = await api.get<Complaint[]>('/complaints/');
        setComplaints(res.data);
      } catch (error) {
        console.error('Failed to fetch complaints', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, [authLoading, role]);

  if (authLoading || role === 'admin') {
    return <p className="text-center py-16 text-stone-500 text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="label-caps mb-2">AWAZ</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Reports</h1>
          <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
            Your submitted issues and their status. Open a card for full detail, draft letters, and notifications.
          </p>
        </div>
        <Link href="/submit">
          <Button>New report</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-stone-500 text-sm font-medium">Loading your reports…</p>
      ) : complaints.length === 0 ? (
        <div className="surface-card text-center py-14 px-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">No reports yet</h2>
          <p className="text-sm text-stone-600 mb-6 max-w-md mx-auto">
            You have not filed any civic issues. Create a new report to track it here.
          </p>
          <Link href="/submit">
            <Button variant="outline">New report</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {complaints.map((complaint) => (
            <Link key={complaint.id} href={`/status/${complaint.id}`}>
              <div className="surface-card p-5 h-full flex flex-col justify-between hover:border-stone-400 transition-colors cursor-pointer">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    {getStatusBadge(complaint.status)}
                    <span className="text-xs font-medium text-stone-500 tabular-nums shrink-0">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-stone-900 mb-1 truncate">
                    {complaint.title || 'Untitled report'}
                  </h2>
                  <p className="text-xs font-medium text-stone-500 capitalize mb-2">
                    {complaint.category || 'Category pending'}
                  </p>
                  <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">{complaint.description}</p>
                </div>
                {complaint.authority && (
                  <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
                    <span className="font-medium text-stone-600">Authority: </span>
                    {complaint.authority}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

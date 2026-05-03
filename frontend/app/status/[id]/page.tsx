"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Complaint } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function StatusTracker() {
  const params = useParams();
  const id = params.id as string;
  const { role } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLetter, setShowLetter] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get<Complaint>(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (error) {
      console.error('Failed to fetch complaint', error);
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!complaint || complaint.status !== 'pending') return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [complaint?.status, load]);

  if (isLoading) {
    return (
      <p className="text-center py-20 text-stone-500 text-sm font-medium">Retrieving status…</p>
    );
  }
  if (!complaint) {
    return (
      <p className="text-center py-20 text-red-800 text-sm font-semibold">
        Record not found or access denied.
      </p>
    );
  }

  const steps = ['pending', 'submitted', 'acknowledged', 'resolved'] as const;
  let currentStepIndex = steps.indexOf(complaint.status as (typeof steps)[number]);
  if (currentStepIndex < 0) currentStepIndex = 0;
  if (complaint.status === 'escalated') currentStepIndex = Math.max(currentStepIndex, 1);

  const backHref = role === 'admin' ? '/admin/complaints' : '/reports';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href={backHref} className="text-sm font-medium text-stone-700 hover:text-stone-950">
          ← Back to list
        </Link>
      </div>

      <div className="surface-card p-6 md:p-8">
        <div className="border-b border-stone-200 pb-6 mb-8">
          <p className="label-caps mb-2">Report detail</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Report #{complaint.id}</h1>
          <p className="text-sm text-stone-600 mt-2">
            Filed {new Date(complaint.created_at).toLocaleString()}
            {complaint.is_voice_input && (
              <span className="ml-2 text-[11px] uppercase tracking-wide font-semibold text-violet-800">
                Voice
              </span>
            )}
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-semibold text-stone-900 mb-5">Progress</h3>
          <div className="flex items-center w-full gap-1">
            {steps.map((step, index) => (
              <div key={step} className="flex-1 relative min-w-0">
                <div
                  className={`h-1 w-full rounded-sm ${
                    index <= currentStepIndex ? 'bg-stone-900' : 'bg-stone-200'
                  }`}
                />
                <div
                  className={`mt-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate ${
                    index <= currentStepIndex ? 'text-stone-900' : 'text-stone-400'
                  }`}
                >
                  {step}
                </div>
                {complaint.status === 'escalated' && step === 'submitted' && (
                  <span className="text-red-800 block text-[10px] font-semibold mt-1">Escalated</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-stone-200">
          <div>
            <h3 className="label-caps mb-2">Description</h3>
            <div className="text-sm text-stone-800 bg-stone-50/80 p-4 rounded-sm border border-stone-200/90 whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="label-caps mb-1">Category</h3>
              <p className="text-sm font-semibold text-stone-900 capitalize">
                {complaint.category || 'Classifying…'}
              </p>
            </div>
            <div>
              <h3 className="label-caps mb-1">Authority</h3>
              <p className="text-sm font-semibold text-stone-900">
                {complaint.authority || 'Pending routing'}
              </p>
              {complaint.authority_email && (
                <p className="text-xs text-stone-500 mt-1">{complaint.authority_email}</p>
              )}
            </div>
            {complaint.latitude != null && complaint.longitude != null && (
              <div>
                <h3 className="label-caps mb-1">Coordinates</h3>
                <p className="text-sm font-mono text-stone-800">
                  {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
                </p>
              </div>
            )}
          </div>
        </div>

        {complaint.notifications && complaint.notifications.length > 0 && (
          <div className="mt-8 pt-8 border-t border-stone-200">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Notifications</h3>
            <ul className="divide-y divide-stone-100 border border-stone-200 rounded-sm overflow-hidden bg-white">
              {complaint.notifications.map((n) => (
                <li
                  key={n.id}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm"
                >
                  <span className="font-semibold text-stone-800 capitalize">{n.channel}</span>
                  <span className="text-stone-600 truncate max-w-full sm:max-w-md" title={n.recipient}>
                    {n.recipient}
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase ${
                      n.status === 'sent' ? 'text-emerald-800' : 'text-red-700'
                    }`}
                  >
                    {n.status}
                  </span>
                  <span className="text-xs text-stone-400 tabular-nums">
                    {new Date(n.sent_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {complaint.drafted_letter && (
          <div className="mt-8 pt-8 border-t border-stone-200">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-sm font-semibold text-stone-900">Draft letter</h3>
              <Button type="button" variant="outline" onClick={() => setShowLetter(!showLetter)}>
                {showLetter ? 'Hide' : 'View'}
              </Button>
            </div>

            {showLetter && (
              <div className="p-6 bg-stone-50/80 border border-stone-200 rounded-sm text-sm text-stone-800 whitespace-pre-wrap overflow-x-auto max-h-[480px] overflow-y-auto leading-relaxed">
                {complaint.drafted_letter}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

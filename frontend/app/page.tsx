import Link from 'next/link';
import { LandingStats } from '@/components/LandingStats';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="pt-2 pb-10 border-b border-stone-200/90">
        <div className="hero-rule">
          <p className="label-caps mb-4">SDG 6 & 11 · Water & sustainable cities</p>
          <h1 className="text-[1.75rem] sm:text-[2.125rem] lg:text-[2.375rem] font-semibold text-stone-900 max-w-3xl">
            AWAZ — civic reporting for Islamabad
          </h1>
          <p className="mt-5 text-base sm:text-[1.0625rem] text-stone-600 max-w-2xl leading-[1.7]">
            Report water, sewage, roads, and sanitation issues by text or Urdu voice. Drafts are prepared, routed to the
            right authority, and mapped for transparency.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="btn-civic-primary">
              Submit a report
            </Link>
            <Link href="/heatmap" className="btn-civic-secondary">
              View heatmap
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="label-caps mb-4">Platform activity</h2>
        <LandingStats />
      </section>

      <div className="mt-14 pt-12 border-t border-stone-200">
        <h2 className="text-lg font-semibold text-stone-900 mb-6">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="surface-card-interactive p-6">
            <h3 className="text-base font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <span className="text-[var(--app-navy-muted)]/70" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </span>
              Voice &amp; text
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Urdu voice notes or typed descriptions both feed the same classification and routing pipeline.
            </p>
          </div>

          <div className="surface-card-interactive p-6">
            <h3 className="text-base font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <span className="text-[var(--app-navy-muted)]/70" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </span>
              Drafting &amp; context
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Formal letters informed by agency context and document references where configured.
            </p>
          </div>

          <div className="surface-card-interactive p-6">
            <h3 className="text-base font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <span className="text-[var(--app-navy-muted)]/70" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </span>
              Map &amp; status
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Geo-tagged heatmap plus per-report status, authority assignment, and notification history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const navLink =
  "text-[13px] font-medium text-stone-600 hover:text-[var(--app-navy)] py-1 border-b-2 border-transparent hover:border-stone-300 transition-colors";

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/90 shadow-[0_1px_0_rgba(28,25,23,0.04)]">
      <div className="h-1 bg-[var(--app-navy)]" aria-hidden />
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:min-h-[3.5rem] py-3.5 sm:py-0">
          <div className="flex items-baseline gap-4 min-w-0">
            <Link
              href="/"
              className="font-display text-[1.125rem] sm:text-[1.25rem] font-semibold text-stone-900 tracking-tight shrink-0 hover:text-[var(--app-navy)] transition-colors"
            >
              AWAZ
            </Link>
            <span className="hidden md:inline text-[11px] font-medium text-stone-400 uppercase tracking-[0.16em] truncate">
              Islamabad · Civic voice &amp; reporting
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-5 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
            {user && isAdmin ? (
              <>
                <Link href="/admin" className={navLink}>
                  Overview
                </Link>
                <Link href="/admin/complaints" className={navLink}>
                  All complaints
                </Link>
                <Link href="/admin/users" className={navLink}>
                  Users
                </Link>
                <Link href="/admin/account" className={navLink}>
                  Account
                </Link>
                <Link href="/heatmap" className={navLink}>
                  Heatmap
                </Link>
                <span className="hidden sm:inline w-px h-4 bg-stone-200 mx-0.5" aria-hidden />
                <button
                  type="button"
                  onClick={logout}
                  className="text-[13px] font-medium text-stone-500 hover:text-red-800 py-1"
                >
                  Sign out
                </button>
              </>
            ) : user ? (
              <>
                <Link href="/heatmap" className={navLink}>
                  Heatmap
                </Link>
                <Link href="/reports" className={navLink}>
                  Reports
                </Link>
                <Link href="/account" className={navLink}>
                  Account
                </Link>
                <span className="hidden sm:inline w-px h-4 bg-stone-200 mx-0.5" aria-hidden />
                <button
                  type="button"
                  onClick={logout}
                  className="text-[13px] font-medium text-stone-500 hover:text-red-800 py-1"
                >
                  Sign out
                </button>
              </>
            ) : null}
            {!user && (
              <>
                <Link href="/heatmap" className={navLink}>
                  Heatmap
                </Link>
                <Link href="/login" className={navLink}>
                  Sign in
                </Link>
                <Link href="/register" className="btn-civic-primary ml-1 text-[13px] !py-2 !px-3.5">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

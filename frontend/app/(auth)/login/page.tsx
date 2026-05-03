"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { decodeToken } from '@/lib/auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      login(res.data.access_token);

      const nextRaw = searchParams.get('next');
      const next =
        nextRaw && nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : null;
      const decoded = decodeToken(res.data.access_token);
      const isAdmin = decoded?.role === 'admin';
      router.push(next ?? (isAdmin ? '/admin' : '/reports'));
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="surface-card w-full max-w-md p-8 sm:p-10">
      <p className="label-caps mb-2">Account access</p>
      <h2 className="text-2xl font-semibold text-stone-900 mb-6">Sign in</h2>

      {error && (
        <div className="bg-red-50 text-red-800 border border-red-200/80 p-3 rounded-sm mb-5 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-1">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <div className="pt-3">
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-stone-200 text-center">
        <p className="text-sm text-stone-600">
          No account?{' '}
          <Link href="/register" className="link-subtle font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center">
      <Suspense
        fallback={
          <div className="surface-card w-full max-w-md p-10 text-center text-stone-500 text-sm">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

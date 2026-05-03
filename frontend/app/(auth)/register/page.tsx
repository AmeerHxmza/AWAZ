"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
      });

      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      login(res.data.access_token);
      router.push('/reports');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center py-10">
      <div className="surface-card w-full max-w-md p-8 sm:p-10 my-4">
        <p className="label-caps mb-2">New account</p>
        <h2 className="text-2xl font-semibold text-stone-900 mb-6">Citizen registration</h2>

        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200/80 p-3 rounded-sm mb-5 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-1">
          <Input
            label="Full name"
            type="text"
            value={fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          <div className="pt-3">
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-600">
            Already registered?{' '}
            <Link href="/login" className="link-subtle font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

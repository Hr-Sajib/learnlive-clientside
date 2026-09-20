'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { loginSchema, type LoginValues } from '@/lib/validation';
import { useLoginMutation } from '@/store/api/authApi';
import { errorCode, errorMessage, fieldErrors } from '@/store/api/baseApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [rejection, setRejection] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setRejection(null);
    try {
      const user = await login(values).unwrap();
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next ?? (user.role === 'admin' ? '/admin' : '/dashboard'));
    } catch (err) {
      const code = errorCode(err);
      if (code === 'ACCOUNT_PENDING') {
        router.push('/pending');
        return;
      }
      if (code === 'ACCOUNT_REJECTED') {
        setRejection(errorMessage(err));
        return;
      }
      if (code === 'VALIDATION_ERROR') {
        for (const { field, message } of fieldErrors(err)) {
          setError(field as keyof LoginValues, { message });
        }
        return;
      }
      toast.error(errorMessage(err));
    }
  });

  return (
    <main className="glow-backdrop flex min-h-dvh items-center justify-center p-4">
      <div className="animate-rise-in w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white shadow-overlay">
            L
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text-subtle">Sign in to join your live classes.</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-7 shadow-overlay">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {rejection && (
              <div className="rounded-md border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-700">
                {rejection}
              </div>
            )}

            <Input
              label="Email or mobile number"
              autoComplete="username"
              error={errors.identifier?.message}
              {...register('identifier')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-subtle">
          New here?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Register with a batch code
          </Link>
        </p>
      </div>
    </main>
  );
}

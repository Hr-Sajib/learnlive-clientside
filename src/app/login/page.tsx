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
import { Card } from '@/components/ui/Card';
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
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card title="Sign in">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {rejection && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
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

            <Button type="submit" isLoading={isLoading} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            New here?{' '}
            <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
              Register with a batch code
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}

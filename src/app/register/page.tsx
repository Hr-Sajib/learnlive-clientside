'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { useRegisterMutation } from '@/store/api/authApi';
import { errorCode, errorMessage } from '@/store/api/baseApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values).unwrap();
      router.replace(`/pending?batchCode=${encodeURIComponent(values.batchCode)}`);
    } catch (err) {
      const code = errorCode(err);
      if (code === 'UNKNOWN_BATCH_CODE') {
        setError('batchCode', { message: errorMessage(err) });
        return;
      }
      if (code === 'DUPLICATE_USER') {
        const field = (err as { data?: { details?: { field?: string } } }).data?.details?.field;
        if (field === 'email' || field === 'phone') {
          setError(field, { message: errorMessage(err) });
        } else {
          toast.error(errorMessage(err));
        }
        return;
      }
      toast.error(errorMessage(err));
    }
  });

  return (
    <main className="glow-backdrop flex min-h-dvh items-center justify-center p-4">
      <div className="animate-rise-in w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white shadow-overlay">
            L
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Create your account</h1>
          <p className="mt-1 max-w-xs text-sm text-text-subtle">
            Register with the batch code your coach gave you. An admin will verify your account
            before you can sign in.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-7 shadow-overlay">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              label="Full name"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mobile number"
              type="tel"
              autoComplete="tel"
              hint="Bangladeshi format, e.g. 01712345678"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Batch code"
              placeholder="e.g. B12-FRONTEND"
              autoComplete="off"
              error={errors.batchCode?.message}
              {...register('batchCode')}
            />

            <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
              Register
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-subtle">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { useLogoutMutation, useMeQuery } from '@/store/api/authApi';
import { Button } from '@/components/ui/Button';

export default function PendingPage() {
  const router = useRouter();
  const { data, refetch, isFetching } = useMeQuery();
  const [logout] = useLogoutMutation();
  const [batchCode, setBatchCode] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('batchCode');
    if (code) setBatchCode(code);
  }, []);

  const effectiveBatchCode = data?.batch?.code ?? batchCode;

  const onCheckAgain = async () => {
    setChecking(true);
    try {
      const result = await refetch();
      if (result.data) {
        router.replace(result.data.role === 'admin' ? '/admin' : '/dashboard');
      }
    } finally {
      setChecking(false);
    }
  };

  const onSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      // No session to clear — the user may not have signed in yet.
    }
    router.replace('/login');
  };

  return (
    <main className="glow-backdrop flex min-h-dvh items-center justify-center p-4">
      <div className="animate-rise-in w-full max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-50 text-warning-600 shadow-overlay">
            <Clock size={28} strokeWidth={2} />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-text">Awaiting approval</h1>

        <div className="mx-auto mt-3 max-w-sm space-y-2 text-sm text-text-subtle">
          <p>
            Your registration is in
            {effectiveBatchCode ? (
              <>
                {' '}
                for batch <span className="font-medium text-text">{effectiveBatchCode}</span>
              </>
            ) : null}
            . A batch admin will verify your account shortly.
          </p>
          <p>Once approved, you will be able to sign in and join your classes.</p>
        </div>

        <div className="mt-7 flex items-center justify-center gap-3">
          <Button onClick={onCheckAgain} isLoading={checking || isFetching} variant="secondary">
            Check again
          </Button>
          <Button onClick={onSignOut} variant="ghost">
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}

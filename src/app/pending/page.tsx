'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogoutMutation, useMeQuery } from '@/store/api/authApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card title="Awaiting approval">
          <div className="space-y-3 text-sm text-neutral-80">
            <p>
              Your registration is in
              {effectiveBatchCode ? (
                <>
                  {' '}
                  for batch <span className="font-medium text-neutral-100">{effectiveBatchCode}</span>
                </>
              ) : null}
              . A batch admin will verify your account shortly.
            </p>
            <p>Once approved, you will be able to sign in and join your classes.</p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={onCheckAgain} isLoading={checking || isFetching} variant="secondary">
              Check again
            </Button>
            <Button onClick={onSignOut} variant="ghost">
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

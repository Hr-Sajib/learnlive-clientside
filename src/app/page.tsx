'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

/**
 * The entry point routes people to wherever they belong, so nobody has to know
 * the difference between /dashboard and /admin.
 *
 * TODO(agent): replace this with a real landing page for signed-out visitors —
 * what LearnLive is, and the two buttons. Keep the redirect for signed-in users.
 */
export default function HomePage() {
  const { user, isLoading, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isPending) router.replace('/pending');
    else if (user) router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    else router.replace('/login');
  }, [isLoading, isPending, router, user]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import type { UserRole } from '@/lib/types';

/**
 * Client-side route protection.
 *
 * There is deliberately no `middleware.ts` doing this. The auth cookie is set
 * by the API on its own domain, so in production — client on Vercel, API on
 * Render — Next.js middleware running on the client's domain cannot see it at
 * all, and any check it made would be meaningless. It happens to work on
 * localhost because cookies ignore ports, which makes it a trap: it would pass
 * locally and fail on deploy.
 *
 * Nothing is lost by guarding here instead. The real enforcement has always
 * been on the server, which re-reads the user's role and status on every
 * request. This only decides what to render.
 */
export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  /** Omit to allow any signed-in user. */
  role?: UserRole;
}) {
  const { user, isLoading, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (isPending) {
      router.replace('/pending');
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (role && user.role !== role) {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isLoading, isPending, pathname, role, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  // Redirects fire from the effect above; render nothing in the interim rather
  // than flashing a page the user is not allowed to see.
  if (!user || (role && user.role !== role)) return null;

  return <>{children}</>;
}

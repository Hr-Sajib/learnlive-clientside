'use client';

import { useMeQuery } from '@/store/api/authApi';
import { errorCode } from '@/store/api/baseApi';
import type { CurrentUser } from '@/lib/types';

export interface Session {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  /** True when the account exists but an admin has not approved it yet. */
  isPending: boolean;
  batchId: string | null;
}

/**
 * The single source of truth for who is signed in.
 *
 * Auth state is not mirrored into a Redux slice on purpose. The access token
 * lives in an httpOnly cookie that JavaScript cannot read, so the only honest
 * way to know whether a session is valid is to ask the server — and RTK Query
 * already caches, dedupes and revalidates that answer. A parallel `authSlice`
 * would just be a second copy that goes stale the moment an admin suspends
 * someone.
 */
export function useSession(): Session {
  const { data, isLoading, error } = useMeQuery();

  const code = error ? errorCode(error) : null;
  const user = data ?? null;

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isPending: code === 'ACCOUNT_PENDING',
    batchId: user?.batch?.id ?? null,
  };
}

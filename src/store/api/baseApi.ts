import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { ApiError, ApiMeta } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  // The access token is an httpOnly cookie, so it never touches JavaScript and
  // cannot be read by an injected script. It only travels if we ask for it.
  credentials: 'include',
});

/**
 * Serialises refresh attempts.
 *
 * A dashboard mounts several queries at once. If the access token has expired,
 * every one of them 401s at the same instant, and without this they would all
 * fire `POST /auth/refresh` in parallel. Refresh tokens rotate — the first call
 * invalidates the token the others are still holding, so all but one would fail
 * and log the user out mid-session. Instead the first caller refreshes and the
 * rest wait on the same promise.
 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Cleared on the next tick so callers awaiting this promise still read it.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

/** Paths where a 401 is the expected answer, not a signal to refresh. */
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

/**
 * `/auth/me` still attempts the refresh above — a visitor with a genuinely
 * stale-but-recoverable session should recover silently wherever they are.
 * But it must never force-navigate on failure. It is the identity probe used
 * by pages like `/pending`, which are deliberately NOT wrapped in
 * `<RequireAuth>` and are built to render correctly for an anonymous visitor
 * — a fresh registrant has no session yet, and that is an expected state for
 * that page, not a reason to yank them to `/login`. Protected pages already
 * own their own redirect through `<RequireAuth>`'s router-based navigation,
 * which is also gentler than the full-page reload below.
 */
const NO_REDIRECT_ON_FAILED_REFRESH = ['/auth/me'];

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  const shouldTryRefresh = result.error?.status === 401 && !NO_REFRESH.some((p) => url.startsWith(p));

  if (shouldTryRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login') &&
      !NO_REDIRECT_ON_FAILED_REFRESH.some((p) => url.startsWith(p))
    ) {
      // The session is genuinely gone. Send them to sign in rather than leaving
      // the page in a half-loaded state that keeps retrying.
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  return result;
};

/**
 * Unwraps the server envelope.
 *
 * Every endpoint answers `{ success, message?, meta?, data }`. Components want
 * `data`, so it is unwrapped once here instead of in forty `transformResponse`
 * callbacks. Endpoints that need `meta` use `unwrapWithMeta` below.
 */
export function unwrap<T>(response: { data: T }): T {
  return response.data;
}

/** For paginated lists: keeps `meta` beside the rows. */
export function unwrapWithMeta<T>(response: { data: T[]; meta?: ApiMeta }): {
  rows: T[];
  meta: ApiMeta;
} {
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit: response.data.length, total: response.data.length, totalPages: 1 },
  };
}

/** Pulls a readable message out of whatever RTK Query handed back. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const body = (error as { data?: Partial<ApiError> }).data;
    if (body?.message) return body.message;
  }
  return fallback;
}

/** Field-level validation errors, ready to feed into react-hook-form's `setError`. */
export function fieldErrors(error: unknown): Array<{ field: string; message: string }> {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const body = (error as { data?: Partial<ApiError> }).data;
    if (body?.code === 'VALIDATION_ERROR' && Array.isArray(body.details)) return body.details;
  }
  return [];
}

/** The stable `code` from the error body, for branching on a specific failure. */
export function errorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    return (error as { data?: Partial<ApiError> }).data?.code ?? null;
  }
  return null;
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Batch', 'Class', 'Attendance', 'LiveAttendance', 'Admin'],
  // Injected by the feature files in this folder, so adding an endpoint never
  // means editing this one.
  endpoints: () => ({}),
});

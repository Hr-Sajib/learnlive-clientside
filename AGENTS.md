# AGENTS.md — LearnLive client

Read this file completely before writing any code in this repository.

## What this project is

The Next.js front end for LearnLive — live coaching classes for batches of
students, with attendance taken automatically from time spent in the class.

Two audiences share one app:

- **Students** register with a batch code, wait for an admin to verify them,
  then join live classes and watch their own attendance.
- **Admins** verify registrations, run batches, start and end classes, and read
  attendance analytics.

The API lives in the sibling repo `learnlive-serverside`. Its
[`docs/API_SPEC.md`](../learnlive-serverside/docs/API_SPEC.md) is the contract —
when in doubt about a response shape, read that, not your memory.

## Your job in this repo

Every API binding, the store, the auth guard, and the live classroom are
already written. Your job is the **UI**: the pages under `src/app/` that say
`TODO(agent)`, and the shared components they need.

**Work through `docs/TASKS.md` in order.** Every page stub carries its own
contract in a docblock at the top — which hook to call, what to render, which
error codes to branch on.

## Hard rules

1. **Never call `fetch` directly.** Every request goes through an RTK Query
   hook from `src/store/api/`. If an endpoint you need is missing, add it to the
   right slice in that folder — do not bypass it.

2. **Never change `src/components/LiveRoom.tsx`** without reading its header
   comment first. It handles the LiveKit connection and the heartbeat, and the
   heartbeat's semantics (display only, never attendance) are load-bearing.

3. **Never store the auth token.** It is an httpOnly cookie. Read the session
   with `useSession()` from `@/hooks/useSession`, never from `localStorage`.

4. **Guard every protected page** by wrapping it in `<RequireAuth role="student">`
   or `<RequireAuth role="admin">`. There is no middleware doing this, on
   purpose — see the comment in `RequireAuth.tsx`.

5. **Handle errors by `code`, never by message text.** Use `errorCode(err)`,
   `errorMessage(err)` and `fieldErrors(err)` from `@/store/api/baseApi`.
   Validation failures belong on the offending field, not in a toast.

6. **Let cache invalidation do the refetching.** The mutations already declare
   their `invalidatesTags`. Do not call `refetch()` after a mutation.

7. **`npx tsc --noEmit` and `npx next build` must both pass** before you call a
   task done.

## Conventions

- Path alias `@/*` → `src/*`.
- Every page that uses a hook needs `'use client'` at the top.
- Tailwind v4. Colours come from the tokens in `globals.css` — use
  `brand-*` and the slate scale, do not introduce a new palette per page.
- Dates and durations go through `@/lib/format`. Never hand-roll
  `new Date().toLocaleString()`; `formatClassTime`, `formatDuration`,
  `attendanceTone` and `classStatusTone` exist so the whole app reads the same.
- Forms use `react-hook-form` + the zod schemas in `@/lib/validation`.
- Toasts via `react-hot-toast`. Success messages come from the server's
  `message` field where there is one — it is written for the user.

## Where things are

| Path | What it holds |
|---|---|
| `src/store/api/baseApi.ts` | Envelope unwrapping, 401-refresh-retry, error helpers. |
| `src/store/api/*Api.ts` | Every endpoint, already typed. Your hooks live here. |
| `src/lib/types.ts` | Mirrors the API's shapes. |
| `src/lib/format.ts` | Dates, durations, status colours. |
| `src/lib/validation.ts` | Form schemas mirroring the server's. |
| `src/hooks/useSession.ts` | Who is signed in. |
| `src/components/RequireAuth.tsx` | Route guard. |
| `src/components/LiveRoom.tsx` | **The classroom.** Read before touching. |
| `docs/TASKS.md` | **Your work queue.** |
| `docs/UI_SPEC.md` | Layout, navigation and the shared components to build. |

## Running it

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL
npm install
npm run dev                    # http://localhost:3000
npm run typecheck
npm run build
```

The API must be running on port 5000 (or wherever `NEXT_PUBLIC_API_URL` points)
or every page will sit in a loading state.

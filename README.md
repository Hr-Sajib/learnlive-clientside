# LearnLive — client

Next.js 15 (App Router) + React 19 + Redux Toolkit Query + Tailwind v4 +
LiveKit. The front end for live coaching classes with automatic attendance.

## Quick start

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm install
npm run dev                    # http://localhost:3000
```

`npm run typecheck` · `npm run build`

The API (`learnlive-serverside`) must be running, and its `CORS_ORIGINS` must
include `http://localhost:3000`.

## How it hangs together

- **Auth** is an httpOnly cookie set by the API. JavaScript never sees the
  token. `useSession()` asks the server who is signed in; `<RequireAuth>` guards
  the page. There is no `middleware.ts` — see the comment in `RequireAuth.tsx`
  for why it would not work cross-domain.
- **Data** goes through RTK Query. `baseApi` unwraps the server's
  `{ success, data }` envelope and retries once through `/auth/refresh` on a
  401, serialising concurrent refreshes so rotation does not log anyone out.
- **The classroom** is `LiveRoom.tsx`: it asks the API for a LiveKit token,
  connects, runs the display-only heartbeat, and shows the student a local
  estimate of their attendance. The real figure is computed server-side.

## Documentation

| Doc | Read it when |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Before writing any code here. |
| [`docs/TASKS.md`](./docs/TASKS.md) | The remaining work queue. |
| [`docs/UI_SPEC.md`](./docs/UI_SPEC.md) | Building a screen. |
| [`../learnlive-serverside/docs/API_SPEC.md`](../learnlive-serverside/docs/API_SPEC.md) | Any question about a response shape. |

## Deployment

Vercel. Set `NEXT_PUBLIC_API_URL` to the deployed API's `/api/v1` URL, and add
the Vercel origin to the API's `CORS_ORIGINS`.

Both sides must be HTTPS in production: the auth cookie is sent as
`SameSite=None; Secure`, which browsers reject over plain HTTP.

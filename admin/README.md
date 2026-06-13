# Sentinel Admin Dashboard

Internal, password-protected dashboard for monitoring real usage of the Sentinel app (signups, SOS alerts, contact invites, push delivery, tracking link views). This is a separate Next.js app and is **not linked from the main client** — deploy it to its own private URL.

## Setup

1. Copy `.env.example` to `.env.local` and fill in:
   - `ADMIN_DASHBOARD_PASSWORD` — password to log in.
   - `SESSION_SECRET` — random string used to sign the session cookie.
   - `BACKEND_API_URL` — URL of the Sentinel server (e.g. the Render deployment).
   - `ADMIN_API_KEY` — must match `ADMIN_API_KEY` set on the server.

2. On the server, set `ADMIN_API_KEY` to the same value (in `server/.env` and on Render).

## Run locally

```
pnpm install
pnpm dev
```

Runs on http://localhost:3100 by default.

## Deploy

Deploy as its own Vercel project (or any Next.js host), pointing at the `admin/` directory, with the env vars above set. Use a private/unguessable URL and do not link to it from the public client app.

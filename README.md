# Sentinel — The Lifeline Network

A mobile-first emergency response PWA. One tap. Immediate help.

## Project Structure

```
sentinel-mvp/
├── client/          # Next.js 14 App Router (PWA)
├── server/          # Express.js API
└── database/        # Supabase schema SQL
```

## Quick Start

### 1. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `database/schema.sql` in the Supabase SQL Editor
3. Copy your project URL and keys

### 2. Backend

```bash
cd server
cp .env.example .env
# Fill in .env with your Supabase credentials
npm install
npm run dev       # starts on port 4000
```

### 3. Frontend

```bash
cd client
cp .env.example .env.local
# Fill in .env.local with your Supabase credentials
npm install
npm run dev       # starts on port 3000
```

### 4. Running Tests

```bash
# Backend
cd server && npm test

# Frontend
cd client && npm test
```

## Environment Variables

### Server (`server/.env`)
| Variable | Description |
|---|---|
| `PORT` | API server port (default: 4000) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (never expose publicly) |
| `FRONTEND_URL` | Frontend origin for CORS |
| `JWT_SECRET` | Secret for additional JWT operations |

### Client (`client/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Pages

| Route | Description |
|---|---|
| `/` | SOS Home — main screen |
| `/active-alert` | Active emergency status & controls |
| `/contacts` | Emergency contacts management |
| `/history` | Past alert history |
| `/profile` | User profile & security PIN |
| `/track/[token]` | Public live tracking page |
| `/offline` | Offline fallback page |

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/profile` | Create/update user profile |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Add contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| POST | `/api/sos/trigger` | Trigger SOS (rate limited: 5/min) |
| GET | `/api/sos/active` | Get active alert |
| PUT | `/api/sos/:id/location` | Update location |
| POST | `/api/sos/:id/mark-safe` | Mark safe (PIN verified) |
| POST | `/api/sos/:id/stop` | Stop alert (PIN verified) |
| GET | `/api/sos/history` | Alert history |
| GET | `/api/tracking/:token` | Public tracking data |

## Future Extensions

- Push notifications (Web Push API)
- Hardware SOS device integration
- Offline emergency infrastructure
- School / estate / NYSC dashboard

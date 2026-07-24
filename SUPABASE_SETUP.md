# FTC — Supabase Backend Setup Guide

Complete guide to deploying the Find To Connect backend.
Designed for 100,000+ users with minimal future schema changes.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| Supabase CLI | ≥ 1.130 | `brew install supabase/tap/supabase` |
| Docker | ≥ 24 | https://docker.com (for local dev) |

---

## 1 · Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose region closest to India: **Singapore (ap-southeast-1)**
3. Copy **Project URL** and **anon key** from Settings → API

---

## 2 · Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
VITE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
```

---

## 3 · Run Migrations

### Option A: Supabase CLI (recommended)

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push

# Optional: seed dev data
supabase db seed
```

### Option B: Supabase Dashboard SQL editor

Run each migration file in order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_indexes.sql`
3. `supabase/migrations/003_rls.sql`
4. `supabase/migrations/004_functions.sql`
5. `supabase/migrations/005_storage.sql`

---

## 4 · Configure Authentication

### Phone / OTP (required)

1. Supabase Dashboard → Authentication → Providers → Phone
2. Enable SMS provider (Twilio recommended)
3. Add Twilio credentials: Account SID, Auth Token, From number
4. Test: send OTP to `+919876543210`

### Google OAuth (recommended)

1. [Google Cloud Console](https://console.cloud.google.com) → Create OAuth 2.0 Client
2. Authorised redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google
4. Paste Client ID and Secret
5. Add your domain to Authorised JS origins

### Auth settings (Dashboard → Authentication → URL Configuration)

```
Site URL:              https://your-production-domain.com
Redirect URLs:         https://your-production-domain.com/auth/callback
                       http://localhost:5173/auth/callback
```

---

## 5 · Deploy Edge Functions

```bash
# Set secrets (never put these in .env)
supabase secrets set RAZORPAY_KEY_ID=rzp_live_...
supabase secrets set RAZORPAY_KEY_SECRET=...
supabase secrets set FCM_SERVER_KEY=...

# Deploy all functions
supabase functions deploy process-payment
supabase functions deploy send-notification
supabase functions deploy trust-score
```

---

## 6 · Configure Storage

Storage buckets are created by migration 005. Verify in Dashboard → Storage:

| Bucket | Public | Max size | Allowed types |
|--------|--------|----------|---------------|
| `avatars` | ✅ | 2 MB | JPEG, PNG, WebP |
| `portfolio` | ✅ | 10 MB | JPEG, PNG, WebP, MP4 |
| `campaigns` | ✅ | 10 MB | JPEG, PNG, WebP |
| `id-docs` | ❌ | 5 MB | JPEG, PNG, PDF |
| `signatures` | ❌ | 1 MB | PNG |

---

## 7 · Generate TypeScript Types (optional but recommended)

After each schema change, regenerate types:

```bash
supabase gen types typescript --project-id your-project-ref \
  > src/lib/database.types.ts
```

---

## 8 · Local Development

```bash
# Start Supabase locally (requires Docker)
supabase start

# Apply migrations + seed
supabase db reset

# View local studio
open http://localhost:54323

# Start the app
npm run dev
```

---

## 9 · Database Architecture

### Entity Relationship Overview

```
auth.users (Supabase managed)
    │
    ├── users (1:1)  ◄── base profile for all users
    │       ├── creator_profiles (1:0..1)
    │       │       ├── services (1:N)
    │       │       └── availability_slots (1:N)
    │       └── consumer_profiles (1:0..1)
    │
    ├── bookings (consumer_id + creator_id)
    │       ├── payments (1:N)
    │       ├── reviews (1:0..2)
    │       └── transactions (1:N)
    │
    ├── favorites (consumer → creator)
    ├── notifications (1:N per user)
    ├── chat_threads (2 participants)
    │       ├── chat_messages (1:N)
    │       └── quotes (1:N)
    │
    └── campaigns (poster_id)
            └── deals (brand + creator)
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Partitioned `notifications` by year | Keeps the table small; old rows archived automatically |
| Denormalised `avg_rating` / `completed_jobs` on `creator_profiles` | Avoids aggregate queries on every creator card render |
| `creator_stats` materialised view | Fast read for discovery feed; refreshed by trigger |
| `search_creators` SQL function | Combines full-text, filters, and ranking in one DB call |
| `booking_ref` sequence (`FTCxxxx`) | Human-readable ID for support and receipts |
| Trust score via DB function | Consistent calculation, called from Edge Function post-event |

---

## 10 · Row Level Security Summary

| Table | Read | Write |
|-------|------|-------|
| `users` | Own row only (+ public creator names) | Own row only |
| `creator_profiles` | All published profiles | Own profile only |
| `services` | Active services of published creators | Own services only |
| `bookings` | Both parties only | Consumer creates; both can update |
| `reviews` | Public reviews by all; private to parties | Reviewer only (post-booking) |
| `payments` | Both booking parties | Edge Functions only (service_role) |
| `transactions` | Own transactions | Append-only via Edge Functions |
| `notifications` | Own only | Own only |
| `favorites` | Own only | Own only |
| `campaigns` | All active | Poster only |
| `deals` | Both parties | Creator creates; both update |

---

## 11 · IDE Setup for Edge Functions

Edge Functions in `supabase/functions/` are **Deno** files, not Node.js.
The VS Code TypeScript server will show errors for `Deno`, `https://` imports, etc.

To fix, install the [Deno VS Code extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno):

```bash
code --install-extension denoland.vscode-deno
```

Then add to `.vscode/settings.json`:

```json
{
  "deno.enablePaths": ["supabase/functions"],
  "deno.lint": true
}
```

The errors in the Node.js project are harmless — the functions compile correctly in Supabase's edge runtime.

---

## 12 · Production Checklist

- [ ] Confirm email confirmations enabled (Auth settings)
- [ ] Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in hosting env (Vercel/Netlify)
- [ ] Deploy Edge Functions with production secrets
- [ ] Enable Supabase Realtime for: `bookings`, `notifications`, `chat_messages`
- [ ] Set up `pg_cron` for: auto-release escrow after 7d, weekly trust score refresh
- [ ] Configure `pg_net` for webhook callbacks from Razorpay (if not using Edge Function)
- [ ] Add rate limiting on OTP endpoint (Supabase dashboard → Auth → Rate limits)
- [ ] Review and tighten RLS policies before going live
- [ ] Enable database backups (Settings → Database → Backups)
- [ ] Set up Sentry or equivalent for Edge Function error tracking

---

## 13 · Scaling Notes

The schema is designed to handle 100k users with:

- **Indexes**: Composite indexes on all common query patterns (discovery, bookings, notifications)
- **Partitioning**: `notifications` table partitioned by year
- **Materialised view**: `creator_stats` for the discovery feed (O(1) reads)
- **Denormalisation**: `avg_rating`, `review_count`, `completed_jobs` stored on `creator_profiles`
- **Connection pooling**: Use Supabase's built-in Supavisor (pgbouncer) for serverless environments
- **Realtime limits**: Supabase free tier = 200 concurrent connections; upgrade before launch

For 500k+ users, consider:
- Read replicas for the discovery feed
- Partitioning `bookings` and `transactions` by month
- Redis cache for creator search results (via Upstash)

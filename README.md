# FTC (Find To Connect)

> A platform connecting people with trusted creative professionals.

## Overview

FTC (Find To Connect) simplifies how people discover, connect with, and work with creative professionals.

The platform provides a seamless experience for consumers looking to hire creators, while giving creators the tools they need to manage their business, build trust, receive payments, and grow their professional presence. As the platform evolves, it will also support collaborations between creators and brands.

FTC is designed with scalability, maintainability, and developer experience as first-class priorities. The project follows modern engineering practices, emphasizing clean architecture, automated testing, continuous integration, and a collaborative development workflow.

Concretely, it's a mobile-first web app: consumers discover, book, and pay local creative professionals (photographers, makeup artists, videographers, etc.), while creators manage bookings, quotes, payouts, and brand sponsorships — all in one app. The UI is built as a simulated phone screen with bottom-tab navigation, backed by Supabase (Postgres + Auth + Storage + Edge Functions).

## Project Goals

* Build a reliable marketplace for creative professionals and consumers.
* Deliver a secure and transparent booking and payment experience.
* Empower creators with business management and growth tools.
* Enable meaningful collaborations between creators and brands.
* Develop a platform that can evolve through continuous iteration and community contributions.

## Repository Status

🏗️ **Active Development**

The project foundation (architecture, engineering workflows, documentation) is in place, and the initial application codebase — frontend (React/Vite) and backend (Supabase schema, RLS, Edge Functions) — has landed. Expect the project structure and documentation to continue evolving as features are built out.

## Development Workflow

This repository follows a pull request–based development workflow.

```text
feature/* → dev → qa → main
```

All changes are developed in feature branches, reviewed through pull requests, validated by automated checks, and promoted through the development lifecycle before reaching the production branch.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS, Framer Motion (animations) |
| State | Zustand (single global store, reducer-style `dispatch`) |
| Data fetching | `@tanstack/react-query` + hand-written Supabase API wrappers |
| Icons | lucide-react |
| Backend | Supabase (Postgres 15, Auth, Storage, Realtime, Edge Functions) |
| Edge Functions | Deno (`process-payment`, `trust-score`, `send-notification`) |
| Payments | Razorpay (via Edge Function, escrow model) |

---

## Project Structure

```
src/
  App.tsx              # Screen router (switch over `screen` in the Zustand store)
  main.tsx             # React entry point
  store/appStore.ts     # Global state + reducer (navigation, bookings, filters, onboarding…)
  types/index.ts        # All shared TypeScript types (Screen, Creator, Booking, Deal, etc.)
  screens/              # One file per feature area (Auth, Booking, Chat, Sponsorship, Settings…)
  components/
    AuthProvider.tsx     # Syncs Supabase auth session -> Zustand store
    ui/                  # Shared UI primitives (BottomNav, etc.)
    creator/             # Creator-specific components
  hooks/                 # useAuth, useBookings, useCreators, useServices
  lib/
    supabase.ts           # Supabase client + "demo mode" detection
    database.types.ts     # Generated Postgres types
    api/                  # Thin query/mutation wrappers per domain (auth, bookings, payments…)
  data/                  # Seed/demo data used when Supabase env vars are absent

supabase/
  migrations/            # 001_schema, 002_indexes, 003_rls, 004_functions, 005_storage
  functions/             # Deno Edge Functions: process-payment, trust-score, send-notification
  seed.sql               # Dev seed data
  config.toml            # Supabase CLI config
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run in demo mode (no backend needed)

The app detects missing Supabase env vars and runs fully offline using seed data from `src/data/`.

```bash
npm run dev
```

Open the printed local URL — auth, bookings, etc. use static demo data.

### 3. Connect to a real Supabase backend (optional)

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Full backend setup (migrations, auth providers, storage buckets, Edge Functions, RLS) is documented in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push local Supabase migrations to the linked project |
| `npm run db:reset` | Reset local Supabase DB + reseed |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the live schema |

---

## Architecture Notes

- **No router library is used for screens.** `App.tsx` renders a component based on `screen` in the Zustand store; navigation is done via `dispatch({ type: 'GO', screen: ... })` and similar actions defined in `src/types/index.ts` (`AppAction`).
- **Demo mode vs connected mode**: `src/lib/supabase.ts` exports `supabaseAvailable`. Components (e.g. `AuthProvider`) short-circuit when it's `false`, so the app is always runnable without any backend configured.
- **Payments use an escrow model**: advance payment is captured and held in `escrow` status, then released to the creator on job completion via the `process-payment` Edge Function (`release_escrow` action) or `pg_cron` auto-release.
- **Trust score** is calculated server-side (`recalculate_trust_score` DB function) and triggered via the `trust-score` Edge Function after reviews, completions, or ID verification.

---

## Backend Setup

See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for the complete guide: creating a Supabase project, running migrations, configuring Phone/OTP + Google auth, deploying Edge Functions, storage buckets, RLS policies, and production checklist.

---

## Documentation

Project documentation is maintained alongside the codebase and will expand as the project grows.

* [`PRODUCT.md`](./PRODUCT.md) — product vision, personas, core flows, and feature scope.
* [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) — backend setup and deployment.
* System architecture, development guidelines, and API references — planned.

## Contributing

Contribution guidelines, coding standards, and development practices are documented in `CONTRIBUTING.md`.

All contributors are expected to follow the established development workflow (`feature/* → dev → qa → main`) and code review process.

## License

This project is currently private and proprietary.

Unless explicitly stated otherwise, all rights are reserved.

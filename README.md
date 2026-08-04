# FTC — Creator & Brand Marketplace

A modern platform connecting content creators with brands and consumers for bookings, sponsorships, and collaborations.

🌐 **Live Demo**: [https://ftc-app-nine.vercel.app](https://ftc-app-nine.vercel.app/)

---

## ✨ Features

- **Creator Discovery & Directory**: Browse creators filtered by discipline, pricing, location, and rating.
- **Creator Profiles & Portfolios**: View creator stats, services, portfolios, and client reviews.
- **Service Bookings**: Book creators directly for studio or on-location work with transparent pricing.
- **Sponsorship & Campaign Pipeline**: Brands can publish campaigns and manage creator applications through a deal pipeline.
- **Demo Mode Built-in**: Full interactive UI running on mock seed data when backend env vars are not set.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **State & Data**: Zustand, TanStack React Query
- **Backend & Auth**: Supabase (PostgreSQL, Row-Level Security, Edge Functions)

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

# FTC — Creator & Brand Marketplace

A modern, high-performance platform connecting content creators with brands and clients for bookings, sponsorships, collaborations, and real-time scheduling.

**Live Website**: [https://findtoconnect.com](https://findtoconnect.com)

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Zustand, TanStack React Query
- **Backend API**: Rust (Axum web framework, Tokio async runtime, SQLx, Serde, Tower-HTTP)
- **Database & Auth**: PostgreSQL managed via Supabase migrations, Row-Level Security (RLS), and Supabase Auth

---

## Getting Started

### Prerequisites

Ensure you have the following installed locally:
- **Node.js**: v20.0.0 or higher (`node -v`)
- **npm**: v10.0.0 or higher
- **Rust Toolchain**: 1.80+ (`rustc --version` and `cargo --version`)
- **PostgreSQL Database**: Either a local PostgreSQL instance or a hosted [Supabase](https://supabase.com) project.

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/ftc.git
cd ftc
npm install
```

---

### 2. Environment Configuration

You will need to configure environment files for both the **Frontend** and the **Backend**.

#### A. Frontend Configuration
Copy the template in the root directory:
```bash
cp .env.example .env
```
Fill in your configuration:
```env
# Supabase credentials (from Supabase Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Endpoint (points to local Rust Axum server)
VITE_API_URL=http://localhost:3000/api

VITE_APP_URL=http://localhost:5173
VITE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
```

#### B. Backend Configuration
Copy the template in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```
Fill in your database and server credentials:
```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase API credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Server options
PORT=3000
RUST_LOG=backend=info,tower_http=info
```

---

### 3. Database Migrations

Apply the migration scripts located in `supabase/migrations/` to your PostgreSQL database. If using the Supabase CLI:

```bash
npm run db:push
```

Or execute the SQL files (from `001_initial_schema.sql` through `007_calendar_availability.sql`) directly via the Supabase SQL Editor.

---

### 4. Running the Development Environment

Start both the backend API server and the frontend client concurrently:

#### Terminal 1: Backend API (Rust Axum)
```bash
npm run backend:dev
# Alternatively: cd backend && cargo run
```
*The backend server will start on `http://localhost:3000`.*

#### Terminal 2: Frontend Client (Vite + React)
```bash
npm run dev
```
*The frontend client will start on `http://localhost:5173`.*

---

## Testing & Quality Assurance

### Backend Tests
Run the Rust backend unit and integration test suite:
```bash
npm run backend:test
# Or: cd backend && cargo test
```

### Frontend Typecheck & Lint
```bash
npm run typecheck
npm run lint
```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port 5173 |
| `npm run backend:dev` | Runs the Rust Axum backend on port 3000 |
| `npm run backend:test` | Runs the Rust test suite (`cargo test`) |
| `npm run build` | Builds the production bundle for the frontend |
| `npm run typecheck` | Validates TypeScript types across the frontend |
| `npm run lint` | Lints the codebase with ESLint |
| `npm run db:push` | Pushes Supabase migrations to remote database |
| `npm run db:types` | Regenerates TypeScript database types from Supabase |

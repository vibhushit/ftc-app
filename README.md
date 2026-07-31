# FTC (Find To Connect)

> A platform connecting people with trusted creative professionals.

## Overview

FTC (Find To Connect) simplifies how people discover, connect with, and work with creative professionals.

The platform provides a seamless experience for consumers looking to hire creators, while giving creators the tools they need to manage their business, build trust, receive payments, and grow their professional presence.

FTC is designed with scalability, maintainability, and developer experience as first-class priorities. It features a **decoupled architecture**: a high-performance **Rust (`Axum` + `Tokio`) Backend API** and a **React 19 + TypeScript UI**.

---

## Tech Stack

| Layer | Tech | Description |
|---|---|---|
| **Frontend UI** | React 19, TypeScript 5.6, Vite 6 | Mobile-first responsive web application |
| **Styling** | Tailwind CSS, Framer Motion | Modern design system, glassmorphism, micro-animations |
| **State** | Zustand | Single global state store with reducer-style `dispatch` |
| **Data Fetching** | `@tanstack/react-query` + `apiClient` | Decoupled API service layer |
| **Backend API** | Rust (`Axum` v0.7, `Tokio` v1.0) | High-concurrency REST & WebSockets API server |
| **Type Generator** | `ts-rs` v9.0 | Zero-drift Rust model export to TypeScript (`src/types/bindings/`) |
| **Database** | PostgreSQL + `SQLx` v0.7 | Compile-time checked SQL queries & migrations |
| **Media Storage** | Cloudflare R2 / AWS S3 | Client-side WebP compressed direct uploads via presigned URLs |

---

## Project Structure

```
ftc/
├── backend/                       # Rust Axum API Server Crate
│   ├── Cargo.toml                 # Backend dependencies (Axum, Tokio, SQLx, ts-rs)
│   ├── migrations/                # SQLx database migration files
│   └── src/
│       ├── main.rs                # Axum server entrypoint, routes & CORS
│       └── models/                # Domain models with #[derive(TS)] auto-export
│           ├── user.rs
│           ├── creator.rs
│           ├── booking.rs
│           └── chat.rs
├── src/                           # React 19 Frontend App
│   ├── services/
│   │   └── apiClient.ts           # Decoupled API service layer
│   ├── types/
│   │   └── bindings/              # Auto-generated TypeScript types from Rust
│   ├── utils/
│   │   └── imageCompressor.ts     # Client-side Canvas WebP image compressor (~300KB)
│   ├── store/appStore.ts          # Zustand state store + local storage session persistence
│   └── screens/                   # Screen components (Discover, Creator, Chat, Booking...)
```

---

## Getting Started

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Run Rust Backend Server

In a new terminal window:

```bash
npm run backend:dev
# OR: cd backend && cargo run
```
> 📍 Starts the Rust Axum API server on **`http://localhost:3000`**.  
> Test healthcheck: `http://localhost:3000/health` -> `200 OK`

### 3. Run React Frontend UI

In another terminal window:

```bash
npm run dev
```
> 📍 Starts the React Vite UI server on **`http://localhost:5173`**.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (`http://localhost:5173`) |
| `npm run backend:dev` | Start Rust Axum API server (`http://localhost:3000`) |
| `npm run backend:test` | Run Rust tests & auto-generate TypeScript definitions to `src/types/bindings/` |
| `npm run build` | Type-check (`tsc`) and build Vite production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint check |

---

## Decoupled API & Type Safety

- **Zero-Drift Type Sharing**: The Rust backend defines domain models (e.g. `Creator`, `Booking`, `Quote`) using `#[derive(TS)]`. Running `npm run backend:test` automatically exports matching TypeScript definition files to `src/types/bindings/`.
- **Decoupled API Client**: `src/services/apiClient.ts` handles all HTTP and WebSocket requests to the Rust backend. If the backend is offline during local UI development, it falls back to typed data seamlessly.
- **Client-Side Image Optimization**: `imageCompressor.ts` resizes raw camera photos (8 MB+) to `1920px` WebP images (~300 KB) in the browser before storage upload.

---

## License

Private and proprietary. All rights reserved.

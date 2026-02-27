# MathWhiz Kids

## Overview

MathWhiz Kids is an AI-powered math learning application designed for elementary school children (Kindergarten through 5th grade). It generates story-based math problems tailored to each child's grade level, tracks practice sessions, and provides a parent dashboard for monitoring progress. The project has a **dual-platform architecture**: a web client (React + Vite + Tailwind) and a React Native/Expo mobile client, both sharing the same Express backend and PostgreSQL database.

Key features:
- AI-generated story-based math problems (addition, subtraction, multiplication, division, geometry)
- Topic-based structured curriculum with 18 topics spanning K-5
- Three difficulty levels (Easy/Difficult/Advanced) with credit multipliers (1x/2x/3x)
- Proficiency system: Beginner → Intermediate → Advanced → Master (based on credits)
- AI-powered lesson generation with examples and tips before exercises
- Grade-appropriate difficulty scaling (K–5) with progressive operation unlocking
- Geometry problems include: counting sides/corners, perimeter, area, shape identification
- Daily usage time limits set by parents (adjustable via sidebar)
- Optional voice/text-to-speech mode
- Parent left sidebar navigation (desktop: persistent, mobile: hamburger menu)
- Parent dashboard with session history and usage tracking
- Multi-child support per parent account
- Password reset with verification code flow
- Password visibility toggle (eye icon) on all password fields

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Dual Frontend Architecture

The project contains **two separate frontend codebases**:

1. **Web Client** (`client/` directory): A React SPA built with Vite, Tailwind CSS v4, and wouter for routing. Uses `@tanstack/react-query` for server state and `zustand` with `persist` middleware for client state. This is the primary frontend served by the Express backend.

2. **React Native / Expo Client** (root `App.tsx`, `src/` directory, `index.ts`): A mobile app using Expo SDK 54, React Navigation (stack + bottom tabs), expo-linear-gradient, expo-haptics, and expo-secure-store. Uses `zustand` stores in `src/stores/` with SecureStore persistence. The mobile client currently uses mock/local auth rather than hitting the API.

**Important**: The web client is the actively served frontend (via Vite dev server or static files in production). The React Native code exists alongside it but runs separately through Expo.

### Backend Architecture

- **Runtime**: Node.js with Express 5, using `tsx` for TypeScript execution in development
- **Entry point**: `server/index.ts` — sets up Express, registers API routes, and configures Vite middleware (dev) or static file serving (production)
- **Production build**: `server/prodServer.ts` — standalone production server bundled via esbuild (`build.js`)
- **API routes** (`server/routes.ts`): RESTful endpoints under `/api/` for auth, children CRUD, sessions, usage tracking, and AI problem generation
- **Storage layer** (`server/storage.ts`): Implements `IStorage` interface using Drizzle ORM queries. All database access goes through this abstraction.
- **AI integration** (`server/ai.ts`): Uses OpenAI API (via Replit AI Integrations proxy) to generate story-based math problems and text-to-speech audio

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon serverless PostgreSQL driver (`@neondatabase/serverless`) with WebSocket support
- **Schema** (`shared/schema.ts`): Four tables:
  - `parents` — user accounts with bcrypt-hashed passwords
  - `children` — child profiles linked to parents (grade, daily time limit, avatar color, voice mode toggle)
  - `sessions` — practice session records (operation type, score, questions, time spent)
  - `daily_usage` — daily minute tracking per child
- **Migrations**: Managed via `drizzle-kit` with config in `drizzle.config.ts`
- **Validation**: `drizzle-zod` generates Zod schemas from table definitions for insert validation
- **Environment**: Requires `DATABASE_URL` environment variable pointing to a PostgreSQL instance

### Authentication

- Simple email/password authentication with bcrypt hashing
- Password reset flow: two-step verification (request code → verify code + set new password)
- Reset tokens stored in-memory with 10-minute expiration
- No session tokens or JWT — the web client stores parent info in zustand persisted to localStorage
- The mobile client stores auth state in expo-secure-store
- No middleware-level auth guards on API routes currently

### Shared Code

- `shared/schema.ts` — Database schema and Zod validation schemas, imported by both server and web client via `@shared/*` path alias
- Types are shared between web client and server through this mechanism

### Build System

- **Development**: `tsx server/index.ts` runs the Express server with Vite middleware for HMR
- **Production**: Two-step build — Vite builds the client to `dist/public/`, esbuild bundles the server to `dist/index.cjs`
- **Vite config**: Proxies `/api` requests to Express server on port 5000 during development

### Replit Integration Files

The `.replit_integration_files/` directory contains pre-built utilities for AI features:
- **Chat**: Conversation storage and routes for AI chat
- **Audio**: Voice recording, playback, and streaming (AudioWorklet-based)
- **Image**: Image generation via OpenAI
- **Batch**: Rate-limited batch processing utilities
- These share a chat schema model (`conversations`, `messages` tables) that may need to be added to the main schema if used

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (Neon serverless recommended)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (via Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI API base URL (Replit proxy)

### Third-Party Services
- **PostgreSQL** (Neon): Primary database via `@neondatabase/serverless` driver with WebSocket transport
- **OpenAI API**: Used for generating story-based math problems and text-to-speech (TTS) audio
- **Expo**: Mobile app framework (SDK 54) for the React Native client

### Key Libraries
- **Server**: Express 5, Drizzle ORM, bcrypt, OpenAI SDK
- **Web Client**: React 19, Vite 7, Tailwind CSS v4, wouter, @tanstack/react-query, zustand
- **Mobile Client**: Expo 54, React Native 0.81, React Navigation 7, expo-haptics, expo-av, expo-linear-gradient, expo-secure-store
- **Shared**: Zod, drizzle-zod
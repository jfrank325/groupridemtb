## Groupride MTB — Project Overview

Groupride MTB is a community platform for discovering, hosting, and coordinating mountain bike rides. The stack is optimized for performant data fetching, location-aware experiences, and high deliverability notifications.

## Core Technologies & How We Use Them

| Technology | Role in the Project |
| --- | --- |
| **Next.js App Router** | Renders server-first UI for pages under `src/app`. Server Components handle data-loading; Client Components (`"use client"`) encapsulate interactive forms, map interactions, and session-dependent UI. |
| **React** | Functional components with hooks manage client state (e.g., login form state, ride modal interactions). Suspense + lazy loading reduce bundle size. |
| **TypeScript** | Strict typing across UI, server actions, and Prisma queries. Interfaces document props and domain objects (`Ride`, `UserNotificationPreferences`, etc.). |
| **Tailwind CSS** | Utility-first styling, responsive design, and accessibility affordances (focus states, status roles). |
| **Prisma ORM + PostgreSQL** | Schema-managed database with models for rides, trails, users, notifications, and password reset tokens. Prisma Client powers reads/writes in server actions and API routes. |
| **NextAuth.js** | Credentials-based authentication with secure session handling. Custom callbacks enrich the session with geocoded data. |
| **MapLibre GL JS** | Interactive map visualizations for rides/trails. Client components orchestrate hover states between map layers and lists. |
| **Mailgun** | Transactional email delivery for ride notifications, cancellations, message alerts, host joins, and password reset links. |
| **Zod** | Input validation for server actions and APIs (user registration, preferences updates). |
| **Rate Limiting (Upstash Ratelimit)** | Protects sensitive endpoints (login, password reset, ride join/leave). Shared helper `lib/rate-limit.ts` enforces limits and responds with standard headers. |

## Architecture Highlights

- **Server-first data flow:** Pages such as `/rides`, `/profile`, and `/reset-password` use server components to fetch Prisma data and present fully hydrated HTML. Client components are reserved for interactivity.
- **Domain-driven modules:** Email logic lives in `src/lib/emailTemplates.ts` and `src/lib/mailgun.ts`; notification pipelines live in dedicated modules such as `src/lib/localRideNotifications.ts`.
- **Reusable API patterns:** Route handlers under `src/app/api/**` handle JSON requests, leverage shared validation helpers, and return normalized payloads for client consumption.
- **Geospatial awareness:** User ZIP codes are geocoded via `fetchLatLngForZip`; the map highlights trails/locations based on hover interactions and user coordinates.

## Key Features

- **Ride discovery & management:** Create rides, link trails, join/leave rides, and view detail pages with map context.
- **Notification suite:** Users can opt into location-based ride alerts, cancellation notices, ride discussion updates, direct messages, and host join alerts. Emails respect preferences and throttle windows.
- **Password recovery:** Forgot-password requests generate hashed, expiring tokens and send secure reset links via Mailgun.
- **Trail interactions:** Hovering over rides or trails keeps map visuals in sync with the list UI for better discovery.

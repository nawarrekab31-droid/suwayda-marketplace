# Suwayda Marketplace — Project Reference

Multi-store e-commerce platform for As-Suwayda, Syria. See `PROJECT_BRIEF.md` for full requirements.

## Stack & Architecture
- **Monorepo**: `/backend` (Node.js + Express + TS + Prisma + Postgres) & `/frontend` (Next.js App Router + Tailwind + React Query).
- **Docker**: Docker Compose runs PostgreSQL (`suwayda_dev` DB on 5432).
- **Storage**: Local disk for image uploads via multer + sharp (WebP format).

## Language & UX Rules
- **UI**: 100% Arabic, fully RTL (`dir="rtl"`, `lang="ar"`). Use Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`).
- **Code & DB**: English for code, comments, variables, schema.
- **Currency**: Syrian Pounds (SYP), integer amounts formatted with thousands separators.
- **Mobile-first**: Lightweight pages, lazy loading, WebP images.

## Core Rules & Roles
1. **Phased execution**: Work in phases. Stop after each phase. Never write code before plan approval.
2. **RBAC**:
   - `ADMIN`: Seed/CLI creation ONLY, no public registration. Full management & audit log.
   - `MERCHANT`: Register -> PENDING -> Admin approve. Sees ONLY own store, products, orders.
   - `CUSTOMER`: Public browse, search, cart, checkout, order tracking, reviews.
   - `DRIVER`: Simple dashboard for assigned deliveries, status updates.
3. **Database Invariants**:
   - Price & store name snapshots in `order_items`.
   - Soft deletes (`deleted_at`) for stores & products.
   - Multi-store carts split into 1 parent order + store sub-orders.
   - Stock decrements inside DB transaction.
   - Phone is unique main login identifier.
4. **Order Lifecycle**:
   - `NEW` -> `ACCEPTED_BY_MERCHANT` -> `PREPARING` -> `READY_FOR_PICKUP` -> `ASSIGNED_TO_DRIVER` -> `ON_THE_WAY` -> `DELIVERED`.
   - Side: `REJECTED_BY_MERCHANT`, `CANCELLED_BY_CUSTOMER` (before PREPARING), `DELIVERY_FAILED`.
   - Enforce via state machine; every transition logs history + triggers notification.

## Security Rules
- Validate server-side with `zod`.
- Strict ownership checks on merchant/driver routes.
- Rate-limit login routes; hash passwords with `argon2`/`bcrypt`.
- No hardcoded secrets; use `.env` (never committed).

## Commands (Fill after Phase 1 setup)
- Backend dev: `cd backend && npm run dev`
- Frontend dev: `cd frontend && npm run dev`
- Migrations: `cd backend && npx prisma migrate dev`
- Seed DB: `cd backend && npm run seed`
- Run tests: `cd backend && npm test`

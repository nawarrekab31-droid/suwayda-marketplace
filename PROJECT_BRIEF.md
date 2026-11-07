# Suwayda Marketplace — Project Brief

You are a senior full-stack engineer. Build "Suwayda Marketplace": a web platform connecting local stores in As-Suwayda, Syria with customers, with delivery tracking. Work in PHASES. Finish and test one phase, commit it, summarize what was done, then wait for me to say "next phase". Do NOT build everything at once.

A detailed study report (Arabic) is available at `docs/Suwayda_Marketplace_Study.pdf` for reference.

## Language & UX
- All user-facing UI in Arabic, fully RTL. Code, comments, and DB names in English.
- Mobile-first (most users are on phones with weak internet): lightweight pages, compressed images, lazy loading, PWA-ready.
- Currency: Syrian pounds (SYP), integer amounts, format with thousands separators.

## Tech stack
- Backend: Node.js + Express + TypeScript, PostgreSQL, Prisma ORM, JWT (access + refresh) with RBAC, argon2/bcrypt, zod validation, helmet, rate limiting, CORS.
- Frontend: Next.js (App Router) + Tailwind CSS, RTL, React Query.
- Images: upload with multer + sharp (resize/compress to WebP), storage behind an interface (local disk now, S3/R2 later).
- Docker Compose for Postgres + app. Config via .env (provide .env.example). Seed script.
- Structure: monorepo with /backend and /frontend. Backend organized by modules (auth, users, stores, categories, products, offers, cart, orders, deliveries, notifications, payments, admin).

## Roles (RBAC)
1. ADMIN (only me): NO public registration. Admin accounts are created via a seed/CLI script only. Full control: create/approve/suspend/delete stores, manage users, categories, products, offers, orders, drivers, settings. Audit log of admin actions.
2. MERCHANT: registers a join request (status PENDING); an admin must approve. Dashboard: manage own products (multiple images, price, stock, availability), own offers/discounts, store profile and working hours, receive and update orders of own store only. Must never access other stores' data.
3. CUSTOMER: browse, search, cart, addresses, place orders, track, review.
4. DRIVER: simple dashboard: assigned deliveries, confirm pickup/delivery, update status.

## Database (PostgreSQL)
Tables: users, stores, categories (with parent_id), products, product_images, offers, addresses, carts, cart_items, orders, order_items, order_status_history, drivers, deliveries, payments, notifications, reviews, audit_logs.
Rules:
- Store name/price snapshots inside order_items so old invoices never change.
- Soft delete (deleted_at) for stores and products.
- A cart with items from several stores becomes ONE parent order split into per-store sub-orders (each store sees only its own).
- Create orders and decrement stock inside a DB transaction.
- Add indexes on search/filter fields. Phone number is unique and is the main login identifier.
- Payments table must support multiple methods (start with CASH_ON_DELIVERY; design for wallets: Syriatel Cash, Sham Cash, MTN Cash with manual confirmation via transfer reference/receipt image).

## Order lifecycle
NEW -> ACCEPTED_BY_MERCHANT -> PREPARING -> READY_FOR_PICKUP -> ASSIGNED_TO_DRIVER -> ON_THE_WAY -> DELIVERED.
Side states: REJECTED_BY_MERCHANT, CANCELLED_BY_CUSTOMER (only before PREPARING), DELIVERY_FAILED.
Implement as a validated state machine (illegal transitions rejected). Every transition writes order_status_history and triggers notifications:
- New order -> merchant + admin; accept/reject -> customer; driver assigned -> driver + customer + merchant; on the way / delivered -> customer + merchant; cancellation/problem -> everyone + admin.
Notification channels: in-app notifications + Web Push now, with a pluggable interface so Telegram/WhatsApp bots can be added later. Driver assignment: manual from the admin panel first, auto-assign nearest available driver later.

## Customer-facing features
- Home page: best offers, featured products, featured stores, categories.
- Search + filters (category, store, price), product page with image gallery.
- Cart with live invoice: subtotal, delivery fee, total. Checkout asks for name, phone, address (area, street, notes), payment method; allows confirm or cancel. Order tracking page with a timeline. Review store/driver after delivery.

## Security & quality
- Validate everything server-side; protect against SQL injection, XSS, CSRF where applicable, brute force (rate limit login); never return password hashes; authorization checks on every merchant/driver endpoint (ownership).
- Consistent API error format, pagination, OpenAPI docs (Swagger).
- Write tests for: auth/RBAC, order state machine, order creation transaction, cart splitting.
- Clear README with setup steps and a short architecture doc.

## PHASES (stop after each one)
1. Foundation: monorepo, Docker, Prisma schema + migrations, seed (admin, categories, demo stores/products), auth + RBAC, admin panel basics (login, stores management, merchant approval, users).
2. Merchants: merchant dashboard (products, images, offers, store profile, working hours).
3. Customers: home, search, product page, cart, invoice, checkout, addresses.
4. Orders & delivery: state machine, merchant/driver/admin order handling, notifications, tracking timeline, reviews.
5. Hardening: tests, security review, performance (images, caching), deployment guide (VPS + Nginx + HTTPS + daily DB backups).

## First instruction
Before writing code for Phase 1: show me the final folder structure and the Prisma schema for approval, and ask me anything that is ambiguous. Do not write any code until I approve.

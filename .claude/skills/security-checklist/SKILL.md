---
name: security-checklist
description: Use before finishing any endpoint, module, or phase. Enforces input validation, RBAC, ownership checks, safe uploads, rate limiting, and consistent error handling.
---

# Security Checklist

Run this checklist before declaring any endpoint or phase complete.

## Input Validation
- Every route uses a `zod` schema for request body, query params, and route params.
- Reject unknown fields and malformed values with a `400` status.
- Sanitize and validate all file uploads (type, size, filename).

## Authentication & RBAC
- Every protected route requires a valid JWT access token.
- RBAC enforced via guards: `AdminGuard`, `MerchantGuard`, `CustomerGuard`, `DriverGuard`.
- Admin accounts are created ONLY via seed/CLI script. No public admin registration.

## Ownership Checks
- Merchant endpoints: merchant can only access their OWN store, products, offers, and orders.
- Customer endpoints: customer can only access their OWN orders, cart, addresses, and reviews.
- Driver endpoints: driver can only access their OWN assigned deliveries.
- Use `store_id` or `customer_id` from the authenticated token, never from client input.

## Password & Secrets
- Passwords hashed with `argon2id` (fallback: `bcrypt`).
- Never return `password_hash` in any API response.
- No secrets in code. Use environment variables. `.env` is in `.gitignore`.
- Refresh tokens stored hashed; rotation on use.

## Rate Limiting & Headers
- Login route rate-limited (e.g. 5 attempts / 15 min per IP).
- `helmet` enabled with safe defaults.
- CORS configured for the frontend origin only.

## File Uploads
- Multer with file type whitelist (image extensions only).
- Sharp re-encode images to WebP and resize to max width.
- Store files in a separate uploads directory outside the source tree.

## Data Safety
- No raw SQL string concatenation. Use Prisma parameterized queries.
- Consistent error format that does not leak internals (stack traces, DB details).

## Audit
- Admin actions logged to `audit_logs` (`user_id`, `action`, `entity`, `entity_id`).
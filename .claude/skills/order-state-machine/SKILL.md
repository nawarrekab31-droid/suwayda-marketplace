---
name: order-state-machine
description: Use when touching orders, deliveries, status transitions, or order notifications. Enforces state machine rules, multi-store order splitting, stock reservation transactions, and invoice snapshots.
---

# Order State Machine & Lifecycle Rules

## Valid Order States
- `NEW`: Order placed by customer.
- `ACCEPTED_BY_MERCHANT`: Merchant accepts order.
- `PREPARING`: Merchant is preparing order.
- `READY_FOR_PICKUP`: Order packaged and ready for driver.
- `ASSIGNED_TO_DRIVER`: Driver assigned by admin.
- `ON_THE_WAY`: Driver picked up order, en route.
- `DELIVERED`: Final state, order delivered to customer.

## Side States
- `REJECTED_BY_MERCHANT`: Merchant declined order.
- `CANCELLED_BY_CUSTOMER`: Customer cancelled (ONLY allowed while state is `NEW` or `ACCEPTED_BY_MERCHANT`, rejected once `PREPARING`).
- `DELIVERY_FAILED`: Driver could not deliver.

## Transition Enforcement
- All transitions MUST pass through a central validator function.
- Reject invalid transitions with a `409 Conflict` status code.
- Every valid transition MUST:
  1. Update `orders.status`.
  2. Write an `order_status_history` record (`status`, `changed_by`, `note`).
  3. Emit a notification event to relevant parties (customer, merchant, driver, admin).

## Order Creation Transaction
When checkout executes:
1. Validate items and availability.
2. If cart contains items from multiple stores:
   - Create 1 Parent Order (holding total + customer address snapshot).
   - Split into N Child Orders (one per store).
3. Decrement product stock within the SAME Prisma `$transaction`.
4. Freeze item names & unit prices inside `order_items` snapshots.

## Required Unit Tests
Every state transition (legal and illegal) must be covered by integration tests in `backend/test/orders.spec.ts`.

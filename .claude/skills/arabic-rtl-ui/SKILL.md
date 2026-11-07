---
name: arabic-rtl-ui
description: Use when building or editing any user interface component or page. Enforces Arabic RTL layout, accessibility, Tailwind logical properties, SYP currency formatting, and mobile responsiveness.
---

# Arabic RTL UI Standards

Use these guidelines for all frontend work in Suwayda Marketplace.

## Required Setup
- Root layout must set `dir="rtl"` and `lang="ar"`.
- Use an Arabic-capable font (e.g. Cairo, Tajawal, Vazirmatn, or IBM Plex Sans Arabic) with fallback.

## Tailwind Logical Properties
Always use logical properties instead of directional ones to avoid broken RTL layouts:
- `ms-*` / `me-*` (margin-inline-start / end) instead of `ml-*` / `mr-*`
- `ps-*` / `pe-*` (padding-inline-start / end) instead of `pl-*` / `pr-*`
- `text-start` / `text-end` instead of `text-left` / `text-right`
- `start-*` / `end-*` instead of `left-*` / `right-*`
- Mirrored directional icons (arrows, chevrons) when indicating direction.

## Currency & Numbers
- Format all prices in Syrian Pounds (SYP / ل.س).
- Format integer amounts with thousands separators: `15,000 ل.س`.
- Do not display fractional decimals for SYP.

## Text & Copy
- All user-visible strings must be in Arabic.
- Validation messages, empty states, error toasts, and button labels MUST be clear Arabic text.
- Standard labels:
  - Add to cart: إضافة إلى السلة
  - Checkout: إتمام الطلب
  - Total: الإجمالي
  - Delivery fee: رسوم التوصيل
  - Syrian Pounds: ل.س

## Mobile First & Performance
- Design for narrow viewports first (375px width).
- Compress all uploaded images to WebP.
- Use lazy loading for product grids.
- Keep bundle size small for weak local internet connections.

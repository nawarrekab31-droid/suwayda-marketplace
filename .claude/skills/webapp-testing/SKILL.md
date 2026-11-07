---
name: webapp-testing
description: Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.
---

# Web Application Testing

Use Playwright MCP or native scripts for browser testing.

## Decision Tree

1. Server running?
   - Yes -> Use Playwright tool or sync_playwright script directly.
   - No -> Start backend/frontend dev server first.

2. Inspection flow:
   - Navigate to page
   - Wait for load state (`networkidle` or `domcontentloaded`)
   - Capture screenshot or inspect DOM
   - Execute actions (clicks, fills, form submissions)

## Best Practices

- Always test mobile viewport (375x812) for RTL/Arabic layout.
- Use explicit waits where needed (`wait_for_selector`).
- Capture screenshots to verify layout, fonts, and alignment.

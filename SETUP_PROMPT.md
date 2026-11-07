# SETUP PROMPT — Configure Claude Code for the Suwayda Marketplace project

You are Claude Code running on a Windows 11 laptop, inside the project folder `suwayda-marketplace`. Your job in THIS session is only to configure yourself (skills, MCP connectors, project memory). Do NOT write any application code yet.

Work through the steps in order. After each step, report what you did and the result. Ask me before any command that changes files outside this project folder, installs anything globally, or needs a secret/API key.

## Ground rules
1. Verify before installing. Package names, plugin names and URLs below come from memory and may be outdated. For each item, check the official docs (https://code.claude.com/docs and the project's own README) and use the current install method. If something no longer exists or cannot be verified, skip it and tell me instead of guessing.
2. Prefer project scope (`--scope project`, which writes `.mcp.json`; project skills in `.claude/skills/`) so the setup travels with the repo. Use user scope only if I approve.
3. Keep it lean. I am running a free auto-routed model with a limited context window, so install ONLY what is listed. No extras.
4. Never put passwords, tokens or API keys in files that could be committed. Use environment variables or `.env` (which must be in `.gitignore`).
5. Windows note: for stdio MCP servers launched with `npx`, check the docs for the correct Windows form (it may need a `cmd /c` wrapper).
6. If a command fails, show me the exact error, try one reasonable fix, then ask me.

## Step 0 — Environment check
- Run `claude --version`, `node --version`, `npm --version`, `git --version`, and check whether Docker is available. Report anything missing and how to install it. Do not install system software without asking.
- Run `git init` if the folder is not a repo yet. Create a `.gitignore` covering `node_modules`, `.env`, `.env.*` (except `.env.example`), build output and uploads.
- Run `/doctor` (or the equivalent) and report problems.

## Step 1 — MCP connectors (install these only)
1. **Context7** — fetches up-to-date library documentation (Next.js, Prisma, Tailwind, Express, etc.).
2. **Playwright** — real browser automation so you can test the site, take screenshots and check RTL/Arabic layout and mobile viewport.
3. **PostgreSQL** — inspect the LOCAL development database only. Requirements: read-only access, connection string via environment variable, never any remote or production database. If a safe read-only setup is not possible, skip it and tell me why. (The database does not exist yet; set up the connector config now but mark it as "to enable after Phase 1 creates the DB".)

For each: add it with `claude mcp add ...` at project scope, then run `claude mcp list` and confirm it connects. Report the tools each server exposes (short list).
Do NOT install: GitHub, Slack, cloud-provider or any other server. I will ask later if I need them.

## Step 2 — Skills and plugins
1. Check which bundled skills are available (`/code-review`, `/debug`, `/doctor`, etc.) and list them for me with one line each.
2. Install **frontend-design** from the official `anthropics/skills` repository (add the marketplace or copy the skill into `.claude/skills/`, whichever the docs recommend). If a web-app-testing skill exists in the same repo, install it too.
3. Run `/reload-plugins` or restart as needed, then list the installed skills to confirm they are visible.

## Step 3 — Project memory: CLAUDE.md
Create `CLAUDE.md` at the project root (concise, under ~80 lines) containing:
- What the project is: Suwayda Marketplace, a platform linking As-Suwayda stores with customers, with delivery tracking. Details are in `PROJECT_BRIEF.md` (always re-read it when unsure).
- Stack: Node.js + Express + TypeScript, PostgreSQL + Prisma, Next.js (App Router) + Tailwind, Docker Compose.
- Language rules: Arabic RTL UI; English code, comments and DB names; SYP currency as integers.
- Working rules: work in phases; stop after each phase; never write code before I approve the plan; run tests before saying "done"; commit with clear messages; ask when ambiguous; keep secrets out of git.
- Security rules: validate server-side, ownership checks on merchant/driver endpoints, rate-limit login, never return password hashes.
- Commands section: leave placeholders to fill after Phase 1 (dev, test, lint, migrate, seed).

## Step 4 — Three project skills
Create these in `.claude/skills/<name>/SKILL.md`, each with YAML frontmatter (`name`, `description` that says exactly when to use it) and focused instructions:

**a) `arabic-rtl-ui`** — Use when building or editing any UI. Rules: `dir="rtl"` and `lang="ar"` at the root; Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) instead of left/right; mirrored icons only where directional; numbers and SYP formatting with thousands separators; Arabic-capable font with proper fallback; mobile-first and lightweight (lazy-loaded, compressed images); verify with Playwright screenshots at a phone viewport; forms, validation messages and empty/error states all in Arabic.

**b) `order-state-machine`** — Use when touching orders, deliveries or notifications. Rules: states NEW → ACCEPTED_BY_MERCHANT → PREPARING → READY_FOR_PICKUP → ASSIGNED_TO_DRIVER → ON_THE_WAY → DELIVERED; side states REJECTED_BY_MERCHANT, CANCELLED_BY_CUSTOMER (only before PREPARING), DELIVERY_FAILED; transitions defined in one table and validated centrally; every transition writes `order_status_history` and triggers notifications to the right parties (merchant, customer, driver, admin); order creation and stock decrement inside one DB transaction; multi-store carts split into per-store sub-orders under a parent order; price and name snapshots stored in `order_items`; tests for every legal and illegal transition.

**c) `security-checklist`** — Use before finishing any endpoint or phase. Checklist: input validation (zod) on every route; authentication and RBAC on every route; ownership checks (merchant sees only own store, customer only own orders, driver only assigned deliveries); admin accounts only via seed/CLI, no public admin registration; password hashing with argon2/bcrypt; login rate limiting; no secrets in code; helmet and CORS configured; safe file uploads (type and size limits, re-encode images); no raw SQL string concatenation; consistent error format without leaking internals; audit log for admin actions.

## Step 5 — Verification and report
1. Run `claude mcp list` and list installed skills.
2. If possible, do a tiny live test: ask Context7 for the current Prisma "getting started" docs and confirm you can read them; open any simple page with Playwright and take a screenshot. Report pass/fail for each.
3. Give me a final report with: (a) what was installed and at which scope, (b) what you skipped and why, (c) anything that needs my manual action (keys, Docker, permissions), (d) the exact commands to remove each item if I want to undo it.
4. Commit the setup files (`CLAUDE.md`, `.claude/`, `.mcp.json`, `.gitignore`) with the message "chore: configure Claude Code skills and MCP".

Then STOP and wait. Do not start Phase 1 until I say so.

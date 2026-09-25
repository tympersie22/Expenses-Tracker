# Expenses Tracker

A real personal-finance application built with Next.js, TypeScript, Prisma, and PostgreSQL. Create a private account, record financial accounts and transactions, reconcile CSV statements in a persistent Financial Inbox, set budgets, reserve savings goals, and track bills. Statement rows are reviewed before they reach the ledger, with duplicate matching and closing-balance checks. All financial data persists in PostgreSQL.

## Local setup

Requires Node.js 20.9+ and PostgreSQL 14+.

```sh
npm ci
cp .env.example .env
# Configure DATABASE_URL for your own PostgreSQL database.
# APP_ORIGIN must match the exact browser origin.
npm run db:generate
npm run db:migrate
npm run dev -- --port 3120
```

Open http://localhost:3120 and create your account. For a new local PostgreSQL instance, `docker compose up -d db` starts an isolated development database on port 5437. Use the connection string shown in `.env.example`. Existing local PostgreSQL also works.

The prototype in `design/` is a separate historical design study. The real application is in `src/`.

## Features

- Signup, email verification, login, password recovery, TOTP MFA, recovery codes, session revocation, and password change.
- Accounts in original currencies with exact minor-unit amounts.
- Income, expenses, atomic same-currency transfers, and auditable removal.
- CSV preview, validation, duplicate detection, transactional import, transaction CSV export, and complete JSON account export.
- Per-category monthly budgets, account-backed savings reservations, and dated bills.
- Consistent available-to-spend calculations, purchase scenarios, amount hiding, and responsive layouts.
- Time-zone-aware calendar dates and preferences.
- Account rename/closure, history-preserving transaction correction, in-app deletion, and an encrypted iOS offline read cache.

Accounts are manually maintained. No bank synchronization, live FX, or money transmission is represented as available. Each currency has a separate overview.

## Verification

```sh
npm run typecheck
npm run lint
npm test
# Create a separate database named money_well_test, then:
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/money_well_test npm run db:migrate
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/money_well_test npm run test:integration
npm run build
npm start -- --port 3120
```

Integration tests refuse to run without the dedicated test database name. They create and remove their own users and validate isolation, exact balances, idempotency, transfers, reservation limits, bill posting/reversal, duplicate imports, and rollback.

## Deployment

Set the production values documented in `.env.example`, run `npm ci`, `npm run build`, and `npm run db:migrate`, then `npm start`. The build packages Next.js standalone output and `npm start` runs that artifact. `render.yaml` is an opt-in deployment blueprint; no public deployment has been performed. Enable managed backups, point-in-time recovery, monitoring, email delivery, and TLS before accepting real users. Run `npm run db:prune` periodically.

See [architecture and launch limits](docs/ARCHITECTURE.md) for data flows, security boundaries, financial assumptions, and unfinished integrations. This is a manual-finance application, not a bank or payment processor.

## Native iOS app

The Expenses Tracker SwiftUI app lives in [ios/](ios/README.md). Open `ios/ExpensesTracker.xcodeproj` and run the ExpensesTracker scheme on an iPhone simulator. Debug simulator builds connect to this same backend at localhost:3120.

## Public launch preparation

Start with [owner actions](docs/OWNER_ACTIONS.md), [production readiness](docs/PRODUCTION_READINESS.md), and [local verification](docs/LAUNCH_VERIFICATION_2026-09-25.md). Use Node 22 or newer. `npm run launch:prepare` creates private local configuration without printing credentials; `npm run launch:check` lists missing settings. Production deployment and App Store distribution remain gated on hosted validation and owner-controlled accounts.

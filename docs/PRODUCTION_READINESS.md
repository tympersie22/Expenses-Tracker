# Expenses Tracker production readiness

Status reviewed: 25 September 2026

## Release decision

The repository is a candidate for controlled staging validation. The repository contains implementations and automated checks for the original launch areas. Public readiness is still unproven and depends on production infrastructure, service credentials, Apple signing, a managed restore drill, and human accessibility/security review. Do not represent the product as connected to banks or mobile-money providers until real provider agreements and sync flows exist.

## Implemented in the repository

| Area | Implemented state | Evidence |
| --- | --- | --- |
| Production configuration | Standalone Next.js artifact packaging, correct start command, HTTPS/config health gate, staging smoke script, separate migration/runtime database roles | `scripts/package-standalone.mjs`, `render.yaml`, `scripts/smoke-production.mjs`, `scripts/configure-runtime-role.sql` |
| Identity lifecycle | Email verification, generic password recovery, single-use hashed tokens, login lockout, TOTP MFA, one-time recovery codes, session inventory and revocation | `/api/auth/*`, web settings, native iOS settings, lifecycle verification script |
| Privacy | Complete JSON archive, authenticated in-app deletion, policy acceptance history, privacy/terms/support pages, retention policy | `src/app/api/finance/full-export`, `docs/DATA_RETENTION.md`, `docs/APP_PRIVACY_DISCLOSURE.md` |
| Recovery | Backup and isolated restore scripts, recovery runbook, local restore drill | `scripts/backup-postgres.sh`, `scripts/restore-drill.sh`, `docs/BACKUP_RESTORE.md` |
| Monitoring | Request IDs, structured server errors, error webhook, database latency health signal, MetricKit iOS diagnostics, pruning schedule, incident runbook | `src/server/observability.ts`, `src/middleware.ts`, `DiagnosticsReporter.swift`, `docs/INCIDENT_RESPONSE.md` |
| App Store foundation | Final target/scheme/bundle naming, Debug and Release configuration, HTTPS release guard, privacy manifest, CI iOS build/tests, metadata drafts | `ios/project.yml`, `ios/Config`, `PrivacyInfo.xcprivacy`, `ios/AppStore` |
| Security | Legacy plaintext OAuth-token table removed, DELETE throttling, versioned hash-chained audit records with update/direct-delete guards, HSTS/CSP, pinned CI actions, CodeQL and dependency audit | Prisma migrations, `src/server/audit.ts`, `.github/workflows/ci.yml`, `docs/THREAT_MODEL.md` |
| Product correctness | Account rename/close, correction entries preserving history, cursor pagination, protected offline read cache, sync state, English/Swahili catalog parity and static literal coverage (dynamic copy review remains) | ledger commands, web/iOS flows, localization check |

The demo credential remains a normal local test user and has no administrator privileges. Production must not seed or document that credential.

## External launch gates

These items require owner accounts or production services and cannot be completed from source code alone:

1. **Infrastructure:** create staging and production services, separate PostgreSQL databases, least-privilege runtime credentials, HTTPS domains, and protected environment secrets.
2. **Email:** configure a verified Resend sender and test verification and recovery delivery outside development.
3. **Monitoring:** configure the monitoring webhook/error destination, external uptime alerts, on-call destination, and release identifier.
4. **Recovery:** enable managed encrypted backups and point-in-time recovery, then record a populated staging restore drill. The local restore drill proves the procedure only; it does not prove a hosting provider's PITR.
5. **Apple:** register `com.expensestracker.app`, select the Apple Developer team, configure distribution signing, create the App Store Connect record, and complete agreements.
6. **Store submission:** capture all required device-size screenshots, host public privacy/support URLs, complete App Privacy and age-rating answers, produce an archive, and validate through TestFlight.
7. **Assurance:** perform VoiceOver, Dynamic Type, keyboard, contrast, reduced-motion, supported-device, penetration, and production-scale load reviews. Automated checks support these reviews but do not replace them.

## Required production values

The deployment health endpoint stays unhealthy when `REQUIRE_PRODUCTION_CONFIG=true` and mandatory values are absent. Configure the values documented in `.env.example`, including:

- `DATABASE_URL` for the restricted runtime role. Keep `MIGRATION_DATABASE_URL` only in the protected database release workflow, never in the web-service environment.
- `APP_ORIGIN` using the public HTTPS origin.
- a random base64 32-byte `APP_ENCRYPTION_KEY` and independent `RATE_LIMIT_SALT`.
- `RESEND_API_KEY`, `EMAIL_FROM`, and `NEXT_PUBLIC_SUPPORT_EMAIL`.
- `MONITORING_WEBHOOK_URL`, optional webhook authentication in `MONITORING_WEBHOOK_TOKEN`, and `RELEASE_SHA` (Render also supplies its commit identifier).
- iOS `EXPENSES_TRACKER_API_URL`, `EXPENSES_TRACKER_PUBLIC_URL`, and `EXPENSES_TRACKER_DEVELOPMENT_TEAM` as protected release settings.

## Go/no-go acceptance

A public launch is allowed only when all of the following are demonstrated in staging or TestFlight:

- Signup, verification email, login, MFA/recovery code, password reset, session revocation, export, and deletion work end to end.
- Account creation/edit/close, transaction correction/void, transfer, budget, goal, bill, CSV import/reconciliation, recurring decisions, forecast, pagination, and export preserve ledger totals.
- A failed health check and deliberately triggered server/iOS error reach the operator without sensitive payloads.
- The deployed artifact passes `scripts/smoke-production.mjs`, and the previous compatible artifact can be restored.
- A dated managed restore report meets the chosen RPO/RTO and validates sampled balances.
- App Store privacy answers match measured traffic and the published policy; archive validation and TestFlight installation pass.
- No unresolved critical/high security finding remains, and cross-user authorization tests pass.
- Supported English and Kiswahili journeys pass accessibility and regional money/date review.

## Post-launch product sequence

After the operational gates are proven, prioritize explainable alerts, encrypted receipt-document storage, queued offline writes with conflict handling, merchant/category rules, 90-day planning, and then licensed read-only financial-data connections by region. Carrier business-payment APIs must never be presented as access to a consumer's complete wallet history.

## Latest handoff

See [owner actions](OWNER_ACTIONS.md) for the short list of decisions and account access needed. See [local verification](LAUNCH_VERIFICATION_2026-09-25.md) for completed checks and their limits. Release automation lives in the Database release and iOS release archive workflows; neither has run against production.

# Local launch verification — 25 September 2026

## Completed

- Clean Node 22 installation, TypeScript check, lint, unit and PostgreSQL integration checks, and packaged Next.js production build.
- Real HTTP verification: signup, HttpOnly session persistence, origin enforcement, duplicate-write protection, user isolation, export and logout.
- Account lifecycle verification: reset and verification links cannot bypass MFA; single-use tokens; concurrent recovery-code reuse rejected; session revocation; TOTP; export and deletion.
- Populated logical PostgreSQL recovery: complete record digest and USD/JPY/KWD balances unchanged; 14 audit events verified. See `restore-drills/2026-09-25-populated.json`.
- Audit integrity: canonical JSON hashing; update/direct-delete rejection; account-deletion cascade retained.
- Diagnostics sanitization: arbitrary payload text does not reach monitoring; only recognized summary counters/categories are accepted.
- Seven iOS unit tests and native screenshot journey, with fictional accounts removed afterwards. Unsigned physical-device Release archive builds successfully.
- Dependency audit reports no known vulnerabilities. Git history secret scan passed. Workflow syntax and shell checks passed.

## Limits

These checks are local, with a local database and simulator. They do not establish provider uptime, production permissions, email delivery, App Store signing/approval, managed PITR, penetration resistance, real-device behavior or performance at production scale. MetricKit currently sends diagnostic counts and metric availability, not a full APM platform.

Localization catalog parity and static-literal checks are automated. Dynamic/server messages and human language quality still need end-to-end review. Offline access is protected cached reading; writes require a server connection.

CI workflows repeat the automated checks on a clean hosted runner. A successful local run must not be described as a successful GitHub CI run.

## Hosted checks and local rehearsal

GitHub run `36126017428` passed all four jobs for commit `2e970fd`: web verification, CodeQL analysis, secret scan and iOS. The iOS job includes unit tests, secure-session persistence, real account/transaction persistence and an unsigned device archive. An earlier macOS-runner failure exposed a missing PostgreSQL username; the CI connection now uses the runner’s actual role.

The local runtime was backed up, migrated and replaced with the validated standalone build; `/api/health` reports the database available. Backup/restore was also repeated successfully with Prisma-specific connection parameters stripped for PostgreSQL command-line tools. Backups and generated production secrets remain outside Git.

Additional local screenshot attempts stalled in simulator automation, including a large-screen run that timed out collecting diagnostics. They are not counted as passing device checks. The stored captures come from the earlier successful 1206 × 2622 English/Kiswahili journey; final recapture and coverage across all submission sizes remain pending.

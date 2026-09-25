# Expenses Tracker threat model

## Assets and trust boundaries

The primary assets are credentials, revocable sessions, identity data, financial records, exports, optional MFA secrets, and operational logs. Trust boundaries exist between the browser/iOS client and HTTPS API, API and PostgreSQL, API and email/monitoring providers, release CI and production, and staff and support tooling.

## Principal threats and controls

- Account takeover: bcrypt passwords, generic login failures, account and IP throttles, temporary lockout, optional TOTP with one-time recovery codes, hashed reset tokens, session revocation, and Keychain storage on iOS.
- Cross-user access: every command scopes records to the authenticated user; composite financial foreign keys and integration tests protect ownership.
- CSRF and request forgery: exact production Origin checks, SameSite cookies, Fetch Metadata rejection, HTTPS-only native configuration, and redirect refusal on iOS.
- Replay and duplicate writes: client idempotency keys, request hashes, import fingerprints, and transaction-scoped advisory locks.
- Financial record tampering: void/correction history, chained audit hashes, append-only database updates, and no silent staff editing path.
- Import attacks: bounded body/file/row size, strict schema parsing, spreadsheet-formula escaping, exact money parsing, and atomic imports.
- Secret disclosure: server-only environment variables, hashed sessions/tokens, encrypted MFA secrets, no tracked environment files, and redacted structured logs.
- Availability abuse: database-backed rate limits, bounded snapshots/imports, health checks, backup restoration, and operator rollback/runbooks.
- Malicious dependencies or releases: lockfile installs, production dependency audit, CodeQL, pinned CI actions, web tests, iOS CI, and release configuration validation.

## Required external review

Before a broad public launch, an independent tester should cover account enumeration, recovery/MFA bypass, session fixation, CSRF, horizontal and vertical authorization, import parsing, export/deletion, rate-limit bypass through proxy headers, database-role permissions, deployment secrets, and denial-of-service limits. Resolve every critical/high finding before launch and record accepted lower risks with an owner and review date.

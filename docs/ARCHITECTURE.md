# Expenses Tracker — application architecture

## Shape

This is a modular Next.js application with PostgreSQL persistence. The earlier standalone study remains in `design/` for reference; it is not the application. No demo balances, users, institutions, or transactions are seeded.

- `src/app`: server-rendered routes and authenticated JSON API handlers.
- `src/components`: interactive workspace, native dialog forms, authentication, preferences.
- `src/domain`: exact money parsing/formatting, calendar-date handling, shared locale data, CSV parsing. No database dependency.
- `src/server`: session authentication, origin/body checks, validation, ledger commands, database access, consistent read snapshots.
- `prisma`: PostgreSQL schema and additive migrations, including constraints.
- `tests`: arithmetic/parser tests and real PostgreSQL integration tests.

The UI sends validated commands; balances never come from the browser. Protected pages require a valid database session. Every API request independently authenticates the user. Server-to-client snapshots contain only the signed-in user's records. Reads use repeatable-read transactions so related totals reflect one consistent database state.

## Financial records

`FinancialAccount` stores a user's tracked account and has one immutable currency. The unused legacy OAuth account/token model has been removed. A `Movement` describes an opening balance, income, expense, or transfer. `LedgerEntry` holds its signed integer minor-unit impact on accounts. Composite foreign keys tie both movement and account to the same owner.

Amounts are parsed from decimal strings into BigInt; binary floating-point is never used for financial arithmetic. Currency precision is shared between server and browser. Amounts cross JSON boundaries as decimal integer strings. Individual inputs have an explicit limit. Negative account balances are represented honestly.

Opening balance + active ledger entries = account balance. Transfers create equal and opposite entries atomically in matching currencies, and are excluded from spending. Cross-currency transfers and live FX conversion are deliberately unavailable until rate provenance and rounding policy are implemented.

Each user's writes take a transaction-scoped PostgreSQL advisory lock, serializing financial changes and goal reservation checks. Account/transaction requests have idempotency keys and request hashes; retrying identical requests does not duplicate entries. Bill payment also checks the bill's paid state under the lock. Voiding retains the original movement and an audit event, removes its effect from calculated totals, and reopens an associated paid bill.

This is a personal-finance tracking ledger, not a custody or settlement ledger. It does not transmit funds, claim bank reconciliation, or implement institutional double-entry accounting.

## Planning

- Budgets are per user, month, category, and currency. Current-month expense entries determine spending; transfers and opening balances do not count.
- Goals reserve money in a particular account. Reservation writes cannot exceed its recorded balance or the target. Later spending can reduce the account below existing reservations; the UI flags this.
- Bills are individually dated obligations. Marking one paid records an expense in its account. No external payment is initiated.
- Available-to-spend is current recorded balances minus goal reservations minus unpaid bills due through the 14-day horizon, including overdue bills. Values may be negative. Currency groups are never silently mixed.
- Dates are calendar dates, not client-local timestamps. The user's selected time zone defines today and the current budget month.
- Recurring detection scans up to 190 days of confirmed income and expense history. It requires at least three consistently spaced observations, supports weekly and monthly cadence, tolerates bounded variable amounts, and persists the evidence behind each suggestion. Suggestions do not affect calculations until the user confirms them.
- The 30-day cash-flow forecast begins with recorded balances and applies unpaid planned bills plus confirmed recurring patterns in each currency. It never converts currencies. Matching planned bills suppress a nearby recurring projection so the same obligation is not counted twice.

## Import and export

CSV imports require `date,description,amount,type` and optionally `category`. Dates are ISO calendar dates and amounts are positive decimal strings in the selected account's currency. A batch contains at most 500 rows / 500 KB. All valid rows commit atomically; any invalid row rolls back the batch. Normalized fingerprints detect exact repeated imported records within the same account, including repeated files. Identical legitimate same-day transactions must be recorded separately by hand; this conservative policy is disclosed in the UI.

Opening balance must precede the transactions being imported to avoid double-counting. No guess is made about statement formats, thousands separators, or account balances. Export includes all nonvoided ledger entries, original currencies, and transfer legs. Spreadsheet-formula-leading values are escaped; exports are intended for review, not an automatic round-trip import.

## Authentication and request security

Passwords use bcrypt with cost 12 and a minimum of 12 characters, with a UTF-8 byte limit to avoid bcrypt truncation. Random 256-bit session tokens live in HttpOnly, SameSite=Lax cookies; only SHA-256 hashes are stored in PostgreSQL. Sessions expire after 30 days, retain bounded device metadata, and are individually revocable. Email verification and password recovery use single-use, expiring, hashed tokens. Optional TOTP secrets are encrypted with AES-256-GCM; recovery codes are stored as hashes and consumed atomically. Password reset revokes all existing sessions.

All write handlers require an exact `Origin` match to configured `APP_ORIGIN`; cross-site Fetch Metadata is rejected. JSON bodies are stream-size-limited. Login/signup attempts are throttled through atomic database counters. Foreign-owned record IDs never authorize a write. Responses are private/no-store. Errors log correlation IDs and error types, not passwords, cookies, financial payloads, or password hashes.

Use HTTPS in production; Secure cookies follow the HTTPS application origin. The application fails writes when APP_ORIGIN is absent. Deploy behind managed TLS with a least-privilege database role. The current CSP prohibits framing, objects, external form submissions and base URL manipulation; it is not a strict nonce-based script CSP.

## Operations

Apply migrations before serving new code; never run destructive schema synchronization on a production database. Back up PostgreSQL with the hosting provider's automated backups and point-in-time recovery, and test restoration before launch. `/api/health` checks database availability and latency without exposing connection information and rejects incomplete production configuration. Run `npm run db:prune` periodically to delete expired sessions, user tokens, and old rate-limit buckets.

The included GitHub workflow validates lint, type safety, domain tests, real PostgreSQL integration, localization parity, dependency exposure, CodeQL, the production build, and iOS unit/UI flows. Keep database credentials in server-only environment variables. Deployment configuration does not contain credentials.

## Explicit launch limits

This implementation is a functioning manual personal-finance application with web and native iOS clients. Live bank synchronization, verified currency feeds, passkeys, push notifications, queued offline writes, automatic recurring-bill generation, and household sharing remain future work. Cursor pagination is implemented for activity; full JSON export is bounded for synchronous delivery and must become a streamed or background job at larger scale. Production service provisioning, managed point-in-time restore proof, App Store signing/TestFlight, accessibility review, load testing, and independent penetration testing remain required before a broad public rollout. No compliance certification or production security audit is implied.

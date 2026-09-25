# Expenses Tracker — next building phase

## Product direction

Expenses Tracker should answer four questions quickly: what can I safely spend, what changed, what is coming next, and what should I do now. The product should earn trust through accurate records and transparent calculations before adding conversational AI or investment features.

## Phase 1 — Reliable daily money loop

1. **Inbox and reconciliation**
   - Put scanned receipts, CSV imports, and future provider transactions into one review inbox.
   - Detect likely duplicates and transfers; show the evidence before merging.
   - Track reconciled balances and warn when the ledger differs from a statement.

2. **Recurring transaction intelligence**
   - Detect salaries, subscriptions, rent, utilities, debt payments, and recurring transfers from confirmed history.
   - Let users confirm a suggested recurrence before it affects forecasts.
   - Predict the next amount as a range when bills vary.

3. **Cash-flow calendar and alerts**
   - Forecast daily balance and safe-to-spend for 30 and 90 days by currency.
   - Notify before a projected shortfall, an unusual charge, a duplicate, or a bill increase.
   - Every alert must explain the records and assumptions used.

4. **Receipt workflow completion**
   - Store the original document encrypted with retention controls.
   - Support multi-page invoices, line items, tax, currency, merchant, and category suggestions.
   - Link each document to its ledger transaction and keep a correction audit trail.

## Phase 2 — Trust, access, and portability (implemented foundation)

1. Email verification, password reset, TOTP MFA with recovery codes, and session management are implemented. Passkeys remain future work.
2. Full data export, account deletion, consent history, privacy pages, and retention rules are implemented. Receipt-document storage is not yet part of the product.
3. Append-only, hash-chained audit events cover financial mutations and reconciliation.
4. iOS has a protected offline read cache with visible sync state. Queued writes and conflict handling remain future work.
5. English and Kiswahili catalogs have automated parity checks. Manual accessibility and regional-format review remains a release gate.

## Phase 3 — Live financial connections

1. Select aggregation partners by market; global coverage requires more than one provider.
2. Build a provider-neutral connection model with encrypted tokens, consent expiry, health state, cursors, webhooks, revocation, and idempotent sync.
3. Pilot one read-only bank provider and one Tanzanian bank partner before carrier wallets.
4. Keep M-Pesa and Airtel business payment APIs separate from personal transaction aggregation.
5. Never show an account as connected until the app has completed a real consent and first sync.

## Phase 4 — Personal money guidance

1. Rules and automation: category rules, split transactions, merchant cleanup, and savings sweeps represented as plans.
2. Goal feasibility: show how a target date changes safe-to-spend and upcoming cash flow.
3. Scenario planning for income changes, travel, debt payoff, and large purchases.
4. A private assistant grounded only in the user’s ledger, with citations to transactions and no autonomous financial action.

## Current build target

The reconciliation inbox, recurring detection, 30-day cash-flow calendar, identity lifecycle, privacy controls, account lifecycle, transaction correction, pagination, and offline read cache are implemented across the relevant API, web, and iOS surfaces. The next milestone is production provisioning and TestFlight validation, followed by a secure receipt-document pipeline and explainable alerts.

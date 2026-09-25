# Expenses Tracker incident response

## First response

1. Record the start time, affected release, symptoms, and incident owner.
2. Check `/api/health`, deployment events, PostgreSQL health, error-rate alerts, and recent migrations.
3. If ledger integrity or cross-user access may be affected, disable public traffic or writes immediately.
4. Preserve redacted logs and deployment identifiers. Never copy passwords, cookies, receipt text, exports, or financial payloads into tickets.

## Containment and recovery

- Application regression: roll back to the prior immutable artifact. Migrations must remain backward compatible.
- Database outage: fail over through the managed provider. Do not run schema synchronization commands.
- Corruption or destructive write: stop writes, select the last verified point in time, restore to an isolated database, validate sampled ledger totals, then switch only after review.
- Credential exposure: revoke and rotate the credential, invalidate affected sessions or tokens, inspect access logs, and assess notification duties.

## Validation before reopening

Verify health, sign-in, account ownership isolation, account creation, transaction posting and voiding, import, reconciliation, full export, and deletion. Compare sampled balances before and after recovery.

## Communication and review

Use the configured support contact and applicable legal process. State known impact, time range, containment, and user action without speculation. Complete a review with root cause, detection gap, corrective owner, and due date.

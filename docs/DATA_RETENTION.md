# Data retention and deletion

This schedule is the production default and must be reflected in the hosting and monitoring provider settings.

| Data | Retention |
| --- | --- |
| Active profile and financial records | Until the user deletes the account |
| Expired sessions | Deleted by the daily prune job after expiry; sessions expire after 30 days |
| Verification and reset tokens | Used tokens and expired tokens deleted by the daily prune job |
| Rate-limit buckets | Deleted by the daily prune job after their window expires |
| Financial audit events | Retained with the account, included in export, deleted with account deletion |
| Receipt images/PDFs and raw OCR text | Transient on device; not stored by the server in this release |
| Generated exports | Generated directly for the authenticated request; not retained by the server in this release |
| Application and monitoring logs | Configure a 30-day production retention, with financial payloads, credentials, cookies, and receipt text excluded |
| Database backups | Configure 35 days for the first release; deleted accounts may remain in encrypted backups until backup expiry |

Changing a provider or adding financial connections, stored receipts, analytics, or customer-support attachments requires a new retention and subprocessor review. Applicable law and contractual obligations may require a different period; obtain legal review for each launch market.

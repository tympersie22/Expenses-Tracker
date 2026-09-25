# App Privacy disclosure worksheet

Validate this worksheet against production traffic and Xcode's privacy report immediately before submission.

| Data type | Linked to user | Tracking | Purpose |
| --- | --- | --- | --- |
| Email address | Yes | No | Account authentication, verification, recovery, and service communication |
| Name | Yes | No | App functionality and profile display |
| Other financial information | Yes | No | Accounts, transactions, budgets, goals, bills, imports, reconciliation, and forecasts |
| User ID | Yes | No | Authentication, ownership enforcement, abuse prevention, and support |
| Crash and performance data | Yes (pseudonymous account association) | No | Reliability, security, and diagnosis |

Receipt images, PDFs, and recognized raw text are processed temporarily on the iOS device in this release. Only transaction fields the user chooses to save are sent to the server. The app does not use advertising, third-party tracking, data brokers, precise location, contacts, health data, or payment-card credentials.

If analytics, support, email, monitoring, bank aggregation, receipt storage, or another SDK/provider is added, reassess every answer, subprocessor, retention period, and privacy-manifest entry before release.

Update 25 September: the manifest includes User ID and diagnostic categories. Treat pseudonymous diagnostic events as linked because the service associates them with a signed-in account. The server retains only whitelisted event counts and metric-category availability, discarding raw crash messages, stacks, and arbitrary client strings. Performance aggregation is basic; configure and validate the monitoring destination before claiming full performance observability.

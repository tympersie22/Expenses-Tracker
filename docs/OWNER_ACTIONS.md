# What the owner needs to do

Updated 26 September 2026. The app has passed local release checks and all four GitHub CI jobs; it has not been deployed to production or approved by Apple. Source-code readiness is not proof of a hosted release.

## 1. Supply the business decisions

- Confirm the legal person/company operating Expenses Tracker and a public support email.
- Choose the first launch countries. The product can support international currencies, but public availability and policies need a country-specific review.
- Choose the domain and approve the hosting, database, email and monitoring budget.
- Confirm the proposed retention: 30 days for operational logs and 35 days for encrypted backups, or supply the reviewed alternative.
- Confirm the first release is a manual tracker with CSV imports and on-device receipt scanning. Live bank, card and carrier connections require provider accounts, agreements and separate implementation.

## 2. Connect service accounts securely

Provide access through the provider dashboards or protected deployment secrets, never a password in chat:

| Service | Owner supplies | Work ready for the agent after access |
| --- | --- | --- |
| Domain/DNS | Purchased domain and DNS access | HTTPS domains and verified email DNS |
| Render or selected host | Account, paid plan/budget and approved region | Separate staging/production services and PostgreSQL; restricted database roles; deployment |
| Transactional email | Resend account and sender-domain access | Sender verification; real verification/reset delivery checks |
| Monitoring | Destination and the person who receives alerts | Connect error webhook, uptime checks, delivery test and incident procedure |
| Apple | Active Developer Program membership, team and App Store Connect access | Bundle registration, signing, build upload, TestFlight and submission preparation |

A development signing identity is present locally. That does not prove distribution membership, agreements or App Store permissions.

## 3. Review the policies and product

Review the privacy/terms drafts with the appropriate adviser for your launch markets. Supply the operator details and approve the exact data use, retention and processors. Arrange a fluent Kiswahili copy review and hands-on accessibility/device acceptance; automated coverage does not certify either.

Use TestFlight on a real iPhone before approving public release. Check signup and delivered email, transactions/import totals, recovery, export and deletion. The agent can prepare test cases and resolve any findings.

## Secure configuration already prepared

A private configuration file exists on this Mac at:

`~/Library/Application Support/ExpensesTracker/release/production.env`

Its folder is private and the file has owner-only permissions. Independent encryption, rate-limit and webhook secrets have been generated there. Preserve these values; changing the encryption key after enrolling authenticators requires a migration. `npm run launch:prepare` preserves an existing file. `npm run launch:check` prints missing setting names, never values.

The configuration file is an inventory, not a file to upload wholesale. Copy only runtime values to the web service. Keep `MIGRATION_DATABASE_URL` exclusively in protected database release environments. Configure staging separately with separate secrets and data.

## What remains for the agent once access is available

1. Deploy the tested commit to staging and run the authenticated smoke journey.
2. Prove real email delivery, monitoring alerts, rollback and managed PostgreSQL point-in-time recovery.
3. Complete device/accessibility and localization issues found in acceptance testing; generate the final screenshots for the selected devices.
4. Populate approved policies and App Store metadata/privacy answers.
5. Sign and upload to TestFlight, resolve beta findings, then prepare the public release for the owner's final launch decision.

Do not enable public signup until these hosted and device checks pass. Do not use the local shared demo credentials for production or App Review; create a dedicated reviewer account with fictional records.

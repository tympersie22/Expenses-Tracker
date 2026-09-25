# App Store submission package

The application record should use:

- Name: Expenses Tracker
- Subtitle: Know what you can spend
- Primary category: Finance
- Secondary category: Productivity
- Bundle identifier: `com.expensestracker.app`
- Privacy policy: `PUBLIC_ORIGIN/privacy`
- Support URL: `PUBLIC_ORIGIN/support`
- Marketing URL: `PUBLIC_ORIGIN`

Replace `PUBLIC_ORIGIN`, configure the protected Apple team and API origin build settings, and complete the territory, tax, banking, and agreement sections in App Store Connect before archiving.

## Review notes

Expenses Tracker is a manual personal-finance tracker. It does not connect to a bank, card, or mobile-money provider and does not initiate payments. Reviewers can add a manual account, record transactions, import a CSV statement, scan a receipt on device, create plans, export all data, and delete the account in Settings.

Provide a dedicated App Review account through App Store Connect. Do not use the local shared demo account in production.

## Required screenshot set

The `Screenshots/en-US` folder contains verified 1206 × 2622 captures of the welcome, today, and activity screens using fictional UI-test data. Before submission, capture the financial inbox, forecast/plans, accounts, receipt review, and privacy/security settings on every size currently required by App Store Connect. Capture the corresponding Kiswahili set after final copy review. Use a purpose-built review account with fictional records and no real person’s information.

## Submission gate

- Archive validation and TestFlight install pass.
- Privacy report matches `PrivacyInfo.xcprivacy` and App Privacy answers.
- Account verification, recovery, full export, and in-app deletion work against production.
- Support and privacy URLs are public without authentication.
- English and Kiswahili metadata and screenshots match the shipping interface.
- The production API origin is HTTPS and contains no placeholder or test host.

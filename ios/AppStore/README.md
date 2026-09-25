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

The screenshot folders contain simulator captures using fictional records. These are submission candidates, not proof of App Store acceptance. Match the final uploaded build and the sizes requested in App Store Connect; capture any missing sizes with `ExpensesTrackerUITests/testReleaseScreenshots`. The test creates isolated records and deletes its account after capture. Human Kiswahili copy review and real-device acceptance remain required.

## Release workflow

`ios/scripts/archive-release.sh validate` creates an unsigned physical-device Release archive without contacting Apple. It needs HTTPS API/public origins; reserved example hosts are accepted only in validation mode. `archive` exports a signed IPA; `upload` submits to App Store Connect. Both reject placeholder hosts and require the distribution team and signing access.

The manual **iOS release archive** workflow uses the protected `app-store` environment. Set variables `EXPENSES_TRACKER_API_URL`, `EXPENSES_TRACKER_PUBLIC_URL` and `APPLE_TEAM_ID`. Store the distribution certificate and App Store API key only as secrets: `APPLE_DISTRIBUTION_P12_BASE64`, `APPLE_DISTRIBUTION_P12_PASSWORD`, `APP_STORE_CONNECT_KEY_BASE64`, `APP_STORE_CONNECT_KEY_ID` and `APP_STORE_CONNECT_ISSUER_ID`. Never commit signing material. The workflow uses a temporary keychain and removes credentials afterwards.

Archive validation succeeded locally on 25 September 2026 without signing. Distribution signing, upload and TestFlight installation remain unverified until Apple access and real server origins are configured.

## Submission gate

- Archive validation and TestFlight install pass.
- Privacy report matches `PrivacyInfo.xcprivacy` and App Privacy answers.
- Account verification, recovery, full export, and in-app deletion work against production.
- Support and privacy URLs are public without authentication.
- English and Kiswahili metadata and screenshots match the shipping interface.
- The production API origin is HTTPS and contains no placeholder or test host.

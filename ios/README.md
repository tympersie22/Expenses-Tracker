# Expenses Tracker for iOS

A native SwiftUI application for iOS 17 and later. No WebView, bundled demo records, or separate financial database. The iOS and web clients use the same authenticated API and PostgreSQL ledger.

## Run

1. Start the backend at `http://localhost:3120`, with `APP_ORIGIN=http://localhost:3120` and a configured PostgreSQL `DATABASE_URL` (see the root README).
2. Open `ExpensesTracker.xcodeproj` in Xcode, choose the ExpensesTracker scheme and an iPhone simulator, then Run. The generated project is included; XcodeGen is only required after editing `project.yml`.
3. Create an account or sign in with an existing web account. Records persist on the server.

From a terminal, `./scripts/run-simulator.sh DEVICE_UDID` builds, installs, and launches the app. Use `xcrun simctl list devices available` to find a device. Build products live outside the repository.

Debug simulator builds connect to localhost. Release archives must receive `EXPENSES_TRACKER_API_URL`, `EXPENSES_TRACKER_PUBLIC_URL`, and `EXPENSES_TRACKER_DEVELOPMENT_TEAM` as protected build settings; the build fails when either origin is missing or is not HTTPS. A physical iPhone cannot use your Mac's localhost. HTTP is rejected for remote hosts; the transport exception is limited to local networking.

The local simulator API is managed by the `com.expensestracker.local-api` LaunchAgent. Its source configuration is in `scripts/com.expensestracker.local-api.plist`; the built runtime lives under `~/Library/Application Support/ExpensesTracker/runtime`, and logs are written to `/tmp/expenses-tracker-api.log` and `/tmp/expenses-tracker-api.error.log`.

## Architecture

- `Core/APIClient.swift`: ephemeral URLSession transport, no redirects, exact-origin requests, session cookies stored in Keychain with `WhenUnlockedThisDeviceOnly`, never UserDefaults. Credentials are not retained. Server-side sessions remain revocable.
- `Core/AppStore.swift`: main-actor observable state, authentication, server snapshots, mutation/refresh lifecycle, and a protected offline read cache with last-synced state. Exports use protected temporary files.
- `Core/Models.swift`: typed API contract, Decimal money conversion and locale-aware formatting. API amounts remain exact strings in minor units. Double is used only for visual progress.
- `Core/CurrencyData.swift`: shared currency precision metadata from the web server.
- `Core/StatementCSV.swift`: bounded, validated CSV parsing with quoted-field support.
- `Views`: native navigation, sheets, entry forms, activity, plans, settings, import/export. Transactions and account creation use stable request IDs for network retries. All ownership checks and ledger transactions remain on the backend.

## Design and motion

Warm adaptive surfaces, forest-green balance cards, lime accents, serif headlines, SF Symbols, and native materials. Shared components live in `DesignSystem.swift`. Native sheet transitions, spring tab selection with matched geometry, gentle screen arrivals, numeric text transitions, press feedback, and success/selection haptics provide motion. Reduce Motion disables custom movement. Dynamic Type, VoiceOver labels, 44-point controls, dark appearance, hidden amounts, and an inactive-app privacy cover are included.

## Verification

```sh
xcodebuild -project ExpensesTracker.xcodeproj -scheme ExpensesTracker \
  -destination 'platform=iOS Simulator,id=DEVICE_UDID' \
  -derivedDataPath /tmp/expenses-tracker-ios-build test
```

Keep simulator code signing enabled. Disabling signing removes the application identifier entitlement and prevents the app from saving its revocable session token in Keychain.

Unit tests cover decimal scaling, zero/three-decimal currencies, timezone boundaries, CSV validation, and HTTPS enforcement. The UI test requires the local backend. It creates an isolated `ios-ui-...@example.test` user through the signup API, signs in through the native form, adds an account and expense through native forms, relaunches to verify persistence, and signs out. Remove only these test users from the development database after verification. Never point this UI test at a production database.

## Launch boundaries

This is a working manual-finance client, not a bank connection or payment service. “Record as paid” records an expense; it does not send money. Currency overviews remain separate. Background bank synchronization, push reminders, production credentials, App Store signing, and distribution require external provider configuration. Offline writes are intentionally unavailable; the app never invents a successful financial record.

#!/bin/bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
simulator_id="${1:?Pass an available iOS simulator UDID}"
derived_path="${EXPENSES_TRACKER_DERIVED_DATA:-/tmp/expenses-tracker-ios-build}"
curl --fail --silent --max-time 5 http://localhost:3120/api/health >/dev/null || { echo "Start the Expenses Tracker backend at http://localhost:3120 first." >&2; exit 1; }
xcrun simctl boot "$simulator_id" 2>/dev/null || true
xcrun simctl bootstatus "$simulator_id" -b
xcodebuild -project "$project_root/ExpensesTracker.xcodeproj" -scheme ExpensesTracker -configuration Debug -destination "platform=iOS Simulator,id=$simulator_id" -derivedDataPath "$derived_path" CODE_SIGN_IDENTITY=- build
xcrun simctl install "$simulator_id" "$derived_path/Build/Products/Debug-iphonesimulator/ExpensesTracker.app"
xcrun simctl launch "$simulator_id" com.expensestracker.app

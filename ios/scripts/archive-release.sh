#!/bin/bash
# archive: locally export an App Store IPA; upload: submit it to App Store Connect.
# validate: unsigned device archive, with no contact with Apple or upload.
set -euo pipefail
mode="${1:-validate}"
case "$mode" in validate|archive|upload) ;; *) echo "Use validate, archive, or upload" >&2; exit 2;; esac
project_root="$(cd "$(dirname "$0")/../.." && pwd)"
export RELEASE_ACTION="$mode"
python3 "$project_root/ios/scripts/validate-release.py"
output="${EXPENSES_TRACKER_RELEASE_DIR:-$project_root/ios/build/release}"
mkdir -p "$output"
options=( -project "$project_root/ios/ExpensesTracker.xcodeproj" -scheme ExpensesTracker -configuration Release -destination 'generic/platform=iOS' -archivePath "$output/ExpensesTracker.xcarchive" -derivedDataPath "$output/DerivedData" "EXPENSES_TRACKER_API_URL=$EXPENSES_TRACKER_API_URL" "EXPENSES_TRACKER_PUBLIC_URL=$EXPENSES_TRACKER_PUBLIC_URL" "CURRENT_PROJECT_VERSION=${EXPENSES_TRACKER_BUILD_NUMBER:-1}" )
if [ "$mode" = validate ]; then
  xcodebuild -quiet "${options[@]}" CODE_SIGNING_ALLOWED=NO archive
  echo "Unsigned device archive validated. This is not an App Store upload."
  exit 0
fi
options+=( "EXPENSES_TRACKER_DEVELOPMENT_TEAM=$EXPENSES_TRACKER_DEVELOPMENT_TEAM" -allowProvisioningUpdates )
auth=()
if [ -n "${APP_STORE_CONNECT_KEY_PATH:-}" ]; then
  auth=( -authenticationKeyPath "$APP_STORE_CONNECT_KEY_PATH" -authenticationKeyID "$APP_STORE_CONNECT_KEY_ID" -authenticationKeyIssuerID "$APP_STORE_CONNECT_ISSUER_ID" )
fi
xcodebuild -quiet "${options[@]}" "${auth[@]}" archive
export RELEASE_OUTPUT="$output"
python3 - <<'PY'
import os, plistlib
values = {'method':'app-store-connect', 'destination':'upload' if os.environ['RELEASE_ACTION']=='upload' else 'export', 'teamID':os.environ['EXPENSES_TRACKER_DEVELOPMENT_TEAM'], 'signingStyle':'automatic', 'uploadSymbols':True, 'manageAppVersionAndBuildNumber':False}
with open(os.path.join(os.environ['RELEASE_OUTPUT'], 'ExportOptions.plist'), 'wb') as f: plistlib.dump(values,f)
PY
xcodebuild -exportArchive -archivePath "$output/ExpensesTracker.xcarchive" -exportPath "$output/export" -exportOptionsPlist "$output/ExportOptions.plist" -allowProvisioningUpdates "${auth[@]}"

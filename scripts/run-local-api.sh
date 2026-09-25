#!/bin/zsh
set -eu
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

runtime="${HOME}/Library/Application Support/ExpensesTracker/runtime"
server="$runtime/.next/standalone/server.js"
if [[ ! -f "$server" || ! -f "$runtime/.next/BUILD_ID" ]]; then
  print -u2 "Expenses Tracker runtime is not built. Run npm ci and npm run build in the project."
  exit 1
fi

set -a
source "$runtime/.env"
set +a
# Bind the local development server on IPv6's unspecified address. Node accepts
# IPv4-mapped connections too, so both localhost resolutions work in Simulator.
export HOSTNAME=::
export PORT=3120
cd "$runtime/.next/standalone"
exec /usr/local/bin/node server.js

#!/usr/bin/env bash
set -euo pipefail
alias_name="${1:-Elaro}"
# Ensure DevHub exists
if ! sf org list --json | grep -q '"isDevHub": true'; then
  echo "Please auth a DevHub first: sf org login web -d -a DevHub"
fi
sf org create scratch -f config/elaro-scratch-def.json -a "$alias_name" --set-default -y 7
sf project deploy start -o "$alias_name"
sf org assign permset -n Elaro_Admin -o "$alias_name"
echo "Open org..."
sf org open -o "$alias_name" -p /lightning/setup/SetupOneHome/home

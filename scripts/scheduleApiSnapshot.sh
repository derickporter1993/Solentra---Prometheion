#!/usr/bin/env bash
# Schedules hourly API usage snapshots
# Usage: ./scripts/scheduleApiSnapshot.sh Prometheion
alias_name="${1:-Prometheion}"
# Schedule (top of hour, hourly)
sf apex run -u "$alias_name" -f /dev/stdin <<'APEX'
System.schedule('Prometheion_API_Snapshot', '0 0 * * * ?', new ApiUsageSnapshot());
APEX

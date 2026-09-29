#!/bin/sh
set -eu

echo "[NEVERA-RUFLO] Checking Ruflo installation..."
npx ruflo@latest doctor --fix

echo "[NEVERA-RUFLO] Starting background daemon..."
npx ruflo@latest daemon start

echo "[NEVERA-RUFLO] Ensuring hierarchical specialized swarm exists..."
npx ruflo@latest swarm status >/dev/null 2>&1 ||   npx ruflo@latest swarm init --topology hierarchical --max-agents 6 --strategy specialized

echo "[NEVERA-RUFLO] Service is running."
echo "[NEVERA-RUFLO] Real-money operations remain disabled by NEVERA safety policy."

# Ruflo's daemon runs as a background process. Keep this Railway service alive.
while :; do
  sleep 60
done

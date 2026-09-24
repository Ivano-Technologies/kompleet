#!/usr/bin/env bash
# Provision an isolated Convex deployment for CI e2e (path B).
#
# Auth stays on Supabase. This only needs a live Convex HTTP URL so
# Playwright's local `pnpm dev` can call queries/mutations.
#
# Preference:
#   1. NEXT_PUBLIC_CONVEX_URL already set (and not the CI placeholder)
#   2. CONVEX_AGENT_MODE=anonymous + `convex dev` (isolated; no team deploy)
#
# Do not use `npx convex deploy` here — that is production-only.

set -euo pipefail

PLACEHOLDER="https://placeholder.convex.cloud"
LOG="${CONVEX_DEV_LOG:-/tmp/convex-dev-e2e.log}"
PID_FILE="${CONVEX_DEV_PID_FILE:-/tmp/convex-dev-e2e.pid}"

write_github_env() {
  local url="$1"
  if [[ -n "${GITHUB_ENV:-}" ]]; then
    echo "NEXT_PUBLIC_CONVEX_URL=${url}" >> "${GITHUB_ENV}"
  fi
}

if [[ -n "${NEXT_PUBLIC_CONVEX_URL:-}" && "${NEXT_PUBLIC_CONVEX_URL}" != "${PLACEHOLDER}" ]]; then
  echo "Using existing NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}"
  write_github_env "${NEXT_PUBLIC_CONVEX_URL}"
  exit 0
fi

export CONVEX_AGENT_MODE="${CONVEX_AGENT_MODE:-anonymous}"

: > "${LOG}"
# Keep the process alive so the anonymous session stays available for the job.
# Codegen is disabled so CI does not rewrite committed convex/_generated.
pnpm exec convex dev --typecheck=disable --codegen=disable --tail-logs disable \
  >> "${LOG}" 2>&1 &
echo $! > "${PID_FILE}"

extract_url() {
  local line url
  if [[ -f .env.local ]]; then
    line="$(grep -E '^NEXT_PUBLIC_CONVEX_URL=' .env.local | tail -n1 || true)"
    if [[ -n "${line}" ]]; then
      url="${line#NEXT_PUBLIC_CONVEX_URL=}"
      url="${url%\"}"
      url="${url#\"}"
      url="${url%\'}"
      url="${url#\'}"
      printf '%s' "${url}"
      return 0
    fi
  fi
  grep -Eo 'https?://[^[:space:]]+' "${LOG}" \
    | grep -E 'convex\.cloud|127\.0\.0\.1:[0-9]+|localhost:[0-9]+' \
    | tail -n1 || true
}

functions_ready() {
  grep -Fq 'Convex functions ready' "${LOG}"
}

# Anonymous local backends write the URL to .env.local before the first
# function push. Wait for both the URL and a successful push so e2e does
# not race "Missing NEXT_PUBLIC_CONVEX_URL" → empty schema.
url=""
for _ in $(seq 1 90); do
  if [[ -z "${url}" ]]; then
    url="$(extract_url)"
  fi
  if [[ -n "${url}" ]] && functions_ready; then
    echo "Provisioned isolated Convex at ${url}"
    write_github_env "${url}"
    export NEXT_PUBLIC_CONVEX_URL="${url}"
    exit 0
  fi
  if ! kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
    echo "::error::convex dev exited before publishing a ready deployment" >&2
    cat "${LOG}" >&2
    exit 1
  fi
  sleep 2
done

echo "::error::Timed out waiting for Convex functions (180s)" >&2
echo "Last seen URL: ${url:-none}" >&2
cat "${LOG}" >&2
exit 1

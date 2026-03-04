#!/usr/bin/env bash
set -euo pipefail

# Enforce main branch protection for release-gated CI.
# Usage:
#   scripts/enforce-branch-protection.sh
#   scripts/enforce-branch-protection.sh owner/repo

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
OWNER="${REPO%/*}"
NAME="${REPO#*/}"

if [[ -z "${OWNER}" || -z "${NAME}" || "${OWNER}" == "${NAME}" ]]; then
  echo "Could not resolve owner/repo. Pass it explicitly, e.g. scripts/enforce-branch-protection.sh Innisfree7x/PersonalTerminal" >&2
  exit 1
fi

gh api \
  --method PUT \
  --header "Accept: application/vnd.github+json" \
  "repos/${OWNER}/${NAME}/branches/main/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Quality Checks",
      "E2E Blocker Suite (Authenticated, Serial)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON

echo "Branch protection updated for ${OWNER}/${NAME} (branch: main)."

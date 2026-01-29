#!/usr/bin/env bash
# List Supabase projects and push migrations using an access token.
# Usage:
#   export SUPABASE_ACCESS_TOKEN="sbp_xxxx..."
#   ./supabase/push-with-token.sh [PROJECT_REF]
# Or:
#   SUPABASE_ACCESS_TOKEN="sbp_xxxx..." ./supabase/push-with-token.sh [PROJECT_REF]

set -e
cd "$(dirname "$0")/.."

TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "Set SUPABASE_ACCESS_TOKEN (e.g. export SUPABASE_ACCESS_TOKEN=sbp_...)"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN="$TOKEN"

# Use npx if supabase not in PATH
SUPABASE_CMD="supabase"
command -v supabase >/dev/null 2>&1 || SUPABASE_CMD="npx supabase"

echo "=== Listing Supabase projects ==="
$SUPABASE_CMD projects list 2>/dev/null || $SUPABASE_CMD projects list

PROJECT_REF="$1"
if [ -z "$PROJECT_REF" ]; then
  echo ""
  echo "Pass a project ref to link and push, e.g.:"
  echo "  ./supabase/push-with-token.sh YOUR_PROJECT_REF"
  echo "Get PROJECT_REF from: Dashboard → Project → Settings → General → Reference ID"
  exit 0
fi

echo ""
echo "=== Linking project ref: $PROJECT_REF ==="
$SUPABASE_CMD link --project-ref "$PROJECT_REF"

echo ""
echo "=== Pushing migrations ==="
$SUPABASE_CMD db push

echo ""
echo "Done. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env from Dashboard → Settings → API."

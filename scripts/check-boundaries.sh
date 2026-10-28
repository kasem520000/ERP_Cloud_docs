#!/usr/bin/env bash
set -euo pipefail
echo "=== Boundary negative test ==="
echo "Linting fixture that violates boundaries (should FAIL)..."

TMP_CFG=$(mktemp --suffix=.cjs)
cat > "$TMP_CFG" <<'JS'
const base = require('/home/user/ERP_Cloud_docs/.dependency-cruiser.cjs');
module.exports = { ...base, options: { ...base.options, exclude: {} } };
JS

# Run depcruise; capture output regardless of exit code (it exits 1 on violations, which is expected)
set +e
pnpm exec depcruise --config "$TMP_CFG" apps/web/src/boundary-fixture 2>&1 | tee /tmp/boundary-depcruise.log
DEP_EXIT=${PIPESTATUS[0]}
set -e
# DEP_EXIT 1 means violations found — which is what we want
if grep -q "no-web-to-api" /tmp/boundary-depcruise.log; then
  echo "✓ dependency-cruiser correctly detected boundary violation (exit $DEP_EXIT)"
  cat /tmp/boundary-depcruise.log
else
  echo "✗ NEGATIVE TEST FAILED: dependency-cruiser did NOT detect violation (exit $DEP_EXIT)"
  cat /tmp/boundary-depcruise.log || true
  rm -f "$TMP_CFG"
  exit 1
fi

rm -f "$TMP_CFG"
echo "✓ Negative test PASSED: fixture correctly fails boundary checks (enforcement works)"
exit 0

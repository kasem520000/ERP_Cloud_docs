#!/usr/bin/env bash
set -euo pipefail
# Provisional UI parity check — verifies AR/EN strings exist for auth keys
node -e "
const en = JSON.parse(require('fs').readFileSync('apps/api/src/infra/i18n/auth.json','utf8')).en;
const ar = JSON.parse(require('fs').readFileSync('apps/api/src/infra/i18n/auth.json','utf8')).ar;
const keys = ['auth.login','auth.email','auth.password','auth.login_failed','auth.account_locked'];
for (const k of keys) if (!en[k] || !ar[k]) { console.error('Missing i18n', k); process.exit(1); }
console.log('i18n parity GREEN: ' + keys.length + ' keys in en+ar');
"
# Check screens exist
test -f 'apps/web/src/app/[locale]/login/page.tsx' && echo "login screen OK"
test -f 'apps/web/src/app/[locale]/users/page.tsx' && echo "users screen OK"

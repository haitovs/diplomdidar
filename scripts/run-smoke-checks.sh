#!/usr/bin/env sh
set -eu

node scripts/smoke-editor.mjs
node scripts/check-lifecycle-pages.mjs
node scripts/check-feedback-guards.mjs

echo "all smoke checks: PASSED"

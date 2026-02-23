#!/usr/bin/env sh
set -eu

node scripts/smoke-editor.mjs
node scripts/smoke-navigator.mjs
node scripts/check-lifecycle-pages.mjs
node scripts/check-feedback-guards.mjs
node scripts/check-react-page-controls.mjs
node scripts/smoke-simulation-actions.mjs

echo "all smoke checks: PASSED"

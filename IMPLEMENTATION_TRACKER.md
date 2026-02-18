# Project Stabilization Tracker

Last updated: 2026-02-18

## Scope
- Stabilize simulation logic and UI interactions.
- Find and remove runtime bugs.
- Improve maintainability of event wiring and state flow.

## P0 Critical Fixes
- [x] Fix play/pause dead state caused by mismatched controller/UI state.
- [x] Remove duplicate event listeners for traffic pattern and rewind in simulation page.
- [x] Fix node dragging coordinate system bug (normalized vs pixel coordinates).
- [x] Remove broken zoom handlers referencing undefined `zoom` variable in playground.

## P1 Editor Stability Fixes
- [x] Fix `TopologyEditor` event-listener cleanup and avoid orphaned handlers.
- [x] Rework `TopologyEditor` undo/redo history so redo can restore forward states.
- [x] Normalize editor pointer coordinates using renderer transform for pan/zoom correctness.

## P2 Rendering Hardening
- [x] Reset renderer transform around frame clear/render cycle.

## P3 Page Lifecycle Stability
- [x] Add shared lifecycle utility for managed listeners/timers/RAF.
- [x] Wire lifecycle cleanup into `simulation.html`.
- [x] Wire lifecycle cleanup into `analytics.html`.
- [x] Wire lifecycle cleanup into `playground-v2.html`.

## P4 Smoke Checks
- [x] Add editor flow smoke checks (add, undo, redo, clear, transform mapping, destroy cleanup).
- [x] Add lifecycle regression checks for managed HTML pages.
- [x] Add one-command smoke runner.

## P5 Dead-Code Cleanup
- [x] Remove unreachable legacy modules not imported by active pages.
- [x] Remove unused static assets and stale file artifacts.
- [x] Align repository documentation with the active runtime structure.

## Change Log
### 2026-02-18
- Updated `simulation.html`:
  - Reworked play button logic to use controller state (`simController.isRunning`) and `togglePause()`.
  - Removed duplicate traffic-pattern click handlers.
  - Removed duplicate rewind click handler.
  - Fixed node dragging updates to pass pixel coordinates to renderer.
  - Updated auto-start check to rely on controller state instead of local flag.
- Updated `playground-v2.html`:
  - Removed trailing `zoom` listeners that threw runtime errors.
- Updated `src/playground/TopologyEditor.js`:
  - Bound and tracked all event listeners for correct teardown in `destroy()`.
  - Reworked history model to snapshot post-mutation state and fixed undo/redo navigation.
  - Added transform-aware coordinate conversion for click/double-click/context-menu/drop interactions.
- Updated `src/rendering/CanvasRenderer.js`:
  - Added explicit transform reset before clear and after scene render to prevent transform carryover artifacts.
- Added `src/utils/lifecycle.js`:
  - Introduced `LifecycleManager` to track listeners, timeouts, intervals, and RAF IDs with a single cleanup call.
- Updated `simulation.html`:
  - Switched page-level listeners/timeouts to lifecycle-managed registration.
  - Replaced per-render failure-action listener attachment with delegated click handling.
  - Added unload teardown for lifecycle, simulation controller, and renderer.
- Updated `analytics.html`:
  - Switched listeners/simulation interval to lifecycle-managed registration.
  - Added unload teardown for lifecycle, renderer, analytics panel, and node detail view.
- Updated `playground-v2.html`:
  - Switched page-level listeners to lifecycle-managed registration.
  - Added unload teardown for lifecycle, renderer, topology editor, palette, and property editor.
- Added `scripts/smoke-editor.mjs`:
  - Automated smoke checks for topology editor core flows: add, undo, redo, link restore, clear/undo, transform mapping, transformed click path, import/export stubs, listener cleanup.
- Added `scripts/check-lifecycle-pages.mjs`:
  - Automated regression checks ensuring lifecycle wiring remains in place and raw listeners/timers do not reappear in key pages.
- Added `scripts/run-smoke-checks.sh`:
  - Runs all smoke suites in one command.
- Added `src/ui/feedback.js`:
  - Centralized bounded toast and log managers (`createToastManager`, `createLogManager`) to control dynamic UI growth.
- Updated `simulation.html`:
  - Replaced inline toast/log implementations with feedback managers.
  - Kept consistent log cap and added explicit feedback cleanup on unload.
- Added `scripts/check-feedback-guards.mjs`:
  - Added rapid-action regression checks for toast/log caps and teardown via clear/remove behavior.
- Updated `simulation.html`:
  - Corrected desktop/mobile alignment of header controls, sidebars, metrics blocks, and quick actions.
  - Added responsive breakpoints for stable panel stacking and canvas-first flow on small viewports.
- Updated `analytics.html`:
  - Corrected header/control alignment, sidebar sizing, and time-control behavior under narrow widths.
  - Added responsive single-column fallback for consistent mobile readability.
- Updated `playground-v2.html`:
  - Fixed toolbar container structure/alignment and horizontal overflow behavior.
  - Added responsive stacking and overlay adjustments for editor usability on tablets/phones.
- Updated `demo-v2.html`:
  - Improved header/control wrapping, panel sizing, and stats-bar behavior across breakpoints.
- Added `Makefile`:
  - Introduced `make smoke` as CI-friendly wrapper for the smoke suite.
- Verified smoke suite execution:
  - `./scripts/run-smoke-checks.sh` passed.
- Removed unreachable files:
  - `src/components/analytics.js`, `src/components/timeline.js`
  - `src/config.js`
  - `src/data/simulationData.js`
  - `src/export/export.js`
  - `src/simulation/alerts.js`, `src/simulation/engine.js`
  - `src/state/store.js`
  - `src/ui/inspector.js`, `src/ui/liveFeed.js`, `src/ui/metrics.js`, `src/ui/valueDisplays.js`
  - `src/utils/accessibility.js`, `src/utils/dom.js`, `src/utils/keyboard.js`
  - `styles/main.css`, `assets/blueprint.svg`, `icons/laptop.svg`
  - `.DS_Store` artifacts from repo root and `src/`
- Updated docs to match active structure:
  - `README.md` project structure and customization notes
  - `icons/README.md` icon inventory aligned with current device config
- Re-verified regression coverage after cleanup:
  - `./scripts/run-smoke-checks.sh` passed
  - `make smoke` passed
- Updated `simulation.html`:
  - Tightened mobile header/control layout with grid-based action stacking and full-width speed controls.
  - Added sidebar scrollbar-gutter stability and non-blocking toast container pointer behavior.
- Updated `analytics.html`:
  - Hardened responsive header controls (2-column mobile grid + full-width actionable items).
  - Improved speed-control wrapping and sidebar scroll stability on narrow widths.
- Updated `playground-v2.html`:
  - Improved mobile toolbar/action alignment with full-width grouped controls and better overlay spacing.
  - Added sidebar scroll-gutter stability to reduce layout jitter.
- Updated `demo-v2.html`:
  - Normalized mobile control bar into a predictable grid with full-width back action.
  - Converted stats bar to responsive grid for stable metric alignment on phones.
- Updated `index-v2.html`:
  - Added mobile bottom padding (including safe-area inset support) so fixed mobile nav does not overlap content.
- Attempted browser automation visual QA:
  - Local Safari WebDriver session creation was blocked by missing Safari setting: `Allow remote automation`.
  - Applied and verified responsive fixes via code-level QA and regression smoke checks.

## Next In Queue
- [x] Expand editor smoke checks to include zoom-aware pointer interaction (`handleClick` path) and import/export stubs.
- [x] Add teardown checks for dynamically created UI elements (toasts/log entries) under rapid actions.
- [x] Add a CI-friendly command wrapper once project-level scripts/tooling are introduced.
- [ ] Re-run screenshot-driven visual QA (375px, 768px, 1280px) after enabling Safari setting `Allow remote automation`.

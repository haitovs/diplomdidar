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

## P6 Functional Training Baseline
- [x] Add shared topology schema normalization for runtime/editor consistency.
- [x] Expand editor property controls with network-training parameters (IP/subnet/VLAN/routing/link QoS).
- [x] Load normalized topology from playground into simulation flow.

## P7 Deterministic Engine Baseline
- [x] Remove random-driven runtime metrics in favor of deterministic, parameter-driven formulas.
- [x] Tie traffic and link health calculations to topology schema parameters (capacity, latency, jitter, packet loss).
- [x] Add scenario objective evaluation and pass/fail scoring.

## P8 Analysis Workflow Usefulness
- [x] Persist latest lab report from simulation for cross-page analysis.
- [x] Replace analytics random demo loop with deterministic simulation controller playback.
- [x] Add report-aware analytics summary with objective status and next-step recommendations.

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
- Updated project naming/purpose alignment:
  - Removed legacy personal branding from all user-facing pages/docs/scripts.
  - Standardized naming to `Network Training Simulator` across titles, headers, redirect page, and launcher script.
  - Added explicit diploma-purpose statement in `README.md` for practical networking-course training goals.
- Added `src/utils/topologySchema.js`:
  - Introduced shared topology normalization/defaulting for nodes and links (`normalizeTopology`, `normalizeNode`, `normalizeLink`, `serializeTopology`).
  - Added training-oriented defaults for routing role/protocol, interface speed, VLAN, and link quality parameters.
- Updated `src/playground/TopologyEditor.js`:
  - Wired add/load/update/export flows through schema normalization.
  - Added `updateLink` and `getSerializableTopology` to support structured link edits and clean export payloads.
  - Stabilized id-counter derivation after import to avoid id collisions.
- Updated `src/playground/PropertyEditor.js`:
  - Expanded node form with routing role/protocol, IP/subnet/gateway, VLAN, and interface speed fields.
  - Expanded link form with jitter, packet loss, duplex, utilization cap, and queue limit fields.
  - Added numeric input clamping helper to reduce invalid data entry.
- Updated `playground-v2.html`:
  - Wired property changes for links via `editor.updateLink(...)`.
  - Switched simulation handoff to serialize topology and open `simulation.html` (build -> simulate flow).
- Updated `simulation.html`:
  - Added normalized load path for topology from `localStorage.playground-topology` with safe fallback to default topology.
  - Added startup log entry when simulation runs with playground-authored topology.
- Updated `simulation.html`:
  - Added `Open Analytics` action in Lab Results to sync the latest run and move directly to `analytics.html`.
  - Refactored report export flow into reusable build/persist/download steps.
  - Persisted latest lab report in `localStorage` (`network-training-lab-report-latest`) for cross-page analysis.
- Updated `src/engine/TrafficGenerator.js`:
  - Replaced random burst/load generation with deterministic time-phase wave calculations.
  - Added parameter-aware node throughput/latency and link utilization/flow/loss/jitter calculations.
- Updated `src/analytics/MetricsCollector.js`:
  - Replaced random latency/jitter sampling with deterministic aggregation from node/link runtime data.
  - Reworked throughput, active connections, packet loss, and energy metrics to use topology-aware calculations.
- Updated `src/engine/SimulationController.js`:
  - Removed random load reset behavior and switched reset state to deterministic baseline derived from topology fields.
- Updated `analytics.html`:
  - Replaced random mock loop with `SimulationController`-driven deterministic playback.
  - Added report import workflow and local latest-report loading.
  - Added Lab Assessment section with scenario score/status, objective snapshot, and targeted remediation recommendations.
  - Added immediate first-sample metrics update after startup so dashboard cards do not stay at zero on initial render.
- Updated `playground-v2.html`:
  - Added starter topology auto-load when no saved topology exists to avoid empty-canvas dead start.
  - Added topology auto-save to local storage on each topology change.
  - Changed Simulate action to same-tab navigation for reliable handoff (no popup blocker issues).
  - Improved editor guidance with step-by-step quick tips for add/link/edit/simulate workflow.
  - Fixed mode behavior so Add Node always has a selected device and mode button state is explicit.
  - Added node/link selection callbacks to keep property panel in sync and clear cleanly.
- Updated `index-v2.html`:
  - Reduced landing-page navigation to a single course flow: Build -> Run -> Analyze.
  - Removed demo-first links from top/footer/mobile navigation to reduce user confusion.
  - Updated hero/feature copy to reflect practical lab workflow rather than showcase mode.
- Updated `simulation.html`:
  - Added `Edit Topology` action to round-trip current topology back into playground editing.
  - Replaced fragile click-based auto-start with explicit controller startup + UI-state sync after topology load.
- Updated `src/playground/TopologyEditor.js`:
  - Added resilient Add Node fallback (`switch`) when no pending device is set.
  - Added link hit-testing for select/delete operations and link callback support for property editing.
  - Hardened drag/drop device extraction for Safari-compatible MIME types.
  - Added direct node dragging in Select mode with grid snap-on-drop, history integration, and click suppression after drag.
- Updated `src/playground/DevicePalette.js`:
  - Added multi-type `dataTransfer.setData(...)` for cross-browser drag/drop reliability.
  - Added programmatic device selection API used by toolbar mode flow.
- Updated `src/engine/TrafficGenerator.js`:
  - Reworked runtime logic from decorative per-node waves to deterministic path-based flow routing.
  - Added shortest-path traffic routing, per-link routed demand accumulation, dropped-demand tracking, and topology-aware congestion behavior.
  - Added runtime node status normalization (`healthy/degraded/warning/critical`) derived from actual computed load each tick.
- Updated `src/engine/SimulationController.js`:
  - Exposed runtime traffic stats (`activeFlows`, `droppedDemandMbps`) in tick payload and state snapshot.
- Updated `simulation.html`:
  - Added runtime traffic indicators (active flows and dropped demand) to Simulation Info panel for visible, interpretable scenario behavior.
- Re-verified regression suite:
  - `./scripts/run-smoke-checks.sh` passed.
  - `make smoke` passed.

### 2026-02-20
- Migrated application shell to React (`web/`) with route-based workflow:
  - Added `web/` app scaffold (Vite + React Router) with pages for `/`, `/playground`, `/simulation`, `/analytics`.
  - Added unified React navigation and responsive app layout styles.
- Implemented React-integrated playground:
  - Wired `CanvasRenderer`, `CanvasNavigator`, `TopologyEditor`, `DevicePalette`, and `PropertyEditor` into `web/src/pages/PlaygroundPage.jsx`.
  - Added topology persistence/import/export and handoff from Playground to Simulation using `localStorage`.
- Implemented React-integrated simulation:
  - Wired `SimulationController` + `MetricsCollector` into `web/src/pages/SimulationPage.jsx`.
  - Added pattern selection, speed controls, failure/recovery actions, report export, and round-trip edit flow back to Playground.
- Implemented analytics report page in React:
  - Added report import + local latest-report load in `web/src/pages/AnalyticsPage.jsx`.
  - Added topology preview canvas and report KPI snapshot display.
- Updated deployment/runtime for React:
  - Replaced static-file Docker flow with multi-stage build serving `web/dist` via Nginx.
  - Updated `run.sh` to run React dev server from `web/`.
  - Updated `README.md` to reflect React architecture and workflow.
- Reorganized root structure:
  - Moved previous root HTML pages into `legacy/` (`index.html`, `index-v2.html`, `playground-v2.html`, `simulation.html`, `analytics.html`).
  - Removed `demo-v2.html`.
- Added migration-focused smoke guard:
  - Updated `scripts/check-lifecycle-pages.mjs` to verify React routes/pages exist and legacy HTML is not present at root.
- Cross-route icon reliability:
  - Changed dynamic icon paths in reusable modules (`DevicePalette`, `PropertyEditor`, `NodeDetailView`) to use absolute `/icons/...` paths.
  - Updated React icon preloader to use `/icons/...`.
- Validation:
  - `./scripts/run-smoke-checks.sh` passed.
  - `docker compose config` passed.
  - Added page/control QA scripts:
    - `scripts/check-react-page-controls.mjs` validates route/page control wiring for Home, Playground, Simulation, and Analytics.
    - `scripts/smoke-simulation-actions.mjs` exercises runtime action paths behind simulation controls (pattern, speed, pause/resume, failure/recover, reset).
  - Expanded smoke runner:
    - `scripts/run-smoke-checks.sh` now includes React control-wiring checks and simulation action smoke checks.
  - Browser automation attempt:
    - Safari WebDriver session creation blocked by system setting: enable `Allow remote automation` in Safari Developer settings.

## Next In Queue
- [x] Expand editor smoke checks to include zoom-aware pointer interaction (`handleClick` path) and import/export stubs.
- [x] Add teardown checks for dynamically created UI elements (toasts/log entries) under rapid actions.
- [x] Add a CI-friendly command wrapper once project-level scripts/tooling are introduced.
- [ ] Re-run screenshot-driven visual QA (375px, 768px, 1280px) after enabling Safari setting `Allow remote automation`.
- [x] Replace random traffic math with deterministic tick-based KPI calculations using topology schema parameters.
- [x] Add scenario objective definitions and pass/fail evaluator (first lab set: classroom congestion, core-link failure, exam spike).
- [ ] Add report history comparison view (latest vs previous run) in analytics for instructor grading evidence.

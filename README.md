# Didar Network Simulation Lab

python -m http.server 4173

Design-first diploma template that showcases an interactive campus network for digital classrooms. The site runs fully on static assets (vanilla ES modules + Chart.js CDN) so it can be demoed without provisioning back-end services.

## Highlights

-   **Multiple specialized views** – Home page, enhanced demo, topology editor playground, full simulation, and analytics dashboard.
-   **Scenario-driven simulation** – swap traffic patterns (classroom, exam, lab, streaming, DDoS) and watch real-time network behavior.
-   **Animated backbone map** – icon-based nodes with live glow, tooltips, draggable nodes, and flowing packet visualization.
-   **Topology editor** – drag-and-drop playground to build custom network topologies with device palette and property editor.
-   **Traffic simulation** – realistic traffic patterns with failure scenarios, cascading failures, and recovery mechanisms.
-   **Live analytics** – real-time metrics collection with charts, node details, and network health monitoring.
-   **Node inspector** – click any icon to see hardware, software, role, and live load metrics.
-   **Interactive controls** – simulation speed control, pattern selection, failure triggers, and traffic spike simulation.
-   **Health + alerting** – network status monitoring with event logs and toast notifications.
-   **Professional rendering** – particle system for packet animation, glow effects, and smooth transitions.

## Getting started

1. **Install nothing:** open `index-v2.html` (or just `index.html` which redirects) directly in a modern browser; ES modules + CDN assets handle everything.
2. **Optional local server:** for clean module loading you can run one of the following from the project root:

    ```bash
    # Python
    python -m http.server 4173

    # Or, if Node is available
    npx serve .
    ```

    Then browse to `http://localhost:4173`.

## Application Pages

-   **`index-v2.html`** – Home page with navigation to all features
-   **`demo-v2.html`** – Enhanced visualization demo with controls
-   **`playground-v2.html`** – Topology editor with drag-and-drop interface
-   **`simulation.html`** – Full simulation with traffic patterns and failure scenarios
-   **`analytics.html`** – Analytics dashboard with live metrics

## Project structure

```
index-v2.html           # Modern home page with navigation
demo-v2.html            # Enhanced visualization demo
playground-v2.html      # Topology editor playground
simulation.html         # Full simulation interface
analytics.html          # Analytics dashboard
styles/
  design-system.css     # Design tokens and utilities
  micro-interactions.css# Animation and interaction styles
  responsive.css        # Mobile and responsive layouts
src/
  analytics/            # Metrics collector, analytics panel, node details
  engine/               # Simulation controller, traffic generator, failure simulator
  playground/           # Device palette, topology editor, property editor
  rendering/            # Canvas renderer, node/link rendering, particles
  ui/feedback.js        # Toast/log UI manager for bounded dynamic feedback
  utils/lifecycle.js    # Shared lifecycle cleanup utility
icons/                  # Network device icons (SVG)
```

## Customization ideas

-   **Scenarios**: Extend traffic patterns in `src/engine/TrafficGenerator.js` with custom patterns.
-   **Failure behavior**: Tune failure types and recovery logic in `src/engine/FailureSimulator.js`.
-   **Device icons**: Drop your own SVG/PNG art into `icons/` (see `icons/README.md`) to brand each device type.
-   **Topology presets**: Update preset graphs directly in `playground-v2.html` and `simulation.html`.
-   **Rendering**: Customize visual effects in `src/rendering/` (particle system, glow effects, colors).
-   **Export**: Add report/export flows by extending page-level controls in `simulation.html` or `analytics.html`.
-   **Analytics**: Add custom metrics in `src/analytics/MetricsCollector.js` to track specific KPIs.

## Next steps for the diploma

-   Add a printable PDF report (see CTA buttons in the footer) by scripting `window.print()` with a custom stylesheet.
-   Bring in geospatial data (Mapbox/Leaflet) if you want to contrast physical topology vs. logical view.
-   Replace the static Chart.js dataset with aggregated metrics from your simulator or benchmark spreadsheets.

This template is ready to present as-is while leaving ample room to demonstrate deeper engineering if time allows.

# Didar Network Simulation Lab

python -m http.server 4173

Design-first diploma template that showcases an interactive campus network for digital classrooms. The site runs fully on static assets (vanilla ES modules + Chart.js CDN) so it can be demoed without provisioning back-end services.

## Highlights

-   **Scenario-driven topology** – swap weekday peak, exams, maintenance, STEM open day, office sprint, or weekend market presets and watch the canvas retune.
-   **Animated backbone map** – icon-based nodes with live glow, tooltips, draggable nodes, and bendable handles.
-   **Flowing packets** – data pulses traverse each wire so the backbone feels alive (speed adjusts with load).
-   **Class traffic timeline** – responsive schedule bars that light up as the simulation clock advances.
-   **Live class feed** – shows which rooms are active right now, their stream weight, and bandwidth draw.
-   **Class load levers** – streaming quality, devices-per-student, AI load, and guest-lock toggles that directly change the canvas and charts.
-   **Node inspector** – click any icon to see hardware, software, role, and live load.
-   **Playground page** – separate sandbox (`playground.html`) to place devices from the palette, wire them, and stream traffic.
-   **Health + alerting** – headroom/SLA bars plus a scrolling alert log that fires when thresholds are crossed.
-   **Movable UI pods** – thanks to `interact.js`, every control card (and even the hero CTA block) can be dragged to arrange the workspace mid-demo.

## Getting started

1. **Install nothing:** open `index.html` directly in a modern browser; ES modules + CDN assets handle everything.
2. **Optional local server:** for clean module loading you can run one of the following from the project root:

    ```bash
    # Python
    python -m http.server 4173

    # Or, if Node is available
    npx serve .
    ```

    Then browse to `http://localhost:4173`.

## Project structure

```
index.html              # Layout skeleton + component containers
styles/main.css         # Theme variables, layout, grid, cards, animations
src/
  main.js               # Orchestration + shared state + event wiring
  data/simulationData.js# Static datasets for nodes, schedules, insights
  components/           # Canvas, timeline, analytics, scenario logic (assistant/playfield kept for experiments)
  utils/dom.js          # Tiny helpers used across modules
assets/blueprint.svg    # Decorative hero blueprint
```

## Customization ideas

-   Feed the static datasets in `src/data/simulationData.js` from CSV exports or telemetry APIs.
-   Extend the scenario builder with per-campus toggles or Wi-Fi/5G slices and reflect them on the canvas.
-   Swap the alert rules in `src/main.js` for the thresholds you need to defend in your thesis.
-   Drop your own SVG/PNG art into `icons/` (see `icons/README.md` for filenames) to brand each node type.
-   Export slides: take screenshots of each scenario (the layout is presentation-ready on desktop widths).
-   Register your own topology preset (nodes + links) under `topologyPresets` and map it to a scenario for even more customised demos (node dragging + wire bending still works automatically).

## Next steps for the diploma

-   Add a printable PDF report (see CTA buttons in the footer) by scripting `window.print()` with a custom stylesheet.
-   Bring in geospatial data (Mapbox/Leaflet) if you want to contrast physical topology vs. logical view.
-   Replace the static Chart.js dataset with aggregated metrics from your simulator or benchmark spreadsheets.

This template is ready to present as-is while leaving ample room to demonstrate deeper engineering if time allows.

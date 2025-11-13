# Didar Network Simulation Lab

Design-first diploma template that showcases an interactive campus network for digital classrooms. The site runs fully on static assets (vanilla ES modules + Chart.js CDN) so it can be demoed without provisioning back-end services.

## Highlights
- **Scenario-driven topology** – switch between weekday peak, exams, maintenance, STEM open day, office sprint, or weekend market playbooks to see the canvas, nodes, and link structure change.
- **Animated backbone map** – canvas-based rendering of cores, access nodes, load glow, tooltips, draggable nodes, and quadratic links with bendable handles.
- **Class traffic timeline** – responsive schedule bars with pulse playback to narrate class traffic.
- **Analytics + AI card** – mocked utilization trend (Chart.js) and deterministic "AI assistant" log ready for storytelling.
- **Scenario builder + instruments** – docked/drag-able side pods consolidate all modifiable sliders, plus a stop button to pause playback instantly.
- **Simulation playbooks** – one-click office/school/market storylines auto-configure every control for live demos.
- **Reliability notebook** – horizontal scroll row of status chips per industry profile that can be edited to align with your diploma storyline.
- **Movable UI pods** – thanks to `interact.js`, every control card (and even the hero CTA block) can be dragged to arrange the workspace mid-demo.

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
  components/           # Canvas, timeline, analytics, assistant, scenario logic
  utils/dom.js          # Tiny helpers used across modules
assets/blueprint.svg    # Decorative hero blueprint
```

## Customization ideas
- Replace the static datasets in `src/data/simulationData.js` with real telemetry or CSV exports.
- Wire the assistant panel to a real API (OpenAI, Hugging Face, Azure OpenAI) by swapping out `generateInsight`.
- Extend the scenario builder with per-campus toggles or Wi-Fi/5G slices and reflect them on the canvas.
- Drive the playbook list from your own JSON so reviewers can pick scenarios relevant to your thesis scope.
- Export slides: take screenshots of each scenario (the layout is presentation-ready on desktop widths).
- Register your own topology preset (nodes + links) under `topologyPresets` and map it to a scenario for even more customised demos (node dragging + wire bending still works automatically).

## Next steps for the diploma
- Add a printable PDF report (see CTA buttons in the footer) by scripting `window.print()` with a custom stylesheet.
- Bring in geospatial data (Mapbox/Leaflet) if you want to contrast physical topology vs. logical view.
- Replace the static Chart.js dataset with aggregated metrics from your simulator or benchmark spreadsheets.

This template is ready to present as-is while leaving ample room to demonstrate deeper engineering if time allows.

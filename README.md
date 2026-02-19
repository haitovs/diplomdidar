# Network Training Simulator Lab

Practical training simulator for computer networking courses. The platform is focused on one learning workflow: build topology, run traffic/failure scenarios, inspect metrics, and explain bottlenecks with evidence.

## Clear Purpose

-   **Audience**: students and instructors in computer networking courses.
-   **Primary goal**: practice design, troubleshooting, and resiliency analysis in a safe lab environment.
-   **Learning outcome**: connect network configuration decisions to measurable effects (latency, throughput, loss, utilization).

## Highlights

-   **Multiple specialized views** – Home page, enhanced demo, topology editor playground, full simulation, and analytics dashboard.
-   **Scenario-driven simulation** – swap traffic patterns (classroom, exam, lab, streaming, DDoS) and watch real-time network behavior.
-   **Lab assessment workflow** – objective scoring (pass/in-progress/needs work), JSON report export, and direct handoff to analytics.
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
-   **`analytics.html`** – Analytics dashboard with deterministic playback, report import, and objective-focused recommendations

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


vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@127.0.0.1:80?security=none&type=ws&headerType=&path=%2F&host=#%F0%9F%91%A4%3A%20Papa-Med%20%E2%9C%85
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@google.com:443?security=tls&type=ws&headerType=&path=%2F%3Fed%3D2048&host=adf.spikeservice.top&sni=google.com&fp=chrome&alpn=h2%2Chttp%2F1.1&allowInsecure=1#%E2%8F%B3%3A%202026-03-31%20%3A%2047.86%20GB
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@204.69.207.50:443?security=tls&type=ws&headerType=&path=%2F&host=farhat.raxo13.store&sni=farhat.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%AB%F0%9F%87%B7%20cf%201.1
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@156.255.123.182:443?security=tls&type=ws&headerType=&path=%2F&host=farhat.raxo13.store&sni=farhat.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%AB%F0%9F%87%B7%20cf%201.2
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@188.95.12.122:443?security=tls&type=ws&headerType=&path=%2F&host=farhat.raxo13.store&sni=farhat.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%AB%F0%9F%87%B7%20cf%201.3
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@204.69.207.50:443?security=tls&type=ws&headerType=&path=%2F&host=islam.raxo13.store&sni=islam.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%AE%F0%9F%87%AA%20cf%201.4
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@156.255.123.182:443?security=tls&type=ws&headerType=&path=%2F&host=islam.raxo13.store&sni=islam.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%AE%F0%9F%87%AA%20cf%201.5
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@188.95.12.122:443?security=tls&type=ws&headerType=&path=%2F&host=islam.raxo13.store&sni=islam.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%AE%F0%9F%87%AA%20cf%201.6
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@204.69.207.50:443?security=tls&type=ws&headerType=&path=%2F&host=nedir.raxo13.store&sni=nedir.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%B3%F0%9F%87%B1%20cf%201.7
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@156.255.123.182:443?security=tls&type=ws&headerType=&path=%2F&host=nedir.raxo13.store&sni=nedir.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%B3%F0%9F%87%B1%20cf%201.8
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@188.95.12.122:443?security=tls&type=ws&headerType=&path=%2F&host=nedir.raxo13.store&sni=nedir.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%B3%F0%9F%87%B1%20cf%201.9
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@204.69.207.50:443?security=tls&type=ws&headerType=&path=%2F&host=ussat.raxo13.store&sni=ussat.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%BA%F0%9F%87%B8%20cf%201.10
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@156.255.123.182:443?security=tls&type=ws&headerType=&path=%2F&host=ussat.raxo13.store&sni=ussat.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%BA%F0%9F%87%B8%20cf%201.11
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@188.95.12.122:443?security=tls&type=ws&headerType=&path=%2F&host=ussat.raxo13.store&sni=ussat.raxo13.store&fp=chrome&alpn=h3%2Ch2%2Chttp%2F1.1&allowInsecure=1#%F0%9F%87%BA%F0%9F%87%B8%20cf%201.12
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@13.32.218.21:443?security=tls&type=ws&headerType=&path=%2F&host=d31k8s2dzutomy.cloudfront.net&sni=127.0.0.1&fp=chrome&alpn=http%2F1.1&allowInsecure=1#%F0%9F%87%AB%F0%9F%87%B7%20aw%202.1
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@13.32.218.10:443?security=tls&type=ws&headerType=&path=%2F&host=d2txwg6f9khyg9.cloudfront.net&sni=127.0.0.1&fp=chrome&alpn=http%2F1.1&allowInsecure=1#%F0%9F%87%AE%F0%9F%87%AA%20aw%202.2
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@13.32.218.17:443?security=tls&type=ws&headerType=&path=%2F&host=d1ywcv37xygcna.cloudfront.net&sni=127.0.0.1&fp=chrome&alpn=http%2F1.1&allowInsecure=1#%F0%9F%87%B3%F0%9F%87%B1%20aw%202.3
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@13.32.218.21:443?security=tls&type=ws&headerType=&path=%2F&host=dujhra4833sws.cloudfront.net&sni=127.0.0.1&fp=chrome&alpn=http%2F1.1&allowInsecure=1#%F0%9F%87%BA%F0%9F%87%B8%20aw%202.4
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@151.101.3.6:443?security=tls&type=xhttp&headerType=&path=%2F&host=remv.store&mode=packet-up&extra=%7B%22scMaxEachPostBytes%22%3A+100000%2C+%22scMaxConcurrentPosts%22%3A+100%2C+%22scMinPostsIntervalMs%22%3A+30%2C+%22xPaddingBytes%22%3A+%22100-1000%22%2C+%22noGRPCHeader%22%3A+true%2C+%22xmux%22%3A+%7B%22maxConnections%22%3A+16%2C+%22cMaxReuseTimes%22%3A+0%2C+%22hMaxRequestTimes%22%3A+%22600-900%22%2C+%22hMaxReusableSecs%22%3A+%221800-3000%22%2C+%22hKeepAlivePeriod%22%3A+0%7D%7D&sni=apps.apple.com&fp=firefox&alpn=h3&allowInsecure=1#%F0%9F%87%AB%F0%9F%87%B7%20fa%203.1
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@151.101.3.6:443?security=tls&type=xhttp&headerType=&path=%2F&host=raxa3.store&mode=packet-up&extra=%7B%22scMaxEachPostBytes%22%3A+100000%2C+%22scMaxConcurrentPosts%22%3A+100%2C+%22scMinPostsIntervalMs%22%3A+30%2C+%22xPaddingBytes%22%3A+%22100-1000%22%2C+%22noGRPCHeader%22%3A+true%2C+%22xmux%22%3A+%7B%22maxConnections%22%3A+16%2C+%22cMaxReuseTimes%22%3A+0%2C+%22hMaxRequestTimes%22%3A+%22600-900%22%2C+%22hMaxReusableSecs%22%3A+%221800-3000%22%2C+%22hKeepAlivePeriod%22%3A+0%7D%7D&sni=apps.apple.com&fp=firefox&alpn=h3&allowInsecure=1#%F0%9F%87%AE%F0%9F%87%AA%20fa%203.2
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@151.101.3.6:443?security=tls&type=xhttp&headerType=&path=%2F&host=raxa6.store&mode=packet-up&extra=%7B%22scMaxEachPostBytes%22%3A+100000%2C+%22scMaxConcurrentPosts%22%3A+100%2C+%22scMinPostsIntervalMs%22%3A+30%2C+%22xPaddingBytes%22%3A+%22100-1000%22%2C+%22noGRPCHeader%22%3A+true%2C+%22xmux%22%3A+%7B%22maxConnections%22%3A+16%2C+%22cMaxReuseTimes%22%3A+0%2C+%22hMaxRequestTimes%22%3A+%22600-900%22%2C+%22hMaxReusableSecs%22%3A+%221800-3000%22%2C+%22hKeepAlivePeriod%22%3A+0%7D%7D&sni=apps.apple.com&fp=firefox&alpn=h3&allowInsecure=1#%F0%9F%87%B3%F0%9F%87%B1%20fa%203.3
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@151.101.3.6:443?security=tls&type=xhttp&headerType=&path=%2F&host=raxo5.store&mode=packet-up&extra=%7B%22scMaxEachPostBytes%22%3A+100000%2C+%22scMaxConcurrentPosts%22%3A+100%2C+%22scMinPostsIntervalMs%22%3A+30%2C+%22xPaddingBytes%22%3A+%22100-1000%22%2C+%22noGRPCHeader%22%3A+true%2C+%22xmux%22%3A+%7B%22maxConnections%22%3A+16%2C+%22cMaxReuseTimes%22%3A+0%2C+%22hMaxRequestTimes%22%3A+%22600-900%22%2C+%22hMaxReusableSecs%22%3A+%221800-3000%22%2C+%22hKeepAlivePeriod%22%3A+0%7D%7D&sni=apps.apple.com&fp=firefox&alpn=h3&allowInsecure=1#%F0%9F%87%BA%F0%9F%87%B8%20fa%203.4
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@35.225.181.245:2847?security=none&type=tcp&headerType=&path=&host=#%F0%9F%87%BA%F0%9F%87%B8%20TCP
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@34.67.18.49:2847?security=none&type=tcp&headerType=&path=&host=#%F0%9F%87%BA%F0%9F%87%B8%20TCP
vless://81afb340-80ee-45e5-b450-1da29cd7ccd3@0.0.0.0:2847?security=none&type=tcp&headerType=&path=&host=#%D0%9E%D0%B1%D0%BD%D0%BE%D0%B2%D0%B8%20%D0%B5%D1%81%D0%BB%D0%B8%20%D0%BD%D0%B5%20%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%D0%B5%D1%82%21
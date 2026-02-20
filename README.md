# Network Training Simulator Lab

React-based network training simulator for diploma showcase and practical networking labs.

## Architecture

- Frontend app lives in `web/` (React + Vite).
- Core simulator logic remains reusable in root `src/` (engine, rendering, analytics, editor modules).
- Legacy static HTML pages were moved out of root to keep structure clean.

## Main Workflow

1. **Build** topology in `/playground`
2. **Run** simulation in `/simulation`
3. **Analyze** results in `/analytics`

## Local Development

```bash
./run.sh
```

Default local URL: `http://localhost:4040`

## Docker Deploy (HTTP only)

```bash
docker compose up -d --build
```

Open:

- `http://localhost:4040`
- `http://<server-ip>:4040`

Stop:

```bash
docker compose down
```

## Project Structure

```text
web/                      # React application (entrypoint)
  index.html
  package.json
  src/
src/                      # Core simulation/rendering/editor modules
styles/                   # Shared style tokens and utility styles
icons/                    # Device SVG icons
legacy/                   # Previous static HTML pages (archived)
Dockerfile
docker-compose.yml
nginx.conf
run.sh
scripts/
```

## Smoke checks

```bash
./scripts/run-smoke-checks.sh
```

## Notes

- HTTP only is intentional for diploma showcase.
- Deployment is optimized for simple `docker compose up -d --build` flow.

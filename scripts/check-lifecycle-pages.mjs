import { existsSync, readFileSync } from 'node:fs';

const failures = [];

function checkExists(path) {
  if (!existsSync(path)) {
    failures.push(`missing file: ${path}`);
  }
}

function ensureContains(path, snippet, message) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  if (!content.includes(snippet)) {
    failures.push(`${path}: ${message}`);
  }
}

['web/src/App.jsx', 'web/src/pages/PlaygroundPage.jsx', 'web/src/pages/SimulationPage.jsx'].forEach(checkExists);

ensureContains('web/src/App.jsx', "path=\"/playground\"", 'missing /playground route');
ensureContains('web/src/App.jsx', "path=\"/simulation\"", 'missing /simulation route');
ensureContains('web/src/pages/PlaygroundPage.jsx', 'new TopologyEditor', 'editor is not initialized');
ensureContains('web/src/pages/SimulationPage.jsx', 'PacketSimulationEngine', 'packet simulation engine is not initialized');

['index.html', 'index-v2.html', 'playground-v2.html', 'simulation.html', 'analytics.html'].forEach((path) => {
  if (existsSync(path)) {
    failures.push(`legacy root HTML still present: ${path}`);
  }
});

if (failures.length > 0) {
  console.error('check-lifecycle-pages: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('check-lifecycle-pages: PASSED');

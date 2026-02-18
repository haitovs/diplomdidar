import { readFileSync } from 'node:fs';

const pages = ['simulation.html', 'analytics.html', 'playground-v2.html'];
const failures = [];

function fail(page, message) {
  failures.push(`${page}: ${message}`);
}

for (const page of pages) {
  const content = readFileSync(page, 'utf8');

  if (!content.includes("import { LifecycleManager }")) {
    fail(page, 'missing LifecycleManager import');
  }

  if (!content.includes('const lifecycle = new LifecycleManager()')) {
    fail(page, 'missing lifecycle manager initialization');
  }

  if (!content.includes("on(window, 'beforeunload'")) {
    fail(page, 'missing beforeunload cleanup hook');
  }

  const rawListener = content.match(/\baddEventListener\s*\(/);
  if (rawListener) {
    fail(page, `raw addEventListener usage found at index ${rawListener.index}`);
  }

  const rawTimeout = content.match(/\bsetTimeout\s*\(/);
  if (rawTimeout) {
    fail(page, `raw setTimeout usage found at index ${rawTimeout.index}`);
  }

  const rawInterval = content.match(/\bsetInterval\s*\(/);
  if (rawInterval) {
    fail(page, `raw setInterval usage found at index ${rawInterval.index}`);
  }
}

if (failures.length > 0) {
  console.error('check-lifecycle-pages: FAILED');
  failures.forEach((msg) => console.error(`- ${msg}`));
  process.exit(1);
}

console.log('check-lifecycle-pages: PASSED');

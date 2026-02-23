import { readFileSync } from 'node:fs';

const failures = [];

function assertContains(path, snippet, message) {
  const content = readFileSync(path, 'utf8');
  if (!content.includes(snippet)) {
    failures.push(`${path}: ${message}`);
  }
}

function assertButtonCount(path, minimum, message) {
  const content = readFileSync(path, 'utf8');
  const count = (content.match(/<button\b/g) || []).length;
  if (count < minimum) {
    failures.push(`${path}: ${message} (found ${count}, expected >= ${minimum})`);
  }
}

// Home page actions
assertContains('web/src/pages/HomePage.jsx', 'to="/playground"', 'missing Playground navigation action');
assertContains('web/src/pages/HomePage.jsx', 'to="/simulation"', 'missing Simulation navigation action');
assertContains('web/src/pages/HomePage.jsx', 'to="/analytics"', 'missing Analytics navigation action');

// Playground controls and integrations
assertButtonCount('web/src/pages/PlaygroundPage.jsx', 10, 'too few actionable controls');
assertContains('web/src/pages/PlaygroundPage.jsx', "setEditorMode('select')", 'missing Select mode button');
assertContains('web/src/pages/PlaygroundPage.jsx', "setEditorMode('addNode')", 'missing Add Node mode button');
assertContains('web/src/pages/PlaygroundPage.jsx', "setEditorMode('addLink')", 'missing Add Link mode button');
assertContains('web/src/pages/PlaygroundPage.jsx', "setEditorMode('hand')", 'missing Hand mode button');
assertContains('web/src/pages/PlaygroundPage.jsx', 'onUndo', 'missing Undo handler wiring');
assertContains('web/src/pages/PlaygroundPage.jsx', 'onRedo', 'missing Redo handler wiring');
assertContains('web/src/pages/PlaygroundPage.jsx', 'onClear', 'missing Clear handler wiring');
assertContains('web/src/pages/PlaygroundPage.jsx', 'onImportClick', 'missing Import trigger wiring');
assertContains('web/src/pages/PlaygroundPage.jsx', 'onExport', 'missing Export wiring');
assertContains('web/src/pages/PlaygroundPage.jsx', 'onSimulate', 'missing Simulate wiring');
assertContains('web/src/pages/PlaygroundPage.jsx', 'new TopologyEditor', 'missing TopologyEditor initialization');
assertContains('web/src/pages/PlaygroundPage.jsx', 'new DevicePalette', 'missing DevicePalette initialization');
assertContains('web/src/pages/PlaygroundPage.jsx', 'new PropertyEditor', 'missing PropertyEditor initialization');
assertContains('web/src/pages/PlaygroundPage.jsx', 'renderer.start()', 'missing playground renderer start');

// Simulation controls and integrations
assertButtonCount('web/src/pages/SimulationPage.jsx', 7, 'too few actionable controls');
assertContains('web/src/pages/SimulationPage.jsx', 'onPauseResume', 'missing pause/resume button wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'onReset', 'missing reset button wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'onFailure', 'missing failure button wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'onRecover', 'missing recover button wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'onEditTopology', 'missing edit topology button wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'onExportReport', 'missing export report wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'setPattern(', 'missing pattern selector wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'setSimSpeed(', 'missing speed controls wiring');
assertContains('web/src/pages/SimulationPage.jsx', 'new SimulationController', 'missing SimulationController initialization');

// Analytics controls and integrations
assertContains('web/src/pages/AnalyticsPage.jsx', 'onClick={() => importInputRef.current?.click()}', 'missing report import trigger button');
assertContains('web/src/pages/AnalyticsPage.jsx', 'onChange={onImportReport}', 'missing report import file handler');
assertContains('web/src/pages/AnalyticsPage.jsx', 'localStorage.setItem(STORAGE_KEYS.latestLabReport', 'missing latest report persistence');

if (failures.length > 0) {
  console.error('check-react-page-controls: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('check-react-page-controls: PASSED');

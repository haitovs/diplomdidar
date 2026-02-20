import { SimulationController } from '../src/engine/SimulationController.js';
import { normalizeTopology } from '../src/utils/topologySchema.js';
import { defaultTopology } from '../web/src/data/topologyTemplates.js';

class MockRenderer {
  constructor() {
    this.nodes = [];
    this.links = [];
    this.running = false;
    this.particleSystem = {
      addBurst() {},
      getCount() {
        return 0;
      },
    };
  }

  setTopology(topology) {
    this.nodes = topology.nodes.map((node) => ({ ...node }));
    this.links = topology.links.map((link) => ({ ...link }));
  }

  start() {
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  resume() {
    this.running = true;
  }

  updateLinkHealth(linkId, health) {
    const link = this.links.find((item) => item.id === linkId);
    if (link) link.health = health;
  }
}

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const renderer = new MockRenderer();
const normalized = normalizeTopology(defaultTopology, { canvasWidth: 1000, canvasHeight: 620 });
renderer.setTopology({ nodes: normalized.nodes, links: normalized.links });

const controller = new SimulationController(renderer, { updateInterval: 1000 });

try {
  check(controller.isRunning === false, 'controller should start stopped');

  controller.setTrafficPattern('exam');
  check(controller.trafficGen.pattern?.label === 'Exam Period', 'pattern should switch to exam');

  controller.setSpeed(2);
  check(controller.trafficGen.simSpeed === 2, 'simulation speed should be set to 2x');

  controller.start();
  check(controller.isRunning === true, 'controller should be running after start');

  // Exercise manual tick path (used by runtime updates and button-triggered state refresh)
  controller.tick();
  let state = controller.getState();
  check(state.formattedTime !== undefined, 'state should expose formatted time');
  check(state.runtimeTraffic !== null, 'state should include runtime traffic metrics');

  const pausedAfterToggle = controller.togglePause();
  check(pausedAfterToggle === true, 'togglePause should pause on first call');
  check(controller.getState().isPaused === true, 'state should indicate paused');

  const resumedAfterToggle = controller.togglePause();
  check(resumedAfterToggle === false, 'togglePause should resume on second call');
  check(controller.getState().isPaused === false, 'state should indicate resumed');

  // Exercise failure/recovery actions used by UI buttons
  controller.triggerRandomFailure();
  state = controller.getState();
  check(Array.isArray(state.activeFailures), 'activeFailures should be an array');

  controller.recoverAll();
  check(controller.getState().activeFailures.length === 0, 'recoverAll should clear failures');

  controller.reset();
  state = controller.getState();
  check(state.activeFailures.length === 0, 'reset should keep failures cleared');
  check(renderer.nodes.every((node) => node.status === 'healthy'), 'reset should restore node statuses');

  controller.stop();
  check(controller.isRunning === false, 'controller should stop after stop()');
} finally {
  controller.destroy();
}

if (failures.length > 0) {
  console.error('smoke-simulation-actions: FAILED');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('smoke-simulation-actions: PASSED');

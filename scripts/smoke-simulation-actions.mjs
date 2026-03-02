import { PacketSimulationEngine } from '../src/engine/PacketSimulationEngine.js';
import { normalizeTopology } from '../src/utils/topologySchema.js';
import { defaultTopology } from '../web/src/data/topologyTemplates.js';

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const normalized = normalizeTopology(defaultTopology, { canvasWidth: 1000, canvasHeight: 620 });

const engine = new PacketSimulationEngine();

try {
  engine.initialize({ nodes: normalized.nodes, links: normalized.links });

  let state = engine.getState();
  check(state.stepCount === 0, 'engine should start at step 0');
  check(state.eventsQueued === 0, 'no events should be queued initially');
  check(state.packetsInFlight === 0, 'no packets in flight initially');

  // Configure IPs so ping can work
  const ns = engine.networkStack;

  // PC0: 10.0.1.2/24 on its first interface, gateway 10.0.1.1
  const pc0 = ns.getNode('pc0');
  if (pc0 && pc0.interfaces.length > 0) {
    ns.setInterfaceIp('pc0', pc0.interfaces[0].name, '10.0.1.2', '255.255.255.0');
    ns.setDefaultGateway('pc0', '10.0.1.1');
  }

  // PC1: 10.0.1.3/24 on its first interface, gateway 10.0.1.1
  const pc1 = ns.getNode('pc1');
  if (pc1 && pc1.interfaces.length > 0) {
    ns.setInterfaceIp('pc1', pc1.interfaces[0].name, '10.0.1.3', '255.255.255.0');
    ns.setDefaultGateway('pc1', '10.0.1.1');
  }

  // Router0 Gig0/0: 10.0.1.1/24 (facing sw0 subnet)
  const r0 = ns.getNode('r0');
  if (r0 && r0.interfaces.length >= 2) {
    ns.setInterfaceIp('r0', r0.interfaces[0].name, '10.0.1.1', '255.255.255.0');
    ns.setInterfaceIp('r0', r0.interfaces[1].name, '10.0.2.1', '255.255.255.0');
  }

  // Server0: 10.0.2.2/24, gateway 10.0.2.1
  const srv0 = ns.getNode('srv0');
  if (srv0 && srv0.interfaces.length > 0) {
    ns.setInterfaceIp('srv0', srv0.interfaces[0].name, '10.0.2.2', '255.255.255.0');
    ns.setDefaultGateway('srv0', '10.0.2.1');
  }

  // Send a ping from PC0 to PC1 (same subnet)
  engine.ping('pc0', '10.0.1.3', 1);
  state = engine.getState();
  check(state.eventsQueued > 0, 'ping should enqueue events');

  // Step forward to process events
  const initialEvents = state.eventsQueued;
  engine.stepForward();
  state = engine.getState();
  check(state.stepCount === 1, 'step count should be 1 after one step');

  // Test speed change
  engine.setSpeed(2);

  // Test mode change
  engine.setMode('realtime');
  engine.setMode('simulation');

  // Test reset
  engine.reset();
  state = engine.getState();
  check(state.stepCount === 0, 'reset should restore step count to 0');
  check(state.eventsQueued === 0, 'reset should clear event queue');

} finally {
  engine.destroy();
}

if (failures.length > 0) {
  console.error('smoke-simulation-actions: FAILED');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('smoke-simulation-actions: PASSED');

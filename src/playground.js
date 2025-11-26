import { NetworkCanvas } from './components/networkCanvas.js';
import { clamp } from './utils/dom.js';

const palette = {
  core: {
    color: '#6c7cff',
    icon: 'router.svg',
    hardware: ['10GbE uplinks', 'Dual PSU shelf', 'Fiber ring', 'QoS ASIC'],
    software: ['IOS XE 17.x', 'BGP / OSPF', 'NetFlow'],
  },
  edge: {
    color: '#4ee1c1',
    icon: 'switch.svg',
    hardware: ['Wi‑Fi 6 APs', 'PoE switches', '5GbE uplink'],
    software: ['Classroom QoS', 'Secure Browser', 'MDM agent'],
  },
  lab: {
    color: '#fcb045',
    icon: 'lab.svg',
    hardware: ['XR render box', 'GPU workstation', 'LiDAR sensor'],
    software: ['Unity runtime', 'XR streaming', 'VNC daemon'],
  },
  iot: {
    color: '#38bdf8',
    icon: 'sensor.svg',
    hardware: ['BLE beacons', 'Camera NVR', 'UPS battery'],
    software: ['MQTT gateway', 'Edge cache', 'Sensor health agent'],
  },
  server: {
    color: '#8b5cf6',
    icon: 'server.svg',
    hardware: ['Dual CPU', 'RAID storage', '2x10GbE'],
    software: ['Hypervisor', 'K8s node', 'Telemetry agent'],
  },
};

const canvas = document.getElementById('playground-canvas');
const tooltip = document.getElementById('playground-tooltip');
const network = new NetworkCanvas(canvas, tooltip);
network.attachHandleLayer(document.getElementById('playground-link-layer'));

const state = {
  nodes: [],
  links: [],
  pendingNode: null,
  editingId: null,
  handlesVisible: true,
  load: 1,
  ai: 0.6,
  jitter: 8,
  timer: null,
  metrics: { loss: 0 },
};

const elements = {
  name: document.getElementById('pg-node-name'),
  role: document.getElementById('pg-node-role'),
  campus: document.getElementById('pg-node-campus'),
  icon: document.getElementById('pg-node-icon'),
  color: document.getElementById('pg-node-color'),
  hardware: document.getElementById('pg-node-hardware'),
  software: document.getElementById('pg-node-software'),
  namePreview: document.getElementById('pg-node-name-preview'),
  iconPreview: document.getElementById('pg-node-icon-preview'),
  colorPreview: document.getElementById('pg-node-color-preview'),
  placeBtn: document.getElementById('pg-node-place'),
  resetBtn: document.getElementById('pg-node-reset'),
  connectFrom: document.getElementById('pg-connect-from'),
  connectTo: document.getElementById('pg-connect-to'),
  connectBtn: document.getElementById('pg-connect-add'),
  existing: document.getElementById('pg-existing-device'),
  loadExisting: document.getElementById('pg-load-device'),
  updateExisting: document.getElementById('pg-update-device'),
  load: document.getElementById('pg-load'),
  ai: document.getElementById('pg-ai'),
  jitter: document.getElementById('pg-jitter'),
  loadDisplay: document.getElementById('pg-load-display'),
  aiDisplay: document.getElementById('pg-ai-display'),
  jitterDisplay: document.getElementById('pg-jitter-display'),
  startBtn: document.getElementById('pg-start'),
  stopBtn: document.getElementById('pg-stop'),
  toggleHandles: document.getElementById('pg-toggle-handles'),
  health: document.getElementById('pg-health'),
  metrics: {
    nodes: document.getElementById('pg-metric-nodes'),
    links: document.getElementById('pg-metric-links'),
    health: document.getElementById('pg-metric-health'),
  },
  inspector: {
    status: document.getElementById('pg-inspector-status'),
    name: document.getElementById('pg-inspector-name'),
    role: document.getElementById('pg-inspector-role'),
    campus: document.getElementById('pg-inspector-campus'),
    statusText: document.getElementById('pg-inspector-status-text'),
    hardware: document.getElementById('pg-inspector-hardware'),
    software: document.getElementById('pg-inspector-software'),
  },
};

network.setTopology({ nodes: [], links: [] });
network.setNodeSelectCallback(renderInspector);
network.setMetricCallback((metrics) => {
  state.metrics = metrics;
  updateHealth(metrics.loss || 0);
});

elements.placeBtn.addEventListener('click', armPlacement);
elements.resetBtn.addEventListener('click', resetForm);
elements.connectBtn.addEventListener('click', addLink);
elements.loadExisting.addEventListener('click', loadExistingDevice);
elements.updateExisting.addEventListener('click', updateExistingDevice);
elements.load.addEventListener('input', () => {
  state.load = parseFloat(elements.load.value);
  elements.loadDisplay.textContent = `${state.load.toFixed(1)}x`;
  applyScenario();
});
elements.ai.addEventListener('input', () => {
  state.ai = parseFloat(elements.ai.value);
  elements.aiDisplay.textContent = `${Math.round(state.ai * 100)}%`;
  applyScenario();
});
elements.jitter.addEventListener('input', () => {
  state.jitter = parseFloat(elements.jitter.value);
  elements.jitterDisplay.textContent = `${Math.round(state.jitter)} ms`;
  applyScenario();
});
elements.startBtn.addEventListener('click', startSimulation);
elements.stopBtn.addEventListener('click', pauseSimulation);
elements.toggleHandles.addEventListener('click', () => {
  state.handlesVisible = !state.handlesVisible;
  network.setHandlesVisible(state.handlesVisible);
  elements.toggleHandles.textContent = state.handlesVisible ? 'Hide Handles' : 'Show Handles';
});

['name', 'icon', 'color'].forEach((key) => {
  elements[key].addEventListener('input', syncPreview);
});
elements.role.addEventListener('change', () => {
  const defaults = palette[elements.role.value] || palette.edge;
  elements.color.value = defaults.color;
  elements.icon.value = defaults.icon;
  syncPreview();
});

canvas.addEventListener('click', (event) => {
  if (!state.pendingNode) return;
  const rect = canvas.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0.05, 0.95);
  const y = clamp((event.clientY - rect.top) / rect.height, 0.05, 0.95);
  placeNode({ ...state.pendingNode, position: { x, y } });
  state.pendingNode = null;
  setInspectorStatus('Placed device', 'live');
});

function armPlacement() {
  state.pendingNode = collectNodeForm();
  setInspectorStatus('Click the canvas to place this device', 'live');
}

function collectNodeForm() {
  const type = elements.role.value || 'edge';
  const defaults = palette[type] || palette.edge;
  const name = elements.name.value.trim() || `Node ${state.nodes.length + 1}`;
  const campus = elements.campus.value || 'Custom';
  const color = elements.color.value || defaults.color;
  const icon = (elements.icon.value || defaults.icon).replace(/^\//, '');
  const hardware = splitList(elements.hardware.value, defaults.hardware);
  const software = splitList(elements.software.value, defaults.software);
  return { id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, label: name, type, campus, color, icon, hardware, software, load: 0.5 };
}

function placeNode(node) {
  state.nodes.push(node);
  refreshOptions();
  pushTopology();
  elements.metrics.nodes.textContent = state.nodes.length;
  state.editingId = null;
}

function splitList(value, fallback) {
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : fallback;
}

function refreshOptions() {
  const options = state.nodes.map((n) => `<option value="${n.id}">${n.label}</option>`).join('');
  elements.connectFrom.innerHTML = options;
  elements.connectTo.innerHTML = options;
  elements.existing.innerHTML = `<option value="">Select device</option>${options}`;
}

function addLink() {
  const from = elements.connectFrom.value;
  const to = elements.connectTo.value;
  if (!from || !to || from === to) {
    setInspectorStatus('Pick two different devices to link', 'warn');
    return;
  }
  const exists = state.links.some((link) => (link.source === from && link.target === to) || (link.source === to && link.target === from));
  if (exists) {
    setInspectorStatus('Already linked', 'warn');
    return;
  }
  const a = state.nodes.find((n) => n.id === from);
  const b = state.nodes.find((n) => n.id === to);
  const latency = a && b ? Math.max(0.6, Math.round(Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) * 30) / 10) : 1;
  state.links.push({ id: `link-${Date.now()}`, source: from, target: to, latency, type: 'custom' });
  elements.metrics.links.textContent = state.links.length;
  pushTopology();
  setInspectorStatus('Link added', 'live');
}

function pushTopology() {
  network.setTopology({ nodes: state.nodes, links: state.links });
  applyScenario();
  renderInspector(null);
}

function applyScenario() {
  network.applyScenario({
    load: state.load,
    ai: state.ai,
    jitterEffect: state.jitter / 120,
    sensorBoost: 0,
    lockdownRelief: 0,
    failover: false,
  });
}

function startSimulation() {
  if (state.timer) return;
  network.play();
  applyScenario();
  state.timer = setInterval(() => {
    const swing = 0.9 + Math.random() * 0.25;
    network.applyScenario({
      load: clamp(state.load * swing, 0.35, 2.8),
      ai: state.ai,
      jitterEffect: state.jitter / 120 + Math.random() * 0.02,
      sensorBoost: 0,
      lockdownRelief: 0,
      failover: false,
    });
  }, 1300);
  setInspectorStatus('Simulation streaming', 'live');
}

function pauseSimulation() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  network.pause();
  setInspectorStatus('Simulation paused', 'idle');
}

function renderInspector(node) {
  if (!node) {
    elements.inspector.status.textContent = 'Awaiting selection';
    elements.inspector.status.dataset.state = 'idle';
    elements.inspector.name.textContent = '—';
    elements.inspector.role.textContent = '—';
    elements.inspector.campus.textContent = '—';
    elements.inspector.statusText.textContent = '—';
    elements.inspector.hardware.innerHTML = '';
    elements.inspector.software.innerHTML = '';
    return;
  }
  elements.inspector.status.textContent = node.status || 'Operational';
  elements.inspector.status.dataset.state = node.status && node.status.toLowerCase().includes('degraded') ? 'warn' : 'live';
  elements.inspector.name.textContent = node.label;
  elements.inspector.role.textContent = node.type;
  elements.inspector.campus.textContent = node.campus || 'Custom';
  elements.inspector.statusText.textContent = `${Math.round((node.displayLoad || node.load || 0.5) * 100)}% load`;
  renderList(elements.inspector.hardware, node.hardware || []);
  renderList(elements.inspector.software, node.software || []);
}

function renderList(el, items) {
  el.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = 'Not documented';
    el.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  });
}

function syncPreview() {
  elements.namePreview.textContent = elements.name.value.trim() || 'Node';
  elements.iconPreview.textContent = elements.icon.value || 'router.svg';
  elements.colorPreview.textContent = elements.color.value || '#6c7cff';
}

function resetForm() {
  elements.name.value = '';
  elements.campus.value = 'HQ';
  elements.icon.value = palette.edge.icon;
  elements.hardware.value = '';
  elements.software.value = '';
  elements.color.value = palette.edge.color;
  elements.role.value = 'edge';
  state.editingId = null;
  syncPreview();
}

function setInspectorStatus(text, state = 'idle') {
  elements.inspector.status.textContent = text;
  elements.inspector.status.dataset.state = state === 'live' ? 'live' : state === 'warn' ? 'warn' : 'idle';
}

function loadExistingDevice() {
  const id = elements.existing.value;
  if (!id) {
    setInspectorStatus('Select a device to load', 'warn');
    return;
  }
  const node = state.nodes.find((n) => n.id === id);
  if (!node) return;
  state.editingId = id;
  elements.name.value = node.label;
  elements.role.value = node.type;
  elements.campus.value = node.campus || 'Custom';
  elements.icon.value = node.icon || palette[node.type]?.icon || 'router.svg';
  elements.color.value = node.color || palette[node.type]?.color || '#6c7cff';
  elements.hardware.value = node.hardware ? node.hardware.join(', ') : '';
  elements.software.value = node.software ? node.software.join(', ') : '';
  syncPreview();
  setInspectorStatus('Loaded device — edit then click Update', 'live');
}

function updateExistingDevice() {
  if (!state.editingId) {
    setInspectorStatus('Load a device first', 'warn');
    return;
  }
  const idx = state.nodes.findIndex((n) => n.id === state.editingId);
  if (idx === -1) {
    setInspectorStatus('Device not found', 'warn');
    return;
  }
  const updated = collectNodeForm();
  updated.id = state.editingId;
  updated.position = state.nodes[idx].position;
  state.nodes[idx] = updated;
  refreshOptions();
  pushTopology();
  setInspectorStatus('Device updated', 'live');
}

function updateHealth(loss = 0) {
  const pct = Math.round(loss * 100);
  let label = 'Healthy';
  let stateAttr = 'live';
  if (loss > 0.22) {
    label = `Down (${pct}% loss)`;
    stateAttr = 'warn';
  } else if (loss > 0.12) {
    label = `Lossy ${pct}%`;
    stateAttr = 'warn';
  } else if (loss > 0.06) {
    label = `Degraded ${pct}%`;
    stateAttr = 'warn';
  }
  elements.health.textContent = label;
  elements.health.dataset.state = stateAttr;
  elements.metrics.health.textContent = label;
}

syncPreview();
applyScenario();
updateHealth(0);

import { NetworkCanvas } from './components/networkCanvas.js';
import { renderTimeline, pulseTimeline } from './components/timeline.js';
import { AnalyticsPanel } from './components/analytics.js';
import { ScenarioPanel } from './components/scenarioPanel.js';
import { scenarios, schedules, reliabilityLibrary, topologyPresets } from './data/simulationData.js';
import { clamp } from './utils/dom.js';

const defaultHardware = {
  core: ['10GbE uplinks', 'Dual PSU shelf', 'Fiber ring', 'QoS ASIC'],
  edge: ['Wi‑Fi 6 APs', 'PoE switches', '5GbE uplink'],
  lab: ['XR render box', 'GPU workstation', 'LiDAR sensor'],
  iot: ['BLE beacons', 'Camera NVR', 'UPS battery'],
};

const defaultSoftware = {
  core: ['IOS XE 17.x', 'BGP / OSPF', 'NetFlow', 'IPS signatures'],
  edge: ['Classroom QoS', 'Secure Browser', 'MDM agent'],
  lab: ['Unity runtime', 'XR streaming', 'VNC daemon'],
  iot: ['MQTT gateway', 'Edge cache', 'Sensor health agent'],
};

const defaultColors = { core: '#6c7cff', edge: '#4ee1c1', lab: '#fcb045', iot: '#38bdf8' };
const defaultIcons = { core: 'router.svg', edge: 'switch.svg', lab: 'lab.svg', iot: 'sensor.svg' };

const aiSlider = document.getElementById('ai-load');
const leverControls = {
  bitrate: document.getElementById('instrument-bitrate'),
  devices: document.getElementById('instrument-devices'),
  guestLock: document.getElementById('instrument-guestlock'),
};

const inspectorEls = {
  status: document.getElementById('inspector-status'),
  name: document.getElementById('inspector-name'),
  role: document.getElementById('inspector-role'),
  campus: document.getElementById('inspector-campus'),
  statusText: document.getElementById('inspector-status-text'),
  hardware: document.getElementById('inspector-hardware'),
  software: document.getElementById('inspector-software'),
};

const nodeFormEls = {
  name: document.getElementById('node-name'),
  role: document.getElementById('node-role'),
  campus: document.getElementById('node-campus'),
  icon: document.getElementById('node-icon'),
  color: document.getElementById('node-color'),
  hardware: document.getElementById('node-hardware'),
  software: document.getElementById('node-software'),
  placeBtn: document.getElementById('node-place'),
  resetBtn: document.getElementById('node-reset'),
  namePreview: document.getElementById('node-name-preview'),
  iconPreview: document.getElementById('node-icon-preview'),
  colorPreview: document.getElementById('node-color-preview'),
  connectFrom: document.getElementById('connect-from'),
  connectTo: document.getElementById('connect-to'),
  connectBtn: document.getElementById('connect-add'),
  applyBtn: document.getElementById('apply-custom-topology'),
};

const state = {
  scenarioKey: 'default',
  scenario: scenarios.default,
  overrides: { concurrent: 18, labs: 3, guest: 'moderate', threshold: 75 },
  aiLoad: parseFloat(aiSlider.value),
  levers: {
    bitrate: parseFloat(leverControls.bitrate.value),
    devices: Number(leverControls.devices.value),
    guestLock: leverControls.guestLock.checked,
  },
  handlesVisible: true,
  playbackActive: false,
  timeline: [],
  alerts: [],
  customNodes: [],
  customLinks: [],
  currentTopology: null,
  pendingPlacement: null,
};

const canvas = document.getElementById('network-canvas');
const tooltip = document.getElementById('network-tooltip');
const network = new NetworkCanvas(canvas, tooltip);
network.attachHandleLayer(document.getElementById('link-handle-layer'));
const analytics = new AnalyticsPanel(document.getElementById('util-chart'));

const timelineEl = document.getElementById('timeline-grid');
const instrumentStatsEl = document.getElementById('instrument-stats');
const reliabilityRow = document.getElementById('reliability-row');
const scenarioDescriptionEl = document.getElementById('scenario-description');
const runtimeStatusEl = document.getElementById('runtime-status');
const simClockEl = document.getElementById('sim-clock');
const networkHealthEl = document.getElementById('network-health');
const liveFeedEl = document.getElementById('live-class-feed');
const liveEventsEl = document.getElementById('live-events');
const statDisplays = {
  throughput: instrumentStatsEl.querySelector('[data-key="throughput"]'),
  packet: instrumentStatsEl.querySelector('[data-key="packet"]'),
  sla: instrumentStatsEl.querySelector('[data-key="sla"]'),
  resilience: instrumentStatsEl.querySelector('[data-key="resilience"]'),
};
const valueDisplays = {
  scenarioPreset: document.getElementById('scenario-select-display'),
  aiLoad: document.getElementById('ai-load-display'),
  classes: document.getElementById('input-classes-display'),
  labs: document.getElementById('input-labs-display'),
  threshold: document.getElementById('input-threshold-display'),
  bitrate: document.getElementById('instrument-bitrate-display'),
  devices: document.getElementById('instrument-devices-display'),
  guestLock: document.getElementById('instrument-guestlock-display'),
};

let latestMetrics = { utilization: 0.62, latency: 14, energy: 8.1, loss: 0 };
let liveSnapshot = { time: 8, activeSlots: [], activeClasses: 0, labsActive: 0, load: 1, bandwidth: 0 };
let simTimer = null;

network.setMetricCallback((metrics) => {
  if (!state.playbackActive && network.isPaused()) return;
  latestMetrics = metrics;
  analytics.update(metrics);
  renderInstrumentStats();
  updateHeroMetrics();
  updateNetworkHealth(metrics.loss || 0);
});
network.setNodeSelectCallback((node) => renderInspector(node));

const scenarioPanel = new ScenarioPanel({
  selectEl: document.getElementById('scenario-select'),
  formEl: document.getElementById('scenario-form'),
  tagsEl: document.getElementById('scenario-tags'),
});

scenarioPanel.onUpdate(({ scenarioKey, scenario, overrides }) => {
  const scenarioChanged = scenarioKey !== state.scenarioKey;
  state.scenarioKey = scenarioKey;
  state.scenario = scenario;
  state.overrides = overrides;
  if (scenarioKey !== 'custom') {
    state.customNodes = [];
    state.customLinks = [];
  }
  updateValueDisplays();
  applyScenario({ refreshTopology: scenarioChanged, announce: scenarioChanged });
});

scenarioPanel.emit();
renderInstrumentStats();
initDraggables();
wireWorkshop();

function applyScenario({ refreshTopology = false, announce = false } = {}) {
  const profile = state.scenario.profile || 'campus';
  if (refreshTopology) {
    const topology = enrichTopology(resolveTopology());
    state.currentTopology = topology;
    network.setTopology(topology);
    renderInspector(null);
  }
  scenarioDescriptionEl.textContent = state.scenario.description;
  state.timeline = deriveTimeline(schedules[state.scenarioKey] || schedules.default, state.overrides);
  renderTimeline(timelineEl, state.timeline);
  highlightTimeline(liveSnapshot.time);
  seedAlerts(profile);
  updateHeroMetrics();
  updateValueDisplays();
  applyLiveMultipliers();
  if (announce) {
    pulseTimeline(timelineEl);
  }
}

function resolveTopology() {
  if (state.scenarioKey === 'custom' && state.customNodes.length) {
    return buildCustomTopology();
  }
  const topologyKey = state.scenario.topology || state.scenarioKey;
  return topologyPresets[topologyKey] || topologyPresets.campusWeekday;
}

function enrichTopology(topology = { nodes: [], links: [] }) {
  const nodes = (topology.nodes || []).map((node, idx) => {
    const role = node.type || node.role || 'edge';
    return {
      ...node,
      color: node.color || defaultColors[role] || defaultColors.edge,
      icon: node.icon || defaultIcons[role] || defaultIcons.edge,
      hardware: node.hardware || defaultHardware[role] || defaultHardware.edge,
      software: node.software || defaultSoftware[role] || defaultSoftware.edge,
      status: node.status || (idx % 5 === 0 ? 'Degraded' : 'Operational'),
      position: node.position || { x: Math.random() * 0.8 + 0.1, y: Math.random() * 0.7 + 0.15 },
    };
  });
  return { nodes, links: topology.links || [] };
}

function deriveTimeline(blocks = [], overrides) {
  const concurrencyFactor = clamp(overrides.concurrent / 18, 0.4, 2.4);
  const labFactor = clamp(overrides.labs / 3, 0.5, 2);
  const shifts = { maintenance: 0.6, exam: -0.2, school: -0.1, office: 0.05, market: -0.05 };
  const shift = shifts[state.scenarioKey] || 0;
  const base = blocks.length ? blocks : schedules.default;
  return base.map((block, idx) => {
    const isLab = block.room.toLowerCase().includes('lab') || block.room.toLowerCase().includes('cluster');
    return {
      ...block,
      slots: block.slots.map((slot, slotIdx) => {
        const durationGrowth = 1 + (concurrencyFactor - 1) * 0.3 + slotIdx * 0.04;
        const labBoost = isLab ? labFactor * 0.08 : 0;
        const adjusted = slot.duration * (durationGrowth + labBoost);
        return {
          ...slot,
          start: clamp(slot.start + shift + idx * 0.08, 7.2, 18.8),
          duration: clamp(adjusted, 0.5, 2.4),
        };
      }),
    };
  });
}

function computeLiveLoad(time) {
  const activeSlots = [];
  (state.timeline || []).forEach((block) => {
    block.slots.forEach((slot) => {
      const start = slot.start;
      const end = slot.start + slot.duration;
      if (time >= start && time <= end) {
        activeSlots.push({ ...slot, room: block.room, color: block.color });
      }
    });
  });

  const activeClasses = activeSlots.length;
  const labsActive = activeSlots.filter((slot) => /lab|xr|vr|makers|studio/i.test(slot.room)).length;
  const densityFactor = clamp(state.overrides.concurrent / 18, 0.5, 2.2);
  const baseLoad = state.scenario.multipliers.load * densityFactor;
  const activityHeat = 1 + activeClasses * 0.08 + labsActive * 0.12;
  const deviceImpact = 1 + (state.levers.devices - 3) * 0.12;
  const guestImpact = state.levers.guestLock
    ? -0.12
    : { low: -0.06, moderate: 0, spike: 0.16 }[state.overrides.guest] || 0;
  const load = clamp(baseLoad * activityHeat * state.levers.bitrate * deviceImpact + guestImpact, 0.35, 2.6);
  const bandwidth = Math.round(load * 520 + activeClasses * 14);
  return { time, activeSlots, activeClasses, labsActive, load, bandwidth };
}

function computeMultipliers(live = liveSnapshot) {
  const { multipliers } = state.scenario;
  const ai = state.aiLoad * multipliers.ai;
  const sensorBoost = clamp((state.levers.devices - 3) * 0.05, -0.2, 0.3);
  const jitterEffect = clamp((state.levers.bitrate - 1) * 0.06, 0, 0.3);
  const lockdownRelief = state.levers.guestLock ? -0.15 : 0;
  const energy =
    multipliers.energy * (1 + live.activeClasses * 0.04 + (state.levers.devices - 3) * 0.06 + ai * 0.05);
  return {
    load: live.load,
    ai,
    energy,
    sensorBoost,
    jitterEffect,
    lockdownRelief,
    failover: false,
  };
}

function applyLiveMultipliers() {
  const multipliers = computeMultipliers(liveSnapshot);
  network.applyScenario(multipliers);
  updateValueDisplays();
}

function setPlaybackVisuals(isRunning) {
  state.playbackActive = isRunning;
  document.body.classList.toggle('scenario-playing', isRunning);
  if (runtimeStatusEl) {
    runtimeStatusEl.textContent = isRunning ? 'Streaming' : 'Idle';
    runtimeStatusEl.dataset.state = isRunning ? 'live' : 'idle';
  }
}

function startSimulation() {
  if (simTimer) return;
  setPlaybackVisuals(true);
  network.play();
  advanceSimulation();
  simTimer = setInterval(() => advanceSimulation(), 1100);
}

function stopSimulation() {
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
  setPlaybackVisuals(false);
  network.pause();
}

function advanceSimulation() {
  liveSnapshot.time = (liveSnapshot.time || 8) + 0.18;
  if (liveSnapshot.time > 18.5) {
    liveSnapshot.time = 8 + (liveSnapshot.time - 18.5);
  }
  updateClock();
  liveSnapshot = computeLiveLoad(liveSnapshot.time);
  applyLiveMultipliers();
  highlightTimeline(liveSnapshot.time);
  updateLiveFeed(liveSnapshot);
  checkAlerts();
}

function updateClock() {
  if (!simClockEl) return;
  const hours = Math.floor(liveSnapshot.time);
  const minutes = Math.round((liveSnapshot.time - hours) * 60);
  const padded = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  simClockEl.textContent = padded;
}

function renderInstrumentStats() {
  const headroom = clamp(1 - latestMetrics.utilization, 0, 1);
  const videoHealth = clamp(
    1 - Math.abs(state.levers.bitrate - 1) * 0.4 - latestMetrics.latency / 80 + (state.levers.guestLock ? 0.08 : 0),
    0,
    1
  );
  const sla = clamp(
    0.92 - Math.max(0, latestMetrics.latency - state.overrides.threshold / 3) / 60 + headroom * 0.4,
    0,
    1
  );
  const resilience = clamp(0.55 + (state.levers.devices - 2) * 0.02 + (state.levers.guestLock ? 0.08 : 0), 0, 1);
  const stats = { throughput: headroom, packet: videoHealth, sla, resilience };

  Object.entries(stats).forEach(([key, value]) => {
    const el = statDisplays[key];
    if (!el) return;
    const percent = Math.round(value * 100);
    const strong = el.querySelector('strong');
    const bar = el.querySelector('.stat-bar span');
    strong.textContent = key === 'packet' ? `${percent}% smooth` : `${percent}%`;
    bar.style.width = `${percent}%`;
  });
}

function updateNetworkHealth(loss = 0) {
  if (!networkHealthEl) return;
  const pct = Math.round(loss * 100);
  let label = 'Healthy';
  let stateAttr = 'live';
  if (loss > 0.22) {
    label = `Downstream loss ${pct}%`;
    stateAttr = 'warn';
  } else if (loss > 0.12) {
    label = `Lossy ${pct}%`;
    stateAttr = 'warn';
  } else if (loss > 0.06) {
    label = `Degraded ${pct}%`;
    stateAttr = 'warn';
  }
  networkHealthEl.textContent = label;
  networkHealthEl.dataset.state = stateAttr;
}

function updateValueDisplays() {
  if (valueDisplays.scenarioPreset) valueDisplays.scenarioPreset.textContent = state.scenario.title;
  if (valueDisplays.aiLoad) valueDisplays.aiLoad.textContent = `${Math.round(state.aiLoad * 100)}%`;
  if (valueDisplays.classes) valueDisplays.classes.textContent = state.overrides.concurrent;
  if (valueDisplays.labs) valueDisplays.labs.textContent = state.overrides.labs;
  if (valueDisplays.threshold) valueDisplays.threshold.textContent = `${state.overrides.threshold}%`;
  if (valueDisplays.bitrate) {
    const label = state.levers.bitrate >= 1.4 ? '4K' : state.levers.bitrate >= 1.1 ? 'HD' : 'SD';
    valueDisplays.bitrate.textContent = label;
  }
  if (valueDisplays.devices) valueDisplays.devices.textContent = state.levers.devices;
  if (valueDisplays.guestLock) valueDisplays.guestLock.textContent = state.levers.guestLock ? '(locked)' : '(open)';
}

function updateHeroMetrics() {
  const activeEl = document.getElementById('metric-active-classes');
  const streamEl = document.getElementById('metric-stream');
  const alertsEl = document.getElementById('metric-alerts');
  if (activeEl) activeEl.textContent = liveSnapshot.activeClasses;
  if (streamEl) streamEl.textContent = `${Math.max(0, liveSnapshot.bandwidth)} Mbps`;
  if (alertsEl) alertsEl.textContent = state.alerts.length;
}

function highlightTimeline(time) {
  timelineEl.querySelectorAll('.timeline-slot').forEach((slot) => {
    const start = parseFloat(slot.dataset.start);
    const end = parseFloat(slot.dataset.end);
    const playing = time >= start && time <= end;
    slot.classList.toggle('playing', playing);
    slot.classList.toggle('live', playing);
  });
}

function updateLiveFeed(live) {
  liveFeedEl.innerHTML = '';
  if (!live.activeSlots.length) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="room">No classes active</span><span class="load">Playback fast-forwards time.</span>`;
    liveFeedEl.appendChild(li);
    return;
  }
  live.activeSlots.slice(0, 5).forEach((slot) => {
    const li = document.createElement('li');
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = slot.label;
    const room = document.createElement('span');
    room.className = 'room';
    room.textContent = slot.room;
    const load = document.createElement('span');
    load.className = 'load';
    load.textContent = `${Math.round(state.levers.bitrate * 100)}% video · ${Math.round(slot.duration * 45)} min`;
    li.appendChild(room);
    li.appendChild(pill);
    li.appendChild(load);
    liveFeedEl.appendChild(li);
  });
}

function seedAlerts(profileKey) {
  const notes = reliabilityLibrary[profileKey] || reliabilityLibrary.campus || [];
  state.alerts = notes.slice(0, 3).map((note) => ({
    title: note.title,
    detail: note.detail,
    tone: note.status === 'alert' ? 'alert' : note.status === 'scheduled' ? 'warn' : 'info',
  }));
  renderAlerts();
}

function addAlert(detail, tone = 'info') {
  const last = state.alerts[state.alerts.length - 1];
  if (last && last.detail === detail && last.tone === tone) return;
  const entry = { title: 'Live event', detail, tone };
  state.alerts.push(entry);
  if (state.alerts.length > 12) state.alerts.shift();
  renderAlerts();
}

function renderAlerts() {
  reliabilityRow.innerHTML = '';
  state.alerts.slice(-5).forEach((note) => {
    const chip = document.createElement('div');
    chip.className = 'reliability-chip';
    chip.dataset.status = note.tone === 'alert' ? 'alert' : note.tone === 'warn' ? 'scheduled' : 'info';
    chip.innerHTML = `<strong>${note.title}</strong><span>${note.detail}</span>`;
    reliabilityRow.appendChild(chip);
  });

  liveEventsEl.innerHTML = '';
  state.alerts
    .slice()
    .reverse()
    .slice(0, 4)
    .forEach((note) => {
      const item = document.createElement('div');
      item.className = 'live-event';
      item.dataset.tone = note.tone;
      item.textContent = note.detail;
      liveEventsEl.appendChild(item);
    });
  updateHeroMetrics();
}

function checkAlerts() {
  const utilizationPct = Math.round(latestMetrics.utilization * 100);
  const threshold = state.overrides.threshold;
  if (utilizationPct > threshold) addAlert(`Load reached ${utilizationPct}% (over ${threshold}% threshold).`, 'alert');
  if (state.levers.guestLock && state.overrides.guest === 'spike') {
    addAlert('Guest Wi‑Fi locked while a spike scenario is running.', 'warn');
  }
  if (liveSnapshot.activeClasses >= 4 && state.levers.bitrate > 1.3) {
    addAlert('Multiple HD classes detected — expect higher jitter.', 'warn');
  }
}

aiSlider.addEventListener('input', (event) => {
  state.aiLoad = parseFloat(event.target.value);
  updateValueDisplays();
  applyLiveMultipliers();
});

Object.entries(leverControls).forEach(([key, input]) => {
  const eventName = input.type === 'checkbox' ? 'change' : 'input';
  input.addEventListener(eventName, () => {
    if (key === 'guestLock') state.levers.guestLock = input.checked;
    else if (key === 'devices') state.levers.devices = Number(input.value);
    else state.levers.bitrate = parseFloat(input.value);
    updateValueDisplays();
    applyLiveMultipliers();
  });
});

const timelineBtn = document.getElementById('timeline-play');
timelineBtn.addEventListener('click', () => {
  startSimulation();
  pulseTimeline(timelineEl);
});

const startBtn = document.getElementById('start-simulation');
const stopBtn = document.getElementById('stop-simulation');

startBtn.addEventListener('click', () => {
  startSimulation();
  startBtn.textContent = 'Streaming...';
  stopBtn.textContent = 'Pause';
});

stopBtn.addEventListener('click', () => {
  stopSimulation();
  startBtn.textContent = 'Resume Streaming';
  stopBtn.textContent = 'Paused';
});

const toggleBtn = document.getElementById('toggle-dark');
toggleBtn.addEventListener('click', () => document.body.classList.toggle('light'));

const handleToggleBtn = document.getElementById('toggle-handle-visibility');
handleToggleBtn.addEventListener('click', () => {
  state.handlesVisible = !state.handlesVisible;
  network.setHandlesVisible(state.handlesVisible);
  handleToggleBtn.textContent = state.handlesVisible ? 'Hide Wire Handles' : 'Show Wire Handles';
});
handleToggleBtn.textContent = 'Hide Wire Handles';
setPlaybackVisuals(false);

const sidebarToggleBtn = document.getElementById('toggle-sidebar');
sidebarToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-hidden');
  sidebarToggleBtn.textContent = document.body.classList.contains('sidebar-hidden') ? 'Show Controls' : 'Hide Controls';
});
sidebarToggleBtn.textContent = 'Hide Controls';

function wireWorkshop() {
  if (!nodeFormEls.placeBtn) return;
  nodeFormEls.name.addEventListener('input', syncFormPreview);
  nodeFormEls.icon.addEventListener('input', syncFormPreview);
  nodeFormEls.color.addEventListener('input', syncFormPreview);

  nodeFormEls.placeBtn.addEventListener('click', () => {
    const payload = collectNodeForm();
    state.pendingPlacement = payload;
    setInspectorStatus('Click the main canvas to place this node', 'live');
    const handle = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      addCustomNode({ ...payload, position: { x: clamp(x, 0.05, 0.95), y: clamp(y, 0.05, 0.95) } });
      state.pendingPlacement = null;
      setInspectorStatus('Node added to custom topology', 'live');
    };
    canvas.addEventListener(
      'click',
      (event) => {
        event.stopPropagation();
        handle(event);
      },
      { once: true }
    );
  });

  nodeFormEls.resetBtn.addEventListener('click', resetNodeForm);
  nodeFormEls.connectBtn.addEventListener('click', addCustomLink);
  nodeFormEls.applyBtn.addEventListener('click', applyCustomTopology);
  syncFormPreview();
}

function collectNodeForm() {
  const role = nodeFormEls.role.value || 'edge';
  const name = nodeFormEls.name.value.trim() || `Node ${state.customNodes.length + 1}`;
  const campus = nodeFormEls.campus.value.trim() || 'Custom';
  const icon = (nodeFormEls.icon.value.trim() || defaultIcons[role] || 'router.svg').replace(/^\//, '');
  const color = nodeFormEls.color.value || defaultColors[role];
  const hardware =
    nodeFormEls.hardware.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) || defaultHardware[role];
  const software =
    nodeFormEls.software.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) || defaultSoftware[role];
  return { label: name, type: role, campus, icon, color, hardware: hardware.length ? hardware : defaultHardware[role], software: software.length ? software : defaultSoftware[role], status: 'Operational' };
}

function addCustomNode(node) {
  const id = `${node.label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  state.customNodes.push({ ...node, id, position: node.position || { x: Math.random(), y: Math.random() } });
  syncConnectOptions();
  state.scenarioKey = 'custom';
  state.scenario = scenarios.custom;
  scenarioPanel.setScenario('custom', { silent: true });
  applyScenario({ refreshTopology: true, announce: true });
}

function addCustomLink() {
  syncCustomPositionsFromCanvas();
  const fromId = nodeFormEls.connectFrom.value;
  const toId = nodeFormEls.connectTo.value;
  if (!fromId || !toId || fromId === toId) {
    setInspectorStatus('Pick two different nodes to connect', 'warn');
    return;
  }
  const exists = state.customLinks.some(
    (link) => (link.source === fromId && link.target === toId) || (link.source === toId && link.target === fromId)
  );
  if (exists) {
    setInspectorStatus('These nodes are already linked', 'warn');
    return;
  }
  state.customLinks.push({
    id: `link-${Date.now()}`,
    source: fromId,
    target: toId,
    latency: 1 + Math.random() * 2,
    type: 'custom',
  });
  setInspectorStatus('Link added', 'live');
  applyScenario({ refreshTopology: true });
}

function syncConnectOptions() {
  const options = state.customNodes.map((node) => `<option value="${node.id}">${node.label}</option>`).join('');
  nodeFormEls.connectFrom.innerHTML = options;
  nodeFormEls.connectTo.innerHTML = options;
}

function buildCustomTopology() {
  return { nodes: state.customNodes, links: state.customLinks };
}

function applyCustomTopology() {
  syncCustomPositionsFromCanvas();
  if (!state.customNodes.length) {
    setInspectorStatus('Add at least one node before applying', 'warn');
    return;
  }
  state.scenarioKey = 'custom';
  state.scenario = scenarios.custom;
  scenarioPanel.setScenario('custom', { silent: true });
  applyScenario({ refreshTopology: true, announce: true });
}

function resetNodeForm() {
  nodeFormEls.name.value = '';
  nodeFormEls.campus.value = '';
  nodeFormEls.icon.value = '';
  nodeFormEls.hardware.value = '';
  nodeFormEls.software.value = '';
  nodeFormEls.color.value = '#6c7cff';
  syncFormPreview();
}

function syncFormPreview() {
  nodeFormEls.namePreview.textContent = nodeFormEls.name.value.trim() || 'Node';
  nodeFormEls.iconPreview.textContent = nodeFormEls.icon.value.trim() || 'router';
  nodeFormEls.colorPreview.textContent = nodeFormEls.color.value || '#6c7cff';
}

function renderInspector(node) {
  if (!node) {
    inspectorEls.status.textContent = 'Awaiting selection';
    inspectorEls.status.dataset.state = 'idle';
    inspectorEls.name.textContent = '—';
    inspectorEls.role.textContent = '—';
    inspectorEls.campus.textContent = '—';
    inspectorEls.statusText.textContent = '—';
    inspectorEls.hardware.innerHTML = '';
    inspectorEls.software.innerHTML = '';
    return;
  }
  inspectorEls.status.textContent = node.status || 'Operational';
  inspectorEls.status.dataset.state = node.status && node.status.toLowerCase().includes('degraded') ? 'warn' : 'live';
  inspectorEls.name.textContent = node.label;
  inspectorEls.role.textContent = node.type;
  inspectorEls.campus.textContent = node.campus || 'N/A';
  inspectorEls.statusText.textContent = `${Math.round(node.displayLoad * 100)}% load`;
  renderList(inspectorEls.hardware, node.hardware || []);
  renderList(inspectorEls.software, node.software || []);
}

function syncCustomPositionsFromCanvas() {
  if (state.scenarioKey !== 'custom' || !Array.isArray(state.customNodes) || !network.nodes) return;
  const positionMap = new Map(network.nodes.map((node) => [node.id, node.position]));
  state.customNodes = state.customNodes.map((node) =>
    positionMap.has(node.id) ? { ...node, position: positionMap.get(node.id) } : node
  );
}

function renderList(el, items) {
  el.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = 'Not documented yet';
    el.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  });
}

function setInspectorStatus(text, state = 'idle') {
  if (!inspectorEls.status) return;
  inspectorEls.status.textContent = text;
  inspectorEls.status.dataset.state = state === 'live' ? 'live' : state === 'warn' ? 'warn' : 'idle';
}

function initDraggables() {
  if (!window.interact) return;
  const elements = document.querySelectorAll('.draggable-card, .draggable-pod');
  elements.forEach((el) => {
    const allowFrom = el.querySelector('.pod-handle') ? '.pod-handle' : null;
    const dataset = { x: 0, y: 0 };
    window.interact(el).draggable({
      allowFrom,
      listeners: {
        start() {
          el.classList.add('dragging');
        },
        move(event) {
          dataset.x += event.dx;
          dataset.y += event.dy;
          el.style.transform = `translate(${dataset.x}px, ${dataset.y}px)`;
        },
        end() {
          el.classList.remove('dragging');
        },
      },
    });
  });
}

applyScenario({ refreshTopology: true });
updateClock();
updateLiveFeed(liveSnapshot);
pulseTimeline(timelineEl);
setPlaybackVisuals(false);

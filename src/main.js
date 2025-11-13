import { NetworkCanvas } from './components/networkCanvas.js';
import { renderTimeline, pulseTimeline } from './components/timeline.js';
import { AnalyticsPanel } from './components/analytics.js';
import { AssistantPanel } from './components/assistant.js';
import { ScenarioPanel } from './components/scenarioPanel.js';
import {
  scenarios,
  schedules,
  reliabilityLibrary,
  simulationPlaybooks,
  topologyPresets,
} from './data/simulationData.js';
import { clamp } from './utils/dom.js';

const aiSlider = document.getElementById('ai-load');
const instrumentControls = {
  jitter: document.getElementById('instrument-jitter'),
  sensors: document.getElementById('instrument-sensors'),
  powerMode: document.getElementById('instrument-power'),
  failover: document.getElementById('instrument-failover'),
  lockdown: document.getElementById('instrument-lockdown'),
};

const state = {
  scenarioKey: 'default',
  scenario: scenarios.default,
  overrides: { concurrent: 18, labs: 3, guest: 'moderate', threshold: 75 },
  aiLoad: parseFloat(aiSlider.value),
  instruments: {
    jitter: Number(instrumentControls.jitter.value),
    sensors: Number(instrumentControls.sensors.value),
    powerMode: instrumentControls.powerMode.value,
    failover: instrumentControls.failover.checked,
    lockdown: instrumentControls.lockdown.checked,
  },
  activePlaybook: null,
  handlesVisible: true,
  playbackActive: false,
};

const canvas = document.getElementById('network-canvas');
const tooltip = document.getElementById('network-tooltip');
const network = new NetworkCanvas(canvas, tooltip);
network.attachHandleLayer(document.getElementById('link-handle-layer'));
const analytics = new AnalyticsPanel(document.getElementById('util-chart'));
const assistant = new AssistantPanel(
  document.getElementById('assistant-log'),
  document.getElementById('assistant-form'),
  document.getElementById('assistant-input')
);

const timelineEl = document.getElementById('timeline-grid');
const instrumentStatsEl = document.getElementById('instrument-stats');
const reliabilityRow = document.getElementById('reliability-row');
const scenarioDescriptionEl = document.getElementById('scenario-description');
const playbookList = document.getElementById('playbook-list');
const statDisplays = {
  throughput: instrumentStatsEl.querySelector('[data-key="throughput"]'),
  packet: instrumentStatsEl.querySelector('[data-key="packet"]'),
  sla: instrumentStatsEl.querySelector('[data-key="sla"]'),
  resilience: instrumentStatsEl.querySelector('[data-key="resilience"]'),
};

network.setMetricCallback((metrics) => {
  if (!state.playbackActive && network.isPaused()) return;
  analytics.update(metrics);
  assistant.updateContext({
    utilization: metrics.utilization,
    latency: metrics.latency,
    scenario: state.scenario.title,
    profile: state.scenario.profile,
  });
});

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
  state.activePlaybook = null;
  renderPlaybooks();
  applyScenario({ refreshTopology: scenarioChanged, announce: scenarioChanged });
});

scenarioPanel.emit();
renderPlaybooks();
renderInstrumentStats();
initDraggables();

function applyScenario({ refreshTopology = false, announce = false } = {}) {
  const profile = state.scenario.profile || 'campus';
  if (refreshTopology) {
    const topologyKey = state.scenario.topology || state.scenarioKey;
    const topology = topologyPresets[topologyKey] || topologyPresets.campusWeekday;
    network.setTopology(topology);
  }
  assistant.setProfile(profile, state.scenario.title);
  scenarioDescriptionEl.textContent = state.scenario.description;
  updateHeroMetrics();
  const multipliers = computeMultipliers();
  network.applyScenario(multipliers);
  const schedule = schedules[state.scenarioKey] || schedules.default;
  const derivedTimeline = deriveTimeline(schedule, state.overrides);
  renderTimeline(timelineEl, derivedTimeline);
  renderReliability(profile, state.overrides);
  renderInstrumentStats();
  if (announce) {
    pulseTimeline(timelineEl);
  }
}

function computeMultipliers() {
  const { multipliers } = state.scenario;
  const concurrencyFactor = clamp(state.overrides.concurrent / 18, 0.5, 2.2);
  const labFactor = clamp(state.overrides.labs / 3, 0.5, 2);
  const guestImpact = { low: -0.08, moderate: 0, spike: 0.12 }[state.overrides.guest] || 0;
  const sensorBoost = (state.instruments.sensors - 3) * 0.06;
  const jitterEffect = state.instruments.jitter / 120;
  const failoverHeat = state.instruments.failover ? 0.08 : 0;
  const lockdownRelief = state.instruments.lockdown ? -0.12 : 0;
  let load =
    multipliers.load *
    (1 + (concurrencyFactor - 1) * 0.3 + labFactor * 0.05 + guestImpact + sensorBoost + jitterEffect + failoverHeat);
  load = clamp(load, 0.35, 2.4);
  let ai = state.aiLoad * multipliers.ai;
  if (state.instruments.powerMode === 'eco') ai *= 0.85;
  if (state.instruments.powerMode === 'turbo') ai *= 1.2;
  const energy =
    multipliers.energy *
    (state.instruments.powerMode === 'eco' ? 0.85 : state.instruments.powerMode === 'turbo' ? 1.18 : 1);
  return {
    load,
    ai,
    energy,
    sensorBoost,
    jitterEffect,
    lockdownRelief,
    failover: state.instruments.failover,
  };
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

function renderReliability(profileKey, overrides) {
  reliabilityRow.innerHTML = '';
  const notes = reliabilityLibrary[profileKey] || reliabilityLibrary.campus;
  const badges = {
    exam: 'Invigilation VLAN prioritized. Highlight secure browser posture.',
    maintenance: 'QoS rerouted to Core Alpha. Document firmware progress.',
    school: 'Guide captive tours; keep robotics uplink in spotlight.',
    office: 'Quarter-end drills active. Capture SD-WAN failover in report.',
    market: 'Promo beacons synced. Call out checkout redundancy.',
    default: 'Telemetry streaming nominal. Take screenshots for slides.',
  };
  const entries = [
    { title: state.scenario.title, detail: badges[state.scenarioKey] || badges.default, status: 'info' },
    ...notes,
  ];
  if (overrides.threshold > 85) {
    entries.push({
      title: 'Aggressive alerting',
      detail: `Threshold locked at ${overrides.threshold}% showcasing proactive monitoring.`,
      status: 'alert',
    });
  }
  entries.forEach((note) => {
    const chip = document.createElement('div');
    chip.className = 'reliability-chip';
    if (note.status) chip.dataset.status = note.status;
    chip.innerHTML = `<strong>${note.title}</strong><span>${note.detail}</span>`;
    reliabilityRow.appendChild(chip);
  });
}

function updateHeroMetrics() {
  const hero = state.scenario.hero || { campuses: 3, rooms: 24, tickets: 110 };
  const rooms = Math.round(hero.rooms + state.overrides.labs * 1.5 + state.instruments.sensors * 1.2);
  const tickets = Math.round(hero.tickets * state.aiLoad + state.overrides.concurrent * 1.2);
  document.getElementById('metric-campuses').textContent = hero.campuses;
  document.getElementById('metric-rooms').textContent = rooms;
  document.getElementById('metric-tickets').textContent = tickets;
}

function computeInstrumentStats() {
  const { jitter, sensors, powerMode, failover, lockdown } = state.instruments;
  const throughput = clamp(
    0.55 + sensors * 0.08 - jitter * 0.01 + (powerMode === 'turbo' ? 0.12 : 0) - (powerMode === 'eco' ? 0.05 : 0),
    0,
    1
  );
  const packetHealth = clamp(0.96 - jitter * 0.012 - (failover ? 0.04 : 0) + (lockdown ? 0.03 : 0), 0.35, 1);
  const sla = clamp(0.78 + throughput * 0.25 + packetHealth * 0.2 + (lockdown ? 0.06 : 0) - (failover ? 0.03 : 0), 0, 1);
  const resilience = clamp(0.55 + sensors * 0.04 + (failover ? 0.25 : 0.05) + (lockdown ? 0.08 : 0), 0, 1);
  return { throughput, packet: packetHealth, sla, resilience };
}

function renderInstrumentStats() {
  const stats = computeInstrumentStats();
  Object.entries(stats).forEach(([key, value]) => {
    const el = statDisplays[key];
    if (!el) return;
    const percent = Math.round(value * 100);
    const strong = el.querySelector('strong');
    const bar = el.querySelector('.stat-bar span');
    strong.textContent = key === 'packet' ? `${percent}% healthy` : `${percent}%`;
    bar.style.width = `${percent}%`;
  });
}

aiSlider.addEventListener('input', (event) => {
  state.aiLoad = parseFloat(event.target.value);
  applyScenario();
});

Object.entries(instrumentControls).forEach(([key, input]) => {
  const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
  input.addEventListener(eventName, () => {
    if (key === 'powerMode') {
      state.instruments.powerMode = input.value;
    } else if (key === 'failover' || key === 'lockdown') {
      state.instruments[key] = input.checked;
    } else {
      state.instruments[key] = Number(input.value);
    }
    state.activePlaybook = null;
    renderPlaybooks();
    applyScenario();
  });
});

function renderPlaybooks() {
  playbookList.innerHTML = '';
  simulationPlaybooks.forEach((play) => {
    const li = document.createElement('li');
    li.className = 'playbook-entry';
    if (state.activePlaybook === play.id) {
      li.dataset.active = 'true';
    }
    li.innerHTML = `<h4>${play.title}</h4><p>${play.blurb}</p>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = state.activePlaybook === play.id ? 'btn ghost' : 'btn secondary';
    btn.textContent = state.activePlaybook === play.id ? 'Active' : 'Load Playbook';
    btn.disabled = state.activePlaybook === play.id;
    btn.addEventListener('click', () => loadPlaybook(play));
    li.appendChild(btn);
    playbookList.appendChild(li);
  });
}

function loadPlaybook(playbook) {
  state.activePlaybook = playbook.id;
  scenarioPanel.setScenario(playbook.scenario, { silent: true });
  state.scenarioKey = playbook.scenario;
  state.scenario = scenarios[playbook.scenario];
  state.overrides = { ...playbook.overrides };
  state.aiLoad = playbook.aiLoad;
  aiSlider.value = playbook.aiLoad;
  document.getElementById('input-classes').value = playbook.overrides.concurrent;
  document.getElementById('input-labs').value = playbook.overrides.labs;
  document.getElementById('input-guest').value = playbook.overrides.guest;
  document.getElementById('input-threshold').value = playbook.overrides.threshold;
  Object.entries(playbook.instruments).forEach(([key, value]) => {
    const control = instrumentControls[key];
    if (!control) return;
    if (typeof value === 'boolean') {
      state.instruments[key] = value;
      control.checked = value;
    } else if (key === 'powerMode') {
      state.instruments.powerMode = value;
      control.value = value;
    } else {
      state.instruments[key] = Number(value);
      control.value = value;
    }
  });
  renderPlaybooks();
  applyScenario({ refreshTopology: true, announce: true });
}

const timelineBtn = document.getElementById('timeline-play');
timelineBtn.addEventListener('click', () => {
  state.playbackActive = true;
  network.play();
  pulseTimeline(timelineEl);
});

const startBtn = document.getElementById('start-simulation');
const stopBtn = document.getElementById('stop-simulation');

startBtn.addEventListener('click', (event) => {
  state.playbackActive = true;
  const btn = event.currentTarget;
  btn.textContent = 'Scenario playing...';
  network.play();
  const burst = computeMultipliers();
  burst.load = clamp(burst.load + 0.2, 0.5, 2.6);
  network.applyScenario(burst);
  pulseTimeline(timelineEl);
  setTimeout(() => {
    btn.textContent = 'Start Scenario Playback';
    applyScenario();
  }, 2200);
});

stopBtn.addEventListener('click', () => {
  state.playbackActive = false;
  network.pause();
  startBtn.textContent = 'Start Scenario Playback';
  resetTimelinePulse();
});

function resetTimelinePulse() {
  timelineEl.querySelectorAll('.timeline-slot').forEach((slot) => slot.classList.remove('playing'));
}

const toggleBtn = document.getElementById('toggle-dark');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
});

const handleToggleBtn = document.getElementById('toggle-handle-visibility');
handleToggleBtn.addEventListener('click', () => {
  state.handlesVisible = !state.handlesVisible;
  network.setHandlesVisible(state.handlesVisible);
  handleToggleBtn.textContent = state.handlesVisible ? 'Hide Wire Handles' : 'Show Wire Handles';
});
handleToggleBtn.textContent = 'Hide Wire Handles';

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
pulseTimeline(timelineEl);

/**
 * Didar Network Simulation - Configuration
 * Central configuration for all simulation parameters
 */

// Simulation timing parameters
export const SIMULATION = {
  START_HOUR: 8,
  END_HOUR: 18.5,
  TIME_INCREMENT: 0.18,
  TICK_INTERVAL_MS: 1100,
  TIME_WRAP_START: 8,
};

// Canvas rendering parameters
export const CANVAS = {
  DEFAULT_WIDTH: 780,
  DEFAULT_HEIGHT: 480,
  NODE_RADIUS: 24,
  PACKET_SPEED: 2,
  FRAME_RATE: 30,
};

// Default thresholds and limits
export const THRESHOLDS = {
  DEFAULT_ALERT: 75,
  LOSS_HEALTHY: 0.06,
  LOSS_DEGRADED: 0.12,
  LOSS_LOSSY: 0.22,
  MAX_ALERTS: 12,
  VISIBLE_ALERTS: 5,
  MAX_LIVE_FEED_ITEMS: 5,
};

// Scenario default values
export const DEFAULTS = {
  CONCURRENT_CLASSES: 18,
  LABS: 3,
  GUEST_TRAFFIC: 'moderate',
  DEVICES_PER_STUDENT: 3,
  AI_LOAD: 0.4,
  BITRATE: 1.1,
};

// Clamp ranges for various calculations
export const CLAMP_RANGES = {
  CONCURRENCY_FACTOR: { min: 0.4, max: 2.4 },
  LAB_FACTOR: { min: 0.5, max: 2 },
  TIMELINE_START: { min: 7.2, max: 18.8 },
  SLOT_DURATION: { min: 0.5, max: 2.4 },
  LOAD: { min: 0.35, max: 2.6 },
  POSITION: { min: 0.05, max: 0.95 },
};

// Network health thresholds
export const HEALTH_STATES = {
  HEALTHY: { label: 'Healthy', state: 'live', maxLoss: 0.06 },
  DEGRADED: { label: 'Degraded', state: 'warn', maxLoss: 0.12 },
  LOSSY: { label: 'Lossy', state: 'warn', maxLoss: 0.22 },
  CRITICAL: { label: 'Downstream loss', state: 'warn', maxLoss: 1 },
};

// Bitrate quality labels
export const BITRATE_LABELS = {
  SD: { min: 0, max: 1.1 },
  HD: { min: 1.1, max: 1.4 },
  '4K': { min: 1.4, max: Infinity },
};

// Scenario shift values for timeline derivation
export const SCENARIO_SHIFTS = {
  maintenance: 0.6,
  exam: -0.2,
  school: -0.1,
  office: 0.05,
  market: -0.05,
  default: 0,
};

// Guest traffic impact values
export const GUEST_IMPACT = {
  low: -0.06,
  moderate: 0,
  spike: 0.16,
};

// Default hardware configurations by node type
export const DEFAULT_HARDWARE = {
  core: ['10GbE uplinks', 'Dual PSU shelf', 'Fiber ring', 'QoS ASIC'],
  edge: ['Wi‑Fi 6 APs', 'PoE switches', '5GbE uplink'],
  lab: ['XR render box', 'GPU workstation', 'LiDAR sensor'],
  iot: ['BLE beacons', 'Camera NVR', 'UPS battery'],
};

// Default software configurations by node type
export const DEFAULT_SOFTWARE = {
  core: ['IOS XE 17.x', 'BGP / OSPF', 'NetFlow', 'IPS signatures'],
  edge: ['Classroom QoS', 'Secure Browser', 'MDM agent'],
  lab: ['Unity runtime', 'XR streaming', 'VNC daemon'],
  iot: ['MQTT gateway', 'Edge cache', 'Sensor health agent'],
};

// Default node colors by type
export const DEFAULT_COLORS = {
  core: '#6c7cff',
  edge: '#4ee1c1',
  lab: '#fcb045',
  iot: '#38bdf8',
};

// Default node icons by type
export const DEFAULT_ICONS = {
  core: 'router.svg',
  edge: 'switch.svg',
  lab: 'lab.svg',
  iot: 'sensor.svg',
};

// Multiplier calculation constants
export const MULTIPLIERS = {
  ACTIVITY_HEAT_CLASS: 0.08,
  ACTIVITY_HEAT_LAB: 0.12,
  DEVICE_IMPACT: 0.12,
  GUESTLOCK_RELIEF: -0.12,
  BANDWIDTH_BASE: 520,
  BANDWIDTH_CLASS: 14,
};

// Stat calculation constants
export const STAT_CALC = {
  BITRATE_EFFECT: 0.4,
  LATENCY_DIVISOR: 80,
  GUESTLOCK_BONUS: 0.08,
  SLA_BASE: 0.92,
  LATENCY_EFFECT: 60,
  RESILIENCE_BASE: 0.55,
  DEVICE_EFFECT: 0.02,
};

/**
 * Helper function to get bitrate quality label
 * @param {number} bitrate - Current bitrate value
 * @returns {string} Quality label (SD, HD, or 4K)
 */
export function getBitrateLabel(bitrate) {
  if (bitrate >= BITRATE_LABELS['4K'].min) return '4K';
  if (bitrate >= BITRATE_LABELS.HD.min) return 'HD';
  return 'SD';
}

/**
 * Get network health status based on loss percentage
 * @param {number} loss - Packet loss (0-1)
 * @returns {{label: string, state: string}}
 */
export function getHealthStatus(loss) {
  if (loss <= HEALTH_STATES.HEALTHY.maxLoss) return HEALTH_STATES.HEALTHY;
  if (loss <= HEALTH_STATES.DEGRADED.maxLoss) return HEALTH_STATES.DEGRADED;
  if (loss <= HEALTH_STATES.LOSSY.maxLoss) return HEALTH_STATES.LOSSY;
  return HEALTH_STATES.CRITICAL;
}

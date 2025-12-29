/**
 * Simulation Engine Module
 * Core simulation logic: timing, load calculation, multipliers
 */

import { CLAMP_RANGES, GUEST_IMPACT, MULTIPLIERS, SCENARIO_SHIFTS, SIMULATION } from '../config.js';
import { clamp } from '../utils/dom.js';

/**
 * Compute live load at a given simulation time
 * @param {number} time - Current simulation time (decimal hours)
 * @param {Object} params - Simulation parameters
 * @returns {Object} Live snapshot with load data
 */
export function computeLiveLoad(time, { timeline, overrides, levers, scenario }) {
  const activeSlots = [];
  
  (timeline || []).forEach((block) => {
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
  
  const densityFactor = clamp(overrides.concurrent / 18, CLAMP_RANGES.CONCURRENCY_FACTOR.min, CLAMP_RANGES.CONCURRENCY_FACTOR.max);
  const baseLoad = (scenario?.multipliers?.load || 1) * densityFactor;
  const activityHeat = 1 + activeClasses * MULTIPLIERS.ACTIVITY_HEAT_CLASS + labsActive * MULTIPLIERS.ACTIVITY_HEAT_LAB;
  const deviceImpact = 1 + (levers.devices - 3) * MULTIPLIERS.DEVICE_IMPACT;
  const guestImpact = levers.guestLock
    ? MULTIPLIERS.GUESTLOCK_RELIEF
    : GUEST_IMPACT[overrides.guest] || 0;
  
  const load = clamp(
    baseLoad * activityHeat * levers.bitrate * deviceImpact + guestImpact,
    CLAMP_RANGES.LOAD.min,
    CLAMP_RANGES.LOAD.max
  );
  
  const bandwidth = Math.round(load * MULTIPLIERS.BANDWIDTH_BASE + activeClasses * MULTIPLIERS.BANDWIDTH_CLASS);
  
  return { time, activeSlots, activeClasses, labsActive, load, bandwidth };
}

/**
 * Compute multipliers for network visualization
 * @param {Object} liveSnapshot - Current live snapshot
 * @param {Object} params - Simulation parameters
 * @returns {Object} Multipliers for network canvas
 */
export function computeMultipliers(liveSnapshot, { scenario, aiLoad, levers }) {
  const multipliers = scenario?.multipliers || { load: 1, ai: 1, energy: 1 };
  const ai = aiLoad * multipliers.ai;
  const sensorBoost = clamp((levers.devices - 3) * 0.05, -0.2, 0.3);
  const jitterEffect = clamp((levers.bitrate - 1) * 0.06, 0, 0.3);
  const lockdownRelief = levers.guestLock ? -0.15 : 0;
  const energy = multipliers.energy * (1 + liveSnapshot.activeClasses * 0.04 + (levers.devices - 3) * 0.06 + ai * 0.05);
  
  return {
    load: liveSnapshot.load,
    ai,
    energy,
    sensorBoost,
    jitterEffect,
    lockdownRelief,
    failover: false,
  };
}

/**
 * Derive timeline from schedule blocks
 * @param {Array} blocks - Schedule blocks
 * @param {Object} overrides - Scenario overrides
 * @param {string} scenarioKey - Current scenario key
 * @returns {Array} Derived timeline
 */
export function deriveTimeline(blocks, overrides, scenarioKey) {
  const concurrencyFactor = clamp(
    overrides.concurrent / 18,
    CLAMP_RANGES.CONCURRENCY_FACTOR.min,
    CLAMP_RANGES.CONCURRENCY_FACTOR.max
  );
  const labFactor = clamp(overrides.labs / 3, CLAMP_RANGES.LAB_FACTOR.min, CLAMP_RANGES.LAB_FACTOR.max);
  const shift = SCENARIO_SHIFTS[scenarioKey] || SCENARIO_SHIFTS.default;
  
  return blocks.map((block, idx) => {
    const isLab = block.room.toLowerCase().includes('lab') || block.room.toLowerCase().includes('cluster');
    return {
      ...block,
      slots: block.slots.map((slot, slotIdx) => {
        const durationGrowth = 1 + (concurrencyFactor - 1) * 0.3 + slotIdx * 0.04;
        const labBoost = isLab ? labFactor * 0.08 : 0;
        const adjusted = slot.duration * (durationGrowth + labBoost);
        return {
          ...slot,
          start: clamp(slot.start + shift + idx * 0.08, CLAMP_RANGES.TIMELINE_START.min, CLAMP_RANGES.TIMELINE_START.max),
          duration: clamp(adjusted, CLAMP_RANGES.SLOT_DURATION.min, CLAMP_RANGES.SLOT_DURATION.max),
        };
      }),
    };
  });
}

/**
 * Advance simulation time by one tick
 * @param {number} currentTime - Current time
 * @returns {number} New time (wraps around after end of day)
 */
export function advanceTime(currentTime) {
  let newTime = (currentTime || SIMULATION.START_HOUR) + SIMULATION.TIME_INCREMENT;
  if (newTime > SIMULATION.END_HOUR) {
    newTime = SIMULATION.TIME_WRAP_START + (newTime - SIMULATION.END_HOUR);
  }
  return newTime;
}

/**
 * Create simulation timer controller
 * @param {Function} onTick - Callback for each tick
 * @returns {Object} Timer controller with start/stop methods
 */
export function createSimulationTimer(onTick) {
  let timerId = null;
  
  return {
    start() {
      if (timerId) return false;
      onTick(); // Run immediately
      timerId = setInterval(onTick, SIMULATION.TICK_INTERVAL_MS);
      return true;
    },
    stop() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
        return true;
      }
      return false;
    },
    isRunning() {
      return timerId !== null;
    },
  };
}

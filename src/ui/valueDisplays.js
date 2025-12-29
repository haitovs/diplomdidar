/**
 * Value Displays Module
 * Handles updating value display pills in the UI
 */

import { getBitrateLabel } from '../config.js';
import { getElement } from '../utils/dom.js';

/**
 * Create value displays controller
 * @returns {Object} Value displays controller
 */
export function createValueDisplays() {
  const displays = {
    scenarioPreset: getElement('scenario-select-display'),
    aiLoad: getElement('ai-load-display'),
    classes: getElement('input-classes-display'),
    labs: getElement('input-labs-display'),
    threshold: getElement('input-threshold-display'),
    bitrate: getElement('instrument-bitrate-display'),
    devices: getElement('instrument-devices-display'),
    guestLock: getElement('instrument-guestlock-display'),
  };

  return {
    /**
     * Update all value displays
     * @param {Object} state - Current state
     */
    update({ scenario, aiLoad, overrides, levers }) {
      if (displays.scenarioPreset) {
        displays.scenarioPreset.textContent = scenario?.title || 'Unknown';
      }
      if (displays.aiLoad) {
        displays.aiLoad.textContent = `${Math.round(aiLoad * 100)}%`;
      }
      if (displays.classes) {
        displays.classes.textContent = overrides.concurrent;
      }
      if (displays.labs) {
        displays.labs.textContent = overrides.labs;
      }
      if (displays.threshold) {
        displays.threshold.textContent = `${overrides.threshold}%`;
      }
      if (displays.bitrate) {
        displays.bitrate.textContent = getBitrateLabel(levers.bitrate);
      }
      if (displays.devices) {
        displays.devices.textContent = levers.devices;
      }
      if (displays.guestLock) {
        displays.guestLock.textContent = levers.guestLock ? '(locked)' : '(open)';
      }
    },
  };
}

/**
 * Didar Network Simulation - State Management
 * Centralized reactive state management with persistence
 */

import { DEFAULTS, SIMULATION } from '../config.js';

/**
 * Initial application state
 */
const initialState = {
  // Scenario
  scenarioKey: 'default',
  scenario: null,
  overrides: {
    concurrent: DEFAULTS.CONCURRENT_CLASSES,
    labs: DEFAULTS.LABS,
    guest: DEFAULTS.GUEST_TRAFFIC,
    threshold: 75,
  },
  
  // Controls
  aiLoad: DEFAULTS.AI_LOAD,
  levers: {
    bitrate: DEFAULTS.BITRATE,
    devices: DEFAULTS.DEVICES_PER_STUDENT,
    guestLock: false,
  },
  
  // UI State
  handlesVisible: true,
  playbackActive: false,
  sidebarVisible: true,
  
  // Simulation Data
  timeline: [],
  alerts: [],
  currentTopology: null,
  
  // Custom topology
  customNodes: [],
  customLinks: [],
  pendingPlacement: null,
  
  // Live simulation snapshot
  liveSnapshot: {
    time: SIMULATION.START_HOUR,
    activeSlots: [],
    activeClasses: 0,
    labsActive: 0,
    load: 1,
    bandwidth: 0,
  },
  
  // Latest metrics
  metrics: {
    utilization: 0.62,
    latency: 14,
    energy: 8.1,
    loss: 0,
  },
};

/**
 * State store class with subscription support
 */
class StateStore {
  #state = {};
  #listeners = new Set();
  #history = [];
  #maxHistory = 50;

  constructor(initial = {}) {
    this.#state = structuredClone(initial);
  }

  /**
   * Get current state (readonly copy)
   * @returns {Object}
   */
  getState() {
    return structuredClone(this.#state);
  }

  /**
   * Get a specific value from state
   * @param {string} path - Dot-notation path (e.g., 'levers.bitrate')
   * @returns {*}
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.#state);
  }

  /**
   * Update state with partial updates
   * @param {Object|Function} updates - Updates or updater function
   * @param {boolean} [saveHistory=false] - Save to undo history
   */
  setState(updates, saveHistory = false) {
    if (saveHistory && this.#history.length < this.#maxHistory) {
      this.#history.push(structuredClone(this.#state));
    }

    if (typeof updates === 'function') {
      updates = updates(this.#state);
    }

    this.#deepMerge(this.#state, updates);
    this.#notify(updates);
  }

  /**
   * Set a specific value in state
   * @param {string} path - Dot-notation path
   * @param {*} value - New value
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.#state);
    
    target[lastKey] = value;
    this.#notify({ [path]: value });
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback(updates, fullState)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Undo last state change
   * @returns {boolean} True if undo was performed
   */
  undo() {
    if (this.#history.length === 0) return false;
    this.#state = this.#history.pop();
    this.#notify({ _undo: true });
    return true;
  }

  /**
   * Reset state to initial
   */
  reset() {
    this.#history = [];
    this.#state = structuredClone(initialState);
    this.#notify({ _reset: true });
  }

  /**
   * Save state to localStorage
   * @param {string} key - Storage key
   */
  persist(key = 'didar-state') {
    try {
      localStorage.setItem(key, JSON.stringify(this.#state));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  }

  /**
   * Load state from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if loaded successfully
   */
  hydrate(key = 'didar-state') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.#deepMerge(this.#state, parsed);
        this.#notify({ _hydrated: true });
        return true;
      }
    } catch (e) {
      console.warn('Failed to hydrate state:', e);
    }
    return false;
  }

  #notify(updates) {
    const fullState = this.getState();
    this.#listeners.forEach(listener => {
      try {
        listener(updates, fullState);
      } catch (e) {
        console.error('State listener error:', e);
      }
    });
  }

  #deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.#deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}

// Create and export singleton store
export const store = new StateStore(initialState);

// Export initial state for reference
export { initialState };

// Convenience exports for common state operations
export const getState = () => store.getState();
export const setState = (updates, saveHistory) => store.setState(updates, saveHistory);
export const subscribe = (listener) => store.subscribe(listener);

/**
 * Metrics Display Module
 * Handles rendering of instrument stats and metrics
 */

import { STAT_CALC } from '../config.js';
import { clamp, getElement } from '../utils/dom.js';

/**
 * Create metrics display controller
 * @param {Object} elements - Stat display elements
 * @returns {Object} Metrics controller
 */
export function createMetricsDisplay(elements) {
  const { throughput, packet, sla, resilience } = elements;

  return {
    /**
     * Update all instrument stats
     * @param {Object} params - Current state values
     */
    update({ metrics, levers, overrides }) {
      const headroom = clamp(1 - metrics.utilization, 0, 1);
      
      const videoHealth = clamp(
        1 - Math.abs(levers.bitrate - 1) * STAT_CALC.BITRATE_EFFECT 
          - metrics.latency / STAT_CALC.LATENCY_DIVISOR 
          + (levers.guestLock ? STAT_CALC.GUESTLOCK_BONUS : 0),
        0,
        1
      );
      
      const slaValue = clamp(
        STAT_CALC.SLA_BASE 
          - Math.max(0, metrics.latency - overrides.threshold / 3) / STAT_CALC.LATENCY_EFFECT 
          + headroom * 0.4,
        0,
        1
      );
      
      const resilienceValue = clamp(
        STAT_CALC.RESILIENCE_BASE 
          + (levers.devices - 2) * STAT_CALC.DEVICE_EFFECT 
          + (levers.guestLock ? STAT_CALC.GUESTLOCK_BONUS : 0),
        0,
        1
      );

      const stats = {
        throughput: headroom,
        packet: videoHealth,
        sla: slaValue,
        resilience: resilienceValue,
      };

      this.renderStat(throughput, stats.throughput, 'throughput');
      this.renderStat(packet, stats.packet, 'packet');
      this.renderStat(sla, stats.sla, 'sla');
      this.renderStat(resilience, stats.resilience, 'resilience');

      return stats;
    },

    /**
     * Render a single stat element
     * @param {HTMLElement} el - Stat element
     * @param {number} value - Value (0-1)
     * @param {string} key - Stat key
     */
    renderStat(el, value, key) {
      if (!el) return;
      
      const percent = Math.round(value * 100);
      const strong = el.querySelector('strong');
      const bar = el.querySelector('.stat-bar span');
      
      if (strong) {
        strong.textContent = key === 'packet' ? `${percent}% smooth` : `${percent}%`;
      }
      if (bar) {
        bar.style.width = `${percent}%`;
      }
    },
  };
}

/**
 * Create hero metrics controller
 * @returns {Object} Hero metrics controller
 */
export function createHeroMetrics() {
  const activeEl = getElement('metric-active-classes');
  const streamEl = getElement('metric-stream');
  const alertsEl = getElement('metric-alerts');

  return {
    /**
     * Update hero metrics display
     * @param {Object} data - Metrics data
     */
    update({ activeClasses, bandwidth, alertCount }) {
      if (activeEl) activeEl.textContent = activeClasses;
      if (streamEl) streamEl.textContent = `${Math.max(0, bandwidth)} Mbps`;
      if (alertsEl) alertsEl.textContent = alertCount;
    },
  };
}

/**
 * Create network health display controller
 * @returns {Object} Health display controller
 */
export function createHealthDisplay() {
  const el = getElement('network-health');

  return {
    /**
     * Update network health status
     * @param {number} loss - Packet loss (0-1)
     */
    update(loss = 0) {
      if (!el) return;
      
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
      
      el.textContent = label;
      el.dataset.state = stateAttr;
    },
  };
}

/**
 * Get stat display elements from DOM
 * @returns {Object} Stat element references
 */
export function getStatElements() {
  const statsEl = getElement('instrument-stats');
  if (!statsEl) return {};
  
  return {
    throughput: statsEl.querySelector('[data-key="throughput"]'),
    packet: statsEl.querySelector('[data-key="packet"]'),
    sla: statsEl.querySelector('[data-key="sla"]'),
    resilience: statsEl.querySelector('[data-key="resilience"]'),
  };
}

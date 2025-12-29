/**
 * Alert Management Module
 * Handles alert creation, rendering, and threshold checking
 */

import { THRESHOLDS } from '../config.js';

/**
 * Create alert manager
 * @param {Object} options - Configuration options
 * @returns {Object} Alert manager instance
 */
export function createAlertManager({ reliabilityRow, liveEventsEl, alertsMetricEl }) {
  let alerts = [];

  return {
    /**
     * Get current alerts
     * @returns {Array}
     */
    getAlerts() {
      return [...alerts];
    },

    /**
     * Seed initial alerts from reliability library
     * @param {Array} notes - Reliability notes
     */
    seed(notes) {
      alerts = (notes || []).slice(0, 3).map((note) => ({
        title: note.title,
        detail: note.detail,
        tone: note.status === 'alert' ? 'alert' : note.status === 'scheduled' ? 'warn' : 'info',
        timestamp: Date.now(),
      }));
      this.render();
    },

    /**
     * Add a new alert
     * @param {string} detail - Alert message
     * @param {string} tone - Alert tone (info, warn, alert)
     * @returns {boolean} True if alert was added
     */
    add(detail, tone = 'info') {
      const last = alerts[alerts.length - 1];
      if (last && last.detail === detail && last.tone === tone) {
        return false; // Duplicate
      }
      
      const entry = { 
        title: 'Live event', 
        detail, 
        tone,
        timestamp: Date.now(),
      };
      alerts.push(entry);
      
      if (alerts.length > THRESHOLDS.MAX_ALERTS) {
        alerts.shift();
      }
      
      this.render();
      return true;
    },

    /**
     * Clear all alerts
     */
    clear() {
      alerts = [];
      this.render();
    },

    /**
     * Render alerts to DOM
     */
    render() {
      // Render to reliability row
      if (reliabilityRow) {
        reliabilityRow.innerHTML = '';
        alerts.slice(-THRESHOLDS.VISIBLE_ALERTS).forEach((note) => {
          const chip = document.createElement('div');
          chip.className = 'reliability-chip';
          chip.dataset.status = note.tone === 'alert' ? 'alert' : note.tone === 'warn' ? 'scheduled' : 'info';
          chip.innerHTML = `<strong>${note.title}</strong><span>${note.detail}</span>`;
          reliabilityRow.appendChild(chip);
        });
      }

      // Render to live events
      if (liveEventsEl) {
        liveEventsEl.innerHTML = '';
        alerts
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
      }

      // Update metrics element
      if (alertsMetricEl) {
        alertsMetricEl.textContent = alerts.length;
      }
    },

    /**
     * Check conditions and create alerts as needed
     * @param {Object} params - Check parameters
     */
    check({ utilization, threshold, guestLock, guestMode, activeClasses, bitrate }) {
      const utilizationPct = Math.round(utilization * 100);
      
      if (utilizationPct > threshold) {
        this.add(`Load reached ${utilizationPct}% (over ${threshold}% threshold).`, 'alert');
      }
      
      if (guestLock && guestMode === 'spike') {
        this.add('Guest Wi‑Fi locked while a spike scenario is running.', 'warn');
      }
      
      if (activeClasses >= 4 && bitrate > 1.3) {
        this.add('Multiple HD classes detected — expect higher jitter.', 'warn');
      }
    },

    /**
     * Get alert count
     * @returns {number}
     */
    get count() {
      return alerts.length;
    },
  };
}

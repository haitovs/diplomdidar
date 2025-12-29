/**
 * Inspector Module
 * Handles node inspector panel rendering
 */

import { getElement } from '../utils/dom.js';

/**
 * Create inspector panel controller
 * @param {Object} elements - Inspector DOM elements
 * @returns {Object} Inspector controller
 */
export function createInspector(elements) {
  const {
    status,
    name,
    role,
    campus,
    statusText,
    hardware,
    software,
  } = elements;

  /**
   * Render a list of items
   * @param {HTMLElement} el - Target list element
   * @param {Array<string>} items - Items to render
   */
  function renderList(el, items) {
    if (!el) return;
    el.innerHTML = '';
    if (!items || !items.length) {
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

  return {
    /**
     * Clear inspector to default state
     */
    clear() {
      if (status) {
        status.textContent = 'Awaiting selection';
        status.dataset.state = 'idle';
      }
      if (name) name.textContent = '—';
      if (role) role.textContent = '—';
      if (campus) campus.textContent = '—';
      if (statusText) statusText.textContent = '—';
      if (hardware) hardware.innerHTML = '';
      if (software) software.innerHTML = '';
    },

    /**
     * Render node details
     * @param {Object} node - Node to display
     */
    render(node) {
      if (!node) {
        this.clear();
        return;
      }

      if (status) {
        status.textContent = node.status || 'Operational';
        status.dataset.state = node.status?.toLowerCase().includes('degraded') ? 'warn' : 'live';
      }
      
      if (name) name.textContent = node.label;
      if (role) role.textContent = node.type;
      if (campus) campus.textContent = node.campus || 'N/A';
      if (statusText) statusText.textContent = `${Math.round(node.displayLoad * 100)}% load`;
      
      renderList(hardware, node.hardware);
      renderList(software, node.software);
    },

    /**
     * Set status message
     * @param {string} text - Status text
     * @param {string} state - State (idle, live, warn)
     */
    setStatus(text, state = 'idle') {
      if (!status) return;
      status.textContent = text;
      status.dataset.state = state === 'live' ? 'live' : state === 'warn' ? 'warn' : 'idle';
    },
  };
}

/**
 * Get inspector elements from DOM
 * @returns {Object} Inspector element references
 */
export function getInspectorElements() {
  return {
    status: getElement('inspector-status'),
    name: getElement('inspector-name'),
    role: getElement('inspector-role'),
    campus: getElement('inspector-campus'),
    statusText: getElement('inspector-status-text'),
    hardware: getElement('inspector-hardware'),
    software: getElement('inspector-software'),
  };
}

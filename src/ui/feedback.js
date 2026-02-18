/**
 * Feedback UI helpers
 * Centralizes toast and log list behavior with bounded growth.
 */

const ICON_BY_TYPE = {
  error: '⚠️',
  warning: '📢',
  info: '✅',
  success: '✅',
};

/**
 * Create toast manager
 */
export function createToastManager({
  container,
  maxVisible = 4,
  removeDelay = 4000,
  schedule = (handler, delay) => setTimeout(handler, delay),
  createElement = (tag) => document.createElement(tag),
  iconForType = (type) => ICON_BY_TYPE[type] || ICON_BY_TYPE.info,
} = {}) {
  if (!container) {
    return {
      show() {},
      clear() {},
    };
  }

  return {
    show(message, type = 'info') {
      const toast = createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `<span>${iconForType(type)}</span>${message}`;
      container.appendChild(toast);

      while (container.children.length > maxVisible) {
        container.removeChild(container.firstChild);
      }

      schedule(() => toast.remove(), removeDelay);
      return toast;
    },

    clear() {
      container.innerHTML = '';
    },
  };
}

/**
 * Create event-log manager
 */
export function createLogManager({
  container,
  maxEntries = 100,
  createElement = (tag) => document.createElement(tag),
  formatTime = () => new Date().toLocaleTimeString('en-US', { hour12: false }),
} = {}) {
  if (!container) {
    return {
      add() {},
      clear() {},
    };
  }

  return {
    add(message, type = 'info') {
      const entry = createElement('div');
      entry.className = `log-entry ${type}`;
      entry.innerHTML = `<span class="log-time">${formatTime()}</span><span class="log-msg">${message}</span>`;
      container.insertBefore(entry, container.firstChild);

      while (container.children.length > maxEntries) {
        container.removeChild(container.lastChild);
      }

      return entry;
    },

    clear() {
      container.innerHTML = '';
    },
  };
}


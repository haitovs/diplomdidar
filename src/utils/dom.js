/**
 * DOM Utilities - Common helpers for DOM operations
 * Includes safe element access and validation
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Safely get DOM element by ID with warning if not found
 * @param {string} id - Element ID
 * @param {boolean} [required=false] - If true, throw error when not found
 * @returns {HTMLElement|null} Element or null
 */
export function getElement(id, required = false) {
  const el = document.getElementById(id);
  if (!el) {
    const msg = `Element #${id} not found in DOM`;
    if (required) {
      throw new Error(msg);
    }
    console.warn(msg);
  }
  return el;
}

/**
 * Safely get multiple elements by their IDs
 * @param {Object<string, string>} idMap - Map of key to element ID
 * @returns {Object<string, HTMLElement|null>} Map of key to element
 */
export function getElements(idMap) {
  const result = {};
  for (const [key, id] of Object.entries(idMap)) {
    result[key] = getElement(id);
  }
  return result;
}

/**
 * Safely query selector within an element
 * @param {HTMLElement} parent - Parent element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null}
 */
export function safeQuery(parent, selector) {
  if (!parent) return null;
  return parent.querySelector(selector);
}

/**
 * Safely set text content
 * @param {HTMLElement|null} el - Target element
 * @param {string} text - Text content
 */
export function setText(el, text) {
  if (el) el.textContent = text;
}

/**
 * Safely set innerHTML
 * @param {HTMLElement|null} el - Target element
 * @param {string} html - HTML content
 */
export function setHTML(el, html) {
  if (el) el.innerHTML = html;
}

/**
 * Add event listener with cleanup tracking
 * @param {HTMLElement} el - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {Object} [options] - Event listener options
 * @returns {Function} Cleanup function to remove listener
 */
export function addListener(el, event, handler, options) {
  if (!el) return () => {};
  el.addEventListener(event, handler, options);
  return () => el.removeEventListener(event, handler, options);
}

/**
 * Format time as HH:MM
 * @param {number} decimalTime - Time as decimal hours (e.g., 8.5 = 8:30)
 * @returns {string} Formatted time string
 */
export function formatTime(decimalTime) {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Create DOM element with attributes and children
 * @param {string} tag - Tag name
 * @param {Object} [attrs] - Attributes to set
 * @param {(string|HTMLElement)[]} [children] - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }
  
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    }
  });
  
  return el;
}

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

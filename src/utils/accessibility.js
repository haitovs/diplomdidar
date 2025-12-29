/**
 * Accessibility Module
 * Adds ARIA attributes and keyboard navigation support
 */

/**
 * Initialize accessibility features
 * Call this after DOM is ready
 */
export function initAccessibility() {
  // Add skip link for keyboard users
  addSkipLink();
  
  // Enhance buttons with ARIA
  enhanceButtons();
  
  // Enhance canvas with ARIA
  enhanceCanvas();
  
  // Add live regions for dynamic content
  addLiveRegions();
  
  // Enhance form controls
  enhanceFormControls();

  console.log('Accessibility features initialized');
}

/**
 * Add skip navigation link
 */
function addSkipLink() {
  if (document.getElementById('skip-link')) return;

  const skipLink = document.createElement('a');
  skipLink.id = 'skip-link';
  skipLink.href = '#network-canvas';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  
  // Add styles
  if (!document.getElementById('a11y-styles')) {
    const style = document.createElement('style');
    style.id = 'a11y-styles';
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--accent, #6c7cff);
        color: white;
        padding: 8px 16px;
        z-index: 10000;
        text-decoration: none;
        border-radius: 0 0 8px 0;
        transition: top 0.2s;
      }
      .skip-link:focus {
        top: 0;
      }
      
      /* Focus indicators */
      :focus-visible {
        outline: 2px solid var(--accent, #6c7cff);
        outline-offset: 2px;
      }
      
      /* Screen reader only */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Enhance buttons with ARIA attributes
 */
function enhanceButtons() {
  // Start/Stop simulation buttons
  const startBtn = document.getElementById('start-simulation');
  const stopBtn = document.getElementById('stop-simulation');
  
  if (startBtn) {
    startBtn.setAttribute('aria-label', 'Start network simulation streaming');
    startBtn.setAttribute('aria-pressed', 'false');
  }
  
  if (stopBtn) {
    stopBtn.setAttribute('aria-label', 'Pause network simulation');
    stopBtn.setAttribute('aria-pressed', 'false');
  }

  // Theme toggle
  const themeBtn = document.getElementById('toggle-dark');
  if (themeBtn) {
    themeBtn.setAttribute('aria-label', 'Toggle dark/light theme');
    themeBtn.setAttribute('aria-pressed', document.body.classList.contains('light') ? 'true' : 'false');
  }

  // Sidebar toggle
  const sidebarBtn = document.getElementById('toggle-sidebar');
  if (sidebarBtn) {
    sidebarBtn.setAttribute('aria-label', 'Toggle control sidebar');
    sidebarBtn.setAttribute('aria-expanded', 'true');
    sidebarBtn.setAttribute('aria-controls', 'control-sidebar');
  }

  // Handle toggle
  const handleBtn = document.getElementById('toggle-handle-visibility');
  if (handleBtn) {
    handleBtn.setAttribute('aria-label', 'Toggle wire handle visibility');
    handleBtn.setAttribute('aria-pressed', 'true');
  }

  // Pod handles
  document.querySelectorAll('.pod-handle').forEach(handle => {
    handle.setAttribute('aria-label', 'Drag to reposition panel');
    handle.setAttribute('role', 'button');
  });
}

/**
 * Enhance canvas with ARIA
 */
function enhanceCanvas() {
  const canvas = document.getElementById('network-canvas');
  if (canvas) {
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Interactive network topology visualization showing nodes, connections, and real-time traffic flow');
    canvas.setAttribute('tabindex', '0');
  }

  const playgroundCanvas = document.getElementById('playground-canvas');
  if (playgroundCanvas) {
    playgroundCanvas.setAttribute('role', 'application');
    playgroundCanvas.setAttribute('aria-label', 'Network playground canvas for creating custom topologies');
    playgroundCanvas.setAttribute('tabindex', '0');
  }
}

/**
 * Add ARIA live regions for dynamic content
 */
function addLiveRegions() {
  // Status pill - announces simulation state changes
  const statusPill = document.getElementById('runtime-status');
  if (statusPill) {
    statusPill.setAttribute('role', 'status');
    statusPill.setAttribute('aria-live', 'polite');
    statusPill.setAttribute('aria-atomic', 'true');
  }

  // Clock
  const clock = document.getElementById('sim-clock');
  if (clock) {
    clock.setAttribute('role', 'timer');
    clock.setAttribute('aria-label', 'Simulation time');
  }

  // Network health
  const health = document.getElementById('network-health');
  if (health) {
    health.setAttribute('role', 'status');
    health.setAttribute('aria-live', 'polite');
  }

  // Alerts container
  const alerts = document.getElementById('reliability-row');
  if (alerts) {
    alerts.setAttribute('role', 'log');
    alerts.setAttribute('aria-live', 'polite');
    alerts.setAttribute('aria-label', 'Network alerts and notifications');
  }

  // Metrics
  const metrics = document.querySelector('.hero__metrics');
  if (metrics) {
    metrics.setAttribute('role', 'region');
    metrics.setAttribute('aria-label', 'Current simulation metrics');
  }
}

/**
 * Enhance form controls with labels and descriptions
 */
function enhanceFormControls() {
  // Scenario select
  const scenarioSelect = document.getElementById('scenario-select');
  if (scenarioSelect) {
    scenarioSelect.setAttribute('aria-label', 'Select simulation scenario');
  }

  // Range inputs
  const aiLoad = document.getElementById('ai-load');
  if (aiLoad) {
    aiLoad.setAttribute('aria-label', 'AI workload intensity');
    aiLoad.setAttribute('aria-valuemin', '0');
    aiLoad.setAttribute('aria-valuemax', '1');
    aiLoad.setAttribute('aria-valuenow', aiLoad.value);
  }

  const bitrate = document.getElementById('instrument-bitrate');
  if (bitrate) {
    bitrate.setAttribute('aria-label', 'Streaming quality / bitrate');
  }

  const devices = document.getElementById('instrument-devices');
  if (devices) {
    devices.setAttribute('aria-label', 'Devices per student');
  }

  const threshold = document.getElementById('input-threshold');
  if (threshold) {
    threshold.setAttribute('aria-label', 'Alert threshold percentage');
  }

  // Checkbox
  const guestLock = document.getElementById('instrument-guestlock');
  if (guestLock) {
    guestLock.setAttribute('aria-label', 'Lock guest Wi-Fi network');
  }
}

/**
 * Update ARIA states when simulation state changes
 * @param {Object} state - Current state
 */
export function updateAriaStates({ isPlaying, sidebarVisible, handlesVisible }) {
  const startBtn = document.getElementById('start-simulation');
  const stopBtn = document.getElementById('stop-simulation');
  const sidebarBtn = document.getElementById('toggle-sidebar');
  const handleBtn = document.getElementById('toggle-handle-visibility');

  if (startBtn) {
    startBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }
  if (stopBtn) {
    stopBtn.setAttribute('aria-pressed', !isPlaying ? 'true' : 'false');
  }
  if (sidebarBtn) {
    sidebarBtn.setAttribute('aria-expanded', sidebarVisible ? 'true' : 'false');
  }
  if (handleBtn) {
    handleBtn.setAttribute('aria-pressed', handlesVisible ? 'true' : 'false');
  }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} [priority='polite'] - 'polite' or 'assertive'
 */
export function announce(message, priority = 'polite') {
  let announcer = document.getElementById('a11y-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }

  // Clear and set new message
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

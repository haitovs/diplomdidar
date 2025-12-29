/**
 * Keyboard shortcuts handler
 * Provides keyboard navigation and shortcuts for the simulation
 */

/**
 * Keyboard shortcut definitions
 */
const SHORTCUTS = {
  ' ': { action: 'togglePlayback', description: 'Play/Pause simulation' },
  'Escape': { action: 'stopPlayback', description: 'Stop simulation' },
  'd': { action: 'toggleDarkMode', description: 'Toggle dark/light mode' },
  's': { action: 'toggleSidebar', description: 'Toggle sidebar' },
  'h': { action: 'toggleHandles', description: 'Toggle wire handles' },
  '?': { action: 'showHelp', description: 'Show keyboard shortcuts' },
  'r': { action: 'resetView', description: 'Reset canvas view' },
};

/**
 * Initialize keyboard shortcuts
 * @param {Object} handlers - Map of action names to handler functions
 * @returns {Function} Cleanup function to remove listener
 */
export function initKeyboardShortcuts(handlers) {
  const handleKeydown = (event) => {
    // Ignore if user is typing in an input
    const tagName = event.target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return;
    }

    const shortcut = SHORTCUTS[event.key];
    if (shortcut && handlers[shortcut.action]) {
      event.preventDefault();
      handlers[shortcut.action](event);
    }
  };

  document.addEventListener('keydown', handleKeydown);
  
  // Return cleanup function
  return () => document.removeEventListener('keydown', handleKeydown);
}

/**
 * Get all available shortcuts for help display
 * @returns {Array<{key: string, description: string}>}
 */
export function getShortcutsList() {
  return Object.entries(SHORTCUTS).map(([key, value]) => ({
    key: key === ' ' ? 'Space' : key,
    description: value.description,
  }));
}

/**
 * Show keyboard shortcuts modal/toast
 */
export function showShortcutsHelp() {
  const existing = document.getElementById('shortcuts-help');
  if (existing) {
    existing.remove();
    return;
  }

  const shortcuts = getShortcutsList();
  const html = shortcuts
    .map(s => `<div><kbd>${s.key}</kbd> ${s.description}</div>`)
    .join('');

  const modal = document.createElement('div');
  modal.id = 'shortcuts-help';
  modal.className = 'shortcuts-modal';
  modal.innerHTML = `
    <div class="shortcuts-content">
      <h3>Keyboard Shortcuts</h3>
      ${html}
      <button class="btn subtle" onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  
  // Add styles if not present
  if (!document.getElementById('shortcuts-styles')) {
    const style = document.createElement('style');
    style.id = 'shortcuts-styles';
    style.textContent = `
      .shortcuts-modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
      }
      .shortcuts-content {
        background: var(--surface, #1a1a2e);
        border: 1px solid var(--border, rgba(255,255,255,0.1));
        border-radius: 16px;
        padding: 24px;
        min-width: 280px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.4);
      }
      .shortcuts-content h3 {
        margin: 0 0 16px 0;
      }
      .shortcuts-content div {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .shortcuts-content kbd {
        background: rgba(255,255,255,0.1);
        padding: 4px 10px;
        border-radius: 6px;
        font-family: monospace;
        min-width: 40px;
        text-align: center;
      }
      .shortcuts-content button {
        margin-top: 16px;
        width: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // Close on Escape
  const closeOnEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', closeOnEscape);
    }
  };
  document.addEventListener('keydown', closeOnEscape);
}

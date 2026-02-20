/**
 * Device Palette Component
 * Provides a draggable palette of network devices for the playground editor
 */

import { DEVICE_CONFIG } from '../rendering/NodeRenderer.js';

// Device categories for organized display
export const DEVICE_CATEGORIES = {
  core: {
    label: 'Core Network',
    icon: '🔀',
    devices: ['coreRouter', 'router', 'firewall'],
  },
  access: {
    label: 'Access Layer',
    icon: '📡',
    devices: ['switch', 'accessPoint'],
  },
  servers: {
    label: 'Servers',
    icon: '🖥️',
    devices: ['server', 'lab'],
  },
  endpoints: {
    label: 'Endpoints',
    icon: '📱',
    devices: ['pc', 'iot'],
  },
  cloud: {
    label: 'Cloud & Internet',
    icon: '☁️',
    devices: ['cloud', 'internet'],
  },
};

/**
 * Device Palette UI Component
 */
export class DevicePalette {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onDeviceSelect: null,
      onDeviceDragStart: null,
      ...options,
    };
    
    this.selectedDevice = null;
    this.render();
  }

  /**
   * Render the palette UI
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'device-palette';
    
    // Create search input
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'palette-search';
    searchWrapper.innerHTML = `
      <input type="text" placeholder="Search devices..." id="palette-search" />
    `;
    this.container.appendChild(searchWrapper);
    
    // Create category sections
    Object.entries(DEVICE_CATEGORIES).forEach(([catKey, category]) => {
      const section = this.createCategorySection(catKey, category);
      this.container.appendChild(section);
    });

    // Search functionality
    const searchInput = this.container.querySelector('#palette-search');
    searchInput.addEventListener('input', (e) => this.filterDevices(e.target.value));

    this.addStyles();
  }

  /**
   * Create a category section
   */
  createCategorySection(catKey, category) {
    const section = document.createElement('div');
    section.className = 'palette-category';
    section.dataset.category = catKey;
    
    // Header
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <span class="category-label">${category.label}</span>
      <span class="category-toggle">▼</span>
    `;
    header.addEventListener('click', () => this.toggleCategory(section));
    section.appendChild(header);
    
    // Device grid
    const grid = document.createElement('div');
    grid.className = 'device-grid';
    
    category.devices.forEach(deviceKey => {
      const deviceConfig = DEVICE_CONFIG[deviceKey];
      if (!deviceConfig) return;
      
      const deviceEl = this.createDeviceItem(deviceKey, deviceConfig);
      grid.appendChild(deviceEl);
    });
    
    section.appendChild(grid);
    return section;
  }

  /**
   * Create a single device item
   */
  createDeviceItem(deviceKey, config) {
    const item = document.createElement('div');
    item.className = 'palette-device';
    item.dataset.device = deviceKey;
    item.draggable = true;
    
    item.innerHTML = `
      <div class="device-icon" style="background-color: ${config.color}20; border-color: ${config.color};">
        <img src="/icons/${config.icon}.svg" alt="${config.label}" onerror="this.remove()" />
      </div>
      <div class="device-label">${config.label}</div>
    `;
    
    // Click to select
    item.addEventListener('click', () => this.selectDevice(deviceKey, item));
    
    // Drag start
    item.addEventListener('dragstart', (e) => {
      // Safari is strict about transferable types; set multiple keys.
      e.dataTransfer.setData('device', deviceKey);
      e.dataTransfer.setData('application/x-network-device', deviceKey);
      e.dataTransfer.setData('text/plain', deviceKey);
      e.dataTransfer.effectAllowed = 'copy';
      item.classList.add('dragging');
      
      if (this.options.onDeviceDragStart) {
        this.options.onDeviceDragStart(deviceKey, e);
      }
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    
    return item;
  }

  /**
   * Select a device type
   */
  selectDevice(deviceKey, element, emit = true) {
    // Deselect previous
    const prev = this.container.querySelector('.palette-device.selected');
    if (prev) prev.classList.remove('selected');
    
    // Select new
    this.selectedDevice = deviceKey;
    element.classList.add('selected');
    
    if (emit && this.options.onDeviceSelect) {
      this.options.onDeviceSelect(deviceKey);
    }
  }

  /**
   * Programmatically select a device by key.
   */
  setSelectedDevice(deviceKey, emit = true) {
    const element = this.container.querySelector(`.palette-device[data-device="${deviceKey}"]`);
    if (!element) return false;
    this.selectDevice(deviceKey, element, emit);
    return true;
  }

  /**
   * Get currently selected device
   */
  getSelectedDevice() {
    return this.selectedDevice;
  }

  /**
   * Clear selection
   */
  clearSelection() {
    const prev = this.container.querySelector('.palette-device.selected');
    if (prev) prev.classList.remove('selected');
    this.selectedDevice = null;
  }

  /**
   * Toggle category collapse
   */
  toggleCategory(section) {
    section.classList.toggle('collapsed');
    const toggle = section.querySelector('.category-toggle');
    toggle.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
  }

  /**
   * Filter devices by search
   */
  filterDevices(query) {
    const lowerQuery = query.toLowerCase();
    
    this.container.querySelectorAll('.palette-device').forEach(device => {
      const key = device.dataset.device;
      const config = DEVICE_CONFIG[key];
      const visible = !query || 
        key.toLowerCase().includes(lowerQuery) ||
        config?.label?.toLowerCase().includes(lowerQuery);
      
      device.style.display = visible ? '' : 'none';
    });
    
    // Show/hide categories based on visible devices
    this.container.querySelectorAll('.palette-category').forEach(cat => {
      const visibleDevices = cat.querySelectorAll('.palette-device:not([style*="none"])');
      cat.style.display = visibleDevices.length > 0 ? '' : 'none';
    });
  }

  /**
   * Add styles
   */
  addStyles() {
    if (document.getElementById('device-palette-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'device-palette-styles';
    style.textContent = `
      .device-palette {
        background: rgba(15, 23, 42, 0.95);
        border-radius: 12px;
        padding: 12px;
        max-height: 100%;
        overflow-y: auto;
      }
      
      .palette-search {
        margin-bottom: 12px;
      }
      
      .palette-search input {
        width: 100%;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #f8fafc;
        font-size: 14px;
      }
      
      .palette-search input:focus {
        outline: none;
        border-color: #6366f1;
      }
      
      .palette-category {
        margin-bottom: 12px;
      }
      
      .palette-category.collapsed .device-grid {
        display: none;
      }
      
      .category-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s;
      }
      
      .category-header:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .category-icon {
        font-size: 16px;
      }
      
      .category-label {
        flex: 1;
        font-weight: 500;
        color: #94a3b8;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .category-toggle {
        font-size: 10px;
        color: #64748b;
      }
      
      .device-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        padding: 8px 0;
      }
      
      .palette-device {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        cursor: grab;
        transition: all 0.2s;
      }
      
      .palette-device:hover {
        background: rgba(99, 102, 241, 0.1);
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
      }
      
      .palette-device.selected {
        background: rgba(99, 102, 241, 0.2);
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
      }
      
      .palette-device.dragging {
        opacity: 0.5;
        cursor: grabbing;
      }
      
      .palette-device .device-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
      }
      
      .palette-device .device-icon img {
        width: 24px;
        height: 24px;
      }
      
      .palette-device .device-label {
        font-size: 11px;
        color: #e2e8f0;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

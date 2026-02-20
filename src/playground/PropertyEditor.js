/**
 * Property Editor Panel
 * Edits properties of selected nodes and links
 */

import { LINK_CONFIG } from '../rendering/LinkRenderer.js';
import { DEVICE_CONFIG } from '../rendering/NodeRenderer.js';
import { getLinkDefaults, getNodeDefaults } from '../utils/topologySchema.js';

/**
 * Property Editor Class
 */
export class PropertyEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onPropertyChange: null,
      onDelete: null,
      ...options,
    };
    
    this.currentItem = null;
    this.currentType = null; // 'node' or 'link'
    
    this.render();
  }

  /**
   * Show editor for a node
   */
  editNode(node) {
    this.currentItem = node;
    this.currentType = 'node';
    this.renderNodeEditor(node);
  }

  /**
   * Show editor for a link
   */
  editLink(link) {
    this.currentItem = link;
    this.currentType = 'link';
    this.renderLinkEditor(link);
  }

  /**
   * Clear editor
   */
  clear() {
    this.currentItem = null;
    this.currentType = null;
    this.renderEmpty();
  }

  /**
   * Render empty state
   */
  render() {
    this.container.className = 'property-editor';
    this.renderEmpty();
    this.addStyles();
  }

  /**
   * Render empty state
   */
  renderEmpty() {
    this.container.innerHTML = `
      <div class="editor-empty">
        <div class="empty-icon">📋</div>
        <div class="empty-text">Select a node or link to edit its properties</div>
      </div>
    `;
  }

  /**
   * Render node editor form
   */
  renderNodeEditor(node) {
    const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
    const nodeDefaults = getNodeDefaults(node.type);
    const positionX = Math.round((node.position?.x || 0) * 100);
    const positionY = Math.round((node.position?.y || 0) * 100);
    const loadPercent = Math.round((node.load || 0.5) * 100);
    const routingRole = node.routingRole || node.role || nodeDefaults.role;
    const routingProtocol = node.routingProtocol || nodeDefaults.routingProtocol;
    const interfaceSpeed = node.interfaceSpeedMbps || nodeDefaults.interfaceSpeedMbps;
    const vlan = node.vlan || nodeDefaults.vlan;
    const subnetCidr = node.subnetCidr || nodeDefaults.subnetCidr || '';
    
    this.container.innerHTML = `
      <div class="editor-header">
        <div class="editor-title">
          <span class="editor-icon" style="background-color: ${config.color}20; border-color: ${config.color};">
            <img src="/icons/${config.icon}.svg" alt="${config.label}" />
          </span>
          <span class="editor-label">Edit Node</span>
        </div>
        <button class="btn-delete" title="Delete node">🗑️</button>
      </div>
      
      <div class="editor-body">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="prop-label" value="${node.label || ''}" />
        </div>
        
        <div class="form-group">
          <label>Device Type</label>
          <select id="prop-type">
            ${Object.entries(DEVICE_CONFIG).map(([key, cfg]) => `
              <option value="${key}" ${key === node.type ? 'selected' : ''}>${cfg.label}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Position X</label>
            <input type="number" id="prop-x" value="${positionX}" min="0" max="100" />
            <span class="form-unit">%</span>
          </div>
          <div class="form-group">
            <label>Position Y</label>
            <input type="number" id="prop-y" value="${positionY}" min="0" max="100" />
            <span class="form-unit">%</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>Load</label>
          <input type="range" id="prop-load" value="${loadPercent}" min="0" max="100" />
          <span class="form-value" id="prop-load-value">${loadPercent}%</span>
        </div>
        
        <div class="form-group">
          <label>Status</label>
          <select id="prop-status">
            <option value="healthy" ${node.status === 'healthy' ? 'selected' : ''}>Healthy</option>
            <option value="warning" ${node.status === 'warning' ? 'selected' : ''}>Warning</option>
            <option value="critical" ${node.status === 'critical' ? 'selected' : ''}>Critical</option>
            <option value="degraded" ${node.status === 'degraded' ? 'selected' : ''}>Degraded</option>
            <option value="offline" ${node.status === 'offline' ? 'selected' : ''}>Offline</option>
          </select>
        </div>

        <div class="form-divider">Network Parameters</div>

        <div class="form-row">
          <div class="form-group">
            <label>Routing Role</label>
            <select id="prop-role">
              <option value="core" ${routingRole === 'core' ? 'selected' : ''}>Core</option>
              <option value="distribution" ${routingRole === 'distribution' ? 'selected' : ''}>Distribution</option>
              <option value="access" ${routingRole === 'access' ? 'selected' : ''}>Access</option>
              <option value="edge" ${routingRole === 'edge' ? 'selected' : ''}>Edge</option>
              <option value="server" ${routingRole === 'server' ? 'selected' : ''}>Server</option>
              <option value="security" ${routingRole === 'security' ? 'selected' : ''}>Security</option>
              <option value="endpoint" ${routingRole === 'endpoint' ? 'selected' : ''}>Endpoint</option>
            </select>
          </div>
          <div class="form-group">
            <label>Routing Protocol</label>
            <select id="prop-routing-protocol">
              <option value="none" ${routingProtocol === 'none' ? 'selected' : ''}>None</option>
              <option value="static" ${routingProtocol === 'static' ? 'selected' : ''}>Static</option>
              <option value="rip" ${routingProtocol === 'rip' ? 'selected' : ''}>RIP</option>
              <option value="ospf" ${routingProtocol === 'ospf' ? 'selected' : ''}>OSPF</option>
              <option value="eigrp" ${routingProtocol === 'eigrp' ? 'selected' : ''}>EIGRP</option>
              <option value="bgp" ${routingProtocol === 'bgp' ? 'selected' : ''}>BGP</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>IPv4 Address</label>
            <input type="text" id="prop-ipv4" value="${node.ipv4 || ''}" placeholder="10.10.10.2" />
          </div>
          <div class="form-group">
            <label>Subnet (CIDR)</label>
            <input type="text" id="prop-subnet" value="${subnetCidr}" placeholder="10.10.10.0/24" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Gateway</label>
            <input type="text" id="prop-gateway" value="${node.gateway || ''}" placeholder="10.10.10.1" />
          </div>
          <div class="form-group">
            <label>VLAN</label>
            <input type="number" id="prop-vlan" value="${vlan}" min="1" max="4094" />
          </div>
        </div>

        <div class="form-group">
          <label>Interface Speed (Mbps)</label>
          <input type="number" id="prop-interface-speed" value="${interfaceSpeed}" min="10" max="400000" />
        </div>
        
        <div class="form-group">
          <label>Notes</label>
          <textarea id="prop-notes" rows="3">${node.notes || ''}</textarea>
        </div>
      </div>
      
      <div class="editor-footer">
        <button class="btn-apply">Apply Changes</button>
      </div>
    `;
    
    this.setupNodeListeners(node);
  }

  /**
   * Setup node form listeners
   */
  setupNodeListeners(node) {
    // Load slider
    const loadSlider = this.container.querySelector('#prop-load');
    const loadValue = this.container.querySelector('#prop-load-value');
    loadSlider.addEventListener('input', () => {
      loadValue.textContent = loadSlider.value + '%';
    });
    
    // Delete button
    this.container.querySelector('.btn-delete').addEventListener('click', () => {
      if (this.options.onDelete) {
        this.options.onDelete('node', node.id);
      }
    });
    
    // Apply button
    this.container.querySelector('.btn-apply').addEventListener('click', () => {
      this.applyNodeChanges(node);
    });
  }

  /**
   * Apply node property changes
   */
  applyNodeChanges(node) {
    const posX = this.readNumericInput('prop-x', 50, { min: 0, max: 100, integer: true });
    const posY = this.readNumericInput('prop-y', 50, { min: 0, max: 100, integer: true });
    const load = this.readNumericInput('prop-load', 50, { min: 0, max: 100 }) / 100;
    const interfaceSpeedMbps = this.readNumericInput('prop-interface-speed', 1000, { min: 10, max: 400000, integer: true });
    const vlan = this.readNumericInput('prop-vlan', 10, { min: 1, max: 4094, integer: true });

    const updates = {
      label: this.container.querySelector('#prop-label').value,
      type: this.container.querySelector('#prop-type').value,
      position: {
        x: posX / 100,
        y: posY / 100,
      },
      load,
      status: this.container.querySelector('#prop-status').value,
      role: this.container.querySelector('#prop-role').value,
      routingRole: this.container.querySelector('#prop-role').value,
      routingProtocol: this.container.querySelector('#prop-routing-protocol').value,
      interfaceSpeedMbps,
      ipv4: this.container.querySelector('#prop-ipv4').value.trim(),
      subnetCidr: this.container.querySelector('#prop-subnet').value.trim(),
      gateway: this.container.querySelector('#prop-gateway').value.trim(),
      vlan,
      notes: this.container.querySelector('#prop-notes').value,
    };
    
    if (this.options.onPropertyChange) {
      this.options.onPropertyChange('node', node.id, updates);
    }
  }

  /**
   * Render link editor form
   */
  renderLinkEditor(link) {
    const linkDefaults = getLinkDefaults(link.type);
    const bandwidth = link.bandwidth || linkDefaults.bandwidth;
    const latency = link.latency || linkDefaults.latency;
    const jitter = link.jitter ?? linkDefaults.jitter;
    const packetLoss = link.packetLoss ?? linkDefaults.packetLoss;
    const utilizationCap = link.utilizationCap || linkDefaults.utilizationCap;
    const duplex = link.duplex || linkDefaults.duplex;
    const queueLimit = link.queueLimit || linkDefaults.queueLimit;

    this.container.innerHTML = `
      <div class="editor-header">
        <div class="editor-title">
          <span class="editor-icon link-icon">🔗</span>
          <span class="editor-label">Edit Link</span>
        </div>
        <button class="btn-delete" title="Delete link">🗑️</button>
      </div>
      
      <div class="editor-body">
        <div class="form-group">
          <label>Link Type</label>
          <select id="prop-link-type">
            ${Object.entries(LINK_CONFIG).map(([key, cfg]) => `
              <option value="${key}" ${key === link.type ? 'selected' : ''}>${cfg.label}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Bandwidth (Mbps)</label>
          <input type="number" id="prop-bandwidth" value="${bandwidth}" min="1" max="400000" />
        </div>
        
        <div class="form-group">
          <label>Latency (ms)</label>
          <input type="number" id="prop-latency" value="${latency}" min="0.1" max="5000" step="0.1" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Jitter (ms)</label>
            <input type="number" id="prop-jitter" value="${jitter}" min="0" max="1000" step="0.1" />
          </div>
          <div class="form-group">
            <label>Packet Loss (%)</label>
            <input type="number" id="prop-packet-loss" value="${packetLoss}" min="0" max="100" step="0.1" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Duplex</label>
            <select id="prop-duplex">
              <option value="full" ${duplex === 'full' ? 'selected' : ''}>Full</option>
              <option value="half" ${duplex === 'half' ? 'selected' : ''}>Half</option>
            </select>
          </div>
          <div class="form-group">
            <label>Utilization Cap (%)</label>
            <input type="number" id="prop-utilization-cap" value="${utilizationCap}" min="10" max="100" />
          </div>
        </div>

        <div class="form-group">
          <label>Queue Limit (packets)</label>
          <input type="number" id="prop-queue-limit" value="${queueLimit}" min="10" max="200000" />
        </div>
        
        <div class="form-group info-group">
          <label>Source</label>
          <div class="info-value">${link.source}</div>
        </div>
        
        <div class="form-group info-group">
          <label>Target</label>
          <div class="info-value">${link.target}</div>
        </div>
      </div>
      
      <div class="editor-footer">
        <button class="btn-apply">Apply Changes</button>
      </div>
    `;
    
    this.setupLinkListeners(link);
  }

  /**
   * Setup link form listeners
   */
  setupLinkListeners(link) {
    // Delete button
    this.container.querySelector('.btn-delete').addEventListener('click', () => {
      if (this.options.onDelete) {
        this.options.onDelete('link', link.id);
      }
    });
    
    // Apply button
    this.container.querySelector('.btn-apply').addEventListener('click', () => {
      this.applyLinkChanges(link);
    });
  }

  /**
   * Apply link property changes
   */
  applyLinkChanges(link) {
    const updates = {
      type: this.container.querySelector('#prop-link-type').value,
      bandwidth: this.readNumericInput('prop-bandwidth', 1000, { min: 1, max: 400000, integer: true }),
      latency: this.readNumericInput('prop-latency', 5, { min: 0.1, max: 5000 }),
      jitter: this.readNumericInput('prop-jitter', 1, { min: 0, max: 1000 }),
      packetLoss: this.readNumericInput('prop-packet-loss', 0.1, { min: 0, max: 100 }),
      duplex: this.container.querySelector('#prop-duplex').value,
      utilizationCap: this.readNumericInput('prop-utilization-cap', 100, { min: 10, max: 100 }),
      queueLimit: this.readNumericInput('prop-queue-limit', 5000, { min: 10, max: 200000, integer: true }),
    };
    
    if (this.options.onPropertyChange) {
      this.options.onPropertyChange('link', link.id, updates);
    }
  }

  /**
   * Parse and clamp a numeric input.
   */
  readNumericInput(id, fallback, options = {}) {
    const input = this.container.querySelector(`#${id}`);
    const value = Number(input?.value);
    if (!Number.isFinite(value)) return fallback;

    const min = Number.isFinite(options.min) ? options.min : -Infinity;
    const max = Number.isFinite(options.max) ? options.max : Infinity;
    const clamped = Math.min(max, Math.max(min, value));
    return options.integer ? Math.round(clamped) : clamped;
  }

  /**
   * Add styles
   */
  addStyles() {
    if (document.getElementById('property-editor-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'property-editor-styles';
    style.textContent = `
      .property-editor {
        background: rgba(15, 23, 42, 0.95);
        border-radius: 12px;
        overflow: hidden;
      }
      
      .editor-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }
      
      .empty-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.5;
      }
      
      .empty-text {
        color: #64748b;
        font-size: 13px;
      }
      
      .editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .editor-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .editor-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .editor-icon img {
        width: 20px;
        height: 20px;
      }
      
      .editor-icon.link-icon {
        background: rgba(34, 197, 94, 0.1);
        border-color: #22c55e;
        font-size: 18px;
      }
      
      .editor-label {
        font-weight: 600;
        font-size: 14px;
      }
      
      .btn-delete {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-delete:hover {
        background: rgba(239, 68, 68, 0.2);
      }
      
      .editor-body {
        padding: 16px;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group label {
        display: block;
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .form-divider {
        margin: 18px 0 12px;
        padding-top: 12px;
        border-top: 1px dashed rgba(255, 255, 255, 0.12);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #a5b4fc;
      }
      
      .form-group input[type="text"],
      .form-group input[type="number"],
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #f8fafc;
        font-size: 14px;
      }
      
      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #6366f1;
      }
      
      .form-group input[type="range"] {
        width: calc(100% - 50px);
        vertical-align: middle;
      }
      
      .form-value {
        display: inline-block;
        width: 45px;
        text-align: right;
        font-size: 13px;
        color: #94a3b8;
      }
      
      .form-row {
        display: flex;
        gap: 12px;
      }
      
      .form-row .form-group {
        flex: 1;
        position: relative;
      }
      
      .form-unit {
        position: absolute;
        right: 12px;
        bottom: 10px;
        font-size: 12px;
        color: #64748b;
      }
      
      .info-group .info-value {
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        color: #94a3b8;
      }
      
      .editor-footer {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .btn-apply {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-apply:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
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

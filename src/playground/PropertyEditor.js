/**
 * Property Editor Panel
 * Edits properties of selected nodes and links with interface support.
 */

import { LINK_CONFIG } from '../rendering/LinkRenderer.js';
import { DEVICE_CONFIG } from '../rendering/NodeRenderer.js';
import { isEndpointType, isRouterType } from '../network/InterfaceManager.js';

export class PropertyEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onPropertyChange: null,
      onDelete: null,
      ...options,
    };

    this.currentItem = null;
    this.currentType = null;

    this.render();
  }

  editNode(node) {
    this.currentItem = node;
    this.currentType = 'node';
    this.renderNodeEditor(node);
  }

  editLink(link) {
    this.currentItem = link;
    this.currentType = 'link';
    this.renderLinkEditor(link);
  }

  clear() {
    this.currentItem = null;
    this.currentType = null;
    this.renderEmpty();
  }

  render() {
    this.container.className = 'property-editor';
    this.renderEmpty();
    this.addStyles();
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="editor-empty">
        <div class="empty-icon">📋</div>
        <div class="empty-text">Select a node or link to edit its properties</div>
      </div>
    `;
  }

  renderNodeEditor(node) {
    const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
    const positionX = Math.round((node.position?.x || 0) * 100);
    const positionY = Math.round((node.position?.y || 0) * 100);
    const showGateway = isEndpointType(node.type);

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
          <label>Hostname</label>
          <input type="text" id="prop-hostname" value="${node.hostname || node.label || ''}" />
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

        ${showGateway ? `
        <div class="form-group">
          <label>Default Gateway</label>
          <input type="text" id="prop-gateway" value="${node.defaultGateway || ''}" placeholder="10.0.0.1" />
        </div>
        ` : ''}

        <div class="form-divider">Interfaces</div>
        <div class="interface-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>IP</th>
                <th>Mask</th>
                <th>MAC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(node.interfaces || []).map(iface => `
                <tr class="${iface.status === 'down' ? 'iface-down' : ''}">
                  <td>${iface.shortName}</td>
                  <td class="${iface.ipAddress ? '' : 'unassigned'}">${iface.ipAddress || 'unassigned'}</td>
                  <td>${iface.subnetMask || '-'}</td>
                  <td class="mono-small">${iface.mac}</td>
                  <td><span class="status-${iface.status}">${iface.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea id="prop-notes" rows="2">${node.notes || ''}</textarea>
        </div>
      </div>

      <div class="editor-footer">
        <button class="btn-apply">Apply Changes</button>
      </div>
    `;

    this.setupNodeListeners(node);
  }

  setupNodeListeners(node) {
    this.container.querySelector('.btn-delete').addEventListener('click', () => {
      if (this.options.onDelete) {
        this.options.onDelete('node', node.id);
      }
    });

    this.container.querySelector('.btn-apply').addEventListener('click', () => {
      this.applyNodeChanges(node);
    });
  }

  applyNodeChanges(node) {
    const posX = this.readNumericInput('prop-x', 50, { min: 0, max: 100, integer: true });
    const posY = this.readNumericInput('prop-y', 50, { min: 0, max: 100, integer: true });
    const gatewayInput = this.container.querySelector('#prop-gateway');

    const updates = {
      label: this.container.querySelector('#prop-hostname').value,
      hostname: this.container.querySelector('#prop-hostname').value,
      type: this.container.querySelector('#prop-type').value,
      position: { x: posX / 100, y: posY / 100 },
      notes: this.container.querySelector('#prop-notes').value,
    };

    if (gatewayInput) {
      updates.defaultGateway = gatewayInput.value.trim();
    }

    if (this.options.onPropertyChange) {
      this.options.onPropertyChange('node', node.id, updates);
    }
  }

  renderLinkEditor(link) {
    // Find available interfaces for source and target nodes (passed via link metadata)
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
          <input type="number" id="prop-bandwidth" value="${link.bandwidth || 1000}" min="1" max="400000" />
        </div>

        <div class="form-group info-group">
          <label>Source</label>
          <div class="info-value">${link.source} <span class="mono-small">${link.sourceInterface || 'auto'}</span></div>
        </div>

        <div class="form-group info-group">
          <label>Target</label>
          <div class="info-value">${link.target} <span class="mono-small">${link.targetInterface || 'auto'}</span></div>
        </div>
      </div>

      <div class="editor-footer">
        <button class="btn-apply">Apply Changes</button>
      </div>
    `;

    this.setupLinkListeners(link);
  }

  setupLinkListeners(link) {
    this.container.querySelector('.btn-delete').addEventListener('click', () => {
      if (this.options.onDelete) {
        this.options.onDelete('link', link.id);
      }
    });

    this.container.querySelector('.btn-apply').addEventListener('click', () => {
      this.applyLinkChanges(link);
    });
  }

  applyLinkChanges(link) {
    const updates = {
      type: this.container.querySelector('#prop-link-type').value,
      bandwidth: this.readNumericInput('prop-bandwidth', 1000, { min: 1, max: 400000, integer: true }),
    };

    if (this.options.onPropertyChange) {
      this.options.onPropertyChange('link', link.id, updates);
    }
  }

  readNumericInput(id, fallback, options = {}) {
    const input = this.container.querySelector(`#${id}`);
    const value = Number(input?.value);
    if (!Number.isFinite(value)) return fallback;
    const min = Number.isFinite(options.min) ? options.min : -Infinity;
    const max = Number.isFinite(options.max) ? options.max : Infinity;
    const clamped = Math.min(max, Math.max(min, value));
    return options.integer ? Math.round(clamped) : clamped;
  }

  addStyles() {
    if (document.getElementById('property-editor-styles')) return;

    const style = document.createElement('style');
    style.id = 'property-editor-styles';
    style.textContent = `
      .property-editor { background: rgba(15, 23, 42, 0.95); border-radius: 12px; overflow: hidden; }
      .editor-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
      .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.5; }
      .empty-text { color: #64748b; font-size: 13px; }
      .editor-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
      .editor-title { display: flex; align-items: center; gap: 12px; }
      .editor-icon { width: 36px; height: 36px; border-radius: 8px; border: 2px solid; display: flex; align-items: center; justify-content: center; }
      .editor-icon img { width: 20px; height: 20px; }
      .editor-icon.link-icon { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; font-size: 18px; }
      .editor-label { font-weight: 600; font-size: 14px; }
      .btn-delete { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 8px 12px; cursor: pointer; transition: all 0.2s; }
      .btn-delete:hover { background: rgba(239, 68, 68, 0.2); }
      .editor-body { padding: 16px; }
      .form-group { margin-bottom: 16px; }
      .form-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
      .form-divider { margin: 18px 0 12px; padding-top: 12px; border-top: 1px dashed rgba(255, 255, 255, 0.12); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #a5b4fc; }
      .form-group input[type="text"], .form-group input[type="number"], .form-group select, .form-group textarea {
        width: 100%; padding: 10px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #f8fafc; font-size: 14px;
      }
      .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #6366f1; }
      .form-row { display: flex; gap: 12px; }
      .form-row .form-group { flex: 1; position: relative; }
      .form-unit { position: absolute; right: 12px; bottom: 10px; font-size: 12px; color: #64748b; }
      .info-group .info-value { padding: 10px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; font-family: monospace; font-size: 12px; color: #94a3b8; }
      .editor-footer { padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
      .btn-apply { width: 100%; padding: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; }
      .btn-apply:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4); }
      .interface-table { overflow-x: auto; margin-bottom: 16px; }
      .interface-table table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .interface-table th { text-align: left; padding: 6px 8px; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .interface-table td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1; }
      .interface-table .iface-down td { opacity: 0.5; }
      .interface-table .unassigned { color: #64748b; font-style: italic; }
      .interface-table .mono-small { font-family: monospace; font-size: 10px; color: #64748b; }
      .interface-table .status-up { color: #22c55e; }
      .interface-table .status-down { color: #ef4444; }
      .mono-small { font-family: monospace; font-size: 10px; color: #64748b; }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

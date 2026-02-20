/**
 * Node Detail View
 * Shows detailed information about a selected node
 */

import { DEVICE_CONFIG, STATUS_CONFIG } from '../rendering/NodeRenderer.js';

/**
 * Node Detail View Class
 */
export class NodeDetailView {
  constructor(container, metricsCollector, options = {}) {
    this.container = container;
    this.collector = metricsCollector;
    this.options = {
      updateInterval: 500,
      ...options,
    };
    
    this.currentNode = null;
    this.updateTimer = null;
    
    this.render();
  }

  /**
   * Show details for a node
   */
  showNode(node) {
    this.currentNode = node;
    this.renderNodeDetails(node);
    this.startUpdates();
  }

  /**
   * Clear the detail view
   */
  clear() {
    this.currentNode = null;
    this.stopUpdates();
    this.renderEmpty();
  }

  /**
   * Render empty state
   */
  render() {
    this.container.className = 'node-detail-view';
    this.renderEmpty();
    this.addStyles();
  }

  /**
   * Render empty state
   */
  renderEmpty() {
    this.container.innerHTML = `
      <div class="detail-empty">
        <div class="empty-icon">🖥️</div>
        <div class="empty-text">Click a node to view details</div>
      </div>
    `;
  }

  /**
   * Render node details
   */
  renderNodeDetails(node) {
    const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
    const statusKey = this.getStatusFromLoad(node.displayLoad || 0);
    const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.healthy;
    const nodeMetrics = this.collector.getNodeMetrics(node.id);
    
    this.container.innerHTML = `
      <div class="detail-header">
        <div class="node-icon" style="background: ${config.color}20; border-color: ${config.color};">
          <img src="/icons/${config.icon}.svg" alt="${config.label}" onerror="this.style.display='none'" />
        </div>
        <div class="node-info">
          <div class="node-name">${node.label}</div>
          <div class="node-type">${config.label}</div>
        </div>
        <div class="node-status" style="background: ${statusConfig.color}20; color: ${statusConfig.color};">
          ${statusConfig.label}
        </div>
      </div>
      
      <div class="detail-metrics">
        <div class="detail-metric">
          <div class="metric-label">Current Load</div>
          <div class="metric-value" id="detail-load">${Math.round((node.displayLoad || 0) * 100)}%</div>
          <div class="metric-bar">
            <div class="bar-fill" id="detail-load-bar" style="width: ${(node.displayLoad || 0) * 100}%; background: ${this.getLoadColor(node.displayLoad || 0)}"></div>
          </div>
        </div>
        
        <div class="detail-metric">
          <div class="metric-label">Average Load</div>
          <div class="metric-value">${nodeMetrics ? Math.round(nodeMetrics.avgLoad * 100) : 0}%</div>
        </div>
        
        <div class="detail-metric">
          <div class="metric-label">Peak Load</div>
          <div class="metric-value">${nodeMetrics ? Math.round(nodeMetrics.peakLoad * 100) : 0}%</div>
        </div>
        
        <div class="detail-metric">
          <div class="metric-label">Error Count</div>
          <div class="metric-value">${nodeMetrics?.errorCount || 0}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <div class="section-title">Load History</div>
        <canvas id="node-history-chart" height="80"></canvas>
      </div>
      
      <div class="detail-section">
        <div class="section-title">Hardware</div>
        <ul class="spec-list">
          ${(node.hardware || config.specs?.hardware || ['Not specified']).map(item => `
            <li>${item}</li>
          `).join('')}
        </ul>
      </div>
      
      <div class="detail-section">
        <div class="section-title">Software</div>
        <ul class="spec-list">
          ${(node.software || config.specs?.software || ['Not specified']).map(item => `
            <li>${item}</li>
          `).join('')}
        </ul>
      </div>
      
      <div class="detail-section">
        <div class="section-title">Position</div>
        <div class="position-info">
          X: ${Math.round((node.position?.x || 0) * 100)}% · Y: ${Math.round((node.position?.y || 0) * 100)}%
        </div>
      </div>
    `;
    
    this.drawHistoryChart(nodeMetrics);
  }

  /**
   * Get status from load
   */
  getStatusFromLoad(load) {
    if (load >= 0.9) return 'critical';
    if (load >= 0.75) return 'warning';
    if (load >= 0.6) return 'degraded';
    return 'healthy';
  }

  /**
   * Get color based on load
   */
  getLoadColor(load) {
    if (load >= 0.9) return '#ef4444';
    if (load >= 0.75) return '#f59e0b';
    if (load >= 0.5) return '#eab308';
    return '#22c55e';
  }

  /**
   * Draw load history chart
   */
  drawHistoryChart(nodeMetrics) {
    const canvas = this.container.querySelector('#node-history-chart');
    if (!canvas || !nodeMetrics) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    const data = nodeMetrics.loadHistory;
    if (data.length < 2) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const step = width / (data.length - 1);
    
    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
    
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    data.forEach((val, i) => {
      const x = i * step;
      const y = height - val * (height - 5);
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    
    data.forEach((val, i) => {
      const x = i * step;
      const y = height - val * (height - 5);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
  }

  /**
   * Start periodic updates
   */
  startUpdates() {
    this.stopUpdates();
    this.updateTimer = setInterval(() => {
      if (this.currentNode) {
        this.updateLiveMetrics();
      }
    }, this.options.updateInterval);
  }

  /**
   * Stop updates
   */
  stopUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Update live metrics only
   */
  updateLiveMetrics() {
    const node = this.currentNode;
    if (!node) return;
    
    const loadEl = this.container.querySelector('#detail-load');
    const barEl = this.container.querySelector('#detail-load-bar');
    
    if (loadEl) {
      loadEl.textContent = `${Math.round((node.displayLoad || 0) * 100)}%`;
    }
    
    if (barEl) {
      barEl.style.width = `${(node.displayLoad || 0) * 100}%`;
      barEl.style.background = this.getLoadColor(node.displayLoad || 0);
    }
    
    // Update chart
    const nodeMetrics = this.collector.getNodeMetrics(node.id);
    this.drawHistoryChart(nodeMetrics);
  }

  /**
   * Add styles
   */
  addStyles() {
    if (document.getElementById('node-detail-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'node-detail-styles';
    style.textContent = `
      .node-detail-view {
        padding: 16px;
        color: #f8fafc;
      }
      
      .detail-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }
      
      .empty-icon {
        font-size: 40px;
        margin-bottom: 12px;
        opacity: 0.3;
      }
      
      .empty-text {
        color: #64748b;
        font-size: 13px;
      }
      
      .detail-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .node-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .node-icon img {
        width: 28px;
        height: 28px;
      }
      
      .node-info {
        flex: 1;
      }
      
      .node-name {
        font-size: 16px;
        font-weight: 600;
      }
      
      .node-type {
        font-size: 12px;
        color: #94a3b8;
      }
      
      .node-status {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .detail-metrics {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .detail-metric {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        padding: 12px;
      }
      
      .detail-metric .metric-label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      
      .detail-metric .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: #f8fafc;
      }
      
      .metric-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      
      .bar-fill {
        height: 100%;
        transition: width 0.3s, background 0.3s;
      }
      
      .detail-section {
        margin-bottom: 16px;
      }
      
      .section-title {
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }
      
      .spec-list {
        list-style: none;
        padding: 0;
      }
      
      .spec-list li {
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 6px;
        font-size: 12px;
        color: #e2e8f0;
        margin-bottom: 4px;
      }
      
      .spec-list li::before {
        content: "•";
        color: #6366f1;
        margin-right: 8px;
      }
      
      .position-info {
        font-size: 12px;
        color: #94a3b8;
        font-family: monospace;
      }
      
      #node-history-chart {
        width: 100%;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopUpdates();
    this.container.innerHTML = '';
  }
}

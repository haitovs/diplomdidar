/**
 * Analytics Panel
 * Live metrics dashboard component with charts and statistics
 */

/**
 * Analytics Panel Class
 */
export class AnalyticsPanel {
  constructor(container, metricsCollector, options = {}) {
    this.container = container;
    this.collector = metricsCollector;
    this.options = {
      updateInterval: 1000,
      showCharts: true,
      ...options,
    };
    
    this.charts = {};
    this.updateTimer = null;
    
    this.render();
    this.startUpdates();
  }

  /**
   * Render the analytics panel
   */
  render() {
    this.container.className = 'analytics-panel';
    this.container.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card primary" data-metric="throughput">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <div class="metric-value" id="m-throughput">0</div>
            <div class="metric-label">Throughput</div>
            <div class="metric-unit">Mbps</div>
          </div>
          <div class="metric-trend" id="trend-throughput"></div>
        </div>
        
        <div class="metric-card" data-metric="latency">
          <div class="metric-icon">⏱️</div>
          <div class="metric-content">
            <div class="metric-value" id="m-latency">0</div>
            <div class="metric-label">Latency</div>
            <div class="metric-unit">ms</div>
          </div>
          <div class="metric-trend" id="trend-latency"></div>
        </div>
        
        <div class="metric-card" data-metric="packetLoss">
          <div class="metric-icon">📉</div>
          <div class="metric-content">
            <div class="metric-value" id="m-packetLoss">0</div>
            <div class="metric-label">Packet Loss</div>
            <div class="metric-unit">%</div>
          </div>
          <div class="metric-trend" id="trend-packetLoss"></div>
        </div>
        
        <div class="metric-card" data-metric="utilization">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <div class="metric-value" id="m-utilization">0</div>
            <div class="metric-label">Utilization</div>
            <div class="metric-unit">%</div>
          </div>
          <div class="metric-progress">
            <div class="progress-bar" id="utilization-bar"></div>
          </div>
        </div>
      </div>
      
      <div class="metrics-row">
        <div class="metric-mini">
          <span class="mini-label">Connections</span>
          <span class="mini-value" id="m-connections">0</span>
        </div>
        <div class="metric-mini">
          <span class="mini-label">Jitter</span>
          <span class="mini-value" id="m-jitter">0 ms</span>
        </div>
        <div class="metric-mini">
          <span class="mini-label">Energy</span>
          <span class="mini-value" id="m-energy">0 kW</span>
        </div>
      </div>
      
      <div class="chart-section">
        <div class="chart-header">
          <span class="chart-title">Traffic Over Time</span>
          <div class="chart-legend">
            <span class="legend-item"><span class="dot" style="background:#22c55e"></span>Throughput</span>
            <span class="legend-item"><span class="dot" style="background:#f59e0b"></span>Latency</span>
          </div>
        </div>
        <canvas id="traffic-chart" height="120"></canvas>
      </div>
      
      <div class="top-talkers">
        <div class="section-header">
          <span class="section-title">🔥 Top Talkers</span>
        </div>
        <div id="top-talkers-list" class="talkers-list"></div>
      </div>
      
      <div class="alerts-section">
        <div class="section-header">
          <span class="section-title">⚠️ Recent Alerts</span>
          <button class="btn-clear-alerts" id="clear-alerts">Clear</button>
        </div>
        <div id="alerts-list" class="alerts-list"></div>
      </div>
    `;
    
    this.addStyles();
    this.setupChart();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.container.querySelector('#clear-alerts')?.addEventListener('click', () => {
      this.collector.clearAlerts();
      this.updateAlerts([]);
    });
  }

  /**
   * Setup chart using Chart.js (if available)
   */
  setupChart() {
    const canvas = this.container.querySelector('#traffic-chart');
    if (!canvas || typeof Chart === 'undefined') {
      // Fallback: simple canvas drawing
      this.useSimpleChart = true;
      return;
    }
    
    this.charts.traffic = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Throughput',
            data: [],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Latency',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            yAxisID: 'latency',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            position: 'left',
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } },
          },
          latency: {
            position: 'right',
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10 } },
          },
        },
      },
    });
  }

  /**
   * Start periodic updates
   */
  startUpdates() {
    this.updateTimer = setInterval(() => {
      this.update();
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
   * Update the panel with latest metrics
   */
  update() {
    const metrics = this.collector.getCurrent();
    const history = this.collector.getHistory();
    const topTalkers = this.collector.getTopTalkers();
    const alerts = this.collector.getAlerts(5);
    
    // Update main metrics
    this.updateMetric('throughput', metrics.throughput);
    this.updateMetric('latency', metrics.latency);
    this.updateMetric('packetLoss', metrics.packetLoss);
    this.updateMetric('utilization', metrics.utilization);
    
    // Update mini metrics
    this.setElementText('m-connections', metrics.activeConnections);
    this.setElementText('m-jitter', `${metrics.jitter} ms`);
    this.setElementText('m-energy', `${metrics.energy} kW`);
    
    // Update utilization bar
    const bar = this.container.querySelector('#utilization-bar');
    if (bar) {
      bar.style.width = `${metrics.utilization}%`;
      bar.style.background = metrics.utilization > 80 ? '#ef4444' : 
                             metrics.utilization > 60 ? '#f59e0b' : '#22c55e';
    }
    
    // Update chart
    this.updateChart(history);
    
    // Update top talkers
    this.updateTopTalkers(topTalkers);
    
    // Update alerts
    this.updateAlerts(alerts);
  }

  /**
   * Update a single metric display
   */
  updateMetric(key, value) {
    const el = this.container.querySelector(`#m-${key}`);
    if (el) {
      el.textContent = value;
      
      // Add animation class
      el.classList.add('updated');
      setTimeout(() => el.classList.remove('updated'), 300);
    }
  }

  /**
   * Helper to set element text
   */
  setElementText(id, text) {
    const el = this.container.querySelector(`#${id}`);
    if (el) el.textContent = text;
  }

  /**
   * Update the traffic chart
   */
  updateChart(history) {
    if (this.charts.traffic) {
      this.charts.traffic.data.labels = history.labels.slice(-30);
      this.charts.traffic.data.datasets[0].data = history.throughput.slice(-30);
      this.charts.traffic.data.datasets[1].data = history.latency.slice(-30);
      this.charts.traffic.update('none');
    } else if (this.useSimpleChart) {
      this.drawSimpleChart(history);
    }
  }

  /**
   * Draw simple chart fallback
   */
  drawSimpleChart(history) {
    const canvas = this.container.querySelector('#traffic-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const data = history.throughput.slice(-30);
    if (data.length < 2) return;
    
    const max = Math.max(...data, 100);
    const step = width / (data.length - 1);
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    
    data.forEach((val, i) => {
      const x = i * step;
      const y = height - (val / max) * (height - 20);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
    // Fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fill();
  }

  /**
   * Update top talkers list
   */
  updateTopTalkers(talkers) {
    const list = this.container.querySelector('#top-talkers-list');
    if (!list) return;
    
    list.innerHTML = talkers.map((node, i) => `
      <div class="talker-item">
        <span class="talker-rank">#${i + 1}</span>
        <span class="talker-name">${node.label}</span>
        <span class="talker-load" style="color: ${node.load > 0.8 ? '#ef4444' : node.load > 0.6 ? '#f59e0b' : '#22c55e'}">
          ${Math.round(node.load * 100)}%
        </span>
      </div>
    `).join('');
  }

  /**
   * Update alerts list
   */
  updateAlerts(alerts) {
    const list = this.container.querySelector('#alerts-list');
    if (!list) return;
    
    if (alerts.length === 0) {
      list.innerHTML = '<div class="no-alerts">No recent alerts</div>';
      return;
    }
    
    list.innerHTML = alerts.map(alert => `
      <div class="alert-item ${alert.severity}">
        <span class="alert-icon">${alert.severity === 'critical' ? '🔴' : '🟡'}</span>
        <div class="alert-content">
          <div class="alert-title">${alert.title}</div>
          <div class="alert-message">${alert.message}</div>
        </div>
        <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
      </div>
    `).join('');
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const d = new Date(timestamp);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Add styles
   */
  addStyles() {
    if (document.getElementById('analytics-panel-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'analytics-panel-styles';
    style.textContent = `
      .analytics-panel {
        padding: 16px;
        color: #f8fafc;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .metric-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .metric-card.primary {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
        border-color: rgba(99, 102, 241, 0.3);
      }
      
      .metric-icon {
        font-size: 20px;
      }
      
      .metric-value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1;
        transition: color 0.3s;
      }
      
      .metric-value.updated {
        color: #22c55e;
      }
      
      .metric-label {
        font-size: 12px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .metric-unit {
        font-size: 11px;
        color: #64748b;
      }
      
      .metric-progress {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        background: #22c55e;
        transition: width 0.3s, background 0.3s;
      }
      
      .metrics-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
      }
      
      .metric-mini {
        text-align: center;
      }
      
      .mini-label {
        display: block;
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
      }
      
      .mini-value {
        font-size: 14px;
        font-weight: 600;
        color: #e2e8f0;
      }
      
      .chart-section {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .chart-title {
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
      }
      
      .chart-legend {
        display: flex;
        gap: 12px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: #64748b;
      }
      
      .legend-item .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      
      #traffic-chart {
        width: 100%;
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
      }
      
      .btn-clear-alerts {
        background: none;
        border: none;
        color: #64748b;
        font-size: 11px;
        cursor: pointer;
      }
      
      .btn-clear-alerts:hover {
        color: #94a3b8;
      }
      
      .top-talkers {
        margin-bottom: 16px;
      }
      
      .talkers-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .talker-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 6px;
      }
      
      .talker-rank {
        font-size: 11px;
        color: #64748b;
        width: 24px;
      }
      
      .talker-name {
        flex: 1;
        font-size: 12px;
        color: #e2e8f0;
      }
      
      .talker-load {
        font-size: 12px;
        font-weight: 600;
      }
      
      .alerts-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .alert-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
      }
      
      .alert-item.critical {
        background: rgba(239, 68, 68, 0.1);
        border-left: 3px solid #ef4444;
      }
      
      .alert-item.warning {
        background: rgba(245, 158, 11, 0.1);
        border-left: 3px solid #f59e0b;
      }
      
      .alert-icon {
        font-size: 12px;
      }
      
      .alert-content {
        flex: 1;
      }
      
      .alert-title {
        font-size: 12px;
        font-weight: 600;
        color: #e2e8f0;
      }
      
      .alert-message {
        font-size: 11px;
        color: #94a3b8;
      }
      
      .alert-time {
        font-size: 10px;
        color: #64748b;
      }
      
      .no-alerts {
        text-align: center;
        font-size: 12px;
        color: #64748b;
        padding: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopUpdates();
    Object.values(this.charts).forEach(chart => chart?.destroy());
    this.container.innerHTML = '';
  }
}

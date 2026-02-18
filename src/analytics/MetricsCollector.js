/**
 * Metrics Collector
 * Collects and aggregates network metrics from the simulation
 */

/**
 * Metrics Collector Class
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class MetricsCollector {
  constructor(options = {}) {
    this.options = {
      historySize: 100, // Number of historical data points
      sampleInterval: 1000, // ms between samples
      ...options,
    };
    
    // Current metrics
    this.current = {
      timestamp: Date.now(),
      throughput: 0,
      latency: 0,
      packetLoss: 0,
      activeConnections: 0,
      utilization: 0,
      jitter: 0,
      energy: 0,
    };
    
    // Historical data
    this.history = {
      timestamps: [],
      throughput: [],
      latency: [],
      packetLoss: [],
      utilization: [],
    };
    
    // Per-node metrics
    this.nodeMetrics = new Map();
    
    // Top talkers (most active nodes)
    this.topTalkers = [];
    
    // Alerts
    this.alerts = [];
    this.maxAlerts = 50;
  }

  /**
   * Update metrics from simulation state
   * @param {Object} simState - Current simulation state
   */
  update(simState) {
    const { nodes, links, particles, networkLoss } = simState;
    
    // Calculate aggregate metrics
    const nodeCount = nodes?.length || 0;
    const linkCount = links?.length || 0;
    
    // Average node utilization
    const totalLoad = nodes?.reduce((sum, node) => sum + (node.displayLoad ?? node.load ?? 0), 0) || 0;
    const utilizationRatio = nodeCount > 0 ? totalLoad / nodeCount : 0;

    // Throughput derived from per-node capacity and load.
    const throughput = Math.round((nodes || []).reduce((sum, node) => {
      const explicitThroughput = Number(node.throughputMbps);
      if (Number.isFinite(explicitThroughput)) return sum + explicitThroughput;
      const ifaceSpeed = Math.max(10, Number(node.interfaceSpeedMbps) || 1000);
      const load = clamp(node.displayLoad ?? node.load ?? 0, 0, 1);
      return sum + ifaceSpeed * load;
    }, 0) + (Number(particles) || 0) * 2);

    // Latency from node runtime stats.
    const latencySamples = (nodes || [])
      .map((node) => Number(node.latency))
      .filter((value) => Number.isFinite(value));
    const latency = latencySamples.length > 0
      ? Number((latencySamples.reduce((sum, value) => sum + value, 0) / latencySamples.length).toFixed(2))
      : Number((6 + utilizationRatio * 34).toFixed(2));

    // Jitter from link runtime stats.
    const jitterSamples = (links || [])
      .map((link) => Number(link.health?.jitter ?? link.jitter))
      .filter((value) => Number.isFinite(value));
    const jitter = jitterSamples.length > 0
      ? Number((jitterSamples.reduce((sum, value) => sum + value, 0) / jitterSamples.length).toFixed(2))
      : Number((1 + utilizationRatio * 9).toFixed(2));

    // Active connections are links not currently down.
    const activeConnections = (links || []).reduce((count, link) => {
      const status = link.health?.status || 'up';
      return status === 'down' ? count : count + 1;
    }, 0);

    // Packet loss from link health and network loss overrides.
    const linkLossRatios = (links || []).map((link) => {
      if (Number.isFinite(link.health?.loss)) return clamp(link.health.loss, 0, 1);
      if (Number.isFinite(link.packetLoss)) return clamp(link.packetLoss / 100, 0, 1);
      return 0;
    });
    const averageLinkLoss = linkLossRatios.length > 0
      ? linkLossRatios.reduce((sum, value) => sum + value, 0) / linkLossRatios.length
      : 0;
    const networkLossRatio = clamp(Number(networkLoss) || 0, 0, 1);
    const packetLossRatio = Math.max(averageLinkLoss, networkLossRatio);

    // Energy estimate from node count and throughput.
    const energy = Number((nodeCount * 0.35 + utilizationRatio * nodeCount * 0.55 + throughput / 10000).toFixed(1));
    
    // Update current metrics
    this.current = {
      timestamp: Date.now(),
      throughput,
      latency,
      packetLoss: Number((packetLossRatio * 100).toFixed(2)),
      activeConnections,
      utilization: Math.round(utilizationRatio * 100),
      jitter,
      energy,
      nodeCount,
      linkCount,
    };
    
    // Update history
    this.addToHistory();
    
    // Update per-node metrics
    this.updateNodeMetrics(nodes);
    
    // Update top talkers
    this.updateTopTalkers(nodes);
    
    // Check for alerts
    this.checkAlerts();
    
    return this.current;
  }

  /**
   * Add current metrics to history
   */
  addToHistory() {
    this.history.timestamps.push(this.current.timestamp);
    this.history.throughput.push(this.current.throughput);
    this.history.latency.push(this.current.latency);
    this.history.packetLoss.push(this.current.packetLoss);
    this.history.utilization.push(this.current.utilization);
    
    // Trim history to max size
    while (this.history.timestamps.length > this.options.historySize) {
      this.history.timestamps.shift();
      this.history.throughput.shift();
      this.history.latency.shift();
      this.history.packetLoss.shift();
      this.history.utilization.shift();
    }
  }

  /**
   * Update metrics for individual nodes
   */
  updateNodeMetrics(nodes) {
    if (!nodes) return;
    
    nodes.forEach(node => {
      if (!this.nodeMetrics.has(node.id)) {
        this.nodeMetrics.set(node.id, {
          id: node.id,
          label: node.label,
          type: node.type,
          loadHistory: [],
          avgLoad: 0,
          peakLoad: 0,
          errorCount: 0,
        });
      }
      
      const metrics = this.nodeMetrics.get(node.id);
      const load = node.displayLoad || 0;
      
      metrics.label = node.label;
      metrics.loadHistory.push(load);
      
      // Keep last 60 samples
      if (metrics.loadHistory.length > 60) {
        metrics.loadHistory.shift();
      }
      
      // Calculate averages
      metrics.avgLoad = metrics.loadHistory.reduce((a, b) => a + b, 0) / metrics.loadHistory.length;
      metrics.peakLoad = Math.max(metrics.peakLoad, load);
      metrics.currentLoad = load;
      
      // Count errors (high load events)
      if (load > 0.9) {
        metrics.errorCount++;
      }
    });
  }

  /**
   * Update top talkers list
   */
  updateTopTalkers(nodes) {
    if (!nodes) return;
    
    this.topTalkers = nodes
      .map(n => ({
        id: n.id,
        label: n.label,
        load: n.displayLoad || 0,
        type: n.type,
      }))
      .sort((a, b) => b.load - a.load)
      .slice(0, 5);
  }

  /**
   * Check for alert conditions
   */
  checkAlerts() {
    const now = Date.now();
    
    // High utilization alert
    if (this.current.utilization > 85) {
      this.addAlert('critical', 'High Network Utilization', 
        `Network utilization at ${this.current.utilization}%`);
    } else if (this.current.utilization > 70) {
      this.addAlert('warning', 'Elevated Utilization', 
        `Network utilization at ${this.current.utilization}%`);
    }
    
    // High latency alert
    if (this.current.latency > 50) {
      this.addAlert('critical', 'High Latency', 
        `Network latency at ${this.current.latency}ms`);
    } else if (this.current.latency > 30) {
      this.addAlert('warning', 'Elevated Latency', 
        `Network latency at ${this.current.latency}ms`);
    }
    
    // Packet loss alert
    if (this.current.packetLoss > 10) {
      this.addAlert('critical', 'Packet Loss Detected', 
        `Packet loss at ${this.current.packetLoss}%`);
    } else if (this.current.packetLoss > 5) {
      this.addAlert('warning', 'Minor Packet Loss', 
        `Packet loss at ${this.current.packetLoss}%`);
    }
  }

  /**
   * Add an alert
   */
  addAlert(severity, title, message) {
    // Prevent duplicate alerts within 5 seconds
    const recent = this.alerts.find(a => 
      a.title === title && 
      Date.now() - a.timestamp < 5000
    );
    
    if (recent) return;
    
    this.alerts.unshift({
      id: Date.now().toString(36),
      timestamp: Date.now(),
      severity,
      title,
      message,
    });
    
    // Trim alerts
    while (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }
  }

  /**
   * Get current metrics
   */
  getCurrent() {
    return { ...this.current };
  }

  /**
   * Get history for charts
   */
  getHistory() {
    return {
      labels: this.history.timestamps.map(t => {
        const d = new Date(t);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      }),
      throughput: [...this.history.throughput],
      latency: [...this.history.latency],
      packetLoss: [...this.history.packetLoss],
      utilization: [...this.history.utilization],
    };
  }

  /**
   * Get node metrics
   */
  getNodeMetrics(nodeId) {
    return this.nodeMetrics.get(nodeId) || null;
  }

  /**
   * Get all node metrics
   */
  getAllNodeMetrics() {
    return Array.from(this.nodeMetrics.values());
  }

  /**
   * Get top talkers
   */
  getTopTalkers() {
    return [...this.topTalkers];
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 10) {
    return this.alerts.slice(0, limit);
  }

  /**
   * Clear all alerts
   */
  clearAlerts() {
    this.alerts = [];
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.current = {
      timestamp: Date.now(),
      throughput: 0,
      latency: 0,
      packetLoss: 0,
      activeConnections: 0,
      utilization: 0,
      jitter: 0,
      energy: 0,
    };
    
    this.history = {
      timestamps: [],
      throughput: [],
      latency: [],
      packetLoss: [],
      utilization: [],
    };
    
    this.nodeMetrics.clear();
    this.topTalkers = [];
    this.alerts = [];
  }
}

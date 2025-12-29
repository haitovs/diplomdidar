/**
 * Traffic Generator
 * Creates realistic network traffic patterns based on scenarios
 */

// Traffic pattern definitions
export const TRAFFIC_PATTERNS = {
  classroom: {
    label: 'Classroom',
    description: 'Standard lecture with video streaming',
    baseLoad: 0.4,
    peakLoad: 0.7,
    burstChance: 0.1,
    burstMultiplier: 1.5,
    peakHours: [[9, 12], [14, 17]],
  },
  exam: {
    label: 'Exam Period',
    description: 'High concurrent access, mostly downloads',
    baseLoad: 0.6,
    peakLoad: 0.9,
    burstChance: 0.2,
    burstMultiplier: 1.3,
    peakHours: [[9, 11], [14, 16]],
  },
  lab: {
    label: 'Computer Lab',
    description: 'Mixed workloads, software downloads',
    baseLoad: 0.5,
    peakLoad: 0.85,
    burstChance: 0.15,
    burstMultiplier: 1.4,
    peakHours: [[10, 12], [15, 18]],
  },
  streaming: {
    label: 'Video Streaming',
    description: 'Live lecture streaming',
    baseLoad: 0.55,
    peakLoad: 0.8,
    burstChance: 0.05,
    burstMultiplier: 1.2,
    peakHours: [[9, 11], [14, 16]],
  },
  idle: {
    label: 'Off Hours',
    description: 'Minimal background traffic',
    baseLoad: 0.1,
    peakLoad: 0.3,
    burstChance: 0.02,
    burstMultiplier: 1.1,
    peakHours: [],
  },
  ddos: {
    label: 'DDoS Attack',
    description: 'Simulated attack traffic',
    baseLoad: 0.8,
    peakLoad: 1.0,
    burstChance: 0.5,
    burstMultiplier: 1.5,
    peakHours: [[0, 24]],
  },
  backup: {
    label: 'Backup Window',
    description: 'Large data transfers',
    baseLoad: 0.65,
    peakLoad: 0.95,
    burstChance: 0.3,
    burstMultiplier: 1.2,
    peakHours: [[22, 24], [0, 6]],
  },
};

// Node type specific modifiers
const NODE_TYPE_MODIFIERS = {
  coreRouter: { loadMult: 1.2, latencyMult: 0.8 },
  router: { loadMult: 1.1, latencyMult: 0.9 },
  firewall: { loadMult: 1.15, latencyMult: 1.2 },
  switch: { loadMult: 1.0, latencyMult: 0.7 },
  server: { loadMult: 1.3, latencyMult: 1.0 },
  accessPoint: { loadMult: 0.9, latencyMult: 1.1 },
  lab: { loadMult: 1.4, latencyMult: 1.0 },
  iot: { loadMult: 0.5, latencyMult: 0.8 },
  cloud: { loadMult: 0.8, latencyMult: 1.5 },
  internet: { loadMult: 0.7, latencyMult: 2.0 },
};

/**
 * Traffic Generator Class
 */
export class TrafficGenerator {
  constructor(options = {}) {
    this.options = {
      updateInterval: 100,
      smoothing: 0.1,
      ...options,
    };
    
    this.pattern = TRAFFIC_PATTERNS.classroom;
    this.simTime = 8.0; // 8:00 AM
    this.simSpeed = 1.0;
    this.isPaused = false;
    this.lastUpdate = Date.now();
    
    // Node states
    this.nodeStates = new Map();
    
    // Traffic events
    this.events = [];
  }

  /**
   * Set traffic pattern
   */
  setPattern(patternKey) {
    this.pattern = TRAFFIC_PATTERNS[patternKey] || TRAFFIC_PATTERNS.classroom;
  }

  /**
   * Set simulation time
   */
  setTime(hours) {
    this.simTime = hours;
  }

  /**
   * Get current simulation time
   */
  getTime() {
    return this.simTime;
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed) {
    this.simSpeed = Math.max(0.1, Math.min(10, speed));
  }

  /**
   * Pause/resume traffic generation
   */
  setPaused(paused) {
    this.isPaused = paused;
  }

  /**
   * Check if current time is in peak hours
   */
  isInPeakHours() {
    const hour = this.simTime;
    return this.pattern.peakHours.some(([start, end]) => {
      if (start <= end) {
        return hour >= start && hour < end;
      } else {
        // Handles overnight ranges like [22, 6]
        return hour >= start || hour < end;
      }
    });
  }

  /**
   * Update simulation and generate traffic
   */
  update(nodes, links, deltaMs) {
    if (this.isPaused) return;
    
    // Advance simulation time
    const hoursElapsed = (deltaMs / 1000) * (this.simSpeed / 60);
    this.simTime = (this.simTime + hoursElapsed) % 24;
    
    // Determine current load level
    const isPeak = this.isInPeakHours();
    const targetLoad = isPeak ? this.pattern.peakLoad : this.pattern.baseLoad;
    
    // Update each node
    nodes.forEach(node => {
      const state = this.getNodeState(node.id);
      const modifier = NODE_TYPE_MODIFIERS[node.type] || { loadMult: 1, latencyMult: 1 };
      
      // Calculate target load for this node
      let nodeTargetLoad = targetLoad * modifier.loadMult;
      
      // Apply random bursts
      if (Math.random() < this.pattern.burstChance * 0.01) {
        nodeTargetLoad *= this.pattern.burstMultiplier;
        state.lastBurst = Date.now();
        
        this.events.push({
          type: 'burst',
          nodeId: node.id,
          timestamp: Date.now(),
          intensity: this.pattern.burstMultiplier,
        });
      }
      
      // Apply any scheduled events
      this.events
        .filter(e => e.nodeId === node.id && e.type === 'load_override')
        .forEach(e => {
          if (Date.now() - e.timestamp < e.duration) {
            nodeTargetLoad = e.targetLoad;
          }
        });
      
      // Smooth the load change
      nodeTargetLoad = Math.min(1, Math.max(0, nodeTargetLoad));
      state.currentLoad = state.currentLoad + (nodeTargetLoad - state.currentLoad) * this.options.smoothing;
      
      // Update node
      node.targetLoad = state.currentLoad;
      node.latency = Math.round(10 + state.currentLoad * 40 * modifier.latencyMult);
    });
    
    // Update link health based on connected nodes
    links.forEach(link => {
      const sourceLoad = this.nodeStates.get(link.source)?.currentLoad || 0.5;
      const targetLoad = this.nodeStates.get(link.target)?.currentLoad || 0.5;
      const avgLoad = (sourceLoad + targetLoad) / 2;
      
      link.health = {
        status: avgLoad > 0.9 ? 'lossy' : avgLoad > 0.75 ? 'degraded' : 'up',
        flow: 1 - avgLoad * 0.3,
        loss: avgLoad > 0.8 ? (avgLoad - 0.8) * 0.5 : 0,
      };
    });
    
    // Clean up old events
    this.events = this.events.filter(e => Date.now() - e.timestamp < 60000);
  }

  /**
   * Get or create node state
   */
  getNodeState(nodeId) {
    if (!this.nodeStates.has(nodeId)) {
      this.nodeStates.set(nodeId, {
        currentLoad: 0.3 + Math.random() * 0.2,
        lastBurst: 0,
      });
    }
    return this.nodeStates.get(nodeId);
  }

  /**
   * Schedule a traffic event
   */
  scheduleEvent(event) {
    this.events.push({
      timestamp: Date.now(),
      ...event,
    });
  }

  /**
   * Create a traffic spike on a node
   */
  createSpike(nodeId, intensity = 1.0, duration = 5000) {
    this.scheduleEvent({
      type: 'load_override',
      nodeId,
      targetLoad: intensity,
      duration,
    });
  }

  /**
   * Get formatted time string
   */
  getFormattedTime() {
    const hours = Math.floor(this.simTime);
    const minutes = Math.floor((this.simTime - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Reset traffic generator
   */
  reset() {
    this.simTime = 8.0;
    this.nodeStates.clear();
    this.events = [];
  }
}

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

const SOURCE_NODE_TYPES = new Set(['pc', 'iot', 'lab', 'accessPoint', 'switch']);
const DEST_NODE_TYPES = new Set(['server', 'cloud', 'internet', 'coreRouter', 'router']);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function stableHash01(text) {
  let hash = 0;
  const input = String(text || '');
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

function inferRuntimeStatus(loadRatio) {
  if (loadRatio >= 0.9) return 'critical';
  if (loadRatio >= 0.75) return 'warning';
  if (loadRatio >= 0.6) return 'degraded';
  return 'healthy';
}

function getInterfaceSpeedMbps(node) {
  return Math.max(10, Number(node?.interfaceSpeedMbps) || 1000);
}

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
    this.runtimeStats = {
      activeFlows: 0,
      droppedDemandMbps: 0,
      sourceCount: 0,
    };
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
    
    // Determine current baseline load
    const isPeak = this.isInPeakHours();
    const targetLoad = isPeak ? this.pattern.peakLoad : this.pattern.baseLoad;
    const dayFactor = 0.5 + 0.5 * Math.sin((this.simTime / 24) * Math.PI * 2 - Math.PI / 2);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const adjacency = this.buildAdjacency(links, nodeById);
    const nodeDemandMbps = new Map(nodes.map((node) => [node.id, 0]));
    const linkDemandMbps = new Map(links.map((link) => [link.id, 0]));
    const sourceNodes = this.getSourceNodes(nodes);
    const destinationNodes = this.getDestinationNodes(nodes);
    const timeBucket = Math.floor(this.simTime * 4);

    let activeFlows = 0;
    let droppedDemandMbps = 0;

    sourceNodes.forEach((sourceNode, sourceIndex) => {
      const sourceState = this.getNodeState(sourceNode.id);
      const sourceModifier = NODE_TYPE_MODIFIERS[sourceNode.type] || { loadMult: 1, latencyMult: 1 };
      const phase = sourceState.phase;
      const harmonic = 0.5 + 0.5 * Math.sin(this.simTime * 1.7 + phase);
      const microBurst = Math.max(0, Math.sin(this.simTime * 6 + phase * 2));
      const burstThreshold = 1 - this.pattern.burstChance;
      const burstIntensity = microBurst > burstThreshold
        ? (microBurst - burstThreshold) / Math.max(this.pattern.burstChance, 0.01)
        : 0;

      let sourceDemandRatio = targetLoad * sourceModifier.loadMult;
      sourceDemandRatio += (dayFactor - 0.5) * 0.12;
      sourceDemandRatio += (harmonic - 0.5) * 0.15;
      sourceDemandRatio += burstIntensity * (this.pattern.burstMultiplier - 1) * 0.2;
      sourceDemandRatio = clamp(sourceDemandRatio, 0.05, 1);

      // Emit deterministic burst event once per burst bucket.
      const burstBucket = Math.floor(this.simTime * 12 + phase * 10);
      if (burstIntensity > 0.8 && burstBucket !== sourceState.lastBurstBucket) {
        sourceState.lastBurstBucket = burstBucket;
        this.events.push({
          type: 'burst',
          nodeId: sourceNode.id,
          timestamp: Date.now(),
          intensity: Number(burstIntensity.toFixed(2)),
        });
      }

      // Apply explicit load overrides (spikes/fault-injection helpers).
      this.events
        .filter((event) => event.nodeId === sourceNode.id && event.type === 'load_override')
        .forEach((event) => {
          if (Date.now() - event.timestamp < event.duration) {
            sourceDemandRatio = clamp(Number(event.targetLoad) || sourceDemandRatio, 0, 1.4);
          }
        });

      const sourceCapacity = getInterfaceSpeedMbps(sourceNode);
      const flowDemandMbps = Math.max(5, sourceCapacity * sourceDemandRatio);

      if (destinationNodes.length === 0) {
        droppedDemandMbps += flowDemandMbps;
        return;
      }

      // Deterministic destination choice per source + time bucket.
      let destinationIndex = Math.floor(
        stableHash01(`${sourceNode.id}:${timeBucket}:${sourceIndex}`) * destinationNodes.length
      );
      destinationIndex = clamp(destinationIndex, 0, destinationNodes.length - 1);
      let destinationNode = destinationNodes[destinationIndex];
      if (!destinationNode || destinationNode.id === sourceNode.id) {
        destinationNode = destinationNodes.find((node) => node.id !== sourceNode.id) || null;
      }

      if (!destinationNode) {
        droppedDemandMbps += flowDemandMbps;
        return;
      }

      const path = this.findShortestPath(sourceNode.id, destinationNode.id, adjacency, nodeById);
      if (!path) {
        droppedDemandMbps += flowDemandMbps;
        return;
      }

      activeFlows += 1;

      path.nodeIds.forEach((nodeId) => {
        const demandFactor = nodeId === sourceNode.id || nodeId === destinationNode.id ? 0.6 : 1;
        nodeDemandMbps.set(nodeId, (nodeDemandMbps.get(nodeId) || 0) + flowDemandMbps * demandFactor);
      });

      path.linkIds.forEach((linkId) => {
        linkDemandMbps.set(linkId, (linkDemandMbps.get(linkId) || 0) + flowDemandMbps);
      });
    });

    // Update each node using path demand + deterministic baseline.
    nodes.forEach((node) => {
      const state = this.getNodeState(node.id);
      const modifier = NODE_TYPE_MODIFIERS[node.type] || { loadMult: 1, latencyMult: 1 };
      const phase = state.phase;
      const harmonic = 0.5 + 0.5 * Math.sin(this.simTime * 1.2 + phase);
      let baselineLoad = targetLoad * modifier.loadMult;
      baselineLoad += (dayFactor - 0.5) * 0.08;
      baselineLoad += (harmonic - 0.5) * 0.1;

      // Apply any explicit override for non-source nodes too.
      this.events
        .filter((event) => event.nodeId === node.id && event.type === 'load_override')
        .forEach((event) => {
          if (Date.now() - event.timestamp < event.duration) {
            baselineLoad = clamp(Number(event.targetLoad) || baselineLoad, 0, 1.4);
          }
        });

      const interfaceSpeedMbps = getInterfaceSpeedMbps(node);
      const routedDemandRatio = (nodeDemandMbps.get(node.id) || 0) / interfaceSpeedMbps;
      const nodeTargetLoad = clamp(baselineLoad * 0.4 + routedDemandRatio * 0.9, 0, 1);
      state.currentLoad = state.currentLoad + (nodeTargetLoad - state.currentLoad) * this.options.smoothing;

      const loadRatio = clamp(state.currentLoad, 0, 1);
      node.targetLoad = loadRatio;
      node.throughputMbps = Math.round(interfaceSpeedMbps * loadRatio);
      node.queueDepth = Math.round(loadRatio * 100);
      node.latency = Number((3 + loadRatio * 30 * modifier.latencyMult).toFixed(2));
      node.status = inferRuntimeStatus(loadRatio);
    });

    // Update link health from path-routed demand.
    const networkStress = sourceNodes.length > 0
      ? droppedDemandMbps / (sourceNodes.length * 5000)
      : 0;

    links.forEach((link) => {
      const demandMbps = linkDemandMbps.get(link.id) || 0;
      const linkBandwidth = Math.max(1, Number(link.bandwidth) || 1000);
      const utilizationCap = clamp((Number(link.utilizationCap) || 100) / 100, 0.1, 1);
      const effectiveBandwidth = linkBandwidth * utilizationCap;
      const utilization = demandMbps / effectiveBandwidth;

      const baseLatency = Math.max(0.1, Number(link.latency) || 5);
      const baseJitter = Math.max(0, Number(link.jitter) || 1);
      const baseLossPercent = clamp(Number(link.packetLoss) || 0, 0, 100);

      const congestionPenalty = Math.max(0, utilization - 1);
      const latency = baseLatency + congestionPenalty * baseLatency * 2.2;
      const jitter = baseJitter * (1 + Math.max(0, utilization - 0.7) * 2.5);
      const lossPercent = clamp(baseLossPercent + congestionPenalty * 25 + networkStress * 10, 0, 100);
      const loss = lossPercent / 100;

      const status = utilization > 1.2 || loss > 0.12
        ? 'lossy'
        : utilization > 0.85 || loss > 0.04
          ? 'degraded'
          : 'up';
      const flow = clamp(1 - Math.max(0, utilization - 0.85) * 0.8 - loss, 0, 1);

      link.health = {
        status,
        flow,
        loss,
        utilization: Number(utilization.toFixed(3)),
        latency: Number(latency.toFixed(2)),
        jitter: Number(jitter.toFixed(2)),
        demandMbps: Math.round(demandMbps),
      };
    });

    this.runtimeStats = {
      activeFlows,
      droppedDemandMbps: Math.round(droppedDemandMbps),
      sourceCount: sourceNodes.length,
    };
    
    // Clean up old events
    this.events = this.events.filter(e => Date.now() - e.timestamp < 60000);
  }

  /**
   * Build bidirectional graph adjacency from links.
   */
  buildAdjacency(links, nodeById) {
    const adjacency = new Map();
    nodeById.forEach((_, nodeId) => adjacency.set(nodeId, []));

    links.forEach((link) => {
      if (!nodeById.has(link.source) || !nodeById.has(link.target)) return;
      adjacency.get(link.source).push({ to: link.target, link });
      adjacency.get(link.target).push({ to: link.source, link });
    });

    return adjacency;
  }

  /**
   * Resolve source nodes for traffic generation.
   */
  getSourceNodes(nodes) {
    const typedSources = nodes.filter((node) => SOURCE_NODE_TYPES.has(node.type));
    if (typedSources.length > 0) return typedSources;

    const nonDestinationNodes = nodes.filter((node) => !DEST_NODE_TYPES.has(node.type));
    if (nonDestinationNodes.length > 0) {
      const count = Math.max(1, Math.ceil(nonDestinationNodes.length * 0.6));
      return nonDestinationNodes.slice(0, count);
    }

    return nodes.slice(0, Math.max(1, Math.floor(nodes.length / 2)));
  }

  /**
   * Resolve destination nodes for traffic generation.
   */
  getDestinationNodes(nodes) {
    const typedDestinations = nodes.filter((node) => DEST_NODE_TYPES.has(node.type));
    if (typedDestinations.length > 0) return typedDestinations;

    const infraNodes = nodes.filter((node) =>
      node.type === 'coreRouter' || node.type === 'router' || node.type === 'switch' || node.type === 'firewall'
    );
    if (infraNodes.length > 0) return infraNodes;

    return nodes.slice(-Math.max(1, Math.floor(nodes.length / 2)));
  }

  /**
   * Link weight for shortest-path calculation.
   */
  linkWeight(link) {
    const baseLatency = Math.max(0.1, Number(link.latency) || 5);
    const baseLossPercent = clamp(Number(link.packetLoss) || 0, 0, 100);
    const linkBandwidth = Math.max(1, Number(link.bandwidth) || 1000);
    const utilizationCap = clamp((Number(link.utilizationCap) || 100) / 100, 0.1, 1);
    const effectiveBandwidth = linkBandwidth * utilizationCap;
    const speedPenalty = effectiveBandwidth < 100
      ? 3
      : effectiveBandwidth < 500
        ? 2
        : effectiveBandwidth < 1000
          ? 1.2
          : 1;

    return baseLatency * (1 + baseLossPercent / 100) * speedPenalty;
  }

  /**
   * Dijkstra shortest path by link weight.
   */
  findShortestPath(sourceId, targetId, adjacency, nodeById) {
    if (!nodeById.has(sourceId) || !nodeById.has(targetId)) return null;
    if (sourceId === targetId) {
      return { nodeIds: [sourceId], linkIds: [] };
    }

    const distances = new Map();
    const previousNode = new Map();
    const previousLink = new Map();
    const unvisited = new Set(nodeById.keys());

    nodeById.forEach((_, nodeId) => distances.set(nodeId, Number.POSITIVE_INFINITY));
    distances.set(sourceId, 0);

    while (unvisited.size > 0) {
      let currentNode = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      unvisited.forEach((nodeId) => {
        const distance = distances.get(nodeId);
        if (distance < bestDistance) {
          bestDistance = distance;
          currentNode = nodeId;
        }
      });

      if (currentNode === null || bestDistance === Number.POSITIVE_INFINITY) break;
      unvisited.delete(currentNode);
      if (currentNode === targetId) break;

      const edges = adjacency.get(currentNode) || [];
      edges.forEach(({ to, link }) => {
        if (!unvisited.has(to)) return;
        const nextDistance = distances.get(currentNode) + this.linkWeight(link);
        if (nextDistance < distances.get(to)) {
          distances.set(to, nextDistance);
          previousNode.set(to, currentNode);
          previousLink.set(to, link.id);
        }
      });
    }

    if (!previousNode.has(targetId)) return null;

    const nodeIds = [];
    const linkIds = [];
    let cursor = targetId;
    while (cursor) {
      nodeIds.push(cursor);
      const linkId = previousLink.get(cursor);
      if (linkId) {
        linkIds.push(linkId);
      }
      cursor = previousNode.get(cursor);
    }

    nodeIds.reverse();
    linkIds.reverse();
    return { nodeIds, linkIds };
  }

  /**
   * Get or create node state
   */
  getNodeState(nodeId) {
    if (!this.nodeStates.has(nodeId)) {
      const seed = stableHash01(nodeId);
      this.nodeStates.set(nodeId, {
        currentLoad: 0.25 + seed * 0.25,
        lastBurst: 0,
        lastBurstBucket: -1,
        phase: seed * Math.PI * 2,
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
    this.runtimeStats = {
      activeFlows: 0,
      droppedDemandMbps: 0,
      sourceCount: 0,
    };
  }

  /**
   * Get runtime flow stats (for analytics/debug).
   */
  getRuntimeStats() {
    return { ...this.runtimeStats };
  }
}

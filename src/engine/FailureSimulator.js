/**
 * Failure Simulator
 * Simulates various network failure scenarios
 */

// Failure type definitions
export const FAILURE_TYPES = {
  nodeDown: {
    label: 'Node Down',
    description: 'Complete node failure',
    severity: 'critical',
    recoveryTime: 30000, // 30 seconds
  },
  partialDegradation: {
    label: 'Partial Degradation',
    description: 'Node performance degraded',
    severity: 'warning',
    recoveryTime: 15000,
  },
  linkDown: {
    label: 'Link Down',
    description: 'Connection failure',
    severity: 'critical',
    recoveryTime: 20000,
  },
  packetLoss: {
    label: 'Packet Loss',
    description: 'High packet loss on link',
    severity: 'warning',
    recoveryTime: 10000,
  },
  latencySpike: {
    label: 'Latency Spike',
    description: 'Sudden increase in latency',
    severity: 'warning',
    recoveryTime: 8000,
  },
  cascading: {
    label: 'Cascading Failure',
    description: 'Failure spreading through network',
    severity: 'critical',
    recoveryTime: 45000,
  },
};

/**
 * Failure Simulator Class
 */
export class FailureSimulator {
  constructor(options = {}) {
    this.options = {
      autoRecovery: true,
      recoverySpeed: 1.0,
      maxConcurrentFailures: 5,
      ...options,
    };
    
    // Active failures
    this.failures = new Map();
    
    // Failure history
    this.history = [];
    this.maxHistory = 100;
    
    // Callbacks
    this.onFailure = options.onFailure || null;
    this.onRecovery = options.onRecovery || null;
  }

  /**
   * Trigger a node failure
   */
  failNode(nodeId, type = 'nodeDown') {
    const failureType = FAILURE_TYPES[type] || FAILURE_TYPES.nodeDown;
    
    if (this.failures.size >= this.options.maxConcurrentFailures) {
      console.warn('Max concurrent failures reached');
      return null;
    }
    
    const failure = {
      id: `${nodeId}-${Date.now()}`,
      targetType: 'node',
      targetId: nodeId,
      type,
      ...failureType,
      startTime: Date.now(),
      recovered: false,
    };
    
    this.failures.set(failure.id, failure);
    this.history.unshift(failure);
    
    // Trim history
    while (this.history.length > this.maxHistory) {
      this.history.pop();
    }
    
    // Callback
    if (this.onFailure) {
      this.onFailure(failure);
    }
    
    // Schedule auto-recovery
    if (this.options.autoRecovery) {
      setTimeout(() => {
        this.recover(failure.id);
      }, failure.recoveryTime / this.options.recoverySpeed);
    }
    
    return failure;
  }

  /**
   * Trigger a link failure
   */
  failLink(linkId, type = 'linkDown') {
    const failureType = FAILURE_TYPES[type] || FAILURE_TYPES.linkDown;
    
    if (this.failures.size >= this.options.maxConcurrentFailures) {
      console.warn('Max concurrent failures reached');
      return null;
    }
    
    const failure = {
      id: `${linkId}-${Date.now()}`,
      targetType: 'link',
      targetId: linkId,
      type,
      ...failureType,
      startTime: Date.now(),
      recovered: false,
    };
    
    this.failures.set(failure.id, failure);
    this.history.unshift(failure);
    
    if (this.onFailure) {
      this.onFailure(failure);
    }
    
    if (this.options.autoRecovery) {
      setTimeout(() => {
        this.recover(failure.id);
      }, failure.recoveryTime / this.options.recoverySpeed);
    }
    
    return failure;
  }

  /**
   * Trigger a random failure
   */
  triggerRandom(nodes, links) {
    const targetType = Math.random() > 0.5 ? 'node' : 'link';
    const types = targetType === 'node' 
      ? ['nodeDown', 'partialDegradation', 'latencySpike']
      : ['linkDown', 'packetLoss'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (targetType === 'node' && nodes.length > 0) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      return this.failNode(target.id, type);
    } else if (links.length > 0) {
      const target = links[Math.floor(Math.random() * links.length)];
      return this.failLink(target.id, type);
    }
    
    return null;
  }

  /**
   * Trigger cascading failure starting from a node
   */
  triggerCascade(startNodeId, nodes, links, depth = 3) {
    const affected = new Set([startNodeId]);
    const failures = [];
    
    // Initial failure
    const initial = this.failNode(startNodeId, 'cascading');
    if (initial) failures.push(initial);
    
    // Find connected nodes and fail them with delay
    let currentNodes = [startNodeId];
    let currentDepth = 0;
    
    const spreadFailure = () => {
      if (currentDepth >= depth) return;
      currentDepth++;
      
      const nextNodes = [];
      
      links.forEach(link => {
        currentNodes.forEach(nodeId => {
          let connectedId = null;
          if (link.source === nodeId && !affected.has(link.target)) {
            connectedId = link.target;
          } else if (link.target === nodeId && !affected.has(link.source)) {
            connectedId = link.source;
          }
          
          if (connectedId) {
            affected.add(connectedId);
            nextNodes.push(connectedId);
            
            // Fail with delay based on depth
            setTimeout(() => {
              const failure = this.failNode(connectedId, 'partialDegradation');
              if (failure) failures.push(failure);
            }, currentDepth * 1500);
          }
        });
      });
      
      currentNodes = nextNodes;
      
      if (nextNodes.length > 0) {
        setTimeout(spreadFailure, 1500);
      }
    };
    
    setTimeout(spreadFailure, 1000);
    
    return failures;
  }

  /**
   * Recover from a failure
   */
  recover(failureId) {
    const failure = this.failures.get(failureId);
    if (!failure) return false;
    
    failure.recovered = true;
    failure.recoveryTime = Date.now();
    this.failures.delete(failureId);
    
    if (this.onRecovery) {
      this.onRecovery(failure);
    }
    
    return true;
  }

  /**
   * Recover all failures
   */
  recoverAll() {
    const recovered = [];
    this.failures.forEach((failure, id) => {
      if (this.recover(id)) {
        recovered.push(failure);
      }
    });
    return recovered;
  }

  /**
   * Apply failures to nodes and links
   */
  applyFailures(nodes, links) {
    this.failures.forEach(failure => {
      if (failure.targetType === 'node') {
        const node = nodes.find(n => n.id === failure.targetId);
        if (node) {
          switch (failure.type) {
            case 'nodeDown':
              node.status = 'offline';
              node.targetLoad = 0;
              break;
            case 'partialDegradation':
              node.status = 'degraded';
              node.targetLoad = Math.min(node.targetLoad * 1.3, 1);
              break;
            case 'latencySpike':
              node.latency = (node.latency || 10) * 3;
              break;
            case 'cascading':
              node.status = 'critical';
              node.targetLoad = 1;
              break;
          }
        }
      } else if (failure.targetType === 'link') {
        const link = links.find(l => l.id === failure.targetId);
        if (link) {
          link.health = link.health || {};
          switch (failure.type) {
            case 'linkDown':
              link.health.status = 'down';
              link.health.flow = 0;
              break;
            case 'packetLoss':
              link.health.status = 'lossy';
              link.health.loss = 0.3;
              break;
          }
        }
      }
    });
  }

  /**
   * Get active failures
   */
  getActiveFailures() {
    return Array.from(this.failures.values());
  }

  /**
   * Get failure history
   */
  getHistory(limit = 20) {
    return this.history.slice(0, limit);
  }

  /**
   * Check if target is affected by failure
   */
  isAffected(targetId) {
    return Array.from(this.failures.values())
      .some(f => f.targetId === targetId && !f.recovered);
  }

  /**
   * Clear all failures and history
   */
  clear() {
    this.failures.clear();
    this.history = [];
  }
}

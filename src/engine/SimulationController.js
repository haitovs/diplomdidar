/**
 * Simulation Controller
 * Master controller that orchestrates traffic, failures, and time
 */

import { FAILURE_TYPES, FailureSimulator } from './FailureSimulator.js';
import { TRAFFIC_PATTERNS, TrafficGenerator } from './TrafficGenerator.js';

/**
 * Simulation Controller Class
 */
export class SimulationController {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.options = {
      updateInterval: 100,
      ...options,
    };
    
    // Initialize sub-systems
    this.trafficGen = new TrafficGenerator();
    this.failureSim = new FailureSimulator({
      onFailure: (f) => this.handleFailure(f),
      onRecovery: (f) => this.handleRecovery(f),
    });
    
    // State
    this.isRunning = false;
    this.updateTimer = null;
    this.lastUpdate = Date.now();
    this.frameCount = 0;
    
    // Callbacks
    this.onTick = options.onTick || null;
    this.onAlert = options.onAlert || null;
    this.onTimeChange = options.onTimeChange || null;
  }

  /**
   * Start the simulation
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastUpdate = Date.now();
    
    this.updateTimer = setInterval(() => {
      this.tick();
    }, this.options.updateInterval);
    
    this.renderer.start();
  }

  /**
   * Stop the simulation
   */
  stop() {
    this.isRunning = false;
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    this.renderer.pause();
  }

  /**
   * Pause without resetting
   */
  pause() {
    this.trafficGen.setPaused(true);
    this.renderer.pause();
  }

  /**
   * Resume from pause
   */
  resume() {
    this.trafficGen.setPaused(false);
    this.renderer.resume();
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.trafficGen.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.trafficGen.isPaused;
  }

  /**
   * Main simulation tick
   */
  tick() {
    const now = Date.now();
    const deltaMs = now - this.lastUpdate;
    this.lastUpdate = now;
    this.frameCount++;
    
    // Update traffic
    this.trafficGen.update(
      this.renderer.nodes,
      this.renderer.links,
      deltaMs
    );
    
    // Apply any failures
    this.failureSim.applyFailures(
      this.renderer.nodes,
      this.renderer.links
    );
    
    // Update link health in renderer
    this.renderer.links.forEach(link => {
      if (link.health) {
        this.renderer.updateLinkHealth(link.id, link.health);
      }
    });
    
    // Callback
    if (this.onTick) {
      this.onTick({
        time: this.trafficGen.getTime(),
        formattedTime: this.trafficGen.getFormattedTime(),
        frame: this.frameCount,
        activeFailures: this.failureSim.getActiveFailures().length,
      });
    }
    
    // Time change callback (once per simulated minute)
    if (this.onTimeChange && this.frameCount % 10 === 0) {
      this.onTimeChange(this.trafficGen.getFormattedTime());
    }
  }

  /**
   * Handle failure event
   */
  handleFailure(failure) {
    if (this.onAlert) {
      this.onAlert({
        type: 'failure',
        severity: failure.severity,
        title: failure.label,
        message: `${failure.description} on ${failure.targetId}`,
        timestamp: Date.now(),
      });
    }
    
    // Add burst of error particles
    if (failure.targetType === 'link') {
      this.renderer.particleSystem.addBurst(failure.targetId, 8, 'error');
    }
  }

  /**
   * Handle recovery event
   */
  handleRecovery(failure) {
    if (this.onAlert) {
      this.onAlert({
        type: 'recovery',
        severity: 'info',
        title: 'Recovered',
        message: `${failure.targetId} has recovered`,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Set traffic pattern
   */
  setTrafficPattern(patternKey) {
    this.trafficGen.setPattern(patternKey);
  }

  /**
   * Set simulation time
   */
  setTime(hours) {
    this.trafficGen.setTime(hours);
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed) {
    this.trafficGen.setSpeed(speed);
  }

  /**
   * Trigger random failure
   */
  triggerRandomFailure() {
    return this.failureSim.triggerRandom(
      this.renderer.nodes,
      this.renderer.links
    );
  }

  /**
   * Trigger specific node failure
   */
  triggerNodeFailure(nodeId, type = 'nodeDown') {
    return this.failureSim.failNode(nodeId, type);
  }

  /**
   * Trigger cascading failure
   */
  triggerCascade(startNodeId) {
    return this.failureSim.triggerCascade(
      startNodeId,
      this.renderer.nodes,
      this.renderer.links
    );
  }

  /**
   * Recover all failures
   */
  recoverAll() {
    return this.failureSim.recoverAll();
  }

  /**
   * Create traffic spike
   */
  createTrafficSpike(nodeId, intensity = 1.0, duration = 5000) {
    this.trafficGen.createSpike(nodeId, intensity, duration);
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.trafficGen.isPaused,
      time: this.trafficGen.getTime(),
      formattedTime: this.trafficGen.getFormattedTime(),
      speed: this.trafficGen.simSpeed,
      pattern: this.trafficGen.pattern,
      activeFailures: this.failureSim.getActiveFailures(),
      failureHistory: this.failureSim.getHistory(10),
    };
  }

  /**
   * Reset simulation
   */
  reset() {
    this.trafficGen.reset();
    this.failureSim.clear();
    this.frameCount = 0;
    
    // Reset all nodes
    this.renderer.nodes.forEach(node => {
      node.targetLoad = 0.3 + Math.random() * 0.2;
      node.status = 'healthy';
    });
    
    // Reset all links
    this.renderer.links.forEach(link => {
      link.health = { status: 'up', flow: 1, loss: 0 };
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    this.failureSim.clear();
  }
}

// Export pattern and failure type constants
export { FAILURE_TYPES, TRAFFIC_PATTERNS };


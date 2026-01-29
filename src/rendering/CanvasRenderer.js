/**
 * Main Canvas Renderer (v2)
 * Orchestrates all rendering subsystems for the network visualization
 */

import { LINK_CONFIG, LinkRenderer } from './LinkRenderer.js';
import { DEVICE_CONFIG, NodeRenderer } from './NodeRenderer.js';
import { ParticleSystem } from './ParticleSystem.js';

// Rendering configuration
const RENDER_CONFIG = {
  targetFPS: 60,
  backgroundColor: '#0a0f1a',
  gridColor: 'rgba(255, 255, 255, 0.03)',
  gridSize: 40,
  showGrid: true,
};

/**
 * Main Canvas Renderer Class
 */
export class CanvasRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = { ...RENDER_CONFIG, ...options };

    // Initialize sub-renderers
    this.nodeRenderer = new NodeRenderer(this.ctx, new Map());
    this.linkRenderer = new LinkRenderer(this.ctx);
    this.particleSystem = new ParticleSystem(this.ctx);

    // State
    this.nodes = [];
    this.links = [];
    this.nodeMap = new Map();
    this.linkHealthMap = new Map();
    this.selectedNode = null;
    this.hoveredNode = null;
    this.selectedLink = null;

    // Animation
    this.frame = 0;
    this.lastFrameTime = 0;
    this.rafId = null;
    this.paused = false;

    // Setup canvas
    this.dpr = window.devicePixelRatio || 1;
    this.handleResize();

    // Event bindings
    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Set icon cache for node rendering
   */
  setIconCache(cache) {
    this.nodeRenderer.iconCache = cache;
  }

  /**
   * Set network topology
   */
  setTopology(topology) {
    this.nodes = (topology.nodes || []).map(node => ({
      ...node,
      x: node.position?.x * this.width || this.width / 2,
      y: node.position?.y * this.height || this.height / 2,
      displayLoad: node.load ?? 0.5,
      targetLoad: node.load ?? 0.5,
      type: node.type || 'switch',
    }));

    this.links = topology.links || [];
    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    // Initialize particle system
    this.particleSystem.initialize(this.links, this.nodeMap, 1);

    // Initialize link health
    this.links.forEach(link => {
      this.linkHealthMap.set(link.id, { status: 'up', flow: 1, loss: 0 });
    });
  }

  /**
   * Update link health status
   */
  updateLinkHealth(linkId, health) {
    this.linkHealthMap.set(linkId, health);
    this.particleSystem.updateLink(linkId, { health });
  }

  /**
   * Handle canvas resize
   */
  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Update node positions
    this.nodes.forEach(node => {
      if (node.position) {
        node.x = node.position.x * this.width;
        node.y = node.position.y * this.height;
      }
    });
  }

  /**
   * Start animation loop
   */
  start() {
    this.paused = false;
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  /**
   * Stop animation loop
   */
  stop() {
    this.paused = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Pause rendering (keeps RAF but stops updates)
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume rendering
   */
  resume() {
    this.paused = false;
  }

  /**
   * Main render loop
   */
  loop(timestamp) {
    const elapsed = timestamp - this.lastFrameTime;
    const targetFrameTime = 1000 / this.options.targetFPS;

    if (elapsed >= targetFrameTime) {
      this.lastFrameTime = timestamp - (elapsed % targetFrameTime);
      this.frame++;

      if (!this.paused) {
        this.update();
      }

      this.render();

      // Update sub-renderers
      this.nodeRenderer.tick();
      this.linkRenderer.tick();
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  /**
   * Update simulation state
   */
  update() {
    // Animate node loads
    this.nodes.forEach(node => {
      const diff = node.targetLoad - node.displayLoad;
      node.displayLoad += diff * 0.05;
    });

    // Update particles
    this.particleSystem.update(1);
  }

  /**
   * Render full scene
   */
  render() {
    // Clear canvas
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply transform
    if (this.applyTransform) {
      this.applyTransform();
    }


    // Draw grid
    if (this.options.showGrid) {
      this.drawGrid();
    }

    // Draw links
    this.links.forEach(link => {
      const source = this.nodeMap.get(link.source);
      const target = this.nodeMap.get(link.target);
      const health = this.linkHealthMap.get(link.id) || { status: 'up', flow: 1 };
      const control = this.getControlPoint(link, source, target);
      const isSelected = this.selectedLink === link.id;

      this.linkRenderer.render(link, source, target, control, health, isSelected);
    });

    // Draw particles
    this.particleSystem.render();

    // Draw nodes
    this.nodes.forEach(node => {
      const isSelected = this.selectedNode === node.id;
      const isHovered = this.hoveredNode === node.id;
      this.nodeRenderer.render(node, isSelected, isHovered);
    });
  }

  /**
   * Draw background grid
   */
  drawGrid() {
    const size = this.options.gridSize;
    this.ctx.strokeStyle = this.options.gridColor;
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= this.width; x += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.height; y += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Get control point for curved links
   */
  getControlPoint(link, source, target) {
    if (link.control && link.control.manual) {
      return {
        x: link.control.x * this.width,
        y: link.control.y * this.height,
      };
    }

    if (!source || !target) {
      return { x: this.width / 2, y: this.height / 2 };
    }

    // Auto-calculate curve
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2 - Math.abs(source.x - target.x) * 0.1;
    return { x: midX, y: midY };
  }

  /**
   * Select a node
   */
  selectNode(nodeId) {
    this.selectedNode = nodeId;
    this.selectedLink = null;
  }

  /**
   * Select a link
   */
  selectLink(linkId) {
    this.selectedLink = linkId;
    this.selectedNode = null;
  }

  /**
   * Set hovered node
   */
  setHoveredNode(nodeId) {
    this.hoveredNode = nodeId;
  }

  /**
   * Find node at coordinates
   */
  findNodeAt(x, y) {
    return this.nodes.find(node => {
      const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
      const radius = config.radius;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
  }

  /**
   * Update node position (for dragging)
   */
  updateNodePosition(nodeId, x, y) {
    const node = this.nodeMap.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      node.position = { x: x / this.width, y: y / this.height };
    }
  }

  /**
   * Update node load target
   */
  setNodeLoad(nodeId, load) {
    const node = this.nodeMap.get(nodeId);
    if (node) {
      node.targetLoad = load;
    }
  }

  /**
   * Set all nodes' target loads based on multiplier
   */
  setGlobalLoad(multiplier) {
    this.nodes.forEach(node => {
      const variance = node.type === 'core' ? 0.1 : 0.2;
      const base = 0.3 + multiplier * 0.5;
      node.targetLoad = Math.min(1, Math.max(0, base + (Math.random() - 0.5) * variance));
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.particleSystem.clear();
  }
}


// setSpeed method for ParticleSystem
ParticleSystem.prototype.setSpeed = function (multiplier) {
  this.speedMultiplier = multiplier || 1;
};

// setTransform method for CanvasRenderer
CanvasRenderer.prototype.setTransform = function (transform) {
  this.transform = transform || { scale: 1, offsetX: 0, offsetY: 0 };
  this.needsRedraw = true;
};

// Apply transform in render method
CanvasRenderer.prototype.applyTransform = function () {
  if (this.transform) {
    this.ctx.setTransform(
      this.transform.scale * this.dpr, 0, 0,
      this.transform.scale * this.dpr,
      this.transform.offsetX * this.dpr,
      this.transform.offsetY * this.dpr
    );
  } else {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
};

// Reset transform after rendering
CanvasRenderer.prototype.resetTransform = function () {
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
};

export { DEVICE_CONFIG, LINK_CONFIG };

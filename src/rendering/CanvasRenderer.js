/**
 * Main Canvas Renderer (v3)
 * Orchestrates rendering for the network packet simulator.
 */

import { LINK_CONFIG, LinkRenderer } from './LinkRenderer.js';
import { DEVICE_CONFIG, NodeRenderer } from './NodeRenderer.js';
import { PacketRenderer } from './PacketRenderer.js';

const RENDER_CONFIG = {
  targetFPS: 60,
  backgroundColor: '#0a0f1a',
  gridColor: 'rgba(255, 255, 255, 0.03)',
  gridSize: 40,
  showGrid: true,
};

export class CanvasRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = { ...RENDER_CONFIG, ...options };

    this.nodeRenderer = new NodeRenderer(this.ctx, new Map());
    this.linkRenderer = new LinkRenderer(this.ctx);
    this.packetRenderer = new PacketRenderer(this.ctx);

    this.nodes = [];
    this.links = [];
    this.nodeMap = new Map();
    this.linkHealthMap = new Map();
    this.selectedNode = null;
    this.hoveredNode = null;
    this.selectedLink = null;

    this.frame = 0;
    this.lastFrameTime = 0;
    this.rafId = null;
    this.paused = false;

    this.dpr = window.devicePixelRatio || 1;
    this.handleResize();

    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.handleResize);
  }

  setIconCache(cache) {
    this.nodeRenderer.iconCache = cache;
  }

  setTopology(topology) {
    this.nodes = (topology.nodes || []).map(node => ({
      ...node,
      x: node.position?.x * this.width || this.width / 2,
      y: node.position?.y * this.height || this.height / 2,
      type: node.type || 'switch',
    }));

    this.links = topology.links || [];
    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    this.links.forEach(link => {
      this.linkHealthMap.set(link.id, { status: link.status || 'up' });
    });

    this.packetRenderer.setNodeMap(this.nodeMap);
  }

  updateLinkHealth(linkId, health) {
    this.linkHealthMap.set(linkId, health);
  }

  /**
   * Set active packets for rendering.
   */
  setActivePackets(packets) {
    this.packetRenderer.setPackets(packets);
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    const oldW = this.width || rect.width;
    const oldH = this.height || rect.height;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.nodes.length > 0 && oldW > 0 && oldH > 0) {
      const scaleX = this.width / oldW;
      const scaleY = this.height / oldH;
      this.nodes.forEach(node => {
        node.x *= scaleX;
        node.y *= scaleY;
        if (node.position) {
          node.position.x = node.x / this.width;
          node.position.y = node.y / this.height;
        }
      });
    }
  }

  start() {
    this.paused = false;
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  stop() {
    this.paused = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }

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
      this.nodeRenderer.tick();
      this.linkRenderer.tick();
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  update() {
    this.packetRenderer.update(1);
  }

  render() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.applyTransform) {
      this.applyTransform();
    }

    if (this.options.showGrid) {
      this.drawGrid();
    }

    // Draw links
    this.links.forEach(link => {
      const source = this.nodeMap.get(link.source);
      const target = this.nodeMap.get(link.target);
      const health = this.linkHealthMap.get(link.id) || { status: 'up' };
      const control = this.getControlPoint(link, source, target);
      const isSelected = this.selectedLink === link.id;

      this.linkRenderer.render(link, source, target, control, health, isSelected);
    });

    // Draw packets
    this.packetRenderer.render();

    // Draw nodes
    this.nodes.forEach(node => {
      const isSelected = this.selectedNode === node.id;
      const isHovered = this.hoveredNode === node.id;
      this.nodeRenderer.render(node, isSelected, isHovered);
    });

    if (this.resetTransform) {
      this.resetTransform();
    }
  }

  drawGrid() {
    const size = this.options.gridSize;
    this.ctx.strokeStyle = this.options.gridColor;
    this.ctx.lineWidth = 1;

    let startX = 0, startY = 0, endX = this.width, endY = this.height;
    if (this.transform) {
      startX = -this.transform.offsetX / this.transform.scale;
      startY = -this.transform.offsetY / this.transform.scale;
      endX = (this.width - this.transform.offsetX) / this.transform.scale;
      endY = (this.height - this.transform.offsetY) / this.transform.scale;
    }
    startX = Math.floor(startX / size) * size;
    startY = Math.floor(startY / size) * size;

    for (let x = startX; x <= endX; x += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }
    for (let y = startY; y <= endY; y += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  getControlPoint(link, source, target) {
    if (link.control && link.control.manual) {
      return { x: link.control.x * this.width, y: link.control.y * this.height };
    }
    if (!source || !target) {
      return { x: this.width / 2, y: this.height / 2 };
    }
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2 - Math.abs(source.x - target.x) * 0.1;
    return { x: midX, y: midY };
  }

  selectNode(nodeId) {
    this.selectedNode = nodeId;
    this.selectedLink = null;
  }

  selectLink(linkId) {
    this.selectedLink = linkId;
    this.selectedNode = null;
  }

  setHoveredNode(nodeId) {
    this.hoveredNode = nodeId;
  }

  findNodeAt(x, y) {
    const scale = this.transform?.scale || 1;
    const minWorldHitRadius = 14 / Math.max(scale, 0.1);

    for (let i = this.nodes.length - 1; i >= 0; i -= 1) {
      const node = this.nodes[i];
      const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
      const radius = Math.max(config.radius, minWorldHitRadius);
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        return node;
      }
    }
    return null;
  }

  updateNodePosition(nodeId, x, y) {
    const node = this.nodeMap.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      node.position = { x: x / this.width, y: y / this.height };
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.packetRenderer.clear();
  }
}

// setTransform method
CanvasRenderer.prototype.setTransform = function (transform) {
  this.transform = transform || { scale: 1, offsetX: 0, offsetY: 0 };
  this.needsRedraw = true;
};

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

CanvasRenderer.prototype.resetTransform = function () {
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
};

export { DEVICE_CONFIG, LINK_CONFIG };

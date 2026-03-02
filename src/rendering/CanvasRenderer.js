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
  gridDotColor: 'rgba(255, 255, 255, 0.08)',
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
    this.hoveredLink = null;
    this.selectedLink = null;
    this.pduSourceNode = null;
    this.pingResults = []; // { nodeId, success, startTime }

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
    // Use uniform scaling so the layout isn't distorted by canvas aspect ratio
    const dim = Math.min(this.width, this.height);
    const padX = (this.width - dim) / 2;
    const padY = (this.height - dim) / 2;

    this.nodes = (topology.nodes || []).map(node => ({
      ...node,
      x: (node.position?.x ?? 0.5) * dim + padX,
      y: (node.position?.y ?? 0.5) * dim + padY,
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
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Node positions are managed by fitToContent — no non-uniform rescaling here
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
      const isHovered = this.hoveredLink === link.id;

      this.linkRenderer.render(link, source, target, control, health, isSelected, isHovered);
    });

    // Draw packets
    this.packetRenderer.render();

    // Draw nodes
    this.nodes.forEach(node => {
      const isSelected = this.selectedNode === node.id;
      const isHovered = this.hoveredNode === node.id;
      const isPduSource = this.pduSourceNode === node.id;
      this.nodeRenderer.render(node, isSelected, isHovered, isPduSource);
    });

    // Draw ping result overlays
    this.drawPingResults();

    if (this.resetTransform) {
      this.resetTransform();
    }
  }

  drawGrid() {
    const size = this.options.gridSize;
    this.ctx.fillStyle = this.options.gridDotColor;

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
      for (let y = startY; y <= endY; y += size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  setHoveredLink(linkId) {
    this.hoveredLink = linkId;
  }

  setPduSourceNode(nodeId) {
    this.pduSourceNode = nodeId;
  }

  addPingResult(nodeId, success) {
    this.pingResults.push({ nodeId, success, startTime: performance.now() });
  }

  findLinkAt(x, y) {
    const threshold = 8;
    for (let i = this.links.length - 1; i >= 0; i--) {
      const link = this.links[i];
      const source = this.nodeMap.get(link.source);
      const target = this.nodeMap.get(link.target);
      if (!source || !target) continue;

      const dist = pointToSegmentDist(x, y, source.x, source.y, target.x, target.y);
      if (dist < threshold) return link;
    }
    return null;
  }

  drawPingResults() {
    const now = performance.now();
    const duration = 3000;
    this.pingResults = this.pingResults.filter(r => now - r.startTime < duration);

    for (const result of this.pingResults) {
      const node = this.nodeMap.get(result.nodeId);
      if (!node) continue;

      const elapsed = now - result.startTime;
      const alpha = Math.max(0, 1 - elapsed / duration);
      const offsetY = -10 * (elapsed / duration);

      const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
      const ix = node.x + config.radius + 12;
      const iy = node.y - config.radius + offsetY;

      this.ctx.globalAlpha = alpha;
      this.ctx.font = 'bold 16px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      if (result.success) {
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillText('\u2713', ix, iy);
      } else {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillText('\u2717', ix, iy);
      }
      this.ctx.globalAlpha = 1;
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

function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export { DEVICE_CONFIG, LINK_CONFIG };

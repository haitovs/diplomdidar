import { clamp, debounce, lerp } from '../utils/dom.js';

// Performance configuration
const PERFORMANCE = {
  TARGET_FPS: 30,
  MIN_FRAME_TIME: 1000 / 60, // 16.67ms
  MAX_FRAME_TIME: 1000 / 15, // 66ms
  RESIZE_DEBOUNCE_MS: 150,
  METRIC_INTERVAL: 40, // frames between metric updates
};

export class NetworkCanvas {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tooltip = tooltip;
    this.dpr = window.devicePixelRatio || 1;
    this.frame = 0;
    this.metricCallback = null;
    this.nodes = [];
    this.nodeMap = new Map();
    this.links = [];
    this.handleLayer = null;
    this.handleElements = new Map();
    this.handlesVisible = true;
    this.draggedNode = null;
    this.pointerDownNode = null;
    this.dragMoved = false;
    this.activeHandle = null;
    this.instrumentation = {
      sensorBoost: 0,
      jitterEffect: 0,
      lockdownRelief: 0,
      failover: false,
    };
    this.aiIntensity = 0.4;
    this.paused = false;
    this.packets = [];
    this.linkHealth = new Map();
    this.networkLoss = 0;
    this.iconCache = new Map();
    this.nodeSelectCallback = null;
    this.flowScale = 1;

    // Performance tracking
    this.lastFrameTime = 0;
    this.frameTime = 0;
    this.targetFrameTime = 1000 / PERFORMANCE.TARGET_FPS;
    this.dirty = true; // Flag to track if redraw is needed
    this.rafId = null;
    this.fps = 0;
    this.fpsCounter = 0;
    this.lastFpsUpdate = 0;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.beginNodeDrag = this.beginNodeDrag.bind(this);
    this.moveNodeDrag = this.moveNodeDrag.bind(this);
    this.endNodeDrag = this.endNodeDrag.bind(this);
    this.loop = this.loop.bind(this);

    // Debounced resize handler
    this._debouncedResize = debounce(this.handleResize, PERFORMANCE.RESIZE_DEBOUNCE_MS);

    this.handleResize();
    window.addEventListener('resize', this._debouncedResize);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.hideTooltip);
    canvas.addEventListener('pointerdown', this.beginNodeDrag);
    window.addEventListener('pointermove', this.moveNodeDrag);
    window.addEventListener('pointerup', this.endNodeDrag);
    this.loop();
  }

  /**
   * Cleanup method to remove event listeners
   */
  destroy() {
    window.removeEventListener('resize', this._debouncedResize);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerleave', this.hideTooltip);
    this.canvas.removeEventListener('pointerdown', this.beginNodeDrag);
    window.removeEventListener('pointermove', this.moveNodeDrag);
    window.removeEventListener('pointerup', this.endNodeDrag);
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Mark canvas as needing redraw
   */
  markDirty() {
    this.dirty = true;
  }

  /**
   * Get current FPS for debugging
   */
  getFPS() {
    return this.fps;
  }

  setNodeSelectCallback(cb) {
    this.nodeSelectCallback = cb;
  }

  setMetricCallback(cb) {
    this.metricCallback = cb;
  }

  attachHandleLayer(layer) {
    this.handleLayer = layer;
    this.buildHandleElements();
  }

  setTopology(topology = { nodes: [], links: [] }) {
    const nodes = topology.nodes || [];
    const links = topology.links || [];
    this.nodes = nodes.map((node) => ({
      ...node,
      position: node.position || { x: Math.random(), y: Math.random() },
      baseLoad: node.load ?? 0.5,
      displayLoad: node.load ?? 0.5,
      targetLoad: node.load ?? 0.5,
      color: node.color,
      icon: node.icon,
      hardware: node.hardware || [],
      software: node.software || [],
      status: node.status || 'Operational',
    }));
    this.nodeMap = new Map(this.nodes.map((node) => [node.id, node]));
    this.links = links.map((link, idx) => ({
      ...link,
      id: link.id || `${link.source}-${link.target}-${idx}`,
      control: link.control
        ? { ...link.control, manual: true }
        : { x: 0.5, y: 0.5, manual: false },
    }));
    this.handleResize();
    this.buildHandleElements();
    this.preloadIcons();
    this.seedPackets();
  }

  applyScenario(multipliers = {}) {
    const {
      load = 1,
      ai = 0.5,
      sensorBoost = 0,
      jitterEffect = 0,
      lockdownRelief = 0,
      failover = false,
    } = multipliers;
    this.instrumentation = { sensorBoost, jitterEffect, lockdownRelief, failover };
    this.flowScale = load;
    this.nodes.forEach((node) => {
      const variance = node.type === 'core' ? 0.05 : 0.12;
      const aiBoost = node.label.includes('XR') || node.label.includes('AI') ? ai * 0.18 : 0;
      const sensorInfluence = node.type === 'edge' ? sensorBoost : sensorBoost * 0.6;
      const jitterSwing = jitterEffect * (node.type === 'core' ? 0.4 : 0.8);
      const lockdownOffset = node.type === 'edge' ? lockdownRelief : lockdownRelief * 0.5;
      const base = node.baseLoad * load + aiBoost + sensorInfluence;
      const seeded = clamp(
        base + (Math.random() - 0.5) * variance + jitterSwing + lockdownOffset,
        0.12,
        0.98
      );
      node.targetLoad = seeded;
    });
    this.aiIntensity = ai;
    this.seedPackets();
    this.recalculateLinkHealth(load, jitterEffect);
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.bounds = rect;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.nodes.forEach((node) => {
      node.x = node.position.x * rect.width;
      node.y = node.position.y * rect.height;
    });
    this.refreshHandlePositions();
  }

  beginNodeDrag(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const target = this.findNodeAt(x, y);
    this.pointerDownNode = target || null;
    this.dragMoved = false;
    if (target) {
      this.draggedNode = { node: target, offsetX: target.x - x, offsetY: target.y - y };
      this.canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  }

  moveNodeDrag(event) {
    if (!this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left + this.draggedNode.offsetX, 0, this.width);
    const y = clamp(event.clientY - rect.top + this.draggedNode.offsetY, 0, this.height);
    this.draggedNode.node.x = x;
    this.draggedNode.node.y = y;
    this.draggedNode.node.position = { x: x / this.width, y: y / this.height };
    this.refreshHandlePositions();
    this.dragMoved = true;
  }

  endNodeDrag(event) {
    if (this.draggedNode) {
      try {
        this.canvas.releasePointerCapture(event.pointerId);
      } catch (err) {
        // ignore
      }
    }
    if (this.pointerDownNode && !this.dragMoved && typeof this.nodeSelectCallback === 'function') {
      this.nodeSelectCallback(this.pointerDownNode);
    }
    this.pointerDownNode = null;
    this.dragMoved = false;
    this.draggedNode = null;
  }

  setHandlesVisible(visible) {
    this.handlesVisible = visible;
    this.handleElements.forEach((el) => {
      el.style.display = visible ? 'flex' : 'none';
    });
  }

  buildHandleElements() {
    if (!this.handleLayer) return;
    this.handleLayer.innerHTML = '';
    this.handleElements = new Map();
    this.links.forEach((link) => {
      const handle = document.createElement('div');
      handle.className = 'link-handle';
      handle.textContent = '●';
      handle.style.display = this.handlesVisible ? 'flex' : 'none';
      handle.dataset.linkId = link.id;
      handle.addEventListener('pointerdown', (event) => this.beginHandleDrag(event, link, handle));
      this.handleLayer.appendChild(handle);
      this.handleElements.set(link.id, handle);
    });
    this.refreshHandlePositions();
  }

  beginHandleDrag(event, link, element) {
    event.preventDefault();
    event.stopPropagation();
    this.activeHandle = { link, element };
    element.classList.add('dragging');
    element.setPointerCapture(event.pointerId);
    const move = (ev) => this.moveHandle(ev);
    const end = (ev) => this.endHandle(ev, move, end);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', end, { once: true });
    element.addEventListener('pointercancel', end, { once: true });
  }

  moveHandle(event) {
    if (!this.activeHandle) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, this.width);
    const y = clamp(event.clientY - rect.top, 0, this.height);
    const { link } = this.activeHandle;
    link.control = { x: x / this.width, y: y / this.height, manual: true };
    this.positionHandle(link);
  }

  endHandle(event, move, end) {
    if (!this.activeHandle) return;
    const { element } = this.activeHandle;
    element.classList.remove('dragging');
    try {
      element.releasePointerCapture(event.pointerId);
    } catch (err) {
      // ignore
    }
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerup', end);
    element.removeEventListener('pointercancel', end);
    this.activeHandle = null;
  }

  positionHandle(link) {
    const handle = this.handleElements.get(link.id);
    if (!handle) return;
    const point = this.getControlPointPx(link);
    handle.style.transform = `translate(${point.x - 17}px, ${point.y - 17}px)`;
  }

  refreshHandlePositions() {
    this.links.forEach((link) => this.positionHandle(link));
  }

  getControlPointPx(link) {
    if (link.control && link.control.manual) {
      return {
        x: link.control.x * this.width,
        y: link.control.y * this.height,
      };
    }
    const source = this.nodeMap.get(link.source);
    const target = this.nodeMap.get(link.target);
    if (!source || !target) {
      return { x: this.width / 2, y: this.height / 2 };
    }
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2 - Math.abs(source.x - target.x) * 0.08;
    return { x: midX, y: midY };
  }

  handlePointerMove(e) {
    if (this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hover = this.findNodeAt(x, y);
    if (hover) {
      this.tooltip.hidden = false;
      this.tooltip.style.left = `${hover.x}px`;
      this.tooltip.style.top = `${hover.y}px`;
      this.tooltip.innerHTML = `
        <strong>${hover.label}</strong><br />
        ${Math.round(hover.displayLoad * 100)}% load · ${hover.campus}<br />
        <small>${hover.status || 'Operational'}</small>
      `;
    } else {
      this.hideTooltip();
    }
  }

  findNodeAt(x, y) {
    return this.nodes.find((node) => {
      const radius = node.type === 'core' ? 28 : 18;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
  }

  hideTooltip() {
    this.tooltip.hidden = true;
  }

  play() {
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  isPaused() {
    return this.paused;
  }

  loop(timestamp = 0) {
    // Frame budgeting - skip frames if we're ahead of target
    const elapsed = timestamp - this.lastFrameTime;
    
    // Update FPS counter
    this.fpsCounter++;
    if (timestamp - this.lastFpsUpdate >= 1000) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.lastFpsUpdate = timestamp;
    }

    // Only process if enough time has passed (frame budget)
    if (elapsed >= this.targetFrameTime) {
      this.frameTime = elapsed;
      this.lastFrameTime = timestamp - (elapsed % this.targetFrameTime);
      this.frame += 1;

      if (!this.paused) {
        this.updateLoads();
        this.dirty = true; // Loads changed, need redraw
        
        // Emit metrics at interval
        if (this.frame % PERFORMANCE.METRIC_INTERVAL === 0 && this.metricCallback) {
          const metrics = this.collectMetrics();
          this.metricCallback(metrics);
        }
      }

      // Only redraw if dirty (something changed)
      if (this.dirty) {
        this.drawScene();
        this.dirty = false;
      }
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  updateLoads() {
    this.nodes.forEach((node) => {
      node.displayLoad = lerp(node.displayLoad, node.targetLoad, 0.05);
    });
  }

  seedPackets() {
    this.packets = [];
    this.links.forEach((link) => {
      const intensity = clamp(this.flowScale || 1, 0.4, 2.8);
      const count = Math.max(2, Math.round(intensity * 3 + Math.random() * 2));
      for (let i = 0; i < count; i++) {
        this.packets.push({
          linkId: link.id,
          t: Math.random(),
          speed: 0.003 + Math.random() * 0.006 * intensity,
          hue: 160 + Math.random() * 80,
        });
      }
    });
  }

  recalculateLinkHealth(loadFactor = 1, jitterEffect = 0) {
    this.networkLoss = 0;
    this.linkHealth = new Map();
    const avgNodeLoad =
      this.nodes.reduce((acc, node) => acc + node.targetLoad, 0) / (this.nodes.length || 1);
    this.links.forEach((link) => {
      const stress = loadFactor + avgNodeLoad + jitterEffect * 6 + (Math.random() * 0.4 - 0.2);
      const loss = clamp((stress - 1) * 0.1 + jitterEffect * 0.5, 0, 0.35);
      const status = loss > 0.24 ? 'down' : loss > 0.14 ? 'lossy' : stress > 1.4 ? 'degraded' : 'up';
      const flow = status === 'down' ? 0 : status === 'lossy' ? 0.4 : status === 'degraded' ? 0.8 : 1;
      this.linkHealth.set(link.id, { loss, status, flow });
      this.networkLoss += loss;
    });
    if (this.links.length) {
      this.networkLoss = this.networkLoss / this.links.length;
    }
  }

  preloadIcons() {
    this.nodes.forEach((node) => {
      const key = node.icon || (node.type === 'core' ? 'router.svg' : 'switch.svg');
      if (this.iconCache.has(key)) return;
      const img = new Image();
      img.src = `icons/${key}`;
      img.onload = () => this.iconCache.set(key, img);
      img.onerror = () => this.iconCache.set(key, null);
      this.iconCache.set(key, img);
    });
  }

  collectMetrics() {
    const avgLoad =
      this.nodes.reduce((acc, node) => acc + node.displayLoad, 0) / (this.nodes.length || 1);
    const utilization = clamp(avgLoad, 0, 1);
    const jitterPenalty = this.instrumentation.jitterEffect * 90;
    const latency = clamp(12 + (utilization - 0.55) * 20 + jitterPenalty, 7, 32);
    const energy = clamp(
      6 + utilization * 3.4 + this.aiIntensity * 1.6 + this.instrumentation.sensorBoost * 8,
      5,
      14
    );
    const loss = clamp(this.networkLoss || 0, 0, 0.35);
    return { utilization, latency, energy, loss };
  }

  drawScene() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawLinks();
    this.drawPackets();
    this.drawAIFlux();
    this.drawNodes();
  }

  drawLinks() {
    const { failover } = this.instrumentation;
    if (failover) {
      this.ctx.setLineDash([12, 8]);
      this.ctx.lineDashOffset = (this.frame % 80) * 0.8;
    } else {
      this.ctx.setLineDash([]);
    }
    this.links.forEach((link) => {
      const source = this.nodeMap.get(link.source);
      const target = this.nodeMap.get(link.target);
      if (!source || !target) return;
      const control = this.getControlPointPx(link);
      const health = this.linkHealth.get(link.id) || { status: 'up', loss: 0, flow: 1 };
      const gradient = this.ctx.createLinearGradient(source.x, source.y, target.x, target.y);
      const colorA =
        health.status === 'down'
          ? 'rgba(255, 99, 132, 0.6)'
          : health.status === 'lossy'
          ? 'rgba(252, 176, 69, 0.8)'
          : 'rgba(108, 124, 255, 0.6)';
      const colorB =
        health.status === 'down'
          ? 'rgba(255, 99, 132, 0.3)'
          : health.status === 'lossy'
          ? 'rgba(252, 176, 69, 0.5)'
          : 'rgba(78, 225, 193, 0.6)';
      gradient.addColorStop(0, colorA);
      gradient.addColorStop(1, colorB);
      this.ctx.lineWidth = link.type === 'fiber' ? 3 : 2;
      this.ctx.strokeStyle = gradient;
      if (health.status === 'lossy' || health.status === 'down') {
        this.ctx.setLineDash([10, 6]);
        this.ctx.lineDashOffset = (this.frame % 60) * 1.4;
      } else if (health.status === 'degraded') {
        this.ctx.setLineDash([16, 12]);
        this.ctx.lineDashOffset = (this.frame % 100) * 0.8;
      } else if (!failover) {
        this.ctx.setLineDash([]);
      }
      this.ctx.beginPath();
      this.ctx.moveTo(source.x, source.y);
      this.ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
      this.ctx.stroke();
    });
    this.ctx.setLineDash([]);
  }

  drawAIFlux() {
    const pulse = (Math.sin(this.frame * 0.02) + 1) / 2;
    const jitter = this.instrumentation.jitterEffect * 5;
    this.ctx.globalAlpha = 0.15 + this.aiIntensity * 0.2;
    this.ctx.fillStyle = `rgba(${108 + jitter}, ${124 - jitter}, 255, ${0.08 + pulse * 0.1})`;
    this.ctx.beginPath();
    this.ctx.ellipse(
      this.width * 0.55,
      this.height * 0.45,
      220 + this.aiIntensity * 120,
      140 + pulse * 60,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  drawNodes() {
    this.nodes.forEach((node) => {
      const radius = node.type === 'core' ? 30 : 24;
      const glow = node.type === 'core' ? 26 : 18;
      const baseColor = node.color || (node.type === 'core' ? '#6c7cff' : '#4ee1c1');

      const gradient = this.ctx.createRadialGradient(node.x, node.y, 4, node.x, node.y, glow);
      gradient.addColorStop(0, `${baseColor}dd`);
      gradient.addColorStop(1, 'rgba(3,7,18,0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, glow, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#0b1220';
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = `${baseColor}aa`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      const iconKey = node.icon || (node.type === 'core' ? 'router.svg' : 'switch.svg');
      const icon = this.iconCache.get(iconKey);
      if (icon && icon.complete && icon.naturalWidth > 0) {
        const size = node.type === 'core' ? 30 : 26;
        this.ctx.drawImage(icon, node.x - size / 2, node.y - size / 2, size, size);
      } else {
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
      this.ctx.font = '12px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${Math.round(node.displayLoad * 100)}%`, node.x, node.y + radius + 14);
      this.ctx.font = '11px Inter';
      this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
      this.ctx.fillText(node.label, node.x, node.y - radius - 6);
    });
  }

  drawPackets() {
    if (!this.packets.length) return;
    this.packets.forEach((packet) => {
      const link = this.links.find((l) => l.id === packet.linkId);
      if (!link) return;
      const source = this.nodeMap.get(link.source);
      const target = this.nodeMap.get(link.target);
      if (!source || !target) return;
      const health = this.linkHealth.get(link.id) || { flow: 1, loss: 0, status: 'up' };
      if (health.status === 'down') return;
      const control = this.getControlPointPx(link);
      packet.t += packet.speed * health.flow;
      if (packet.t > 1) {
        packet.t = 0;
        packet.speed = 0.003 + Math.random() * 0.006;
      }
      if (Math.random() < health.loss * 0.03) {
        packet.lost = 1;
      }
      if (packet.lost) {
        packet.lost -= 0.04;
        if (packet.lost <= 0) {
          packet.lost = 0;
          packet.t = Math.random();
        }
      }
      const t = packet.t;
      const x = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * control.x + t * t * target.x;
      const y = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * control.y + t * t * target.y;
      const alpha = packet.lost ? Math.max(packet.lost, 0.2) : 0.9;
      this.ctx.fillStyle = packet.lost ? 'rgba(255,99,132,0.9)' : `hsla(${packet.hue}, 75%, 60%, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

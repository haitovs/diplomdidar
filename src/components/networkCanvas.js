import { clamp, lerp } from '../utils/dom.js';

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
    this.activeHandle = null;
    this.instrumentation = {
      sensorBoost: 0,
      jitterEffect: 0,
      lockdownRelief: 0,
      failover: false,
    };
    this.aiIntensity = 0.4;
    this.paused = false;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.beginNodeDrag = this.beginNodeDrag.bind(this);
    this.moveNodeDrag = this.moveNodeDrag.bind(this);
    this.endNodeDrag = this.endNodeDrag.bind(this);
    this.loop = this.loop.bind(this);

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.hideTooltip);
    canvas.addEventListener('pointerdown', this.beginNodeDrag);
    window.addEventListener('pointermove', this.moveNodeDrag);
    window.addEventListener('pointerup', this.endNodeDrag);
    this.loop();
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
  }

  endNodeDrag(event) {
    if (this.draggedNode) {
      try {
        this.canvas.releasePointerCapture(event.pointerId);
      } catch (err) {
        // ignore
      }
    }
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
        ${Math.round(hover.displayLoad * 100)}% load · ${hover.campus}
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

  loop() {
    this.frame += 1;
    if (!this.paused) {
      this.updateLoads();
      if (this.frame % 40 === 0 && this.metricCallback) {
        const metrics = this.collectMetrics();
        this.metricCallback(metrics);
      }
    }
    this.drawScene();
    requestAnimationFrame(this.loop);
  }

  updateLoads() {
    this.nodes.forEach((node) => {
      node.displayLoad = lerp(node.displayLoad, node.targetLoad, 0.05);
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
    return { utilization, latency, energy };
  }

  drawScene() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawLinks();
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
      const gradient = this.ctx.createLinearGradient(source.x, source.y, target.x, target.y);
      gradient.addColorStop(0, failover ? 'rgba(252, 176, 69, 0.6)' : 'rgba(108, 124, 255, 0.4)');
      gradient.addColorStop(1, failover ? 'rgba(255, 99, 132, 0.6)' : 'rgba(78, 225, 193, 0.4)');
      this.ctx.lineWidth = link.type === 'fiber' ? 3 : 2;
      this.ctx.strokeStyle = gradient;
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
      const radius = node.type === 'core' ? 22 : 14;
      const glow = node.type === 'core' ? 18 : 10;
      const hue = node.type === 'core' ? 230 : node.label.includes('XR') ? 165 : 32;
      const saturation = node.type === 'core' ? 80 : 65;
      const lightness = 55 + node.displayLoad * 20;

      const gradient = this.ctx.createRadialGradient(
        node.x,
        node.y,
        4,
        node.x,
        node.y,
        glow
      );
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`);
      gradient.addColorStop(1, 'rgba(3,7,18,0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, glow, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${45 + node.displayLoad * 30}%)`;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = 'rgba(255,255,255,0.75)';
      this.ctx.font = '11px Inter';
      this.ctx.textAlign = 'center';
      if (node.type === 'core') {
        this.ctx.fillText(node.label, node.x, node.y - radius - 8);
      }
      this.ctx.font = '12px Inter';
      this.ctx.fillText(`${Math.round(node.displayLoad * 100)}%`, node.x, node.y + radius + 14);
    });
  }
}

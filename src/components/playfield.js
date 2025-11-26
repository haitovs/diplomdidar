const STORAGE_KEY = 'didar-playfield-layout';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Playfield {
  constructor({
    canvas,
    addBtn,
    connectBtn,
    saveBtn,
    loadBtn,
    clearBtn,
    applyBtn,
    statusEl,
    onApply,
    onTopologyChange,
  }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.addBtn = addBtn;
    this.connectBtn = connectBtn;
    this.saveBtn = saveBtn;
    this.loadBtn = loadBtn;
    this.clearBtn = clearBtn;
    this.applyBtn = applyBtn;
    this.statusEl = statusEl;
    this.onApply = onApply || (() => {});
    this.onTopologyChange = onTopologyChange || (() => {});

    this.mode = 'idle';
    this.nodes = [];
    this.links = [];
    this.draggedNode = null;
    this.nodeCounter = 1;
    this.pendingNode = null;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);

    this.registerControls();
    this.handleResize();
    this.loadFromStorage();
    this.draw();
  }

  registerControls() {
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.toggleMode('add'));
    }
    if (this.connectBtn) {
      this.connectBtn.addEventListener('click', () => this.toggleMode('connect'));
    }
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveToStorage());
    }
    if (this.loadBtn) {
      this.loadBtn.addEventListener('click', () => this.loadFromStorage(true));
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.nodes = [];
        this.links = [];
        this.nodeCounter = 1;
        this.pendingNode = null;
        this.draw();
        this.setStatus('Cleared playfield');
        this.notifyTopologyChange();
      });
    }
    if (this.applyBtn) {
      this.applyBtn.addEventListener('click', () => {
        const topology = this.buildTopology();
        if (!topology.nodes.length) {
          this.setStatus('Add at least 1 node before applying', 'warn');
          return;
        }
        this.onApply(topology);
        this.setStatus('Applied to simulation', 'live');
      });
    }
  }

  toggleMode(mode) {
    this.mode = this.mode === mode ? 'idle' : mode;
    if (this.addBtn) this.addBtn.dataset.active = this.mode === 'add';
    if (this.connectBtn) this.connectBtn.dataset.active = this.mode === 'connect';
    const label = this.mode === 'add' ? 'Add node mode: click the grid to place dots.' : this.mode === 'connect'
      ? 'Connect mode: click two dots to wire them.'
      : 'Idle';
    this.setStatus(label);
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    this.draw();
  }

  getPointerPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return { x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) };
  }

  handlePointerDown(event) {
    const pos = this.getPointerPosition(event);
    const target = this.pickNode(pos);
    if (this.mode === 'add') {
      this.addNode(pos);
      return;
    }
    if (target && this.mode === 'connect') {
      if (this.pendingNode && this.pendingNode.id !== target.id) {
        this.connectNodes(this.pendingNode, target);
        this.pendingNode = null;
      } else {
        this.pendingNode = target;
        this.setStatus(`Connection start: ${target.label}`);
      }
      return;
    }
    if (target) {
      this.draggedNode = { node: target };
    }
  }

  handlePointerMove(event) {
    if (!this.draggedNode) return;
    const pos = this.getPointerPosition(event);
    this.draggedNode.node.x = pos.x;
    this.draggedNode.node.y = pos.y;
    this.draw();
    this.notifyTopologyChange();
  }

  handlePointerUp() {
    this.draggedNode = null;
  }

  addNode(pos) {
    const node = {
      id: `custom-${Date.now()}-${this.nodeCounter}`,
      label: `Node ${this.nodeCounter}`,
      x: pos.x,
      y: pos.y,
    };
    this.nodeCounter += 1;
    this.nodes.push(node);
    this.draw();
    this.setStatus(`${node.label} added`, 'live');
    this.notifyTopologyChange();
  }

  connectNodes(a, b) {
    if (this.links.some((link) => (link.source === a.id && link.target === b.id) || (link.source === b.id && link.target === a.id))) {
      this.setStatus('These nodes are already connected', 'warn');
      return;
    }
    this.links.push({ id: `link-${Date.now()}`, source: a.id, target: b.id });
    this.draw();
    this.setStatus(`Linked ${a.label} ↔ ${b.label}`, 'live');
    this.notifyTopologyChange();
  }

  pickNode(pos) {
    const threshold = 0.03;
    return this.nodes.find((node) => distance(pos, node) < threshold);
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid();
    this.links.forEach((link) => {
      const source = this.nodes.find((node) => node.id === link.source);
      const target = this.nodes.find((node) => node.id === link.target);
      if (!source || !target) return;
      this.ctx.strokeStyle = 'rgba(108,124,255,0.7)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(source.x * this.width, source.y * this.height);
      this.ctx.lineTo(target.x * this.width, target.y * this.height);
      this.ctx.stroke();
    });
    this.nodes.forEach((node, index) => {
      const x = node.x * this.width;
      const y = node.y * this.height;
      this.ctx.fillStyle = index < 2 ? '#6c7cff' : '#4ee1c1';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#0b1220';
      this.ctx.font = '11px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.label, x, y - 14);
    });
  }

  drawGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  saveToStorage() {
    const payload = { nodes: this.nodes, links: this.links, nodeCounter: this.nodeCounter };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    this.setStatus('Layout saved locally');
  }

  loadFromStorage(notify = false) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (notify) this.setStatus('No saved layout found', 'warn');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      this.nodes = parsed.nodes || [];
      this.links = parsed.links || [];
      this.nodeCounter = parsed.nodeCounter || this.nodes.length + 1;
      this.draw();
      this.setStatus('Layout loaded');
      this.notifyTopologyChange();
    } catch (error) {
      this.setStatus('Failed to parse saved layout', 'warn');
    }
  }

  setStatus(message, tone = 'info') {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    this.statusEl.dataset.state = tone === 'live' ? 'live' : tone === 'warn' ? 'warn' : 'idle';
  }

  buildTopology() {
    const nodes = this.nodes.map((node, index) => ({
      id: node.id,
      label: node.label,
      type: index < 2 ? 'core' : 'edge',
      campus: 'Custom',
      load: 0.4 + (index % 3) * 0.1,
      position: { x: node.x, y: node.y },
    }));
    const links = this.links.map((link) => {
      const source = this.nodes.find((node) => node.id === link.source);
      const target = this.nodes.find((node) => node.id === link.target);
      return {
        id: link.id,
        source: link.source,
        target: link.target,
        latency: source && target ? Math.round(distance(source, target) * 30) / 10 + 0.6 : 1,
        type: 'custom',
      };
    });
    return { nodes, links };
  }

  notifyTopologyChange() {
    this.onTopologyChange(this.buildTopology());
  }

  getTopology() {
    return this.buildTopology();
  }
}

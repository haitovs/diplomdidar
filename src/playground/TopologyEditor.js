/**
 * Topology Editor
 * Main editor component for creating and modifying network topologies
 */

import { DEVICE_CONFIG } from '../rendering/NodeRenderer.js';
import { normalizeLink, normalizeNode, normalizeTopology, serializeTopology } from '../utils/topologySchema.js';

/**
 * Topology Editor Class
 */
export class TopologyEditor {
  constructor(canvas, renderer, options = {}) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.options = {
      onNodeAdd: null,
      onNodeSelect: null,
      onLinkSelect: null,
      onLinkAdd: null,
      onLinkStageChange: null,
      onTopologyChange: null,
      isPanning: null,
      snapToGrid: true,
      gridSize: 40,
      ...options,
    };
    
    // Editor state
    this.mode = 'select'; // 'select', 'addNode', 'addLink', 'delete'
    this.pendingDevice = null;
    this.pendingLink = null;
    this.selectedNodes = new Set();
    this.selectedLinks = new Set();
    
    // Undo/redo history
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    
    // Current topology
    this.nodes = [];
    this.links = [];
    this.nodeIdCounter = 1;
    this.linkIdCounter = 1;
    this.lastDeviceType = 'switch';
    this.dragState = null;
    this.suppressNextClick = false;

    this.boundHandlers = {
      click: (e) => this.handleClick(e),
      dblclick: (e) => this.handleDoubleClick(e),
      contextmenu: (e) => this.handleContextMenu(e),
      mousedown: (e) => this.handleMouseDown(e),
      mousemove: (e) => this.handleMouseMove(e),
      mouseup: (e) => this.handleMouseUp(e),
      mouseleave: (e) => this.handleMouseUp(e),
      dragover: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      },
      drop: (e) => this.handleDrop(e),
      keydown: (e) => this.handleKeydown(e),
    };
    
    this.setupEventListeners();
    this.saveState();
  }

  /**
   * Set editor mode
   */
  setMode(mode) {
    const previousMode = this.mode;
    this.mode = mode;
    this.pendingLink = null;
    if (mode === 'addNode') {
      this.pendingDevice = this.pendingDevice || this.lastDeviceType || 'switch';
    } else {
      this.pendingDevice = null;
    }
    if (previousMode === 'addLink' || mode !== 'addLink') {
      this.options.onLinkStageChange?.({ stage: 'idle' });
    }
    this.updateCursor();
  }

  /**
   * Set device to add
   */
  setPendingDevice(deviceType) {
    this.mode = 'addNode';
    this.pendingLink = null;
    this.pendingDevice = DEVICE_CONFIG[deviceType] ? deviceType : 'switch';
    this.lastDeviceType = this.pendingDevice;
    this.options.onLinkStageChange?.({ stage: 'idle' });
    this.updateCursor();
  }

  /**
   * Toggle grid snapping for drag/add operations.
   */
  setSnapToGrid(enabled) {
    this.options.snapToGrid = Boolean(enabled);
  }

  /**
   * Update cursor based on mode
   */
  updateCursor() {
    const cursors = {
      select: 'default',
      addNode: 'crosshair',
      addLink: 'crosshair',
      hand: 'grab',
      delete: 'not-allowed',
    };
    this.canvas.style.cursor = cursors[this.mode] || 'default';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.canvas.addEventListener('click', this.boundHandlers.click);
    this.canvas.addEventListener('dblclick', this.boundHandlers.dblclick);
    this.canvas.addEventListener('contextmenu', this.boundHandlers.contextmenu);
    this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.addEventListener('mouseleave', this.boundHandlers.mouseleave);
    
    // Drag and drop from palette
    this.canvas.addEventListener('dragover', this.boundHandlers.dragover);
    
    this.canvas.addEventListener('drop', this.boundHandlers.drop);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.boundHandlers.keydown);
  }

  /**
   * Get current canvas dimensions for normalization.
   */
  getNormalizationOptions() {
    return {
      canvasWidth: this.canvas.offsetWidth || this.canvas.width || 1000,
      canvasHeight: this.canvas.offsetHeight || this.canvas.height || 500,
    };
  }

  /**
   * Handle canvas click
   */
  handleClick(e) {
    if (this.options.isPanning?.()) return;
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const viewX = e.clientX - rect.left;
    const viewY = e.clientY - rect.top;
    const { x, y } = this.toWorldCoordinates(viewX, viewY);
    
    switch (this.mode) {
      case 'addNode':
        if (this.pendingDevice) {
          this.addNode(x, y, this.pendingDevice);
        }
        break;
        
      case 'addLink':
        this.handleLinkClick(x, y);
        break;

      case 'hand':
        break;
        
      case 'delete':
        this.handleDeleteClick(x, y);
        break;
        
      case 'select':
      default:
        this.handleSelectClick(x, y, e.shiftKey);
        break;
    }
  }

  /**
   * Handle select mode click
   */
  handleSelectClick(x, y, addToSelection) {
    const node = this.renderer.findNodeAt(x, y);
    
    if (node) {
      this.selectedLinks.clear();
      if (addToSelection) {
        if (this.selectedNodes.has(node.id)) {
          this.selectedNodes.delete(node.id);
        } else {
          this.selectedNodes.add(node.id);
        }
      } else {
        this.selectedNodes.clear();
        this.selectedNodes.add(node.id);
      }
      
      this.renderer.selectNode(node.id);
      
      if (this.options.onNodeSelect) {
        this.options.onNodeSelect(node);
      }
      if (this.options.onLinkSelect) {
        this.options.onLinkSelect(null);
      }
      return;
    }

    const link = this.findLinkAt(x, y);
    if (link) {
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      this.selectedLinks.add(link.id);
      this.renderer.selectLink(link.id);
      if (this.options.onNodeSelect) {
        this.options.onNodeSelect(null);
      }
      if (this.options.onLinkSelect) {
        this.options.onLinkSelect(link);
      }
      return;
    }

    if (!addToSelection) {
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      this.renderer.selectNode(null);
      if (this.options.onNodeSelect) {
        this.options.onNodeSelect(null);
      }
      if (this.options.onLinkSelect) {
        this.options.onLinkSelect(null);
      }
    }
  }

  /**
   * Start node drag (select mode only).
   */
  handleMouseDown(e) {
    if (this.mode !== 'select') return;
    if (this.options.isPanning?.()) return;
    if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.metaKey) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewX = e.clientX - rect.left;
    const viewY = e.clientY - rect.top;
    const { x, y } = this.toWorldCoordinates(viewX, viewY);
    const node = this.renderer.findNodeAt(x, y);
    if (!node) return;

    this.dragState = {
      nodeId: node.id,
      startX: x,
      startY: y,
      startViewX: viewX,
      startViewY: viewY,
      lastX: x,
      lastY: y,
      lastViewX: viewX,
      lastViewY: viewY,
      moved: false,
    };
    this.canvas.style.cursor = 'grabbing';
  }

  /**
   * Continue node drag or show hover cursor.
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const viewX = e.clientX - rect.left;
    const viewY = e.clientY - rect.top;
    const { x, y } = this.toWorldCoordinates(viewX, viewY);

    if (!this.dragState) {
      // Hover cursor feedback in select mode
      if (this.mode === 'select') {
        if (this.options.isPanning?.()) {
          this.canvas.style.cursor = 'grabbing';
          return;
        }
        const hoverNode = this.renderer.findNodeAt(x, y);
        this.canvas.style.cursor = hoverNode ? 'grab' : 'default';
      }
      return;
    }

    const screenDx = viewX - this.dragState.startViewX;
    const screenDy = viewY - this.dragState.startViewY;
    if (!this.dragState.moved && Math.hypot(screenDx, screenDy) < 4) {
      return;
    }

    this.dragState.moved = true;
    this.dragState.lastX = x;
    this.dragState.lastY = y;
    this.dragState.lastViewX = viewX;
    this.dragState.lastViewY = viewY;
    this.updateNodePositionLive(this.dragState.nodeId, x, y);
  }

  /**
   * Finish node drag.
   */
  handleMouseUp() {
    if (!this.dragState) return;

    const { nodeId, moved, lastX, lastY } = this.dragState;
    this.dragState = null;

    if (moved) {
      // Optional snap to grid when drag ends.
      if (this.options.snapToGrid) {
        const snappedX = Math.round(lastX / this.options.gridSize) * this.options.gridSize;
        const snappedY = Math.round(lastY / this.options.gridSize) * this.options.gridSize;
        this.updateNodePositionLive(nodeId, snappedX, snappedY);
      }

      this.saveState();
      this.emitChange();
      this.suppressNextClick = true;
    }

    this.updateCursor();
  }

  /**
   * Update node position in editor + renderer without committing history.
   */
  updateNodePositionLive(nodeId, x, y) {
    const node = this.nodes.find((entry) => entry.id === nodeId);
    if (!node) return;

    const width = this.canvas.offsetWidth || this.canvas.width || 1;
    const height = this.canvas.offsetHeight || this.canvas.height || 1;
    const clampedX = Math.min(width, Math.max(0, x));
    const clampedY = Math.min(height, Math.max(0, y));

    node.x = clampedX;
    node.y = clampedY;
    node.position = {
      x: clampedX / width,
      y: clampedY / height,
    };

    this.updateRenderer();

    if (this.renderer.selectedNode === nodeId && this.options.onNodeSelect) {
      this.options.onNodeSelect(node);
    }
  }

  /**
   * Handle link mode click
   */
  handleLinkClick(x, y) {
    const node = this.renderer.findNodeAt(x, y);
    
    if (!node) {
      this.pendingLink = null;
      this.options.onLinkStageChange?.({ stage: 'idle' });
      return;
    }
    
    if (!this.pendingLink) {
      // First node selected
      this.pendingLink = { source: node.id };
      this.selectedNodes.clear();
      this.selectedNodes.add(node.id);
      this.renderer.selectNode(node.id);
      this.options.onLinkStageChange?.({ stage: 'source', sourceId: node.id });
    } else {
      // Second node selected - create link
      let createdLink = null;
      if (this.pendingLink.source !== node.id) {
        createdLink = this.addLink(this.pendingLink.source, node.id);
      }
      this.pendingLink = null;
      this.selectedNodes.clear();
      this.renderer.selectNode(null);
      if (createdLink) {
        this.options.onLinkStageChange?.({
          stage: 'created',
          sourceId: createdLink.source,
          targetId: createdLink.target,
          linkId: createdLink.id,
        });
      } else {
        this.options.onLinkStageChange?.({ stage: 'idle' });
      }
    }
  }

  /**
   * Handle delete mode click
   */
  handleDeleteClick(x, y) {
    const node = this.renderer.findNodeAt(x, y);
    
    if (node) {
      this.deleteNode(node.id);
      return;
    }

    const link = this.findLinkAt(x, y);
    if (link) {
      this.deleteLink(link.id);
    }
  }

  /**
   * Handle double click (edit node)
   */
  handleDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const viewX = e.clientX - rect.left;
    const viewY = e.clientY - rect.top;
    const { x, y } = this.toWorldCoordinates(viewX, viewY);
    const node = this.renderer.findNodeAt(x, y);
    
    if (node && this.options.onNodeEdit) {
      this.options.onNodeEdit(node);
    }
  }

  /**
   * Handle context menu
   */
  handleContextMenu(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const viewX = e.clientX - rect.left;
    const viewY = e.clientY - rect.top;
    const { x, y } = this.toWorldCoordinates(viewX, viewY);
    
    // Show context menu (implement in UI)
    if (this.options.onContextMenu) {
      this.options.onContextMenu({ x: e.clientX, y: e.clientY, canvasX: x, canvasY: y });
    }
  }

  /**
   * Handle drop from palette
   */
  handleDrop(e) {
    e.preventDefault();
    const deviceType = (
      e.dataTransfer.getData('device') ||
      e.dataTransfer.getData('application/x-network-device') ||
      e.dataTransfer.getData('text/plain')
    ).trim();
    
    if (deviceType && DEVICE_CONFIG[deviceType]) {
      const rect = this.canvas.getBoundingClientRect();
      const viewX = e.clientX - rect.left;
      const viewY = e.clientY - rect.top;
      const { x, y } = this.toWorldCoordinates(viewX, viewY);
      this.addNode(x, y, deviceType);
      this.updateCursor();
    }
  }

  /**
   * Find link near a point for selection/deletion operations.
   */
  findLinkAt(x, y, threshold = null) {
    let hit = null;
    const scale = this.renderer?.transform?.scale || 1;
    const worldThreshold = Number.isFinite(threshold)
      ? threshold
      : Math.max(8, 14 / Math.max(scale, 0.1));

    this.links.forEach((link) => {
      if (hit) return;
      const source = this.renderer.nodeMap.get(link.source);
      const target = this.renderer.nodeMap.get(link.target);
      if (!source || !target) return;
      const control = this.renderer.getControlPoint(link, source, target);
      if (this.distanceToCurve(x, y, source, control, target) <= worldThreshold) {
        hit = link;
      }
    });

    return hit;
  }

  /**
   * Approximate shortest distance from a point to a quadratic Bezier curve.
   */
  distanceToCurve(px, py, p0, p1, p2, steps = 24) {
    let minDistSq = Number.POSITIVE_INFINITY;

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const inv = 1 - t;
      const x = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
      const y = inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y;
      const dx = px - x;
      const dy = py - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) minDistSq = distSq;
    }

    return Math.sqrt(minDistSq);
  }

  /**
   * Convert viewport canvas coordinates to world coordinates
   */
  toWorldCoordinates(x, y) {
    const transform = this.renderer?.transform;
    if (!transform) {
      return { x, y };
    }

    return {
      x: (x - transform.offsetX) / transform.scale,
      y: (y - transform.offsetY) / transform.scale,
    };
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeydown(e) {
    // Only process if canvas is focused or no input is focused
    const target = e.target;
    const tagName = target?.tagName?.toLowerCase?.() || '';
    const isEditable = (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target?.isContentEditable
    );
    if (isEditable) return;
    
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          e.shiftKey ? this.redo() : this.undo();
          break;
        case 'y':
          e.preventDefault();
          this.redo();
          break;
        case 'a':
          e.preventDefault();
          this.selectAll();
          break;
      }
    } else {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          this.deleteSelected();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.nudgeSelectedNodes(0, e.shiftKey ? -this.options.gridSize : -10);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.nudgeSelectedNodes(0, e.shiftKey ? this.options.gridSize : 10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.nudgeSelectedNodes(e.shiftKey ? -this.options.gridSize : -10, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nudgeSelectedNodes(e.shiftKey ? this.options.gridSize : 10, 0);
          break;
        case 'Escape':
          this.setMode('select');
          this.resetSelection();
          break;
        case 'v':
          this.setMode('select');
          break;
        case 'n':
          this.setMode('addNode');
          break;
        case 'l':
          this.setMode('addLink');
          break;
        case 'h':
          this.setMode('hand');
          break;
      }
    }
  }

  /**
   * Add a new node
   */
  addNode(x, y, deviceType) {
    const config = DEVICE_CONFIG[deviceType] || DEVICE_CONFIG.switch;
    
    // Snap to grid
    if (this.options.snapToGrid) {
      x = Math.round(x / this.options.gridSize) * this.options.gridSize;
      y = Math.round(y / this.options.gridSize) * this.options.gridSize;
    }
    
    const rawNode = {
      id: `node-${this.nodeIdCounter++}`,
      label: `${config.label}-${this.nodeIdCounter - 1}`,
      type: deviceType,
      position: { x: x / this.canvas.offsetWidth, y: y / this.canvas.offsetHeight },
      x,
      y,
      load: 0.35,
      status: 'healthy',
    };
    const node = normalizeNode(rawNode, this.nodes.length, this.getNormalizationOptions());
    this.lastDeviceType = deviceType;
    
    this.nodes.push(node);
    this.saveState();
    this.updateRenderer();
    
    if (this.options.onNodeAdd) {
      this.options.onNodeAdd(node);
    }
    
    this.emitChange();
    return node;
  }

  /**
   * Add a new link
   */
  addLink(sourceId, targetId, type = 'ethernet') {
    // Check if link already exists
    const exists = this.links.some(l => 
      (l.source === sourceId && l.target === targetId) ||
      (l.source === targetId && l.target === sourceId)
    );
    
    if (exists) return null;
    
    const link = normalizeLink({
      id: `link-${this.linkIdCounter++}`,
      source: sourceId,
      target: targetId,
      type,
    }, this.links.length, new Set(this.nodes.map((node) => node.id)));
    
    if (!link) return null;
    
    this.links.push(link);
    this.saveState();
    this.updateRenderer();
    
    if (this.options.onLinkAdd) {
      this.options.onLinkAdd(link);
    }
    
    this.emitChange();
    return link;
  }

  /**
   * Delete a node and its connected links
   */
  deleteNode(nodeId) {
    const shouldClearSelection = this.selectedNodes.has(nodeId) || this.renderer.selectedNode === nodeId;
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.links = this.links.filter(l => l.source !== nodeId && l.target !== nodeId);
    this.selectedNodes.delete(nodeId);
    if (shouldClearSelection) {
      this.resetSelection();
    }
    
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Delete a link
   */
  deleteLink(linkId) {
    const shouldClearSelection = this.selectedLinks.has(linkId) || this.renderer.selectedLink === linkId;
    this.links = this.links.filter(l => l.id !== linkId);
    this.selectedLinks.delete(linkId);
    if (shouldClearSelection) {
      this.resetSelection();
    }
    
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Delete all selected items
   */
  deleteSelected() {
    if (this.selectedNodes.size === 0 && this.selectedLinks.size === 0) return;

    this.selectedNodes.forEach(nodeId => {
      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      this.links = this.links.filter(l => l.source !== nodeId && l.target !== nodeId);
    });

    this.selectedLinks.forEach(linkId => {
      this.links = this.links.filter((link) => link.id !== linkId);
    });
    
    this.resetSelection();
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Move all selected nodes by delta (in world coordinates).
   */
  nudgeSelectedNodes(dx, dy) {
    if (this.selectedNodes.size === 0) return false;
    const width = this.canvas.offsetWidth || this.canvas.width || 1;
    const height = this.canvas.offsetHeight || this.canvas.height || 1;
    let movedAny = false;

    this.selectedNodes.forEach((nodeId) => {
      const node = this.nodes.find((entry) => entry.id === nodeId);
      if (!node) return;

      const nextX = Math.min(width, Math.max(0, node.x + dx));
      const nextY = Math.min(height, Math.max(0, node.y + dy));
      if (nextX === node.x && nextY === node.y) return;

      movedAny = true;
      node.x = nextX;
      node.y = nextY;
      node.position = {
        x: nextX / width,
        y: nextY / height,
      };
    });

    if (!movedAny) return false;
    this.saveState();
    this.updateRenderer();

    if (this.selectedNodes.size === 1 && this.options.onNodeSelect) {
      const [nodeId] = this.selectedNodes;
      const node = this.nodes.find((entry) => entry.id === nodeId);
      this.options.onNodeSelect(node || null);
    }

    this.emitChange();
    return true;
  }

  /**
   * Clear all selections and notify panels.
   */
  resetSelection(notify = true) {
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.renderer.selectNode(null);
    if (notify) {
      this.options.onNodeSelect?.(null);
      this.options.onLinkSelect?.(null);
    }
  }

  /**
   * Select all nodes
   */
  selectAll() {
    this.selectedNodes.clear();
    this.nodes.forEach(n => this.selectedNodes.add(n.id));
    this.selectedLinks.clear();
    this.renderer.selectNode(null);
    this.options.onLinkSelect?.(null);
    this.options.onNodeSelect?.(null);
  }

  /**
   * Update node properties
   */
  updateNode(nodeId, updates) {
    const index = this.nodes.findIndex((node) => node.id === nodeId);
    if (index < 0) return;

    const mergedNode = { ...this.nodes[index], ...updates };
    const normalized = normalizeNode(mergedNode, index, this.getNormalizationOptions());
    normalized.id = this.nodes[index].id;
    this.nodes[index] = normalized;

    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Update link properties
   */
  updateLink(linkId, updates) {
    const index = this.links.findIndex((link) => link.id === linkId);
    if (index < 0) return;

    const mergedLink = { ...this.links[index], ...updates };
    const normalized = normalizeLink(
      mergedLink,
      index,
      new Set(this.nodes.map((node) => node.id))
    );
    if (!normalized) return;

    normalized.id = this.links[index].id;
    this.links[index] = normalized;

    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Update renderer with current topology
   */
  updateRenderer() {
    this.renderer.setTopology({ nodes: this.nodes, links: this.links });
  }

  /**
   * Save state for undo
   */
  saveState() {
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      links: JSON.parse(JSON.stringify(this.links)),
    };

    // Remove any redo states
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add current state
    this.history.push(snapshot);
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex = this.history.length - 1;
      return;
    }
    
    this.historyIndex++;
  }

  /**
   * Undo last action
   */
  undo() {
    if (this.historyIndex <= 0) return;

    this.historyIndex--;
    const state = this.history[this.historyIndex];
    this.nodes = JSON.parse(JSON.stringify(state.nodes));
    this.links = JSON.parse(JSON.stringify(state.links));
    this.resetSelection();
    
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Redo last undone action
   */
  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    
    this.historyIndex++;
    const state = this.history[this.historyIndex];
    this.nodes = JSON.parse(JSON.stringify(state.nodes));
    this.links = JSON.parse(JSON.stringify(state.links));
    this.resetSelection();
    
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Get current topology
   */
  getTopology() {
    return {
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      links: JSON.parse(JSON.stringify(this.links)),
    };
  }

  /**
   * Get current topology in serializable schema form.
   */
  getSerializableTopology() {
    return serializeTopology(this.getTopology());
  }

  /**
   * Load topology
   */
  loadTopology(topology) {
    const normalized = normalizeTopology(topology, this.getNormalizationOptions());
    this.nodes = normalized.nodes;
    this.links = normalized.links;
    this.resetSelection();
    
    // Update counters
    this.nodeIdCounter = this.getNextCounter(this.nodes, 'node');
    this.linkIdCounter = this.getNextCounter(this.links, 'link');

    if (normalized.warnings.length > 0) {
      console.warn('[TopologyEditor] Topology normalization warnings:', normalized.warnings);
    }
    
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Clear topology
   */
  clear() {
    this.nodes = [];
    this.links = [];
    this.resetSelection();
    this.nodeIdCounter = 1;
    this.linkIdCounter = 1;
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Compute next numeric id counter based on existing items.
   */
  getNextCounter(items, prefix) {
    let maxSuffix = 0;
    items.forEach((item) => {
      const rawId = String(item.id || '');
      const directMatch = rawId.match(new RegExp(`^${prefix}-(\\d+)$`));
      const trailingMatch = rawId.match(/(\d+)(?!.*\d)/);
      const token = directMatch?.[1] || trailingMatch?.[1];
      const numeric = Number.parseInt(token, 10);
      if (Number.isFinite(numeric)) {
        maxSuffix = Math.max(maxSuffix, numeric);
      }
    });
    return Math.max(items.length + 1, maxSuffix + 1);
  }

  /**
   * Emit topology change event
   */
  emitChange() {
    if (this.options.onTopologyChange) {
      this.options.onTopologyChange(this.getTopology());
    }
  }

  /**
   * Export topology as JSON
   */
  exportJSON() {
    const data = this.getSerializableTopology();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = 'network-topology.json';
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import topology from JSON file
   */
  importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const topology = JSON.parse(e.target.result);
        this.loadTopology(topology);
      } catch (err) {
        console.error('Failed to parse topology file:', err);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners
    this.canvas.removeEventListener('click', this.boundHandlers.click);
    this.canvas.removeEventListener('dblclick', this.boundHandlers.dblclick);
    this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
    this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.removeEventListener('mouseleave', this.boundHandlers.mouseleave);
    this.canvas.removeEventListener('dragover', this.boundHandlers.dragover);
    this.canvas.removeEventListener('drop', this.boundHandlers.drop);
    document.removeEventListener('keydown', this.boundHandlers.keydown);
  }
}

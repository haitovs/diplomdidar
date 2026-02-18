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
      onLinkAdd: null,
      onTopologyChange: null,
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

    this.boundHandlers = {
      click: (e) => this.handleClick(e),
      dblclick: (e) => this.handleDoubleClick(e),
      contextmenu: (e) => this.handleContextMenu(e),
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
    this.mode = mode;
    this.pendingDevice = null;
    this.pendingLink = null;
    this.updateCursor();
  }

  /**
   * Set device to add
   */
  setPendingDevice(deviceType) {
    this.mode = 'addNode';
    this.pendingDevice = deviceType;
    this.updateCursor();
  }

  /**
   * Update cursor based on mode
   */
  updateCursor() {
    const cursors = {
      select: 'default',
      addNode: 'crosshair',
      addLink: 'crosshair',
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
    } else if (!addToSelection) {
      this.selectedNodes.clear();
      this.renderer.selectNode(null);
    }
  }

  /**
   * Handle link mode click
   */
  handleLinkClick(x, y) {
    const node = this.renderer.findNodeAt(x, y);
    
    if (!node) {
      this.pendingLink = null;
      return;
    }
    
    if (!this.pendingLink) {
      // First node selected
      this.pendingLink = { source: node.id };
      this.selectedNodes.clear();
      this.selectedNodes.add(node.id);
      this.renderer.selectNode(node.id);
    } else {
      // Second node selected - create link
      if (this.pendingLink.source !== node.id) {
        this.addLink(this.pendingLink.source, node.id);
      }
      this.pendingLink = null;
      this.selectedNodes.clear();
      this.renderer.selectNode(null);
    }
  }

  /**
   * Handle delete mode click
   */
  handleDeleteClick(x, y) {
    const node = this.renderer.findNodeAt(x, y);
    
    if (node) {
      this.deleteNode(node.id);
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
    const deviceType = e.dataTransfer.getData('device');
    
    if (deviceType) {
      const rect = this.canvas.getBoundingClientRect();
      const viewX = e.clientX - rect.left;
      const viewY = e.clientY - rect.top;
      const { x, y } = this.toWorldCoordinates(viewX, viewY);
      this.addNode(x, y, deviceType);
    }
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
    const tagName = e.target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') return;
    
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
        case 'Escape':
          this.setMode('select');
          this.selectedNodes.clear();
          this.renderer.selectNode(null);
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
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.links = this.links.filter(l => l.source !== nodeId && l.target !== nodeId);
    this.selectedNodes.delete(nodeId);
    
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Delete a link
   */
  deleteLink(linkId) {
    this.links = this.links.filter(l => l.id !== linkId);
    this.selectedLinks.delete(linkId);
    
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Delete all selected items
   */
  deleteSelected() {
    if (this.selectedNodes.size === 0) return;

    this.selectedNodes.forEach(nodeId => {
      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      this.links = this.links.filter(l => l.source !== nodeId && l.target !== nodeId);
    });
    
    this.selectedNodes.clear();
    this.saveState();
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Select all nodes
   */
  selectAll() {
    this.selectedNodes.clear();
    this.nodes.forEach(n => this.selectedNodes.add(n.id));
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
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.renderer.selectNode(null);
    
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
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.renderer.selectNode(null);
    
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
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.renderer.selectNode(null);
    
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
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.renderer.selectNode(null);
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
    this.canvas.removeEventListener('dragover', this.boundHandlers.dragover);
    this.canvas.removeEventListener('drop', this.boundHandlers.drop);
    document.removeEventListener('keydown', this.boundHandlers.keydown);
  }
}

/**
 * Topology Editor
 * Main editor component for creating and modifying network topologies
 */

import { DEVICE_CONFIG } from '../rendering/NodeRenderer.js';

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
    
    this.setupEventListeners();
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
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    
    // Drag and drop from palette
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    this.canvas.addEventListener('drop', (e) => this.handleDrop(e));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  /**
   * Handle canvas click
   */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.addNode(x, y, deviceType);
    }
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
    
    const node = {
      id: `node-${this.nodeIdCounter++}`,
      label: `${config.label}-${this.nodeIdCounter - 1}`,
      type: deviceType,
      position: { x: x / this.canvas.offsetWidth, y: y / this.canvas.offsetHeight },
      x,
      y,
      load: 0.3 + Math.random() * 0.4,
      displayLoad: 0.5,
      targetLoad: 0.5,
    };
    
    this.saveState();
    this.nodes.push(node);
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
    
    const link = {
      id: `link-${this.linkIdCounter++}`,
      source: sourceId,
      target: targetId,
      type,
      bandwidth: 1000,
    };
    
    this.saveState();
    this.links.push(link);
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
    this.saveState();
    
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.links = this.links.filter(l => l.source !== nodeId && l.target !== nodeId);
    this.selectedNodes.delete(nodeId);
    
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Delete a link
   */
  deleteLink(linkId) {
    this.saveState();
    
    this.links = this.links.filter(l => l.id !== linkId);
    this.selectedLinks.delete(linkId);
    
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Delete all selected items
   */
  deleteSelected() {
    if (this.selectedNodes.size === 0) return;
    
    this.saveState();
    
    this.selectedNodes.forEach(nodeId => {
      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      this.links = this.links.filter(l => l.source !== nodeId && l.target !== nodeId);
    });
    
    this.selectedNodes.clear();
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
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    this.saveState();
    Object.assign(node, updates);
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
    // Remove any redo states
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add current state
    this.history.push({
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      links: JSON.parse(JSON.stringify(this.links)),
    });
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    this.historyIndex = this.history.length - 1;
  }

  /**
   * Undo last action
   */
  undo() {
    if (this.historyIndex < 0) return;
    
    const state = this.history[this.historyIndex];
    this.nodes = JSON.parse(JSON.stringify(state.nodes));
    this.links = JSON.parse(JSON.stringify(state.links));
    this.historyIndex--;
    
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
   * Load topology
   */
  loadTopology(topology) {
    this.saveState();
    
    this.nodes = (topology.nodes || []).map((node, i) => ({
      ...node,
      id: node.id || `node-${i + 1}`,
    }));
    
    this.links = (topology.links || []).map((link, i) => ({
      ...link,
      id: link.id || `link-${i + 1}`,
    }));
    
    // Update counters
    this.nodeIdCounter = this.nodes.length + 1;
    this.linkIdCounter = this.links.length + 1;
    
    this.updateRenderer();
    this.emitChange();
  }

  /**
   * Clear topology
   */
  clear() {
    this.saveState();
    this.nodes = [];
    this.links = [];
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.updateRenderer();
    this.emitChange();
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
    const data = this.getTopology();
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
    document.removeEventListener('keydown', this.handleKeydown);
  }
}

import { TopologyEditor } from '../src/playground/TopologyEditor.js';

class MockEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
  }

  removeEventListener(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }

  listenerCount(event) {
    return this.listeners.get(event)?.size || 0;
  }
}

class MockCanvas extends MockEventTarget {
  constructor() {
    super();
    this.style = {};
    this.offsetWidth = 1000;
    this.offsetHeight = 500;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1000, height: 500 };
  }
}

class MockRenderer {
  constructor() {
    this.nodes = [];
    this.links = [];
    this.selectedNode = null;
    this.transform = null;
  }

  setTopology(topology) {
    this.nodes = topology.nodes;
    this.links = topology.links;
  }

  selectNode(nodeId) {
    this.selectedNode = nodeId;
  }

  findNodeAt(x, y) {
    return this.nodes.find((node) => Math.abs(node.x - x) <= 16 && Math.abs(node.y - y) <= 16) || null;
  }
}

const mockDocument = new MockEventTarget();
let anchorClicked = false;
globalThis.document = {
  addEventListener: mockDocument.addEventListener.bind(mockDocument),
  removeEventListener: mockDocument.removeEventListener.bind(mockDocument),
  createElement: (tag) => {
    if (tag !== 'a') return {};
    return {
      download: '',
      href: '',
      click() {
        anchorClicked = true;
      },
    };
  },
};
globalThis.URL = {
  createObjectURL: () => 'blob:mock',
  revokeObjectURL: () => {},
};
globalThis.FileReader = class {
  constructor() {
    this.onload = null;
  }

  readAsText(file) {
    if (this.onload) {
      this.onload({ target: { result: file.__content } });
    }
  }
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const canvas = new MockCanvas();
const renderer = new MockRenderer();
let mockPanning = false;
let lastNodeSelect = 'unset';
let lastLinkSelect = 'unset';
const editor = new TopologyEditor(canvas, renderer, {
  isPanning: () => mockPanning,
  onNodeSelect: (node) => {
    lastNodeSelect = node;
  },
  onLinkSelect: (link) => {
    lastLinkSelect = link;
  },
});

check(editor.history.length === 1, 'Expected initial history snapshot');
check(editor.historyIndex === 0, 'Expected initial history index = 0');

const firstNode = editor.addNode(100, 120, 'switch');
check(editor.nodes.length === 1, 'Expected 1 node after first add');

editor.undo();
check(editor.nodes.length === 0, 'Expected undo to remove first node');

editor.redo();
check(editor.nodes.length === 1, 'Expected redo to restore first node');

const secondNode = editor.addNode(320, 140, 'router');
check(editor.nodes.length === 2, 'Expected 2 nodes after second add');

editor.addLink(firstNode.id, secondNode.id);
check(editor.links.length === 1, 'Expected 1 link after addLink');

editor.undo();
check(editor.links.length === 0, 'Expected undo to remove link');
check(editor.nodes.length === 2, 'Expected undo of link to keep both nodes');

editor.undo();
check(editor.nodes.length === 1, 'Expected second undo to remove second node');

editor.redo();
editor.redo();
check(editor.nodes.length === 2, 'Expected redo to restore second node');
check(editor.links.length === 1, 'Expected redo to restore link');

editor.clear();
check(editor.nodes.length === 0 && editor.links.length === 0, 'Expected clear to remove topology');

editor.undo();
check(editor.nodes.length === 2, 'Expected undo(clear) to restore nodes');
check(editor.links.length === 1, 'Expected undo(clear) to restore links');

renderer.transform = { scale: 2, offsetX: 100, offsetY: 50 };
const world = editor.toWorldCoordinates(300, 250);
check(world.x === 100 && world.y === 100, 'Expected transform-aware world coordinates');

editor.setPendingDevice('switch');
editor.handleClick({ clientX: 300, clientY: 250, shiftKey: false });
const transformedAddNode = editor.nodes[editor.nodes.length - 1];
check(transformedAddNode.x === 120 && transformedAddNode.y === 120, 'Expected addNode via transformed click to use world coordinates');

const countBeforePanningClick = editor.nodes.length;
mockPanning = true;
editor.handleClick({ clientX: 300, clientY: 250, shiftKey: false });
mockPanning = false;
check(editor.nodes.length === countBeforePanningClick, 'Expected click to be ignored while panning');

editor.setMode('select');
editor.handleMouseDown({ button: 0, shiftKey: false, ctrlKey: true, metaKey: false, clientX: 300, clientY: 250 });
check(editor.dragState === null, 'Expected ctrl+mousedown to skip node drag start');

const modeBeforeDrop = editor.mode;
editor.handleDrop({
  preventDefault() {},
  clientX: 350,
  clientY: 260,
  dataTransfer: {
    getData(type) {
      if (type === 'device') return 'router';
      return '';
    },
  },
});
check(editor.mode === modeBeforeDrop, 'Expected drop-add not to force add-node mode');

anchorClicked = false;
editor.exportJSON();
check(anchorClicked, 'Expected exportJSON to trigger anchor click');

editor.importJSON({
  __content: JSON.stringify({
    nodes: [{ id: 'imported-1', label: 'Imported Node', type: 'switch', position: { x: 0.25, y: 0.25 } }],
    links: [],
  }),
});
check(editor.nodes.length === 1, 'Expected importJSON to load provided topology');
check(editor.nodes[0].id === 'imported-1', 'Expected imported node id to match source');

editor.setMode('select');
editor.handleSelectClick(editor.nodes[0].x, editor.nodes[0].y, false);
const nodeBeforeNudgeX = editor.nodes[0].x;
const nudgePrevented = { value: false };
editor.handleKeydown({
  key: 'ArrowRight',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  target: { tagName: 'DIV' },
  preventDefault() {
    nudgePrevented.value = true;
  },
});
const nodeAfterNudgeX = editor.nodes[0].x;
check(nudgePrevented.value, 'Expected ArrowRight to prevent default while nudging');
check(nodeAfterNudgeX === nodeBeforeNudgeX + 10, 'Expected ArrowRight to nudge selected node by 10px');

editor.handleKeydown({
  key: 'ArrowRight',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  target: { tagName: 'SELECT' },
  preventDefault() {},
});
check(editor.nodes[0].x === nodeAfterNudgeX, 'Expected shortcuts ignored when a select field is focused');

editor.setMode('select');
editor.handleSelectClick(editor.nodes[0].x, editor.nodes[0].y, false);
editor.deleteSelected();
check(editor.nodes.length === 0, 'Expected deleteSelected to remove selected imported node');
check(lastNodeSelect === null, 'Expected deleteSelected to clear node selection callback');
check(lastLinkSelect === null, 'Expected deleteSelected to clear link selection callback');

editor.setSnapToGrid(false);
const unsnappedNode = editor.addNode(123, 157, 'switch');
check(unsnappedNode.x === 123 && unsnappedNode.y === 157, 'Expected snap toggle off to preserve raw addNode coordinates');

check(mockDocument.listenerCount('keydown') === 1, 'Expected keydown listener before destroy');
editor.destroy();
check(mockDocument.listenerCount('keydown') === 0, 'Expected keydown listener removed on destroy');
check(canvas.listenerCount('click') === 0, 'Expected click listener removed on destroy');
check(canvas.listenerCount('dblclick') === 0, 'Expected dblclick listener removed on destroy');
check(canvas.listenerCount('contextmenu') === 0, 'Expected contextmenu listener removed on destroy');
check(canvas.listenerCount('dragover') === 0, 'Expected dragover listener removed on destroy');
check(canvas.listenerCount('drop') === 0, 'Expected drop listener removed on destroy');

if (failures.length > 0) {
  console.error('smoke-editor: FAILED');
  failures.forEach((msg) => console.error(`- ${msg}`));
  process.exit(1);
}

console.log('smoke-editor: PASSED');

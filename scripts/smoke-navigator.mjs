import { CanvasNavigator } from '../src/rendering/CanvasNavigator.js';

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
    this.width = 1000;
    this.height = 600;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1000, height: 600 };
  }
}

const mockWindow = new MockEventTarget();
mockWindow.devicePixelRatio = 1;
globalThis.window = mockWindow;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const canvas = new MockCanvas();
let panToolActive = false;
const navigator = new CanvasNavigator(canvas, {
  onTransformChange: () => {},
  isPanToolActive: () => panToolActive,
});

check(canvas.listenerCount('wheel') === 1, 'Expected wheel listener to be registered');
check(canvas.listenerCount('mousedown') === 1, 'Expected mousedown listener to be registered');
check(mockWindow.listenerCount('mousemove') === 1, 'Expected window mousemove listener to be registered');
check(mockWindow.listenerCount('keydown') === 1, 'Expected window keydown listener to be registered');

canvas.style.cursor = 'crosshair';
navigator._onMouseDown({
  button: 0,
  ctrlKey: true,
  metaKey: false,
  clientX: 100,
  clientY: 120,
  preventDefault() {},
});
check(navigator.isPanning, 'Expected ctrl+mousedown to start panning');
check(canvas.style.cursor === 'grabbing', 'Expected panning cursor to be grabbing');

navigator._onMouseMove({ clientX: 150, clientY: 160 });
check(navigator.offsetX === 50 && navigator.offsetY === 40, 'Expected panning move to update offsets');

navigator._onMouseUp({});
check(!navigator.isPanning, 'Expected mouseup to stop panning');
check(canvas.style.cursor === 'crosshair', 'Expected cursor to restore after panning');

navigator._onMouseDown({
  button: 0,
  ctrlKey: false,
  metaKey: false,
  clientX: 150,
  clientY: 170,
  preventDefault() {},
});
check(!navigator.isPanning, 'Expected plain left click not to start panning outside pan tool mode');

panToolActive = true;
navigator._onMouseDown({
  button: 0,
  ctrlKey: false,
  metaKey: false,
  clientX: 180,
  clientY: 190,
  preventDefault() {},
});
check(navigator.isPanning, 'Expected pan tool active state to allow left-drag panning');
navigator._onMouseUp({});
panToolActive = false;

let preventedSpaceDefault = false;
navigator._onKeyDown({
  code: 'Space',
  target: { tagName: 'DIV' },
  preventDefault() {
    preventedSpaceDefault = true;
  },
});
navigator._onMouseDown({
  button: 0,
  ctrlKey: false,
  metaKey: false,
  clientX: 200,
  clientY: 220,
  preventDefault() {},
});
check(preventedSpaceDefault, 'Expected space keydown to prevent default scroll behavior');
check(navigator.isPanning, 'Expected Space+drag to start panning');
navigator._onMouseUp({});
navigator._onKeyUp({ code: 'Space' });

navigator._onKeyDown({
  code: 'Space',
  target: { tagName: 'INPUT', isContentEditable: false },
  preventDefault() {},
});
navigator._onMouseDown({
  button: 0,
  ctrlKey: false,
  metaKey: false,
  clientX: 250,
  clientY: 250,
  preventDefault() {},
});
check(!navigator.isPanning, 'Expected focused input to block Space pan activation');
navigator._onKeyUp({ code: 'Space' });

navigator.destroy();
check(canvas.listenerCount('wheel') === 0, 'Expected wheel listener removed on destroy');
check(canvas.listenerCount('mousedown') === 0, 'Expected mousedown listener removed on destroy');
check(mockWindow.listenerCount('mousemove') === 0, 'Expected mousemove listener removed on destroy');
check(mockWindow.listenerCount('keydown') === 0, 'Expected keydown listener removed on destroy');
check(mockWindow.listenerCount('keyup') === 0, 'Expected keyup listener removed on destroy');
check(mockWindow.listenerCount('blur') === 0, 'Expected blur listener removed on destroy');

if (failures.length > 0) {
  console.error('smoke-navigator: FAILED');
  failures.forEach((msg) => console.error(`- ${msg}`));
  process.exit(1);
}

console.log('smoke-navigator: PASSED');

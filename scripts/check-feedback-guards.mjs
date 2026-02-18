import { createLogManager, createToastManager } from '../src/ui/feedback.js';

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this._innerHTML = '';
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  insertBefore(child, referenceNode) {
    child.parentNode = this;
    if (!referenceNode) {
      this.children.push(child);
      return child;
    }

    const idx = this.children.indexOf(referenceNode);
    if (idx < 0) {
      this.children.push(child);
      return child;
    }

    this.children.splice(idx, 0, child);
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  get firstChild() {
    return this.children[0] || null;
  }

  get lastChild() {
    return this.children[this.children.length - 1] || null;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === '') {
      this.children = [];
    }
  }
}

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const createElement = (tag) => new MockElement(tag);

const toastContainer = new MockElement('div');
const scheduled = [];
const toastManager = createToastManager({
  container: toastContainer,
  maxVisible: 3,
  removeDelay: 100,
  schedule: (handler) => {
    scheduled.push(handler);
    return scheduled.length - 1;
  },
  createElement,
});

for (let i = 0; i < 20; i++) {
  toastManager.show(`toast-${i}`, i % 2 === 0 ? 'info' : 'error');
}

check(toastContainer.children.length === 3, 'Expected toast cap to keep only 3 latest toasts');
check(toastContainer.firstChild.innerHTML.includes('toast-17'), 'Expected oldest retained toast to be toast-17');
check(toastContainer.lastChild.innerHTML.includes('toast-19'), 'Expected newest retained toast to be toast-19');

scheduled.forEach((handler) => handler());
check(toastContainer.children.length === 0, 'Expected scheduled removals to clear visible toasts');

for (let i = 0; i < 5; i++) {
  toastManager.show(`clear-${i}`, 'warning');
}
toastManager.clear();
check(toastContainer.children.length === 0, 'Expected toast clear() to remove all toasts');

const logContainer = new MockElement('div');
const logManager = createLogManager({
  container: logContainer,
  maxEntries: 5,
  createElement,
  formatTime: () => '10:00:00',
});

for (let i = 0; i < 20; i++) {
  logManager.add(`entry-${i}`, 'info');
}

check(logContainer.children.length === 5, 'Expected log cap to keep only 5 latest entries');
check(logContainer.firstChild.innerHTML.includes('entry-19'), 'Expected first log entry to be latest message');
check(logContainer.lastChild.innerHTML.includes('entry-15'), 'Expected last log entry to be oldest retained message');

logManager.clear();
check(logContainer.children.length === 0, 'Expected log clear() to remove all entries');

if (failures.length > 0) {
  console.error('check-feedback-guards: FAILED');
  failures.forEach((msg) => console.error(`- ${msg}`));
  process.exit(1);
}

console.log('check-feedback-guards: PASSED');

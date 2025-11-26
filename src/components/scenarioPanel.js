import { scenarios, scenarioOrder } from '../data/simulationData.js';

export class ScenarioPanel {
  constructor({ selectEl, formEl, tagsEl }) {
    this.selectEl = selectEl;
    this.formEl = formEl;
    this.tagsEl = tagsEl;
    this.callback = null;
    this.activeScenario = 'default';
    this.populateOptions();
    this.renderTags();

    this.selectEl.addEventListener('change', () => {
      this.activeScenario = this.selectEl.value;
      this.renderTags();
      this.emit();
    });

    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      this.emit();
    });
    this.formEl.addEventListener('input', () => this.emit());
  }

  populateOptions() {
    this.selectEl.innerHTML = '';
    scenarioOrder.forEach((key) => {
      const meta = scenarios[key];
      if (!meta) return;
      const option = document.createElement('option');
      option.value = key;
      option.textContent = meta.title;
      this.selectEl.appendChild(option);
    });
    this.selectEl.value = this.activeScenario;
  }

  onUpdate(cb) {
    this.callback = cb;
  }

  setScenario(key, { silent = false } = {}) {
    if (!scenarios[key]) return;
    this.activeScenario = key;
    this.selectEl.value = key;
    this.renderTags();
    if (!silent) {
      this.emit();
    }
  }

  getPayload() {
    const scenario = scenarios[this.activeScenario];
    const concurrent = Number(document.getElementById('input-classes').value);
    const labs = Number(document.getElementById('input-labs').value);
    const guest = document.getElementById('input-guest').value;
    const threshold = Number(document.getElementById('input-threshold').value);
    return {
      scenarioKey: this.activeScenario,
      scenario,
      overrides: { concurrent, labs, guest, threshold },
    };
  }

  emit() {
    if (typeof this.callback === 'function') {
      this.callback(this.getPayload());
    }
  }

  renderTags() {
    const meta = scenarios[this.activeScenario];
    if (!meta) return;
    const { tags = [] } = meta;
    this.tagsEl.innerHTML = '';
    tags.forEach((tag) => {
      const li = document.createElement('li');
      li.textContent = tag;
      this.tagsEl.appendChild(li);
    });
  }
}

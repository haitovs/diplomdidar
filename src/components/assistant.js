import { aiInsightLibrary } from '../data/simulationData.js';
import { randomItem } from '../utils/dom.js';

export class AssistantPanel {
  constructor(logEl, formEl, inputEl) {
    this.logEl = logEl;
    this.formEl = formEl;
    this.inputEl = inputEl;
    this.submitBtn = this.formEl.querySelector('button');
    this.context = { scenario: 'Weekday Peak', utilization: 0.6, latency: 12 };
    this.profile = 'campus';
    this.renderSeed();
    this.formEl.addEventListener('submit', (event) => this.handleSubmit(event));
  }

  setProfile(profileKey, label) {
    if (!profileKey || profileKey === this.profile) return;
    this.profile = profileKey;
    const announcement = `Context switched to ${label}. Adapting assistant briefing.`;
    this.addEntry('ai', announcement);
  }

  updateContext(context) {
    if (context.profile && context.profile !== this.profile) {
      this.setProfile(context.profile, context.scenario || 'New scenario');
    }
    this.context = { ...this.context, ...context };
  }

  currentInsights() {
    const bucket = aiInsightLibrary[this.profile] || aiInsightLibrary.campus || [];
    return bucket.length ? bucket : ['Monitoring telemetry...'];
  }

  renderSeed() {
    this.currentInsights()
      .slice(0, 2)
      .forEach((text) => this.addEntry('ai', text));
  }

  handleSubmit(event) {
    event.preventDefault();
    const prompt = this.inputEl.value.trim();
    if (!prompt) return;
    this.addEntry('user', prompt);
    this.inputEl.value = '';
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Synthesizing...';
    setTimeout(() => {
      this.addEntry('ai', this.generateInsight(prompt));
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'Generate Mock Insight';
    }, 900);
  }

  generateInsight(prompt) {
    const hints = randomItem(this.currentInsights());
    const util = Math.round(this.context.utilization * 100);
    const latency = this.context.latency.toFixed(1);
    const template = `Scenario ${this.context.scenario} sits around ${util}% load with ${latency} ms latency.`;
    return `${template} ${hints} Prompt noted: "${prompt.slice(0, 80)}".`;
  }

  addEntry(type, text) {
    const div = document.createElement('div');
    div.className = `assistant-entry ${type}`;
    div.textContent = text;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
}

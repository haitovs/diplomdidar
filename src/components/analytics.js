import { clamp } from '../utils/dom.js';

const waitForChart = () =>
  new Promise((resolve) => {
    if (window.Chart) return resolve(window.Chart);
    const id = setInterval(() => {
      if (window.Chart) {
        clearInterval(id);
        resolve(window.Chart);
      }
    }, 40);
  });

export class AnalyticsPanel {
  constructor(canvas) {
    this.canvas = canvas;
    this.chart = null;
    this.points = Array.from({ length: 12 }, (_, i) => 0.45 + Math.sin(i) * 0.05);
    this.metricEls = {
      utilization: document.getElementById('metric-utilization'),
      latency: document.getElementById('metric-latency'),
      energy: document.getElementById('metric-energy'),
    };
    waitForChart().then(() => this.initChart());
  }

  initChart() {
    this.chart = new window.Chart(this.canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: Array.from({ length: this.points.length }, (_, i) => `${i + 8}:00`),
        datasets: [
          {
            label: 'Aggregate load',
            data: this.points,
            borderColor: '#6c7cff',
            backgroundColor: 'rgba(108, 124, 255, 0.2)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 0,
            max: 1,
            ticks: {
              callback: (value) => `${Math.round(value * 100)}%`,
              color: 'rgba(255,255,255,0.6)',
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.45)' },
            grid: { display: false },
          },
        },
      },
    });
  }

  update(metrics) {
    if (!this.chart) return;
    this.points.push(metrics.utilization);
    if (this.points.length > 16) this.points.shift();
    this.chart.data.datasets[0].data = this.points;
    this.chart.update('none');

    this.metricEls.utilization.textContent = `${Math.round(metrics.utilization * 100)}%`;
    this.metricEls.latency.textContent = `${metrics.latency.toFixed(1)} ms`;
    this.metricEls.energy.textContent = `${metrics.energy.toFixed(1)} kWh`;
  }
}

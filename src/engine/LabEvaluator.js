/**
 * Lab evaluator for scenario objective scoring and pass/fail status.
 */

import { LAB_SCENARIO_ORDER, getScenarioByKey } from './LabScenarios.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatMetric(value, unit = '') {
  if (!Number.isFinite(value)) return 'N/A';

  const precision = Math.abs(value) >= 100 ? 0 : 1;
  const rendered = value.toFixed(precision).replace(/\.0$/, '');
  return unit ? `${rendered}${unit}` : rendered;
}

function compare(value, operator, target) {
  switch (operator) {
    case '<=':
      return value <= target;
    case '>=':
      return value >= target;
    case '==':
      return value === target;
    case '!=':
      return value !== target;
    default:
      return false;
  }
}

function scoreProgress(value, operator, target, passed) {
  if (passed) return 1;

  switch (operator) {
    case '<=':
      if (target <= 0) return value <= 0 ? 1 : 0;
      return clamp(target / Math.max(value, target), 0, 1);
    case '>=':
      if (target <= 0) return 0;
      return clamp(value / target, 0, 1);
    case '==':
      return 0;
    case '!=':
      return 0;
    default:
      return 0;
  }
}

export class LabEvaluator {
  constructor(options = {}) {
    const scenarioKey = options.scenarioKey || LAB_SCENARIO_ORDER[0];
    this.scenario = getScenarioByKey(scenarioKey);
    this.scenarioKey = this.scenario.key;
    this.reset(options.startedAt || Date.now());
  }

  setScenario(scenarioKey) {
    const scenario = getScenarioByKey(scenarioKey);
    this.scenario = scenario;
    this.scenarioKey = scenario.key;
    this.reset(Date.now());
    return scenario;
  }

  getScenario() {
    return this.scenario;
  }

  reset(startedAt = Date.now()) {
    this.startedAt = startedAt;
    this.sampleCount = 0;

    this.events = {
      failure_injected: 0,
      cascade_triggered: 0,
      traffic_spike: 0,
      recover_all: 0,
      recovery: 0,
    };

    this.summary = {
      avgLatency: 0,
      peakLatency: 0,
      avgPacketLoss: 0,
      peakPacketLoss: 0,
      avgUtilization: 0,
      peakUtilization: 0,
      avgThroughput: 0,
      minThroughput: 0,
      peakActiveFailures: 0,
      recoveredAfterFailure: false,
      recoveryTimeSeconds: Number.POSITIVE_INFINITY,
    };

    this.accumulators = {
      latency: 0,
      packetLoss: 0,
      utilization: 0,
      throughput: 0,
    };

    this.failureState = {
      inFailureWindow: false,
      firstFailureAt: null,
      lastFailureAt: null,
      lastRecoveryAt: null,
    };

    this.lastResult = this.buildResult(startedAt);
    return this.lastResult;
  }

  registerEvent(type, payload = {}) {
    if (!(type in this.events)) {
      this.events[type] = 0;
    }
    this.events[type] += 1;
    this.lastEvent = { type, payload, timestamp: Date.now() };
  }

  update({ metrics, activeFailures = [], now = Date.now() } = {}) {
    if (!metrics) {
      return this.lastResult || this.buildResult(now);
    }

    const currentLatency = toNumber(metrics.latency);
    const currentPacketLoss = toNumber(metrics.packetLoss);
    const currentUtilization = toNumber(metrics.utilization);
    const currentThroughput = toNumber(metrics.throughput);
    const activeFailureCount = activeFailures.length;

    this.sampleCount += 1;
    this.accumulators.latency += currentLatency;
    this.accumulators.packetLoss += currentPacketLoss;
    this.accumulators.utilization += currentUtilization;
    this.accumulators.throughput += currentThroughput;

    this.summary.avgLatency = this.accumulators.latency / this.sampleCount;
    this.summary.avgPacketLoss = this.accumulators.packetLoss / this.sampleCount;
    this.summary.avgUtilization = this.accumulators.utilization / this.sampleCount;
    this.summary.avgThroughput = this.accumulators.throughput / this.sampleCount;

    this.summary.peakLatency = Math.max(this.summary.peakLatency, currentLatency);
    this.summary.peakPacketLoss = Math.max(this.summary.peakPacketLoss, currentPacketLoss);
    this.summary.peakUtilization = Math.max(this.summary.peakUtilization, currentUtilization);
    this.summary.minThroughput = this.sampleCount === 1
      ? currentThroughput
      : Math.min(this.summary.minThroughput, currentThroughput);
    this.summary.peakActiveFailures = Math.max(this.summary.peakActiveFailures, activeFailureCount);

    if (activeFailureCount > 0) {
      if (!this.failureState.inFailureWindow) {
        this.failureState.inFailureWindow = true;
        if (!this.failureState.firstFailureAt) {
          this.failureState.firstFailureAt = now;
        }
      }
      this.failureState.lastFailureAt = now;
    } else if (this.failureState.inFailureWindow) {
      this.failureState.inFailureWindow = false;
      this.failureState.lastRecoveryAt = now;
      this.summary.recoveredAfterFailure = true;
      if (this.failureState.firstFailureAt) {
        this.summary.recoveryTimeSeconds = (now - this.failureState.firstFailureAt) / 1000;
      }
    }

    this.lastResult = this.buildResult(now, activeFailureCount, metrics);
    return this.lastResult;
  }

  getMetricValue(metricKey, now, activeFailureCount, metrics) {
    switch (metricKey) {
      case 'current_latency':
        return toNumber(metrics?.latency);
      case 'avg_latency':
        return this.summary.avgLatency;
      case 'peak_latency':
        return this.summary.peakLatency;
      case 'current_packet_loss':
        return toNumber(metrics?.packetLoss);
      case 'avg_packet_loss':
        return this.summary.avgPacketLoss;
      case 'peak_packet_loss':
        return this.summary.peakPacketLoss;
      case 'current_utilization':
        return toNumber(metrics?.utilization);
      case 'avg_utilization':
        return this.summary.avgUtilization;
      case 'peak_utilization':
        return this.summary.peakUtilization;
      case 'current_throughput':
        return toNumber(metrics?.throughput);
      case 'avg_throughput':
        return this.summary.avgThroughput;
      case 'min_throughput':
        return this.summary.minThroughput;
      case 'peak_active_failures':
        return this.summary.peakActiveFailures;
      case 'current_active_failures':
        return activeFailureCount;
      case 'event_failure_injected':
        return toNumber(this.events.failure_injected) + toNumber(this.events.cascade_triggered);
      case 'event_traffic_spike':
        return toNumber(this.events.traffic_spike);
      case 'event_recover_all':
        return toNumber(this.events.recover_all);
      case 'recovered_after_failure':
        return this.summary.recoveredAfterFailure ? 1 : 0;
      case 'recovery_time_seconds':
        return this.summary.recoveryTimeSeconds;
      case 'elapsed_seconds':
        return (now - this.startedAt) / 1000;
      default:
        return 0;
    }
  }

  evaluateObjective(objective, now, activeFailureCount, metrics) {
    const value = this.getMetricValue(objective.metric, now, activeFailureCount, metrics);
    const target = toNumber(objective.target);
    const passed = compare(value, objective.operator, target);
    const progress = scoreProgress(value, objective.operator, target, passed);
    const weight = toNumber(objective.weight, 0);

    return {
      ...objective,
      value,
      passed,
      progress,
      score: weight * progress,
      targetDisplay: formatMetric(target, objective.unit || ''),
      currentDisplay: formatMetric(value, objective.unit || ''),
    };
  }

  buildResult(now, activeFailureCount = 0, metrics = null) {
    const objectives = this.scenario.objectives.map((objective) =>
      this.evaluateObjective(objective, now, activeFailureCount, metrics)
    );

    const totalWeight = objectives.reduce((sum, objective) => sum + toNumber(objective.weight, 0), 0) || 1;
    const rawScore = objectives.reduce((sum, objective) => sum + objective.score, 0);
    const score = clamp((rawScore / totalWeight) * 100, 0, 100);
    const allPassed = objectives.every((objective) => objective.passed);

    const status = allPassed
      ? 'passed'
      : score >= 70
        ? 'in-progress'
        : 'at-risk';

    return {
      scenarioKey: this.scenario.key,
      scenarioLabel: this.scenario.label,
      description: this.scenario.description,
      elapsedSeconds: (now - this.startedAt) / 1000,
      status,
      score,
      objectives,
      summary: {
        ...this.summary,
        currentActiveFailures: activeFailureCount,
      },
      events: { ...this.events },
    };
  }

  getResult() {
    return this.lastResult;
  }
}

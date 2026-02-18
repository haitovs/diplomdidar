/**
 * Scenario definitions for practical training labs.
 */

export const LAB_SCENARIOS = {
  classroom_congestion: {
    key: 'classroom_congestion',
    label: 'Classroom Congestion Control',
    description: 'Keep a classroom network stable during lecture traffic without failures.',
    recommendedPattern: 'classroom',
    objectives: [
      {
        id: 'classroom-util',
        title: 'Keep peak utilization below 82%',
        metric: 'peak_utilization',
        operator: '<=',
        target: 82,
        unit: '%',
        weight: 20,
      },
      {
        id: 'classroom-latency',
        title: 'Keep peak latency below 35 ms',
        metric: 'peak_latency',
        operator: '<=',
        target: 35,
        unit: 'ms',
        weight: 20,
      },
      {
        id: 'classroom-loss',
        title: 'Keep packet loss below 2%',
        metric: 'peak_packet_loss',
        operator: '<=',
        target: 2,
        unit: '%',
        weight: 20,
      },
      {
        id: 'classroom-throughput',
        title: 'Maintain throughput above 1200 Mbps',
        metric: 'avg_throughput',
        operator: '>=',
        target: 1200,
        unit: 'Mbps',
        weight: 20,
      },
      {
        id: 'classroom-failure',
        title: 'Avoid active failures',
        metric: 'peak_active_failures',
        operator: '<=',
        target: 0,
        unit: '',
        weight: 20,
      },
    ],
  },

  core_link_failure: {
    key: 'core_link_failure',
    label: 'Core Link Failure Response',
    description: 'Inject a major failure and restore acceptable network operation quickly.',
    recommendedPattern: 'lab',
    objectives: [
      {
        id: 'core-failure-trigger',
        title: 'Trigger at least one failure event',
        metric: 'event_failure_injected',
        operator: '>=',
        target: 1,
        unit: 'events',
        weight: 15,
      },
      {
        id: 'core-failure-spread',
        title: 'Contain concurrent failures to 3 or less',
        metric: 'peak_active_failures',
        operator: '<=',
        target: 3,
        unit: '',
        weight: 15,
      },
      {
        id: 'core-recovery',
        title: 'Recover from failure state',
        metric: 'recovered_after_failure',
        operator: '>=',
        target: 1,
        unit: '',
        weight: 20,
      },
      {
        id: 'core-recovery-time',
        title: 'Recover in under 45 seconds',
        metric: 'recovery_time_seconds',
        operator: '<=',
        target: 45,
        unit: 's',
        weight: 20,
      },
      {
        id: 'core-latency',
        title: 'Keep peak latency below 60 ms',
        metric: 'peak_latency',
        operator: '<=',
        target: 60,
        unit: 'ms',
        weight: 15,
      },
      {
        id: 'core-loss',
        title: 'Keep packet loss below 8%',
        metric: 'peak_packet_loss',
        operator: '<=',
        target: 8,
        unit: '%',
        weight: 15,
      },
    ],
  },

  exam_spike_resilience: {
    key: 'exam_spike_resilience',
    label: 'Exam Traffic Spike Resilience',
    description: 'Handle exam-period burst traffic while preserving service quality.',
    recommendedPattern: 'exam',
    objectives: [
      {
        id: 'exam-spike',
        title: 'Inject at least one traffic spike',
        metric: 'event_traffic_spike',
        operator: '>=',
        target: 1,
        unit: 'events',
        weight: 15,
      },
      {
        id: 'exam-throughput',
        title: 'Maintain average throughput above 1800 Mbps',
        metric: 'avg_throughput',
        operator: '>=',
        target: 1800,
        unit: 'Mbps',
        weight: 25,
      },
      {
        id: 'exam-util',
        title: 'Keep peak utilization below 92%',
        metric: 'peak_utilization',
        operator: '<=',
        target: 92,
        unit: '%',
        weight: 20,
      },
      {
        id: 'exam-latency',
        title: 'Keep average latency below 45 ms',
        metric: 'avg_latency',
        operator: '<=',
        target: 45,
        unit: 'ms',
        weight: 20,
      },
      {
        id: 'exam-loss',
        title: 'Keep packet loss below 5%',
        metric: 'peak_packet_loss',
        operator: '<=',
        target: 5,
        unit: '%',
        weight: 20,
      },
    ],
  },
};

export const LAB_SCENARIO_ORDER = Object.keys(LAB_SCENARIOS);

const SCENARIO_BY_PATTERN = {
  classroom: 'classroom_congestion',
  lab: 'core_link_failure',
  exam: 'exam_spike_resilience',
  streaming: 'classroom_congestion',
  backup: 'core_link_failure',
  idle: 'classroom_congestion',
  ddos: 'core_link_failure',
};

export function getScenarioByKey(key) {
  return LAB_SCENARIOS[key] || LAB_SCENARIOS.classroom_congestion;
}

export function scenarioForPattern(patternKey) {
  return SCENARIO_BY_PATTERN[patternKey] || 'classroom_congestion';
}

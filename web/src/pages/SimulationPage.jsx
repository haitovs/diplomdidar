import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CanvasRenderer } from '@core/rendering/CanvasRenderer.js';
import { CanvasNavigator } from '@core/rendering/CanvasNavigator.js';
import { MetricsCollector } from '@core/analytics/MetricsCollector.js';
import { SimulationController, TRAFFIC_PATTERNS } from '@core/engine/SimulationController.js';
import { normalizeTopology, serializeTopology } from '@core/utils/topologySchema.js';
import { defaultTopology } from '../data/topologyTemplates.js';
import { preloadDeviceIcons } from '../lib/iconCache.js';
import { STORAGE_KEYS } from '../lib/storage.js';

function buildReport({ metrics, controller, renderer, patternKey }) {
  const state = controller.getState();
  const topology = serializeTopology({ nodes: renderer.nodes, links: renderer.links });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    scenario: patternKey,
    state: {
      time: state.formattedTime,
      speed: state.speed,
      activeFailures: state.activeFailures.length,
      activeFlows: state.runtimeTraffic?.activeFlows || 0,
      droppedDemandMbps: state.runtimeTraffic?.droppedDemandMbps || 0,
    },
    metrics,
    topology,
  };
}

export default function SimulationPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const instancesRef = useRef({});

  const [patternKey, setPatternKey] = useState('classroom');
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [simInfo, setSimInfo] = useState({ time: '00:00', frame: 0, flows: 0, droppedDemandMbps: 0, paused: false, running: false });
  const [metrics, setMetrics] = useState({ throughput: 0, latency: 0, packetLoss: 0, utilization: 0, activeConnections: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas, { showGrid: true });
    const navigator = new CanvasNavigator(canvas, {
      onTransformChange: (transform) => {
        renderer.setTransform(transform);
        setZoom(Math.round(transform.scale * 100));
      },
    });

    const collector = new MetricsCollector();

    const controller = new SimulationController(renderer, {
      onTick: (tick) => {
        const currentMetrics = collector.update({
          nodes: renderer.nodes,
          links: renderer.links,
          particles: renderer.particleSystem.getCount(),
        });

        setSimInfo((prev) => ({
          ...prev,
          time: tick.formattedTime,
          frame: tick.frame,
          flows: tick.activeFlows,
          droppedDemandMbps: tick.droppedDemandMbps,
          paused: controller.getState().isPaused,
          running: controller.isRunning,
        }));

        setMetrics({
          throughput: currentMetrics.throughput,
          latency: currentMetrics.latency,
          packetLoss: currentMetrics.packetLoss,
          utilization: currentMetrics.utilization,
          activeConnections: currentMetrics.activeConnections,
        });
      },
    });

    instancesRef.current = { renderer, navigator, collector, controller };

    const savedTopologyRaw = localStorage.getItem(STORAGE_KEYS.playgroundTopology);
    let topology = defaultTopology;

    if (savedTopologyRaw) {
      try {
        topology = JSON.parse(savedTopologyRaw);
      } catch {
        topology = defaultTopology;
      }
    }

    const normalized = normalizeTopology(topology, {
      canvasWidth: canvas.clientWidth || 1000,
      canvasHeight: canvas.clientHeight || 620,
    });

    preloadDeviceIcons().then((cache) => {
      renderer.setIconCache(cache);
      renderer.setTopology({ nodes: normalized.nodes, links: normalized.links });
      controller.setTrafficPattern(patternKey);
      controller.setSpeed(speed);
      controller.start();
      setSimInfo((prev) => ({ ...prev, running: true }));
    });

    return () => {
      instancesRef.current = {};
      controller.destroy();
      navigator.destroy();
      renderer.destroy();
    };
  }, []);

  const setPattern = (value) => {
    setPatternKey(value);
    instancesRef.current.controller?.setTrafficPattern(value);
  };

  const setSimSpeed = (value) => {
    setSpeed(value);
    instancesRef.current.controller?.setSpeed(value);
  };

  const onPauseResume = () => {
    const controller = instancesRef.current.controller;
    if (!controller) return;

    const paused = controller.togglePause();
    setSimInfo((prev) => ({ ...prev, paused }));
  };

  const onReset = () => {
    const controller = instancesRef.current.controller;
    if (!controller) return;

    controller.reset();
    setSimInfo({ time: '00:00', frame: 0, flows: 0, droppedDemandMbps: 0, paused: false, running: true });
  };

  const onFailure = () => {
    instancesRef.current.controller?.triggerRandomFailure();
  };

  const onRecover = () => {
    instancesRef.current.controller?.recoverAll();
  };

  const onEditTopology = () => {
    const renderer = instancesRef.current.renderer;
    if (!renderer) {
      navigate('/playground');
      return;
    }

    const serialized = serializeTopology({ nodes: renderer.nodes, links: renderer.links });
    localStorage.setItem(STORAGE_KEYS.playgroundTopology, JSON.stringify(serialized));
    navigate('/playground');
  };

  const onExportReport = () => {
    const controller = instancesRef.current.controller;
    const renderer = instancesRef.current.renderer;
    if (!controller || !renderer) return;

    const report = buildReport({ metrics, controller, renderer, patternKey });
    localStorage.setItem(STORAGE_KEYS.latestLabReport, JSON.stringify(report));

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'network-lab-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page page-simulation">
      <div className="toolbar">
        <button onClick={onPauseResume}>{simInfo.paused ? 'Resume' : 'Pause'}</button>
        <button onClick={onReset}>Reset</button>
        <button onClick={onFailure}>Failure</button>
        <button onClick={onRecover}>Recover</button>
        <button onClick={onEditTopology}>Edit Topology</button>
        <button onClick={onExportReport}>Export Report</button>
        <Link to="/analytics" className="btn-secondary">Open Analytics</Link>
      </div>

      <div className="simulation-grid">
        <div className="canvas-area">
          <canvas ref={canvasRef} className="editor-canvas" />
          <div className="canvas-meta">{simInfo.time} • zoom {zoom}%</div>
        </div>

        <aside className="panel panel-right">
          <h3>Controls</h3>
          <div className="control-group">
            <label htmlFor="pattern">Traffic Pattern</label>
            <select id="pattern" value={patternKey} onChange={(e) => setPattern(e.target.value)}>
              {Object.entries(TRAFFIC_PATTERNS).map(([key, pattern]) => (
                <option key={key} value={key}>{pattern.label}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Speed</label>
            <div className="speed-row">
              {[0.5, 1, 2, 5].map((value) => (
                <button
                  key={value}
                  className={speed === value ? 'active' : ''}
                  onClick={() => setSimSpeed(value)}
                >
                  {value}x
                </button>
              ))}
            </div>
          </div>

          <h3>Simulation Info</h3>
          <div className="kv-list">
            <div><span>Status</span><strong>{simInfo.paused ? 'Paused' : 'Running'}</strong></div>
            <div><span>Frame</span><strong>{simInfo.frame}</strong></div>
            <div><span>Active flows</span><strong>{simInfo.flows}</strong></div>
            <div><span>Dropped demand</span><strong>{simInfo.droppedDemandMbps.toFixed(1)} Mbps</strong></div>
          </div>

          <h3>Live Metrics</h3>
          <div className="kv-list">
            <div><span>Throughput</span><strong>{metrics.throughput} Mbps</strong></div>
            <div><span>Latency</span><strong>{metrics.latency} ms</strong></div>
            <div><span>Packet loss</span><strong>{metrics.packetLoss}%</strong></div>
            <div><span>Utilization</span><strong>{metrics.utilization}%</strong></div>
            <div><span>Connections</span><strong>{metrics.activeConnections}</strong></div>
          </div>
        </aside>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { CanvasRenderer } from '@core/rendering/CanvasRenderer.js';
import { CanvasNavigator } from '@core/rendering/CanvasNavigator.js';
import { normalizeTopology } from '@core/utils/topologySchema.js';
import { defaultTopology } from '../data/topologyTemplates.js';
import { preloadDeviceIcons } from '../lib/iconCache.js';
import { STORAGE_KEYS } from '../lib/storage.js';

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

export default function AnalyticsPage() {
  const canvasRef = useRef(null);
  const importInputRef = useRef(null);
  const viewerRef = useRef({});

  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('No report loaded yet. Export a report from Simulation.');
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const rawReport = localStorage.getItem(STORAGE_KEYS.latestLabReport);
    if (rawReport) {
      try {
        setReport(JSON.parse(rawReport));
        setMessage('Loaded latest report from local storage.');
      } catch {
        setMessage('Stored report was invalid JSON. Export a new report from Simulation.');
      }
    }
  }, []);

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
    viewerRef.current = { renderer, navigator };

    const topology = report?.topology || defaultTopology;
    const normalized = normalizeTopology(topology, {
      canvasWidth: canvas.clientWidth || 1000,
      canvasHeight: canvas.clientHeight || 620,
    });

    preloadDeviceIcons().then((cache) => {
      renderer.setIconCache(cache);
      renderer.setTopology({ nodes: normalized.nodes, links: normalized.links });
      navigator.fitToContent(renderer.nodes, 90);
      renderer.start();
    });

    return () => {
      viewerRef.current = {};
      navigator.destroy();
      renderer.destroy();
    };
  }, [report]);

  const metrics = report?.metrics || null;
  const topTalkers = useMemo(() => {
    const nodes = report?.topology?.nodes || [];
    return [...nodes]
      .sort((a, b) => (b.load || 0) - (a.load || 0))
      .slice(0, 5)
      .map((node) => ({ label: node.label, load: Math.round((node.load || 0) * 100) }));
  }, [report]);

  const onImportReport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setReport(parsed);
        localStorage.setItem(STORAGE_KEYS.latestLabReport, JSON.stringify(parsed));
        setMessage(`Report imported: ${file.name}`);
      } catch {
        setMessage('Failed to parse report JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const onLoadLatestReport = () => {
    const rawReport = localStorage.getItem(STORAGE_KEYS.latestLabReport);
    if (!rawReport) {
      setMessage('No saved report found. Export one from Simulation first.');
      return;
    }

    try {
      const parsed = JSON.parse(rawReport);
      setReport(parsed);
      setMessage('Loaded latest report from local storage.');
    } catch {
      setMessage('Stored report is invalid. Export a fresh report from Simulation.');
    }
  };

  const onClearReport = () => {
    setReport(null);
    setMessage('Report cleared. Showing default topology preview.');
  };

  const updateZoom = (zoomFactor) => {
    const navigator = viewerRef.current.navigator;
    const renderer = viewerRef.current.renderer;
    const canvas = canvasRef.current;
    if (!navigator || !renderer || !canvas) return;

    const transform = navigator.getTransform();
    const targetScale = Math.max(navigator.minScale, Math.min(navigator.maxScale, transform.scale * zoomFactor));
    const ratio = targetScale / transform.scale;
    const centerX = canvas.clientWidth / 2;
    const centerY = canvas.clientHeight / 2;

    navigator.scale = targetScale;
    navigator.offsetX = centerX - (centerX - transform.offsetX) * ratio;
    navigator.offsetY = centerY - (centerY - transform.offsetY) * ratio;
    renderer.setTransform(navigator.getTransform());
    setZoom(Math.round(targetScale * 100));
  };

  const onZoomIn = () => updateZoom(1.2);
  const onZoomOut = () => updateZoom(1 / 1.2);
  const onFitView = () => {
    const navigator = viewerRef.current.navigator;
    const renderer = viewerRef.current.renderer;
    if (!navigator || !renderer) return;
    navigator.fitToContent(renderer.nodes, 90);
  };

  return (
    <section className="page page-analytics">
      <div className="toolbar toolbar-comfort">
        <div className="toolbar-group">
          <button onClick={() => importInputRef.current?.click()}>Import Report</button>
          <button onClick={onLoadLatestReport}>Load Latest</button>
          <button onClick={onClearReport}>Clear Report</button>
        </div>
        <div className="toolbar-group toolbar-zoom">
          <button onClick={onZoomOut}>−</button>
          <span className="zoom-pill">{zoom}%</span>
          <button onClick={onZoomIn}>+</button>
          <button onClick={onFitView}>Fit</button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={onImportReport}
        />
      </div>

      <div className="analytics-grid">
        <div className="canvas-area">
          <canvas ref={canvasRef} className="editor-canvas" />
          <div className="canvas-meta">Topology preview • zoom {zoom}%</div>
        </div>

        <aside className="panel panel-right">
          <h3>Report Status</h3>
          <p className="panel-message">{message}</p>

          <h3>Metadata</h3>
          <div className="kv-list">
            <div><span>Generated</span><strong>{formatDate(report?.generatedAt)}</strong></div>
            <div><span>Scenario</span><strong>{report?.scenario || 'N/A'}</strong></div>
            <div><span>Time</span><strong>{report?.state?.time || 'N/A'}</strong></div>
            <div><span>Speed</span><strong>{report?.state?.speed || 'N/A'}x</strong></div>
            <div><span>Active failures</span><strong>{report?.state?.activeFailures ?? 'N/A'}</strong></div>
          </div>

          <h3>Metrics Snapshot</h3>
          <div className="kv-list">
            <div><span>Throughput</span><strong>{metrics?.throughput ?? 0} Mbps</strong></div>
            <div><span>Latency</span><strong>{metrics?.latency ?? 0} ms</strong></div>
            <div><span>Packet loss</span><strong>{metrics?.packetLoss ?? 0}%</strong></div>
            <div><span>Utilization</span><strong>{metrics?.utilization ?? 0}%</strong></div>
            <div><span>Connections</span><strong>{metrics?.activeConnections ?? 0}</strong></div>
          </div>

          <h3>Top Talkers</h3>
          <ul className="talker-list">
            {topTalkers.length === 0 && <li>No topology nodes in report.</li>}
            {topTalkers.map((talker) => (
              <li key={talker.label}>
                <span>{talker.label}</span>
                <strong>{talker.load}%</strong>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

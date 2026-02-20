import { useEffect, useMemo, useRef, useState } from 'react';
import { CanvasRenderer } from '@core/rendering/CanvasRenderer.js';
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
  const rendererRef = useRef(null);

  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('No report loaded yet. Export a report from Simulation.');

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
    rendererRef.current = renderer;

    const topology = report?.topology || defaultTopology;
    const normalized = normalizeTopology(topology, {
      canvasWidth: canvas.clientWidth || 1000,
      canvasHeight: canvas.clientHeight || 620,
    });

    preloadDeviceIcons().then((cache) => {
      renderer.setIconCache(cache);
      renderer.setTopology({ nodes: normalized.nodes, links: normalized.links });
      renderer.start();
    });

    return () => {
      rendererRef.current = null;
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

  return (
    <section className="page page-analytics">
      <div className="toolbar">
        <button onClick={() => importInputRef.current?.click()}>Import Report</button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={onImportReport}
        />
      </div>

      <div className="simulation-grid">
        <div className="canvas-area">
          <canvas ref={canvasRef} className="editor-canvas" />
          <div className="canvas-meta">Topology preview</div>
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

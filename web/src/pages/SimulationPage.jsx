import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasRenderer } from '@core/rendering/CanvasRenderer.js';
import { CanvasNavigator } from '@core/rendering/CanvasNavigator.js';
import { PacketSimulationEngine } from '@core/engine/PacketSimulationEngine.js';
import { normalizeTopology, serializeTopology } from '@core/utils/topologySchema.js';
import { isRouterType, isSwitchType, isEndpointType } from '@core/network/InterfaceManager.js';
import { defaultTopology } from '../data/topologyTemplates.js';
import { preloadDeviceIcons } from '../lib/iconCache.js';
import { STORAGE_KEYS } from '../lib/storage.js';

import SimulationControls from '../components/SimulationControls.jsx';
import EventList from '../components/EventList.jsx';
import PacketDetailPanel from '../components/PacketDetailPanel.jsx';
import CliTerminal from '../components/CliTerminal.jsx';
import DeviceConfigDialog from '../components/DeviceConfigDialog.jsx';
import PingDialog from '../components/PingDialog.jsx';

export default function SimulationPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const instancesRef = useRef({});

  const [mode, setMode] = useState('simulation');
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [simState, setSimState] = useState({ stepCount: 0, eventsQueued: 0, packetsInFlight: 0 });
  const [events, setEvents] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [rightPanel, setRightPanel] = useState('events'); // 'events' | 'cli' | 'config' | 'info'
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showPingDialog, setShowPingDialog] = useState(false);
  const [nodes, setNodes] = useState([]);

  const refreshState = useCallback(() => {
    const engine = instancesRef.current.engine;
    if (!engine) return;
    setSimState(engine.getState());
    setEvents([...engine.eventLog]);

    const renderer = instancesRef.current.renderer;
    if (renderer && engine) {
      renderer.setActivePackets(engine.activePackets);
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
    const engine = new PacketSimulationEngine();

    engine.on('step', refreshState);
    engine.on('deliver', refreshState);
    engine.on('drop', refreshState);
    engine.on('reset', refreshState);

    instancesRef.current = { renderer, navigator, engine };

    const savedTopologyRaw = localStorage.getItem(STORAGE_KEYS.playgroundTopology);
    let topology = defaultTopology;
    if (savedTopologyRaw) {
      try { topology = JSON.parse(savedTopologyRaw); } catch { topology = defaultTopology; }
    }

    const normalized = normalizeTopology(topology, {
      canvasWidth: canvas.clientWidth || 1000,
      canvasHeight: canvas.clientHeight || 620,
    });

    preloadDeviceIcons().then((cache) => {
      renderer.setIconCache(cache);
      renderer.setTopology({ nodes: normalized.nodes, links: normalized.links });
      navigator.fitToContent(renderer.nodes, 90);
      renderer.start();

      engine.initialize({ nodes: normalized.nodes, links: normalized.links });
      setNodes(normalized.nodes);
      refreshState();
    });

    return () => {
      instancesRef.current = {};
      engine.destroy();
      navigator.destroy();
      renderer.destroy();
    };
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    instancesRef.current.engine?.setMode(newMode);
  };

  const handleStep = () => {
    instancesRef.current.engine?.stepForward();
  };

  const handleReset = () => {
    instancesRef.current.engine?.reset();
    refreshState();
  };

  const handleSpeedChange = (s) => {
    setSpeed(s);
    instancesRef.current.engine?.setSpeed(s);
  };

  const handlePing = (sourceId, destIp) => {
    instancesRef.current.engine?.ping(sourceId, destIp, 4);
  };

  const handleEditTopology = () => {
    const renderer = instancesRef.current.renderer;
    if (renderer) {
      const serialized = serializeTopology({ nodes: renderer.nodes, links: renderer.links });
      localStorage.setItem(STORAGE_KEYS.playgroundTopology, JSON.stringify(serialized));
    }
    navigate('/playground');
  };

  const updateZoom = (factor) => {
    const nav = instancesRef.current.navigator;
    const renderer = instancesRef.current.renderer;
    const canvas = canvasRef.current;
    if (!nav || !renderer || !canvas) return;

    const transform = nav.getTransform();
    const targetScale = Math.max(nav.minScale, Math.min(nav.maxScale, transform.scale * factor));
    const ratio = targetScale / transform.scale;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    nav.scale = targetScale;
    nav.offsetX = cx - (cx - transform.offsetX) * ratio;
    nav.offsetY = cy - (cy - transform.offsetY) * ratio;
    renderer.setTransform(nav.getTransform());
    setZoom(Math.round(targetScale * 100));
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const renderer = instancesRef.current.renderer;
    if (!canvas || !renderer) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const transform = renderer.transform;
    if (transform) {
      x = (x - transform.offsetX) / transform.scale;
      y = (y - transform.offsetY) / transform.scale;
    }

    const node = renderer.findNodeAt(x, y);
    if (node) {
      setSelectedDevice(node);
      renderer.selectNode(node.id);

      // Single click: show info
      setRightPanel('info');
    } else {
      setSelectedDevice(null);
      renderer.selectNode(null);
      setRightPanel('events');
    }
  };

  const handleCanvasDblClick = (e) => {
    const canvas = canvasRef.current;
    const renderer = instancesRef.current.renderer;
    if (!canvas || !renderer) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const transform = renderer.transform;
    if (transform) {
      x = (x - transform.offsetX) / transform.scale;
      y = (y - transform.offsetY) / transform.scale;
    }

    const node = renderer.findNodeAt(x, y);
    if (!node) return;

    setSelectedDevice(node);

    if (isRouterType(node.type) || isSwitchType(node.type)) {
      setRightPanel('cli');
    } else if (isEndpointType(node.type)) {
      setRightPanel('config');
    }
  };

  const deviceForPanel = selectedDevice
    ? instancesRef.current.engine?.networkStack?.getNode(selectedDevice.id) || selectedDevice
    : null;

  return (
    <section className="page page-simulation">
      <SimulationControls
        mode={mode}
        onModeChange={handleModeChange}
        onStep={handleStep}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={handleSpeedChange}
        onSendPing={() => setShowPingDialog(true)}
        onEditTopology={handleEditTopology}
        stepCount={simState.stepCount}
        eventsQueued={simState.eventsQueued}
        packetsInFlight={simState.packetsInFlight}
      />

      <div className="simulation-grid">
        <div className="canvas-area">
          <canvas
            ref={canvasRef}
            className="editor-canvas"
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDblClick}
          />
          <div className="canvas-meta">
            {mode} mode | step {simState.stepCount} | {simState.eventsQueued} queued | {simState.packetsInFlight} in flight | zoom {zoom}%
          </div>
        </div>

        <aside className="panel panel-right sim-panel-right">
          <div className="sim-panel-tabs">
            <button className={rightPanel === 'events' ? 'active' : ''} onClick={() => setRightPanel('events')}>Events</button>
            <button className={rightPanel === 'info' ? 'active' : ''} onClick={() => setRightPanel('info')} disabled={!selectedDevice}>Info</button>
            <button className={rightPanel === 'cli' ? 'active' : ''} onClick={() => setRightPanel('cli')} disabled={!selectedDevice}>CLI</button>
            <button className={rightPanel === 'config' ? 'active' : ''} onClick={() => setRightPanel('config')} disabled={!selectedDevice}>Config</button>
          </div>

          <div className="sim-panel-body">
            {rightPanel === 'events' && (
              <>
                <EventList events={events} currentStep={simState.stepCount} />
                <PacketDetailPanel frame={selectedFrame} />
              </>
            )}

            {rightPanel === 'cli' && deviceForPanel && (
              <CliTerminal
                device={deviceForPanel}
                networkStack={instancesRef.current.engine?.networkStack}
                simulationEngine={instancesRef.current.engine}
                onClose={() => setRightPanel('events')}
              />
            )}

            {rightPanel === 'config' && deviceForPanel && (
              <DeviceConfigDialog
                device={deviceForPanel}
                networkStack={instancesRef.current.engine?.networkStack}
                onClose={() => setRightPanel('events')}
                onApply={() => refreshState()}
              />
            )}

            {rightPanel === 'info' && deviceForPanel && (
              <div className="device-info-panel">
                <h4>{deviceForPanel.hostname}</h4>
                <div className="kv-list">
                  <div><span>Type</span><strong>{deviceForPanel.type}</strong></div>
                  <div><span>Status</span><strong>{deviceForPanel.status}</strong></div>
                  {deviceForPanel.defaultGateway && (
                    <div><span>Gateway</span><strong>{deviceForPanel.defaultGateway}</strong></div>
                  )}
                </div>
                <h4>Interfaces</h4>
                <div className="device-iface-list">
                  {deviceForPanel.interfaces?.map(iface => (
                    <div key={iface.name} className="device-iface-row">
                      <span className="iface-name-col">{iface.shortName}</span>
                      <span>{iface.ipAddress || 'unassigned'}</span>
                      <span className={`iface-status-col ${iface.status}`}>{iface.status}</span>
                    </div>
                  ))}
                </div>
                {isRouterType(deviceForPanel.type) && (
                  <>
                    <h4>Routing Table</h4>
                    <div className="device-table-list">
                      {instancesRef.current.engine?.networkStack?.getRoutingTable(deviceForPanel.id)?.getEntries()?.map((r, i) => (
                        <div key={i} className="device-table-row">
                          <code>{r.type === 'connected' ? 'C' : 'S'} {r.network}/{r.maskBits} {r.nextHop ? `via ${r.nextHop}` : r.iface}</code>
                        </div>
                      )) || <div className="empty-table">No routes</div>}
                    </div>
                  </>
                )}
                <h4>ARP Table</h4>
                <div className="device-table-list">
                  {instancesRef.current.engine?.networkStack?.getArpTable(deviceForPanel.id)?.getEntries()?.map((e, i) => (
                    <div key={i} className="device-table-row">
                      <code>{e.ip} {'->'} {e.mac}</code>
                    </div>
                  )) || <div className="empty-table">Empty</div>}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {showPingDialog && (
        <div className="dialog-overlay" onClick={() => setShowPingDialog(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <PingDialog
              nodes={nodes}
              onPing={handlePing}
              onClose={() => setShowPingDialog(false)}
            />
          </div>
        </div>
      )}

      <div className="status-row">
        <span>{mode === 'simulation' ? 'Step-by-step mode' : 'Realtime mode'}</span>
        <span className="status-pill ok">Step {simState.stepCount}</span>
        <span className="status-pill info">{simState.eventsQueued} queued</span>
        <span>{simState.packetsInFlight} packets in flight</span>
        <span>Click device for info | Double-click router/switch for CLI | Double-click PC for config</span>
      </div>
    </section>
  );
}

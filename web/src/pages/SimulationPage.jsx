import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasRenderer } from '@core/rendering/CanvasRenderer.js';
import { CanvasNavigator } from '@core/rendering/CanvasNavigator.js';
import { PacketSimulationEngine } from '@core/engine/PacketSimulationEngine.js';
import { normalizeTopology, serializeTopology } from '@core/utils/topologySchema.js';
import { isRouterType, isSwitchType, isEndpointType } from '@core/network/InterfaceManager.js';
import { defaultTopology, defaultIpConfig } from '../data/topologyTemplates.js';
import { preloadDeviceIcons } from '../lib/iconCache.js';
import { STORAGE_KEYS } from '../lib/storage.js';

import SimulationControls from '../components/SimulationControls.jsx';
import EventList from '../components/EventList.jsx';
import PacketDetailPanel from '../components/PacketDetailPanel.jsx';
import CliTerminal from '../components/CliTerminal.jsx';
import DeviceConfigDialog from '../components/DeviceConfigDialog.jsx';
import PingDialog from '../components/PingDialog.jsx';
import FloatingIpForm from '../components/FloatingIpForm.jsx';
import DeviceListOverlay from '../components/DeviceListOverlay.jsx';

const TOOL_HINTS = {
  pdu: 'Simple PDU: Click source device',
  pdu_dest: 'Simple PDU: Now click destination device',
  ip: 'Assign IP: Click a device to configure',
};

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
  const [rightPanel, setRightPanel] = useState('events');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showPingDialog, setShowPingDialog] = useState(false);
  const [nodes, setNodes] = useState([]);

  // Tool state
  const [activeTool, setActiveTool] = useState('select');
  const [pduSource, setPduSource] = useState(null);
  const [floatingIp, setFloatingIp] = useState(null);

  // Hostname editing
  const [editingHostname, setEditingHostname] = useState(false);
  const [hostnameValue, setHostnameValue] = useState('');

  // Force re-render counter for info panel refresh
  const [, forceUpdate] = useState(0);

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
    engine.on('deliver', (evt) => {
      refreshState();
      if (evt?.nodeId) {
        renderer.addPingResult(evt.nodeId, true);
      }
    });
    engine.on('drop', (evt) => {
      refreshState();
      if (evt?.nodeId) {
        renderer.addPingResult(evt.nodeId, false);
      }
    });
    engine.on('reset', refreshState);

    instancesRef.current = { renderer, navigator, engine };

    const savedTopologyRaw = localStorage.getItem(STORAGE_KEYS.playgroundTopology);
    let topology = defaultTopology;
    let useDefaultIps = true;
    if (savedTopologyRaw) {
      try {
        topology = JSON.parse(savedTopologyRaw);
        useDefaultIps = false;
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
      navigator.fitToContent(renderer.nodes, 90);
      renderer.start();

      engine.initialize({ nodes: normalized.nodes, links: normalized.links });

      // Apply default IPs if using the built-in topology
      if (useDefaultIps && defaultIpConfig) {
        applyIpConfig(engine.networkStack, defaultIpConfig);
      }

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

  const handleToolChange = (tool) => {
    setActiveTool(tool);
    setPduSource(null);
    setFloatingIp(null);
    const renderer = instancesRef.current.renderer;
    if (renderer) {
      renderer.setPduSourceNode(null);
    }
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const renderer = instancesRef.current.renderer;
    if (!canvas || !renderer) return null;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const transform = renderer.transform;
    if (transform) {
      x = (x - transform.offsetX) / transform.scale;
      y = (y - transform.offsetY) / transform.scale;
    }
    return { x, y, clientX: e.clientX, clientY: e.clientY, rect };
  };

  const handleCanvasMouseMove = (e) => {
    const renderer = instancesRef.current.renderer;
    const canvas = canvasRef.current;
    if (!renderer || !canvas) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const node = renderer.findNodeAt(coords.x, coords.y);
    renderer.setHoveredNode(node?.id || null);

    const link = !node ? renderer.findLinkAt(coords.x, coords.y) : null;
    renderer.setHoveredLink(link?.id || null);

    if (activeTool === 'pdu' || activeTool === 'ip') {
      canvas.style.cursor = node ? 'pointer' : 'crosshair';
    } else {
      canvas.style.cursor = node || link ? 'pointer' : 'default';
    }
  };

  const selectDeviceOnCanvas = (node) => {
    const renderer = instancesRef.current.renderer;
    if (!renderer) return;
    setSelectedDevice(node);
    renderer.selectNode(node.id);
    setRightPanel('info');
    setEditingHostname(false);
  };

  const handleCanvasClick = (e) => {
    const renderer = instancesRef.current.renderer;
    const engine = instancesRef.current.engine;
    if (!renderer || !engine) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const node = renderer.findNodeAt(coords.x, coords.y);

    // PDU tool mode
    if (activeTool === 'pdu') {
      if (!node) return;
      if (!pduSource) {
        setPduSource(node);
        renderer.setPduSourceNode(node.id);
      } else {
        if (node.id !== pduSource.id) {
          const destDevice = engine.networkStack?.getNode(node.id);
          const destIp = destDevice?.interfaces?.find(i => i.ipAddress)?.ipAddress;
          if (destIp) {
            engine.ping(pduSource.id, destIp, 1);
          }
        }
        setPduSource(null);
        renderer.setPduSourceNode(null);
      }
      return;
    }

    // IP tool mode
    if (activeTool === 'ip') {
      if (!node) {
        setFloatingIp(null);
        return;
      }
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setFloatingIp({
        device: node,
        x: coords.clientX - canvasRect.left + 20,
        y: coords.clientY - canvasRect.top - 20,
      });
      return;
    }

    // Select tool mode (default)
    if (node) {
      selectDeviceOnCanvas(node);
    } else {
      setSelectedDevice(null);
      renderer.selectNode(null);
      setRightPanel('events');
      setEditingHostname(false);
    }
  };

  const handleCanvasDblClick = (e) => {
    const renderer = instancesRef.current.renderer;
    if (!renderer) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const node = renderer.findNodeAt(coords.x, coords.y);
    if (!node) return;

    setSelectedDevice(node);
    setEditingHostname(false);

    if (isRouterType(node.type) || isSwitchType(node.type)) {
      setRightPanel('cli');
    } else if (isEndpointType(node.type)) {
      setRightPanel('config');
    }
  };

  const handleFloatingIpApply = (nodeId, ip, mask, gateway) => {
    const engine = instancesRef.current.engine;
    if (!engine?.networkStack) return;

    const device = engine.networkStack.getNode(nodeId);
    const iface = device?.interfaces?.find(i => i.name);
    if (iface) {
      engine.networkStack.setInterfaceIp(nodeId, iface.name, ip, mask);
    }
    if (gateway) {
      engine.networkStack.setDefaultGateway(nodeId, gateway);
    }
    setFloatingIp(null);
    refreshState();
    forceUpdate(n => n + 1);
  };

  // Hostname editing
  const startEditHostname = (hostname) => {
    setEditingHostname(true);
    setHostnameValue(hostname || '');
  };

  const commitHostname = () => {
    if (!selectedDevice || !hostnameValue.trim()) {
      setEditingHostname(false);
      return;
    }
    const engine = instancesRef.current.engine;
    const renderer = instancesRef.current.renderer;
    if (engine?.networkStack) {
      engine.networkStack.setHostname(selectedDevice.id, hostnameValue.trim());
    }
    // Also update the renderer's node so the canvas label refreshes
    if (renderer) {
      const rNode = renderer.nodeMap.get(selectedDevice.id);
      if (rNode) {
        rNode.hostname = hostnameValue.trim();
        rNode.label = hostnameValue.trim();
      }
    }
    setEditingHostname(false);
    forceUpdate(n => n + 1);
  };

  const handleHostnameKeyDown = (e) => {
    if (e.key === 'Enter') commitHostname();
    if (e.key === 'Escape') setEditingHostname(false);
  };

  const deviceForPanel = selectedDevice
    ? instancesRef.current.engine?.networkStack?.getNode(selectedDevice.id) || selectedDevice
    : null;

  const toolHint = activeTool === 'pdu'
    ? (pduSource ? TOOL_HINTS.pdu_dest : TOOL_HINTS.pdu)
    : activeTool === 'ip'
      ? TOOL_HINTS.ip
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
        eventsQueued={simState.eventsQueued}
        activeTool={activeTool}
        onToolChange={handleToolChange}
      />

      <div className="simulation-grid">
        <div className="canvas-area">
          <canvas
            ref={canvasRef}
            className="editor-canvas"
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDblClick}
            onMouseMove={handleCanvasMouseMove}
          />
          {toolHint && (
            <div className="canvas-tool-hint">{toolHint}</div>
          )}
          {floatingIp && (
            <FloatingIpForm
              device={floatingIp.device}
              networkStack={instancesRef.current.engine?.networkStack}
              x={floatingIp.x}
              y={floatingIp.y}
              onApply={handleFloatingIpApply}
              onClose={() => setFloatingIp(null)}
            />
          )}
          <DeviceListOverlay
            nodes={nodes}
            selectedDeviceId={selectedDevice?.id}
            onSelectDevice={selectDeviceOnCanvas}
            networkStack={instancesRef.current.engine?.networkStack}
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
                onApply={() => { refreshState(); forceUpdate(n => n + 1); }}
              />
            )}

            {rightPanel === 'info' && deviceForPanel && (
              <div className="device-info-panel">
                {editingHostname ? (
                  <input
                    className="hostname-input"
                    value={hostnameValue}
                    onChange={e => setHostnameValue(e.target.value)}
                    onBlur={commitHostname}
                    onKeyDown={handleHostnameKeyDown}
                    autoFocus
                    spellCheck={false}
                  />
                ) : (
                  <h4
                    className="hostname-editable"
                    onClick={() => startEditHostname(deviceForPanel.hostname)}
                    title="Click to rename"
                  >
                    {deviceForPanel.hostname}
                    <span className="hostname-edit-icon">&#9998;</span>
                  </h4>
                )}
                <div className="device-info-actions">
                  {(isRouterType(deviceForPanel.type) || isSwitchType(deviceForPanel.type)) && (
                    <button className="btn-sm" onClick={() => setRightPanel('cli')}>Open Terminal</button>
                  )}
                  <button className="btn-sm" onClick={() => setRightPanel('config')}>Configure IP</button>
                </div>
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
                  {instancesRef.current.engine?.networkStack?.getArpTable(deviceForPanel.id)?.getEntries()?.map((entry, i) => (
                    <div key={i} className="device-table-row">
                      <code>{entry.ip} {'->'} {entry.mac}</code>
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
        <span>Click device for info | Double-click for CLI/Config</span>
      </div>
    </section>
  );
}

/**
 * Apply pre-configured IPs from an IP config map after engine initialization.
 */
function applyIpConfig(networkStack, ipConfig) {
  if (!networkStack) return;
  for (const [nodeId, configs] of Object.entries(ipConfig)) {
    for (const cfg of configs) {
      networkStack.setInterfaceIp(nodeId, cfg.iface, cfg.ip, cfg.mask);
    }
  }
}

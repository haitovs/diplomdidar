import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasRenderer } from '@core/rendering/CanvasRenderer.js';
import { CanvasNavigator } from '@core/rendering/CanvasNavigator.js';
import { DevicePalette } from '@core/playground/DevicePalette.js';
import { PropertyEditor } from '@core/playground/PropertyEditor.js';
import { TopologyEditor } from '@core/playground/TopologyEditor.js';
import { normalizeTopology } from '@core/utils/topologySchema.js';
import { starterTopology } from '../data/topologyTemplates.js';
import { preloadDeviceIcons } from '../lib/iconCache.js';
import { STORAGE_KEYS } from '../lib/storage.js';

function persistTopology(editor) {
  if (!editor) return;
  const topology = editor.getSerializableTopology();
  localStorage.setItem(STORAGE_KEYS.playgroundTopology, JSON.stringify(topology));
}

export default function PlaygroundPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const paletteRef = useRef(null);
  const propertyRef = useRef(null);
  const importInputRef = useRef(null);
  const instancesRef = useRef({});
  const modeRef = useRef('select');

  const [mode, setMode] = useState('select');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [stats, setStats] = useState({ nodes: 0, links: 0 });
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [rendererRunning, setRendererRunning] = useState(false);
  const [status, setStatus] = useState('Editor ready');

  const syncEditorState = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    const topology = editor.getTopology();
    setStats({ nodes: topology.nodes.length, links: topology.links.length });
    setHistoryState({
      canUndo: editor.historyIndex > 0,
      canRedo: editor.historyIndex < editor.history.length - 1,
    });
  };

  const applyModeState = (nextMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const paletteHost = paletteRef.current;
    const propertyHost = propertyRef.current;
    if (!canvas || !paletteHost || !propertyHost) return;

    const renderer = new CanvasRenderer(canvas, { showGrid: true });
    const navigator = new CanvasNavigator(canvas, {
      isPanToolActive: () => modeRef.current === 'hand',
      onTransformChange: (transform) => {
        renderer.setTransform(transform);
        setZoom(Math.round(transform.scale * 100));
      },
    });

    const propertyEditor = new PropertyEditor(propertyHost, {
      onPropertyChange: (type, id, updates) => {
        const editor = instancesRef.current.editor;
        if (!editor) return;

        if (type === 'node') {
          editor.updateNode(id, updates);
        } else {
          editor.updateLink(id, updates);
        }
        persistTopology(editor);
        syncEditorState();
        setStatus('Properties updated');
      },
      onDelete: (type, id) => {
        const editor = instancesRef.current.editor;
        if (!editor) return;

        if (type === 'node') {
          editor.deleteNode(id);
        } else {
          editor.deleteLink(id);
        }
        persistTopology(editor);
        syncEditorState();
        setStatus('Property item deleted');
      },
    });

    const editor = new TopologyEditor(canvas, renderer, {
      isPanning: () => navigator.isPanning,
      snapToGrid: true,
      onNodeAdd: (node) => {
        setStatus(`Added ${node.label}`);
      },
      onLinkAdd: (link) => {
        setStatus(`Linked ${link.source} -> ${link.target}`);
      },
      onLinkStageChange: (stage) => {
        if (stage.stage === 'source') {
          setStatus(`Link mode: source selected (${stage.sourceId}). Click destination node.`);
        } else if (stage.stage === 'created') {
          setStatus(`Link created: ${stage.sourceId} -> ${stage.targetId}`);
        } else if (instancesRef.current.editor?.mode === 'addLink') {
          setStatus('Link mode: select source then destination node.');
        }
      },
      onNodeSelect: (node) => {
        if (node) {
          propertyEditor.editNode(node);
          return;
        }
        propertyEditor.clear();
      },
      onLinkSelect: (link) => {
        if (link) {
          propertyEditor.editLink(link);
          return;
        }
        propertyEditor.clear();
      },
      onTopologyChange: () => {
        persistTopology(editor);
        syncEditorState();
      },
    });

    const palette = new DevicePalette(paletteHost, {
      onDeviceSelect: (deviceType) => {
        editor.setPendingDevice(deviceType);
        applyModeState('addNode');
        setStatus(`Add node mode: ${deviceType}`);
      },
    });

    instancesRef.current = { renderer, navigator, editor, palette, propertyEditor };

    const rawTopology = localStorage.getItem(STORAGE_KEYS.playgroundTopology);
    let initialTopology = starterTopology;
    if (rawTopology) {
      try {
        initialTopology = JSON.parse(rawTopology);
      } catch {
        initialTopology = starterTopology;
      }
    }

    const normalized = normalizeTopology(initialTopology, {
      canvasWidth: canvas.clientWidth || 1000,
      canvasHeight: canvas.clientHeight || 600,
    });
    const shouldFallbackToStarter = rawTopology && normalized.nodes.length === 0;
    const topologyToLoad = shouldFallbackToStarter ? starterTopology : normalized;
    const startupMessage = shouldFallbackToStarter
      ? 'Saved topology was empty. Starter topology loaded.'
      : 'Topology loaded';

    preloadDeviceIcons().then((cache) => {
      renderer.setIconCache(cache);
      editor.loadTopology(topologyToLoad);
      editor.setMode('select');
      applyModeState('select');
      navigator.fitToContent(renderer.nodes, 80);
      renderer.start();
      setRendererRunning(true);
      syncEditorState();
      persistTopology(editor);
      setStatus(startupMessage);
    });

    return () => {
      instancesRef.current = {};
      navigator.destroy();
      editor.destroy();
      palette.destroy();
      propertyEditor.destroy();
      renderer.destroy();
    };
  }, []);

  const setEditorMode = (nextMode, fallbackDevice = 'switch') => {
    const editor = instancesRef.current.editor;
    const palette = instancesRef.current.palette;
    if (!editor) return;

    if (nextMode === 'addNode') {
      const selectedDevice = palette?.getSelectedDevice?.();
      const targetDevice = selectedDevice || fallbackDevice;
      editor.setPendingDevice(targetDevice);
      if (palette && !selectedDevice) {
        palette.setSelectedDevice(targetDevice, false);
      }
      setStatus(`Add node mode: ${targetDevice}`);
    } else if (nextMode === 'hand') {
      editor.setMode('hand');
      setStatus('Hand mode: hold left mouse and drag to pan.');
    } else if (nextMode === 'addLink') {
      editor.setMode(nextMode);
      setStatus('Link mode: click source node, then destination node.');
    } else {
      editor.setMode(nextMode);
      setStatus(`Mode: ${nextMode}`);
    }

    applyModeState(nextMode);
  };

  const onUndo = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    if (editor.historyIndex <= 0) {
      setStatus('Nothing to undo');
      return;
    }
    editor.undo();
    persistTopology(editor);
    syncEditorState();
    setStatus('Undo complete');
  };

  const onRedo = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    if (editor.historyIndex >= editor.history.length - 1) {
      setStatus('Nothing to redo');
      return;
    }
    editor.redo();
    persistTopology(editor);
    syncEditorState();
    setStatus('Redo complete');
  };

  const onClear = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    if (editor.nodes.length === 0 && editor.links.length === 0) {
      setStatus('Canvas already empty');
      return;
    }
    editor.clear();
    persistTopology(editor);
    syncEditorState();
    setStatus('Topology cleared');
  };

  const onExport = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    if (editor.nodes.length === 0) {
      setStatus('Nothing to export. Add or load topology first.');
      return;
    }
    editor.exportJSON();
    setStatus('Topology exported');
  };

  const onImportClick = () => {
    importInputRef.current?.click();
    setStatus('Select topology JSON file to import');
  };

  const onImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const editor = instancesRef.current.editor;
    const navigator = instancesRef.current.navigator;
    const renderer = instancesRef.current.renderer;
    if (!editor) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const topology = JSON.parse(String(reader.result));
        editor.loadTopology(topology);
        editor.setMode('select');
        applyModeState('select');
        if (renderer?.nodes?.length) {
          navigator?.fitToContent(renderer.nodes, 80);
        }
        persistTopology(editor);
        syncEditorState();
        setStatus(`Topology imported: ${file.name}`);
      } catch {
        setStatus(`Import failed: invalid JSON in ${file.name}`);
      }
    };
    reader.readAsText(file);

    event.target.value = '';
  };

  const onFit = () => {
    const navigator = instancesRef.current.navigator;
    const renderer = instancesRef.current.renderer;
    if (!navigator || !renderer) return;
    if (renderer.nodes.length === 0) {
      setStatus('Nothing to fit: topology is empty');
      return;
    }
    navigator.fitToContent(renderer.nodes);
    setStatus('View fitted to topology');
  };

  const updateZoom = (zoomFactor) => {
    const navigator = instancesRef.current.navigator;
    const renderer = instancesRef.current.renderer;
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

  const onDeleteSelection = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    const selectedCount = editor.selectedNodes.size + editor.selectedLinks.size;
    if (selectedCount === 0) {
      setStatus('No selected nodes or links to delete');
      return;
    }
    editor.deleteSelected?.();
    persistTopology(editor);
    syncEditorState();
    setStatus(`Removed ${selectedCount} selected item(s)`);
  };

  const onLoadStarter = () => {
    const editor = instancesRef.current.editor;
    const renderer = instancesRef.current.renderer;
    const navigator = instancesRef.current.navigator;
    if (!editor || !renderer || !navigator) return;

    editor.loadTopology(starterTopology);
    editor.setMode('select');
    applyModeState('select');
    navigator.fitToContent(renderer.nodes, 80);
    renderer.start();
    setRendererRunning(true);
    persistTopology(editor);
    syncEditorState();
    setStatus('Starter topology loaded');
  };

  const onToggleSnap = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    const next = !snapToGrid;
    editor.setSnapToGrid(next);
    setSnapToGrid(next);
    setStatus(next ? 'Grid snap enabled' : 'Grid snap disabled');
  };

  const onSimulate = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    if (editor.nodes.length === 0) {
      setStatus('Simulation requires topology. Add nodes or load starter.');
      return;
    }

    localStorage.setItem(STORAGE_KEYS.playgroundTopology, JSON.stringify(editor.getSerializableTopology()));
    setStatus('Opening simulation');
    navigate('/simulation');
  };

  const isCanvasEmpty = stats.nodes === 0;

  return (
    <section className="page page-playground">
      <div className="toolbar toolbar-comfort">
        <div className="toolbar-group">
          <button onClick={() => setEditorMode('select')} className={mode === 'select' ? 'active' : ''}>Select (V)</button>
          <button onClick={() => setEditorMode('hand')} className={mode === 'hand' ? 'active' : ''}>Hand (H)</button>
          <button onClick={() => setEditorMode('addNode')} className={mode === 'addNode' ? 'active' : ''}>Add Node (N)</button>
          <button onClick={() => setEditorMode('addLink')} className={mode === 'addLink' ? 'active' : ''}>Add Link (L)</button>
          <button onClick={onToggleSnap} className={snapToGrid ? 'active' : ''}>Snap</button>
          <button onClick={onDeleteSelection}>Delete Selected</button>
        </div>

        <div className="toolbar-group">
          <button onClick={onUndo} disabled={!historyState.canUndo}>Undo</button>
          <button onClick={onRedo} disabled={!historyState.canRedo}>Redo</button>
          <button onClick={onClear} disabled={stats.nodes === 0 && stats.links === 0}>Clear</button>
          <button onClick={onLoadStarter}>Load Starter</button>
        </div>

        <div className="toolbar-group toolbar-zoom">
          <button onClick={onZoomOut}>−</button>
          <span className="zoom-pill">{zoom}%</span>
          <button onClick={onZoomIn}>+</button>
          <button onClick={onFit} disabled={stats.nodes === 0}>Fit</button>
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar-group">
          <button onClick={onImportClick}>Import</button>
          <button onClick={onExport} disabled={stats.nodes === 0}>Export</button>
          <button className="btn-primary" onClick={onSimulate} disabled={stats.nodes === 0}>Simulate</button>
        </div>

        <input ref={importInputRef} type="file" accept="application/json" onChange={onImportFile} hidden />
      </div>

      <div className="workspace-grid">
        <aside className="panel panel-left">
          <h3>Device Palette</h3>
          <div ref={paletteRef} className="panel-body" />
        </aside>

        <div className="canvas-area">
          <canvas ref={canvasRef} className="editor-canvas" />
          {isCanvasEmpty && (
            <div className="canvas-empty-state">
              <h4>Canvas is empty</h4>
              <p>Load a starter topology or add your first device to begin editing.</p>
              <div className="canvas-empty-actions">
                <button onClick={() => setEditorMode('addNode')}>Add First Node</button>
                <button onClick={onLoadStarter}>Load Starter</button>
                <button onClick={onImportClick}>Import JSON</button>
              </div>
            </div>
          )}
          <div className="canvas-meta">Mode {mode} • Zoom {zoom}% • Pan with Hand or Space-drag</div>
        </div>

        <aside className="panel panel-right">
          <h3>Properties</h3>
          <div ref={propertyRef} className="panel-body" />
        </aside>
      </div>

      <div className="status-row">
        <span>{status}</span>
        <span className={`status-pill ${rendererRunning ? 'ok' : 'warn'}`}>Renderer {rendererRunning ? 'running' : 'stopped'}</span>
        <span className={`status-pill ${mode === 'hand' ? 'info' : 'neutral'}`}>Mode {mode}</span>
        <span>Tip: Use Hand (H) for left-drag pan, or hold Space while dragging. Scroll zooms. Arrow keys nudge selected nodes.</span>
        <span>{stats.nodes} nodes</span>
        <span>{stats.links} links</span>
      </div>
    </section>
  );
}

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

  const [mode, setMode] = useState('select');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [stats, setStats] = useState({ nodes: 0, links: 0 });
  const [status, setStatus] = useState('Editor ready');

  useEffect(() => {
    const canvas = canvasRef.current;
    const paletteHost = paletteRef.current;
    const propertyHost = propertyRef.current;
    if (!canvas || !paletteHost || !propertyHost) return;

    const renderer = new CanvasRenderer(canvas, { showGrid: true });
    const navigator = new CanvasNavigator(canvas, {
      onTransformChange: (transform) => {
        renderer.setTransform(transform);
        setZoom(Math.round(transform.scale * 100));
      },
    });

    const refreshStats = () => {
      const topology = instancesRef.current.editor?.getTopology() || { nodes: [], links: [] };
      setStats({ nodes: topology.nodes.length, links: topology.links.length });
    };

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
        refreshStats();
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
        propertyEditor.clear();
        persistTopology(editor);
        refreshStats();
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
        refreshStats();
      },
    });

    const palette = new DevicePalette(paletteHost, {
      onDeviceSelect: (deviceType) => {
        editor.setPendingDevice(deviceType);
        setMode('addNode');
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

    preloadDeviceIcons().then((cache) => {
      renderer.setIconCache(cache);
      editor.loadTopology({ nodes: normalized.nodes, links: normalized.links });
      editor.setMode('select');
      navigator.fitToContent(renderer.nodes, 80);
      refreshStats();
      setStatus('Topology loaded');
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
    } else if (nextMode === 'addLink') {
      editor.setMode(nextMode);
      setStatus('Link mode: click source node, then destination node.');
    } else {
      editor.setMode(nextMode);
      setStatus(`Mode: ${nextMode}`);
    }

    setMode(nextMode);
  };

  const onUndo = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    editor.undo();
    persistTopology(editor);
    setStatus('Undo complete');
  };

  const onRedo = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    editor.redo();
    persistTopology(editor);
    setStatus('Redo complete');
  };

  const onClear = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;
    editor.clear();
    persistTopology(editor);
    setStatus('Topology cleared');
  };

  const onExport = () => {
    instancesRef.current.editor?.exportJSON();
  };

  const onImportClick = () => {
    importInputRef.current?.click();
  };

  const onImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const editor = instancesRef.current.editor;
    if (!editor) return;

    editor.importJSON(file);
    setTimeout(() => {
      persistTopology(editor);
      setStatus('Topology imported');
    }, 60);

    event.target.value = '';
  };

  const onFit = () => {
    const navigator = instancesRef.current.navigator;
    const renderer = instancesRef.current.renderer;
    if (!navigator || !renderer) return;
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
    editor.deleteSelected?.();
    persistTopology(editor);
    setStatus('Selected items removed');
  };

  const onLoadStarter = () => {
    const editor = instancesRef.current.editor;
    const renderer = instancesRef.current.renderer;
    const navigator = instancesRef.current.navigator;
    if (!editor || !renderer || !navigator) return;

    editor.loadTopology(starterTopology);
    editor.setMode('select');
    setMode('select');
    navigator.fitToContent(renderer.nodes, 80);
    persistTopology(editor);
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

    localStorage.setItem(STORAGE_KEYS.playgroundTopology, JSON.stringify(editor.getSerializableTopology()));
    navigate('/simulation');
  };

  return (
    <section className="page page-playground">
      <div className="toolbar toolbar-comfort">
        <div className="toolbar-group">
          <button onClick={() => setEditorMode('select')} className={mode === 'select' ? 'active' : ''}>Select (V)</button>
          <button onClick={() => setEditorMode('addNode')} className={mode === 'addNode' ? 'active' : ''}>Add Node (N)</button>
          <button onClick={() => setEditorMode('addLink')} className={mode === 'addLink' ? 'active' : ''}>Add Link (L)</button>
          <button onClick={onToggleSnap} className={snapToGrid ? 'active' : ''}>Snap</button>
          <button onClick={onDeleteSelection}>Delete Selected</button>
        </div>

        <div className="toolbar-group">
          <button onClick={onUndo}>Undo</button>
          <button onClick={onRedo}>Redo</button>
          <button onClick={onClear}>Clear</button>
          <button onClick={onLoadStarter}>Load Starter</button>
        </div>

        <div className="toolbar-group toolbar-zoom">
          <button onClick={onZoomOut}>−</button>
          <span className="zoom-pill">{zoom}%</span>
          <button onClick={onZoomIn}>+</button>
          <button onClick={onFit}>Fit</button>
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar-group">
          <button onClick={onImportClick}>Import</button>
          <button onClick={onExport}>Export</button>
          <button className="btn-primary" onClick={onSimulate}>Simulate</button>
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
          <div className="canvas-meta">Mode {mode} • Zoom {zoom}%</div>
        </div>

        <aside className="panel panel-right">
          <h3>Properties</h3>
          <div ref={propertyRef} className="panel-body" />
        </aside>
      </div>

      <div className="status-row">
        <span>{status}</span>
        <span>Tip: Space+drag (or Ctrl+drag) pans. Scroll zooms. Arrow keys nudge selected nodes.</span>
        <span>{stats.nodes} nodes</span>
        <span>{stats.links} links</span>
      </div>
    </section>
  );
}

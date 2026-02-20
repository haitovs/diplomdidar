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
  };

  const onSimulate = () => {
    const editor = instancesRef.current.editor;
    if (!editor) return;

    localStorage.setItem(STORAGE_KEYS.playgroundTopology, JSON.stringify(editor.getSerializableTopology()));
    navigate('/simulation');
  };

  return (
    <section className="page page-playground">
      <div className="toolbar">
        <button onClick={() => setEditorMode('select')} className={mode === 'select' ? 'active' : ''}>Select</button>
        <button onClick={() => setEditorMode('addNode')} className={mode === 'addNode' ? 'active' : ''}>Add Node</button>
        <button onClick={() => setEditorMode('addLink')} className={mode === 'addLink' ? 'active' : ''}>Add Link</button>
        <button onClick={onUndo}>Undo</button>
        <button onClick={onRedo}>Redo</button>
        <button onClick={onClear}>Clear</button>
        <button onClick={onFit}>Fit</button>
        <button onClick={onImportClick}>Import</button>
        <button onClick={onExport}>Export</button>
        <button className="btn-primary" onClick={onSimulate}>Simulate</button>
        <input ref={importInputRef} type="file" accept="application/json" onChange={onImportFile} hidden />
      </div>

      <div className="workspace-grid">
        <aside className="panel panel-left">
          <h3>Device Palette</h3>
          <div ref={paletteRef} className="panel-body" />
        </aside>

        <div className="canvas-area">
          <canvas ref={canvasRef} className="editor-canvas" />
          <div className="canvas-meta">Zoom {zoom}%</div>
        </div>

        <aside className="panel panel-right">
          <h3>Properties</h3>
          <div ref={propertyRef} className="panel-body" />
        </aside>
      </div>

      <div className="status-row">
        <span>{status}</span>
        <span>{stats.nodes} nodes</span>
        <span>{stats.links} links</span>
      </div>
    </section>
  );
}

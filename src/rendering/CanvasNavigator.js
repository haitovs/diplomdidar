/**
 * Canvas Navigation Controller
 * Handles zoom (mouse wheel) and pan (middle-click, Ctrl+drag, or Space+drag) for the network canvas.
 * Works with CanvasRenderer's transform system.
 */
export class CanvasNavigator {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @param {function(Object): void} options.onTransformChange - called with { scale, offsetX, offsetY }
   * @param {function(number, number): Object|null} [options.findNodeAt] - optional hit-test to avoid pan on node drag
   * @param {number} [options.minScale=0.3]
   * @param {number} [options.maxScale=3.0]
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.onTransformChange = options.onTransformChange || (() => {});
    this.findNodeAt = options.findNodeAt || null;
    this.minScale = options.minScale ?? 0.3;
    this.maxScale = options.maxScale ?? 3.0;
    this.enableSpacePan = options.enableSpacePan ?? true;

    // Transform state
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Pan state
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._panStartOffsetX = 0;
    this._panStartOffsetY = 0;
    this._spacePressed = false;
    this._cursorBeforePan = '';

    // Bind handlers
    this._onWheel = this._onWheel.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onDblClick = this._onDblClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onWindowBlur = this._onWindowBlur.bind(this);

    // Attach
    canvas.addEventListener('wheel', this._onWheel, { passive: false });
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('dblclick', this._onDblClick);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onWindowBlur);
  }

  /** Get current transform object */
  getTransform() {
    return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
  }

  /** Convert screen coordinates to world coordinates */
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale,
    };
  }

  /** Convert world coordinates to screen coordinates */
  worldToScreen(wx, wy) {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY,
    };
  }

  /** Reset to default view */
  resetView() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this._emitChange();
  }

  /** Fit all nodes into view */
  fitToContent(nodes, padding = 60) {
    if (!nodes || nodes.length === 0) {
      this.resetView();
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    });

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const canvasW = this.canvas.width / (window.devicePixelRatio || 1);
    const canvasH = this.canvas.height / (window.devicePixelRatio || 1);

    const scaleX = canvasW / contentWidth;
    const scaleY = canvasH / contentHeight;
    this.scale = Math.min(scaleX, scaleY, this.maxScale);
    this.scale = Math.max(this.scale, this.minScale);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.offsetX = canvasW / 2 - centerX * this.scale;
    this.offsetY = canvasH / 2 - centerY * this.scale;

    this._emitChange();
  }

  // ---- Private handlers ----

  _onWheel(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom factor
    const zoomIntensity = 0.08;
    const delta = e.deltaY > 0 ? -1 : 1;
    const factor = 1 + delta * zoomIntensity;

    const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));
    if (newScale === this.scale) return;

    // Zoom towards cursor position
    const scaleRatio = newScale / this.scale;
    this.offsetX = mouseX - (mouseX - this.offsetX) * scaleRatio;
    this.offsetY = mouseY - (mouseY - this.offsetY) * scaleRatio;
    this.scale = newScale;

    this._emitChange();
  }

  _onMouseDown(e) {
    const isSpacePan = this.enableSpacePan && this._spacePressed && e.button === 0;

    // Middle mouse button OR Ctrl+left click = pan
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey)) || isSpacePan) {
      this._startPan(e);
      return;
    }

    // Right-click pan (optional — also handle button 2 for convenience)
    if (e.button === 2) {
      this._startPan(e);
    }
  }

  _onMouseMove(e) {
    if (!this._isPanning) return;

    const dx = e.clientX - this._panStartX;
    const dy = e.clientY - this._panStartY;
    this.offsetX = this._panStartOffsetX + dx;
    this.offsetY = this._panStartOffsetY + dy;

    this._emitChange();
  }

  _onMouseUp(e) {
    this._stopPan();
  }

  _onDblClick(e) {
    // Double-click to fit view (only if not on a node)
    if (e.ctrlKey || e.metaKey) {
      this.resetView();
    }
  }

  _onKeyDown(e) {
    if (!this.enableSpacePan || e.code !== 'Space') return;
    const target = e.target;
    const tagName = target?.tagName?.toLowerCase?.() || '';
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) {
      return;
    }
    e.preventDefault();
    this._spacePressed = true;
  }

  _onKeyUp(e) {
    if (e.code !== 'Space') return;
    this._spacePressed = false;
  }

  _onWindowBlur() {
    this._spacePressed = false;
    this._stopPan();
  }

  _startPan(e) {
    e.preventDefault();
    this._isPanning = true;
    this._panStartX = e.clientX;
    this._panStartY = e.clientY;
    this._panStartOffsetX = this.offsetX;
    this._panStartOffsetY = this.offsetY;
    this._cursorBeforePan = this.canvas.style.cursor || '';
    this.canvas.style.cursor = 'grabbing';
  }

  _stopPan() {
    if (!this._isPanning) return;
    this._isPanning = false;
    this.canvas.style.cursor = this._cursorBeforePan;
    this._cursorBeforePan = '';
  }

  _emitChange() {
    this.onTransformChange(this.getTransform());
  }

  /** Check if currently panning (for other handlers to know) */
  get isPanning() {
    return this._isPanning;
  }

  /** Cleanup */
  destroy() {
    this._stopPan();
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('dblclick', this._onDblClick);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onWindowBlur);
  }
}

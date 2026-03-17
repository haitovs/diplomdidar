/**
 * Canvas Navigation Controller
 * Handles zoom (mouse wheel) and pan (middle-click, Ctrl+drag, Space+drag, or Hand-tool left drag) for the network canvas.
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
    this.isPanToolActive = options.isPanToolActive || (() => false);

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

    // Touch state
    this._activeTouches = [];
    this._lastPinchDist = 0;
    this._lastPinchCenter = null;

    // Bind handlers
    this._onWheel = this._onWheel.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onDblClick = this._onDblClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onWindowBlur = this._onWindowBlur.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    // Attach
    canvas.addEventListener('wheel', this._onWheel, { passive: false });
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('dblclick', this._onDblClick);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onWindowBlur);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd);
    canvas.addEventListener('touchcancel', this._onTouchEnd);
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
    const zoomIntensity = 0.05;
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
    const isPanToolDrag = e.button === 0 && this.isPanToolActive();

    // Middle mouse button OR Ctrl+left click = pan
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey)) || isSpacePan || isPanToolDrag) {
      // Don't pan if clicking on a node (let drag handle it)
      if (this.findNodeAt && e.button === 0 && !isSpacePan && !isPanToolDrag) {
        const rect = this.canvas.getBoundingClientRect();
        const vx = e.clientX - rect.left;
        const vy = e.clientY - rect.top;
        const wx = (vx - this.offsetX) / this.scale;
        const wy = (vy - this.offsetY) / this.scale;
        if (this.findNodeAt(wx, wy)) return;
      }
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

  // ── Touch handlers for mobile pan & pinch-zoom ──

  _pinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  _pinchCenter(touches) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
      y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
    };
  }

  _onTouchStart(e) {
    this._activeTouches = Array.from(e.touches);

    if (e.touches.length === 2) {
      // Start pinch-zoom
      e.preventDefault();
      this._lastPinchDist = this._pinchDist(e.touches);
      this._lastPinchCenter = this._pinchCenter(e.touches);
      this._panStartOffsetX = this.offsetX;
      this._panStartOffsetY = this.offsetY;
      this._isPanning = true;
    } else if (e.touches.length === 1) {
      // Check if touch is on a node — if so, let TopologyEditor handle it
      const rect = this.canvas.getBoundingClientRect();
      const viewX = e.touches[0].clientX - rect.left;
      const viewY = e.touches[0].clientY - rect.top;
      const wx = (viewX - this.offsetX) / this.scale;
      const wy = (viewY - this.offsetY) / this.scale;
      if (this.findNodeAt && this.findNodeAt(wx, wy)) {
        // Node touch — don't start pan
        return;
      }
      // Single-finger pan (no node hit)
      e.preventDefault();
      this._isPanning = true;
      this._panStartX = e.touches[0].clientX;
      this._panStartY = e.touches[0].clientY;
      this._panStartOffsetX = this.offsetX;
      this._panStartOffsetY = this.offsetY;
      this._cursorBeforePan = this.canvas.style.cursor || '';
    }
  }

  _onTouchMove(e) {
    if (!this._isPanning) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      // Pinch zoom
      const newDist = this._pinchDist(e.touches);
      const center = this._pinchCenter(e.touches);

      if (this._lastPinchDist > 0) {
        const factor = newDist / this._lastPinchDist;
        const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));
        if (newScale !== this.scale) {
          const scaleRatio = newScale / this.scale;
          this.offsetX = center.x - (center.x - this.offsetX) * scaleRatio;
          this.offsetY = center.y - (center.y - this.offsetY) * scaleRatio;
          this.scale = newScale;
        }
      }
      this._lastPinchDist = newDist;
      this._lastPinchCenter = center;
      this._emitChange();
    } else if (e.touches.length === 1) {
      e.preventDefault();
      // Single-finger pan
      const dx = e.touches[0].clientX - this._panStartX;
      const dy = e.touches[0].clientY - this._panStartY;
      this.offsetX = this._panStartOffsetX + dx;
      this.offsetY = this._panStartOffsetY + dy;
      this._emitChange();
    }
  }

  _onTouchEnd(e) {
    this._activeTouches = Array.from(e.touches);
    if (e.touches.length === 0) {
      this._isPanning = false;
      this._lastPinchDist = 0;
      this._lastPinchCenter = null;
    } else if (e.touches.length === 1) {
      // Went from pinch to single finger — reset pan start
      this._panStartX = e.touches[0].clientX;
      this._panStartY = e.touches[0].clientY;
      this._panStartOffsetX = this.offsetX;
      this._panStartOffsetY = this.offsetY;
      this._lastPinchDist = 0;
    }
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
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this._onTouchEnd);
  }
}

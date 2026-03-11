// Unified Pointer Events Handler (mouse, touch, pen)
window.PAP = window.PAP || {};

PAP.PointerHandler = class PointerHandler {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.zoom = options.zoom || 16;
        this.canvasWidth = options.canvasWidth || 32;
        this.canvasHeight = options.canvasHeight || 32;

        // Callbacks
        this.onStrokeStart = null;  // (ctx) => {}
        this.onStrokeMove = null;   // (ctx) => {}
        this.onStrokeEnd = null;    // (ctx) => {}
        this.onHover = null;        // (ctx) => {}

        // State
        this._activePointerId = null;
        this._isDrawing = false;
        this._startX = 0;
        this._startY = 0;
        this._lastX = 0;
        this._lastY = 0;

        this._bindEvents();
    }

    _bindEvents() {
        const c = this.canvas;

        c.addEventListener('pointerdown', (e) => this._onPointerDown(e));
        c.addEventListener('pointermove', (e) => this._onPointerMove(e));
        c.addEventListener('pointerup', (e) => this._onPointerUp(e));
        c.addEventListener('pointercancel', (e) => this._onPointerUp(e));
        c.addEventListener('pointerleave', (e) => this._onPointerLeave(e));
        c.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    _getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.zoom);
        const y = Math.floor((e.clientY - rect.top) / this.zoom);
        return { x, y };
    }

    _isInBounds(x, y) {
        return x >= 0 && x < this.canvasWidth && y >= 0 && y < this.canvasHeight;
    }

    _makeContext(e, x, y) {
        return {
            x,
            y,
            startX: this._startX,
            startY: this._startY,
            lastX: this._lastX,
            lastY: this._lastY,
            pressure: e.pressure || 0,
            pointerType: e.pointerType || 'mouse', // 'mouse', 'touch', 'pen'
            tiltX: e.tiltX || 0,
            tiltY: e.tiltY || 0,
            button: e.button,
            buttons: e.buttons,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            inBounds: this._isInBounds(x, y)
        };
    }

    _onPointerDown(e) {
        // Only track primary pointer (first finger / main mouse button area)
        if (this._activePointerId !== null) return;

        const { x, y } = this._getCanvasCoords(e);
        if (!this._isInBounds(x, y)) return;

        this._activePointerId = e.pointerId;
        this._isDrawing = true;
        this._startX = x;
        this._startY = y;
        this._lastX = x;
        this._lastY = y;

        // Capture pointer so events continue even if pointer leaves canvas
        this.canvas.setPointerCapture(e.pointerId);

        const ctx = this._makeContext(e, x, y);
        if (this.onStrokeStart) this.onStrokeStart(ctx);
    }

    _onPointerMove(e) {
        const { x, y } = this._getCanvasCoords(e);

        if (!this._isDrawing) {
            // Hover only
            const ctx = this._makeContext(e, x, y);
            if (this.onHover) this.onHover(ctx);
            return;
        }

        if (e.pointerId !== this._activePointerId) return;

        const ctx = this._makeContext(e, x, y);
        if (this.onStrokeMove) this.onStrokeMove(ctx);

        this._lastX = x;
        this._lastY = y;
    }

    _onPointerUp(e) {
        if (e.pointerId !== this._activePointerId) return;

        const { x, y } = this._getCanvasCoords(e);
        const ctx = this._makeContext(e, x, y);

        this._isDrawing = false;
        this._activePointerId = null;

        try {
            this.canvas.releasePointerCapture(e.pointerId);
        } catch (_) { /* ignore if already released */ }

        if (this.onStrokeEnd) this.onStrokeEnd(ctx);
    }

    _onPointerLeave(e) {
        if (!this._isDrawing) return;
        // Don't end stroke on leave when captured - pointerup will handle it
    }

    get isDrawing() {
        return this._isDrawing;
    }

    get startX() { return this._startX; }
    get startY() { return this._startY; }

    updateDimensions(canvasWidth, canvasHeight, zoom) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.zoom = zoom;
    }
};

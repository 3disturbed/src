// Gesture Handler - Pinch-to-zoom and two-finger pan for DarkPixel
window.PAP = window.PAP || {};

PAP.GestureHandler = class GestureHandler {
    constructor(element, options = {}) {
        this.element = element;
        this.onZoom = options.onZoom || null;   // (newZoom) => {}
        this.onPan = options.onPan || null;     // (dx, dy) => {}

        this._pointers = new Map();
        this._lastPinchDist = 0;
        this._initialZoom = 1;
        this._zoomMin = options.zoomMin || 1;
        this._zoomMax = options.zoomMax || 32;
        this._currentZoom = options.currentZoom || 16;

        this._bindEvents();
    }

    _bindEvents() {
        const el = this.element;

        el.addEventListener('pointerdown', (e) => this._onDown(e));
        el.addEventListener('pointermove', (e) => this._onMove(e));
        el.addEventListener('pointerup', (e) => this._onUp(e));
        el.addEventListener('pointercancel', (e) => this._onUp(e));

        // Prevent default touch gestures on the canvas area
        el.addEventListener('touchstart', (e) => {
            if (e.touches.length >= 2) e.preventDefault();
        }, { passive: false });
        el.addEventListener('touchmove', (e) => {
            if (e.touches.length >= 2) e.preventDefault();
        }, { passive: false });

        // Mouse wheel zoom
        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            this._currentZoom = Math.max(this._zoomMin, Math.min(this._zoomMax, this._currentZoom + delta));
            if (this.onZoom) this.onZoom(this._currentZoom);
        }, { passive: false });
    }

    _onDown(e) {
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this._pointers.size === 2) {
            this._lastPinchDist = this._getPinchDistance();
            this._initialZoom = this._currentZoom;
        }
    }

    _onMove(e) {
        if (!this._pointers.has(e.pointerId)) return;

        const prev = this._pointers.get(e.pointerId);
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this._pointers.size === 2) {
            const dist = this._getPinchDistance();

            if (this._lastPinchDist > 0) {
                const scale = dist / this._lastPinchDist;
                let newZoom = Math.round(this._initialZoom * scale);
                newZoom = Math.max(this._zoomMin, Math.min(this._zoomMax, newZoom));

                if (newZoom !== this._currentZoom) {
                    this._currentZoom = newZoom;
                    if (this.onZoom) this.onZoom(this._currentZoom);
                }
            }
        }
    }

    _onUp(e) {
        this._pointers.delete(e.pointerId);

        if (this._pointers.size < 2) {
            this._lastPinchDist = 0;
        }
    }

    _getPinchDistance() {
        const pts = Array.from(this._pointers.values());
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    updateZoom(zoom) {
        this._currentZoom = zoom;
    }
};

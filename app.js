// Main Application Logic for DarkPixel v2.1 - UX Revamp

class DarkPixel {
    constructor() {
        this.canvas = document.getElementById('pixelCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // State
        this.canvasWidth = 32;
        this.canvasHeight = 32;
        this.zoom = 16;
        this.currentTool = 'pencil';
        this.fgColor = new Color(0, 0, 0);
        this.bgColor = new Color(255, 255, 255);
        this.currentColor = this.fgColor;
        this.brushSize = 1;
        this.gridEnabled = true;
        this.mirrorEnabled = false;

        // Built-in palette (DB16-inspired)
        this.palette = [
            '#140c1c','#442434','#30346d','#4e4a4e','#854c30','#346524',
            '#d04648','#757161','#597dce','#d27d2c','#8595a1','#6daa2c',
            '#d2aa99','#6dc2ca','#dad45e','#deeed6',
            '#000000','#222222','#555555','#888888','#bbbbbb','#ffffff',
            '#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff',
            '#ff8800','#8800ff','#0088ff','#ff0088'
        ];

        // Managers
        this.layerManager = new LayerManager(this.canvasWidth, this.canvasHeight);
        this.frameManager = new FrameManager(this.layerManager);
        this.compositor = new PAP.Compositor(this.canvasWidth, this.canvasHeight);
        this.renderer = new PAP.Renderer(this.canvas);
        this.animationPlayer = new AnimationPlayer(this.frameManager, this.canvas, this.compositor);
        this.onionSkinRenderer = new OnionSkinRenderer();

        // Preview canvas
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

        // History
        this.history = new PAP.CommandHistory(50);
        this._currentDrawCommand = null;

        // Input
        this.pointerHandler = new PAP.PointerHandler(this.canvas, {
            zoom: this.zoom, canvasWidth: this.canvasWidth, canvasHeight: this.canvasHeight
        });
        this.keyboardHandler = new PAP.KeyboardHandler();

        // Gesture handler for pinch-to-zoom and wheel zoom
        const canvasScroll = document.getElementById('canvasScroll');
        this.gestureHandler = new PAP.GestureHandler(canvasScroll || this.canvas, {
            currentZoom: this.zoom,
            zoomMin: 1,
            zoomMax: 32,
            onZoom: (newZoom) => {
                this.zoom = newZoom;
                this._applyZoom();
            }
        });

        this._mouseX = 0;
        this._mouseY = 0;

        // Lasso tool state
        this._lassoPoints = [];
        this._lassoSelection = null; // stored selection polygon after lasso completes

        this._initializeCanvas();
        this._bindPointerEvents();
        this._bindKeyboardShortcuts();
        this._bindUIEvents();
        this._bindEventBus();
        this._initPalette();
        this._initCollapsiblePanels();
        this._updateColorSwatches();
        this.render();
    }

    _initializeCanvas() {
        this.renderer.resizeCanvas(this.canvasWidth, this.canvasHeight, this.zoom);
        if (this.previewCanvas) {
            this.previewCanvas.width = this.canvasWidth;
            this.previewCanvas.height = this.canvasHeight;
        }
    }

    // --- Palette ---

    _initPalette() {
        const grid = document.getElementById('paletteGrid');
        if (!grid) return;
        grid.innerHTML = '';
        this.palette.forEach((hex, i) => {
            const swatch = document.createElement('div');
            swatch.className = 'palette-swatch';
            swatch.style.background = hex;
            swatch.title = hex;
            swatch.addEventListener('click', () => {
                this.fgColor = Color.fromHex(hex);
                this.currentColor = this.fgColor;
                this._updateColorSwatches();
                // Highlight active swatch
                grid.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.bgColor = Color.fromHex(hex);
                this._updateColorSwatches();
            });
            grid.appendChild(swatch);
        });
    }

    _updateColorSwatches() {
        const fg = document.getElementById('fgSwatch');
        const bg = document.getElementById('bgSwatch');
        const hex = document.getElementById('colorHex');
        const picker = document.getElementById('colorPicker');
        if (fg) fg.style.background = this.fgColor.toCSSString();
        if (bg) bg.style.background = this.bgColor.toCSSString();
        if (hex) hex.textContent = this.fgColor.toHex();
        if (picker) picker.value = this.fgColor.toHex();
    }

    // --- Collapsible Panels ---

    _initCollapsiblePanels() {
        document.querySelectorAll('.panel-header[data-panel]').forEach(header => {
            header.addEventListener('click', (e) => {
                // Don't collapse when clicking the switch
                if (e.target.closest('.panel-switch')) return;
                const panel = header.closest('.panel');
                panel.classList.toggle('collapsed');
            });
        });
    }

    // --- Pointer Events ---

    _bindPointerEvents() {
        this.pointerHandler.onStrokeStart = (ctx) => {
            const layer = this.layerManager.getActiveLayer();
            if (!layer) return;

            this._currentDrawCommand = new PAP.DrawCommand(layer, this.currentTool);
            this._currentDrawCommand.captureBeforeState();

            this._mouseX = ctx.x;
            this._mouseY = ctx.y;

            // Right-click uses bg color for pencil, transparent for eraser
            if (ctx.button === 2) {
                this.currentColor = this.bgColor;
            } else {
                this.currentColor = this.fgColor;
            }

            // Lasso tools: start collecting points
            if (this.currentTool === 'lasso' || this.currentTool === 'lassoFill') {
                this._lassoPoints = [{ x: ctx.x, y: ctx.y }];
                this._lassoSelection = null;
            } else if (this.currentTool === 'eyedropper') {
                this._pickColor(ctx.x, ctx.y);
            } else {
                this._performToolAction(ctx.x, ctx.y, ctx.button, ctx.pressure);
            }
            this.render();
        };

        this.pointerHandler.onStrokeMove = (ctx) => {
            this._mouseX = ctx.x;
            this._mouseY = ctx.y;

            if (this.currentTool === 'lasso' || this.currentTool === 'lassoFill') {
                // Add point if it moved to a new pixel
                const last = this._lassoPoints[this._lassoPoints.length - 1];
                if (last && (last.x !== ctx.x || last.y !== ctx.y)) {
                    this._lassoPoints.push({ x: ctx.x, y: ctx.y });
                }
            } else if (['pencil', 'eraser'].includes(this.currentTool)) {
                this._performToolAction(ctx.x, ctx.y, 0, ctx.pressure);
            }
            this.render();
        };

        this.pointerHandler.onStrokeEnd = (ctx) => {
            if (this.currentTool === 'lasso' || this.currentTool === 'lassoFill') {
                this._finalizeLasso();
            } else if (['line', 'rect', 'circle', 'rectFilled', 'circleFilled'].includes(this.currentTool)) {
                this._finalizeShape(ctx.x, ctx.y);
            }

            if (this._currentDrawCommand) {
                const hasChanges = this._currentDrawCommand.captureAfterState();
                if (hasChanges) this.history.push(this._currentDrawCommand);
                this._currentDrawCommand = null;
            }

            // Reset to fg color
            this.currentColor = this.fgColor;
            this.render();
        };

        this.pointerHandler.onHover = (ctx) => {
            this._mouseX = ctx.x;
            this._mouseY = ctx.y;
            if (ctx.inBounds) {
                const info = document.getElementById('pixelInfo');
                if (info) info.textContent = `${ctx.x}, ${ctx.y}`;
                this.render();
            }
        };
    }

    // --- Keyboard ---

    _bindKeyboardShortcuts() {
        const kb = this.keyboardHandler;

        kb.register('p', () => this.selectTool('pencil'));
        kb.register('e', () => this.selectTool('eraser'));
        kb.register('b', () => this.selectTool('fill'));
        kb.register('i', () => this.selectTool('eyedropper'));
        kb.register('l', () => this.selectTool('line'));
        kb.register('r', () => this.selectTool('rect'));
        kb.register('c', () => this.selectTool('circle'));
        kb.register('shift+r', () => this.selectTool('rectFilled'));
        kb.register('shift+c', () => this.selectTool('circleFilled'));
        kb.register('s', () => this.selectTool('lasso'));
        kb.register('shift+s', () => this.selectTool('lassoFill'));

        // Lasso selection actions
        kb.register('delete', () => this._lassoDeleteSelection());
        kb.register('backspace', () => this._lassoDeleteSelection());
        kb.register('enter', () => this._lassoFillSelection());
        kb.register('escape', () => this._clearLassoSelection());

        kb.register('x', () => this._swapColors());
        kb.register('g', () => this._toggleGrid());
        kb.register('m', () => this._toggleMirror());

        kb.register('ctrl+z', () => this.undo());
        kb.register('ctrl+y', () => this.redo());
        kb.register('ctrl+shift+z', () => this.redo());
        kb.register('ctrl+s', () => this.saveProject());
        kb.register('ctrl+n', () => this.newProject());
        kb.register('ctrl+o', () => document.getElementById('loadProjectInput').click());

        // Zoom shortcuts
        kb.register('=', () => this._adjustZoom(1));
        kb.register('-', () => this._adjustZoom(-1));
        kb.register('0', () => { this.zoom = 16; this._applyZoom(); });

        // Brush size
        kb.register('[', () => { this.brushSize = Math.max(1, this.brushSize - 1); this._updateBrushUI(); });
        kb.register(']', () => { this.brushSize = Math.min(32, this.brushSize + 1); this._updateBrushUI(); });
    }

    _swapColors() {
        const tmp = this.fgColor;
        this.fgColor = this.bgColor;
        this.bgColor = tmp;
        this.currentColor = this.fgColor;
        this._updateColorSwatches();
    }

    _toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        const btn = document.getElementById('gridToggleBtn');
        if (btn) btn.classList.toggle('active', this.gridEnabled);
        this.render();
    }

    _toggleMirror() {
        this.mirrorEnabled = !this.mirrorEnabled;
        const btn = document.getElementById('mirrorToggleBtn');
        if (btn) btn.classList.toggle('active', this.mirrorEnabled);
        this.render();
    }

    _adjustZoom(delta) {
        this.zoom = Math.max(1, Math.min(32, this.zoom + delta));
        this._applyZoom();
    }

    _applyZoom() {
        const slider = document.getElementById('zoomSlider');
        const display = document.getElementById('zoomDisplay');
        if (slider) slider.value = this.zoom;
        if (display) display.textContent = this.zoom + 'x';
        this.renderer.resizeCanvas(this.canvasWidth, this.canvasHeight, this.zoom);
        this.pointerHandler.updateDimensions(this.canvasWidth, this.canvasHeight, this.zoom);
        if (this.gestureHandler) this.gestureHandler.updateZoom(this.zoom);
        this.render();
    }

    _updateBrushUI() {
        const slider = document.getElementById('brushSize');
        const label = document.getElementById('brushSizeLabel');
        if (slider) slider.value = this.brushSize;
        if (label) label.textContent = this.brushSize;
    }

    // --- UI Events ---

    _bindUIEvents() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool) this.selectTool(tool);
            });
        });

        // FG/BG color swatches
        const fgSwatch = document.getElementById('fgSwatch');
        const bgSwatch = document.getElementById('bgSwatch');
        const picker = document.getElementById('colorPicker');

        if (fgSwatch) fgSwatch.addEventListener('click', () => {
            this._colorTarget = 'fg';
            picker.value = this.fgColor.toHex();
            picker.click();
        });
        if (bgSwatch) bgSwatch.addEventListener('click', () => {
            this._colorTarget = 'bg';
            picker.value = this.bgColor.toHex();
            picker.click();
        });
        if (picker) picker.addEventListener('input', (e) => {
            const c = Color.fromHex(e.target.value);
            if (this._colorTarget === 'bg') {
                this.bgColor = c;
            } else {
                this.fgColor = c;
                this.currentColor = c;
            }
            this._updateColorSwatches();
        });

        // Swap colors button
        const swapBtn = document.getElementById('swapColorsBtn');
        if (swapBtn) swapBtn.addEventListener('click', () => this._swapColors());

        // Brush size
        const brushSlider = document.getElementById('brushSize');
        if (brushSlider) brushSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeLabel').textContent = this.brushSize;
        });

        // Zoom
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider) zoomSlider.addEventListener('input', (e) => {
            this.zoom = parseInt(e.target.value);
            this._applyZoom();
        });
        const zoomIn = document.getElementById('zoomInBtn');
        const zoomOut = document.getElementById('zoomOutBtn');
        if (zoomIn) zoomIn.addEventListener('click', () => this._adjustZoom(1));
        if (zoomOut) zoomOut.addEventListener('click', () => this._adjustZoom(-1));

        // Grid and Mirror toggle buttons
        const gridBtn = document.getElementById('gridToggleBtn');
        if (gridBtn) gridBtn.addEventListener('click', () => this._toggleGrid());
        const mirrorBtn = document.getElementById('mirrorToggleBtn');
        if (mirrorBtn) mirrorBtn.addEventListener('click', () => this._toggleMirror());

        // Canvas size
        const resizeBtn = document.getElementById('resizeCanvasBtn');
        if (resizeBtn) resizeBtn.addEventListener('click', () => {
            const w = parseInt(document.getElementById('canvasWidth').value);
            const h = parseInt(document.getElementById('canvasHeight').value);
            if (w > 0 && h > 0) this.resizeCanvas(w, h);
        });

        // Size presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const size = parseInt(btn.dataset.size);
                document.getElementById('canvasWidth').value = size;
                document.getElementById('canvasHeight').value = size;
                this.resizeCanvas(size, size);
            });
        });

        // Layer controls
        document.getElementById('newLayerBtn').addEventListener('click', () => { this.layerManager.addLayer(); this.render(); });
        document.getElementById('deleteLayerBtn').addEventListener('click', () => { this.layerManager.deleteLayer(this.layerManager.activeLayerIndex); this.render(); });
        document.getElementById('duplicateLayerBtn').addEventListener('click', () => { this.layerManager.duplicateLayer(this.layerManager.activeLayerIndex); this.render(); });

        const mergeBtn = document.getElementById('mergeLayerBtn');
        if (mergeBtn) mergeBtn.addEventListener('click', () => { this.layerManager.mergeDown(this.layerManager.activeLayerIndex); this.render(); });

        // Frame controls
        document.getElementById('newFrameBtn').addEventListener('click', () => { this.frameManager.addFrame(); this.render(); });
        document.getElementById('deleteFrameBtn').addEventListener('click', () => { this.frameManager.deleteFrame(this.frameManager.currentFrameIndex); this.render(); });

        const dupFrameBtn = document.getElementById('dupFrameBtn');
        if (dupFrameBtn) dupFrameBtn.addEventListener('click', () => { this.frameManager.duplicateFrame(this.frameManager.currentFrameIndex); this.render(); });

        // FPS
        const fpsSlider = document.getElementById('fpsSlider');
        const fpsInput = document.getElementById('fpsInput');
        if (fpsSlider) fpsSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value);
            this.frameManager.setFPS(v);
            if (fpsInput) fpsInput.value = v;
        });
        if (fpsInput) fpsInput.addEventListener('change', (e) => {
            const v = parseInt(e.target.value);
            this.frameManager.setFPS(v);
            if (fpsSlider) fpsSlider.value = v;
        });

        // Animation controls
        document.getElementById('playAnimationBtn').addEventListener('click', () => this.animationPlayer.play());
        document.getElementById('stopAnimationBtn').addEventListener('click', () => { this.animationPlayer.stop(); this.render(); });

        // Onion skin
        document.getElementById('onionSkinToggle').addEventListener('change', (e) => { this.onionSkinRenderer.enabled = e.target.checked; this.render(); });
        document.getElementById('onionSkinOpacity').addEventListener('input', (e) => {
            this.onionSkinRenderer.opacity = parseInt(e.target.value) / 100;
            document.getElementById('opacityLabel').textContent = e.target.value + '%';
            this.render();
        });
        document.getElementById('onionSkinBack').addEventListener('change', (e) => { this.onionSkinRenderer.framesBack = parseInt(e.target.value); this.render(); });
        document.getElementById('onionSkinForward').addEventListener('change', (e) => { this.onionSkinRenderer.framesForward = parseInt(e.target.value); this.render(); });

        // Edit controls
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());

        // File controls
        document.getElementById('newProjectBtn').addEventListener('click', () => this.newProject());
        document.getElementById('openProjectBtn').addEventListener('click', () => document.getElementById('loadProjectInput').click());
        document.getElementById('loadProjectInput').addEventListener('change', (e) => { if (e.target.files[0]) this.loadProject(e.target.files[0]); });
        document.getElementById('saveProjectBtn').addEventListener('click', () => this.saveProject());

        // Export
        document.getElementById('exportPNGBtn').addEventListener('click', () => this.exportPNG());
        document.getElementById('exportGIFBtn').addEventListener('click', () => this.exportGIF());
        document.getElementById('exportJSONBtn').addEventListener('click', () => this.exportJSON());
    }

    // --- EventBus ---

    _bindEventBus() {
        PAP.EventBus.on('layers:changed', () => { this.layerManager.renderLayersList(); this.render(); });
        PAP.EventBus.on('layers:activeChanged', () => { this.layerManager.renderLayersList(); });
        PAP.EventBus.on('history:undo', () => this.render());
        PAP.EventBus.on('history:redo', () => this.render());
    }

    // --- Tools ---

    selectTool(tool) {
        // Clear lasso selection when switching away from lasso tools
        if (this.currentTool !== tool && (this.currentTool === 'lasso' || this.currentTool === 'lassoFill')) {
            this._lassoSelection = null;
            this._lassoPoints = [];
        }
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        const toolInfo = document.getElementById('toolInfo');
        if (toolInfo) {
            const names = { pencil:'Pencil', eraser:'Eraser', fill:'Fill', eyedropper:'Eyedropper', line:'Line', rect:'Rectangle', circle:'Circle', rectFilled:'Filled Rect', circleFilled:'Filled Circle', lasso:'Lasso', lassoFill:'Lasso Fill' };
            toolInfo.textContent = names[tool] || tool;
        }
    }

    _performToolAction(x, y, button, pressure) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer || layer.locked) return;

        const color = this.currentColor;

        switch (this.currentTool) {
            case 'pencil': {
                this._drawBrush(layer, x, y, color);
                if (this.mirrorEnabled) {
                    const mx = this.canvasWidth - 1 - x;
                    this._drawBrush(layer, mx, y, color);
                }
                break;
            }
            case 'eraser': {
                const transparent = new Color(0, 0, 0, 0);
                this._drawBrush(layer, x, y, transparent);
                if (this.mirrorEnabled) {
                    const mx = this.canvasWidth - 1 - x;
                    this._drawBrush(layer, mx, y, transparent);
                }
                break;
            }
            case 'fill':
                floodFill(layer.pixelData, x, y, color);
                break;
        }
    }

    _drawBrush(layer, x, y, color) {
        const offset = Math.floor(this.brushSize / 2);
        for (let dy = 0; dy < this.brushSize; dy++) {
            for (let dx = 0; dx < this.brushSize; dx++) {
                layer.setPixel(x - offset + dx, y - offset + dy, color);
            }
        }
    }

    _finalizeShape(endX, endY) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer || layer.locked) return;

        const startX = this.pointerHandler.startX;
        const startY = this.pointerHandler.startY;
        const color = this.currentColor;

        switch (this.currentTool) {
            case 'line':
                drawLine(layer.pixelData, startX, startY, endX, endY, color);
                if (this.mirrorEnabled) {
                    drawLine(layer.pixelData, this.canvasWidth - 1 - startX, startY, this.canvasWidth - 1 - endX, endY, color);
                }
                break;
            case 'rect':
                drawRect(layer.pixelData, startX, startY, endX, endY, color, false);
                break;
            case 'rectFilled':
                drawRect(layer.pixelData, startX, startY, endX, endY, color, true);
                break;
            case 'circle': {
                const r = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
                drawCircle(layer.pixelData, startX, startY, r, color, false);
                break;
            }
            case 'circleFilled': {
                const r = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
                drawCircle(layer.pixelData, startX, startY, r, color, true);
                break;
            }
        }
    }

    _pickColor(x, y) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer) return;
        const pixel = layer.pixelData.getPixel(x, y);
        this.fgColor = new Color(pixel.r, pixel.g, pixel.b, pixel.a);
        this.currentColor = this.fgColor;
        this._updateColorSwatches();
    }

    _finalizeLasso() {
        if (this._lassoPoints.length < 3) {
            this._lassoPoints = [];
            return;
        }

        const layer = this.layerManager.getActiveLayer();
        if (!layer || layer.locked) {
            this._lassoPoints = [];
            return;
        }

        if (this.currentTool === 'lassoFill') {
            // Fill the polygon immediately
            PAP.fillPolygon(layer.pixelData, this._lassoPoints, this.currentColor);
            this._lassoPoints = [];
            this._lassoSelection = null;
        } else {
            // Lasso select: store selection for later actions (Delete/Enter)
            this._lassoSelection = [...this._lassoPoints];
            this._lassoPoints = [];
            this._startMarchingAnts();
        }
    }

    _lassoDeleteSelection() {
        if (!this._lassoSelection || this._lassoSelection.length < 3) return;
        const layer = this.layerManager.getActiveLayer();
        if (!layer || layer.locked) return;

        const cmd = new PAP.DrawCommand(layer, 'lasso-delete');
        cmd.captureBeforeState();

        const transparent = new PAP.Color(0, 0, 0, 0);
        PAP.fillPolygon(layer.pixelData, this._lassoSelection, transparent);

        const hasChanges = cmd.captureAfterState();
        if (hasChanges) this.history.push(cmd);

        this._lassoSelection = null;
        this._stopMarchingAnts();
        this.render();
    }

    _lassoFillSelection() {
        if (!this._lassoSelection || this._lassoSelection.length < 3) return;
        const layer = this.layerManager.getActiveLayer();
        if (!layer || layer.locked) return;

        const cmd = new PAP.DrawCommand(layer, 'lasso-fill');
        cmd.captureBeforeState();

        PAP.fillPolygon(layer.pixelData, this._lassoSelection, this.fgColor);

        const hasChanges = cmd.captureAfterState();
        if (hasChanges) this.history.push(cmd);

        this._lassoSelection = null;
        this._stopMarchingAnts();
        this.render();
    }

    _clearLassoSelection() {
        this._lassoSelection = null;
        this._lassoPoints = [];
        this._stopMarchingAnts();
        this.render();
    }

    _startMarchingAnts() {
        if (this._marchingAntsRAF) return;
        const animate = () => {
            if (!this._lassoSelection) {
                this._marchingAntsRAF = null;
                return;
            }
            this.render();
            this._marchingAntsRAF = requestAnimationFrame(animate);
        };
        this._marchingAntsRAF = requestAnimationFrame(animate);
    }

    _stopMarchingAnts() {
        if (this._marchingAntsRAF) {
            cancelAnimationFrame(this._marchingAntsRAF);
            this._marchingAntsRAF = null;
        }
    }

    // --- History ---

    undo() { this.history.undo(); this.render(); }
    redo() { this.history.redo(); this.render(); }

    // --- Canvas ---

    resizeCanvas(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.layerManager.resizeAllLayers(width, height);
        this.frameManager.frames.forEach(frame => {
            frame.layers.forEach(layer => layer.resize(width, height));
        });
        this.compositor.resize(width, height);
        this.renderer.resizeCanvas(width, height, this.zoom);
        this.pointerHandler.updateDimensions(width, height, this.zoom);
        if (this.previewCanvas) {
            this.previewCanvas.width = width;
            this.previewCanvas.height = height;
        }
        const label = document.getElementById('canvasDimLabel');
        if (label) label.textContent = `${width} x ${height}`;
        this.render();
    }

    // --- Render ---

    render() {
        this.renderer.render({
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            zoom: this.zoom,
            layerManager: this.layerManager,
            frameManager: this.frameManager,
            onionSkinRenderer: this.onionSkinRenderer,
            compositor: this.compositor,
            isDrawing: this.pointerHandler.isDrawing,
            currentTool: this.currentTool,
            startX: this.pointerHandler.startX,
            startY: this.pointerHandler.startY,
            mouseX: this._mouseX,
            mouseY: this._mouseY,
            currentColor: this.currentColor,
            gridEnabled: this.gridEnabled,
            mirrorEnabled: this.mirrorEnabled,
            brushSize: this.brushSize,
            lassoPoints: this._lassoPoints,
            lassoSelection: this._lassoSelection
        });

        // Update preview canvas
        this._renderPreview();
    }

    _renderPreview() {
        if (!this.previewCtx) return;
        const composited = this.compositor.composite(this.layerManager.layers);
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        this.previewCtx.drawImage(composited, 0, 0);
    }

    // --- Project I/O ---

    newProject() {
        if (confirm('Create a new project? Unsaved changes will be lost.')) {
            this.canvasWidth = 32;
            this.canvasHeight = 32;
            this.layerManager = new LayerManager(32, 32);
            this.frameManager = new FrameManager(this.layerManager);
            this.compositor.resize(32, 32);
            this.animationPlayer.frameManager = this.frameManager;
            this.history.clear();
            document.getElementById('canvasWidth').value = 32;
            document.getElementById('canvasHeight').value = 32;
            const label = document.getElementById('canvasDimLabel');
            if (label) label.textContent = '32 x 32';
            this.renderer.resizeCanvas(32, 32, this.zoom);
            this.pointerHandler.updateDimensions(32, 32, this.zoom);
            if (this.previewCanvas) { this.previewCanvas.width = 32; this.previewCanvas.height = 32; }
            this.render();
        }
    }

    saveProject() {
        const projectData = {
            version: '2.1', timestamp: new Date().toISOString(),
            canvasWidth: this.canvasWidth, canvasHeight: this.canvasHeight,
            layerManager: this.layerManager.toJSON(),
            frameManager: this.frameManager.toJSON()
        };
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        downloadFile(blob, `pixelart-${ts}.pixelart`);
    }

    loadProject(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const pd = JSON.parse(e.target.result);
                this.canvasWidth = pd.canvasWidth;
                this.canvasHeight = pd.canvasHeight;
                this.layerManager = LayerManager.fromJSON(pd.layerManager);
                this.frameManager = FrameManager.fromJSON(pd.frameManager, this.layerManager);
                this.animationPlayer.frameManager = this.frameManager;
                this.compositor.resize(this.canvasWidth, this.canvasHeight);
                document.getElementById('canvasWidth').value = this.canvasWidth;
                document.getElementById('canvasHeight').value = this.canvasHeight;
                const label = document.getElementById('canvasDimLabel');
                if (label) label.textContent = `${this.canvasWidth} x ${this.canvasHeight}`;
                this.renderer.resizeCanvas(this.canvasWidth, this.canvasHeight, this.zoom);
                this.pointerHandler.updateDimensions(this.canvasWidth, this.canvasHeight, this.zoom);
                if (this.previewCanvas) { this.previewCanvas.width = this.canvasWidth; this.previewCanvas.height = this.canvasHeight; }
                this.history.clear();
                this.layerManager.renderLayersList();
                this.frameManager.renderFramesList();
                this.render();
            } catch (err) { alert('Error loading project: ' + err.message); }
        };
        reader.readAsText(file);
    }

    // --- Export ---

    exportPNG() {
        const composited = this.compositor.composite(this.layerManager.layers);
        composited.toBlob(blob => {
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            downloadFile(blob, `pixelart-${ts}.png`);
        });
    }

    exportJSON() {
        const data = { canvasWidth: this.canvasWidth, canvasHeight: this.canvasHeight, layers: this.layerManager.toJSON(), frames: this.frameManager.toJSON() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        downloadFile(blob, `pixelart-${ts}.json`);
    }

    exportGIF() {
        alert('GIF export coming soon. Use "Export PNG" for single frame export.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.darkPixel = new DarkPixel();
    console.log('DarkPixel v2.1 initialized');
});

// Main Application Logic for PixelArtPro
// Refactored to orchestrator pattern using EventBus, PointerHandler, KeyboardHandler, Compositor, Renderer

class PixelArtPro {
    constructor() {
        this.canvas = document.getElementById('pixelCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // State
        this.canvasWidth = 32;
        this.canvasHeight = 32;
        this.zoom = 16;
        this.currentTool = 'pencil';
        this.currentColor = new Color(0, 0, 0);
        this.brushSize = 1;

        // Managers
        this.layerManager = new LayerManager(this.canvasWidth, this.canvasHeight);
        this.frameManager = new FrameManager(this.layerManager);
        this.compositor = new PAP.Compositor(this.canvasWidth, this.canvasHeight);
        this.renderer = new PAP.Renderer(this.canvas);
        this.animationPlayer = new AnimationPlayer(this.frameManager, this.canvas, this.compositor);
        this.onionSkinRenderer = new OnionSkinRenderer();

        // Command-based history
        this.history = new PAP.CommandHistory(50);
        this._currentDrawCommand = null;

        // Input handlers
        this.pointerHandler = new PAP.PointerHandler(this.canvas, {
            zoom: this.zoom,
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight
        });
        this.keyboardHandler = new PAP.KeyboardHandler();

        // Drawing state (for shape preview)
        this._mouseX = 0;
        this._mouseY = 0;

        this._initializeCanvas();
        this._bindPointerEvents();
        this._bindKeyboardShortcuts();
        this._bindUIEvents();
        this._bindEventBus();
        this.render();
    }

    _initializeCanvas() {
        this.renderer.resizeCanvas(this.canvasWidth, this.canvasHeight, this.zoom);
    }

    // --- Pointer Events (replaces mouse events) ---

    _bindPointerEvents() {
        this.pointerHandler.onStrokeStart = (ctx) => {
            // Start a draw command for undo
            const layer = this.layerManager.getActiveLayer();
            if (!layer) return;

            this._currentDrawCommand = new PAP.DrawCommand(layer, this.currentTool);
            this._currentDrawCommand.captureBeforeState();

            this._mouseX = ctx.x;
            this._mouseY = ctx.y;

            if (this.currentTool === 'eyedropper') {
                this._pickColor(ctx.x, ctx.y);
            } else {
                this._performToolAction(ctx.x, ctx.y, ctx.button, ctx.pressure);
            }

            this.render();
        };

        this.pointerHandler.onStrokeMove = (ctx) => {
            this._mouseX = ctx.x;
            this._mouseY = ctx.y;

            // Continuous tools draw on every move
            if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
                this._performToolAction(ctx.x, ctx.y, 0, ctx.pressure);
            }

            this.render();
        };

        this.pointerHandler.onStrokeEnd = (ctx) => {
            // Finalize shapes on mouse up
            if (['line', 'rect', 'circle'].includes(this.currentTool)) {
                this._finalizeShape(ctx.x, ctx.y);
            }

            // Capture after state and push to history
            if (this._currentDrawCommand) {
                const hasChanges = this._currentDrawCommand.captureAfterState();
                if (hasChanges) {
                    this.history.push(this._currentDrawCommand);
                }
                this._currentDrawCommand = null;
            }

            this.render();
        };

        this.pointerHandler.onHover = (ctx) => {
            this._mouseX = ctx.x;
            this._mouseY = ctx.y;
            if (ctx.inBounds) {
                document.getElementById('pixelInfo').textContent = `x: ${ctx.x}, y: ${ctx.y}`;
            }
        };
    }

    // --- Keyboard Shortcuts ---

    _bindKeyboardShortcuts() {
        const kb = this.keyboardHandler;

        // Tool shortcuts
        kb.register('p', () => this.selectTool('pencil'));
        kb.register('e', () => this.selectTool('eraser'));
        kb.register('b', () => this.selectTool('fill'));
        kb.register('i', () => this.selectTool('eyedropper'));
        kb.register('l', () => this.selectTool('line'));
        kb.register('r', () => this.selectTool('rect'));
        kb.register('c', () => this.selectTool('circle'));

        // Edit shortcuts
        kb.register('ctrl+z', () => this.undo());
        kb.register('ctrl+y', () => this.redo());
        kb.register('ctrl+shift+z', () => this.redo());

        // File shortcuts
        kb.register('ctrl+s', () => this.saveProject());
        kb.register('ctrl+n', () => this.newProject());
        kb.register('ctrl+o', () => document.getElementById('loadProjectInput').click());
    }

    // --- UI Event Binding ---

    _bindUIEvents() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool) this.selectTool(tool);
            });
        });

        // Color picker
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = Color.fromHex(e.target.value);
            document.getElementById('colorHex').textContent = this.currentColor.toHex();
        });

        // Brush size
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeLabel').textContent = this.brushSize;
        });

        // Zoom
        document.getElementById('zoomSlider').addEventListener('input', (e) => {
            this.zoom = parseInt(e.target.value);
            document.getElementById('zoomLabel').textContent = this.zoom + 'x';
            this.renderer.resizeCanvas(this.canvasWidth, this.canvasHeight, this.zoom);
            this.pointerHandler.updateDimensions(this.canvasWidth, this.canvasHeight, this.zoom);
            this.render();
        });

        // Canvas size
        document.getElementById('resizeCanvasBtn').addEventListener('click', () => {
            const w = parseInt(document.getElementById('canvasWidth').value);
            const h = parseInt(document.getElementById('canvasHeight').value);
            if (w > 0 && h > 0) {
                this.resizeCanvas(w, h);
            }
        });

        // Layer controls
        document.getElementById('newLayerBtn').addEventListener('click', () => {
            this.layerManager.addLayer();
            this.render();
        });

        document.getElementById('deleteLayerBtn').addEventListener('click', () => {
            this.layerManager.deleteLayer(this.layerManager.activeLayerIndex);
            this.render();
        });

        document.getElementById('duplicateLayerBtn').addEventListener('click', () => {
            this.layerManager.duplicateLayer(this.layerManager.activeLayerIndex);
            this.render();
        });

        // Frame controls
        document.getElementById('newFrameBtn').addEventListener('click', () => {
            this.frameManager.addFrame();
            this.render();
        });

        document.getElementById('deleteFrameBtn').addEventListener('click', () => {
            this.frameManager.deleteFrame(this.frameManager.currentFrameIndex);
            this.render();
        });

        // FPS control
        document.getElementById('fpsInput').addEventListener('change', (e) => {
            this.frameManager.setFPS(parseInt(e.target.value));
        });

        // Animation controls
        document.getElementById('playAnimationBtn').addEventListener('click', () => {
            this.animationPlayer.play();
        });

        document.getElementById('stopAnimationBtn').addEventListener('click', () => {
            this.animationPlayer.stop();
            this.render();
        });

        // Onion skin controls
        document.getElementById('onionSkinToggle').addEventListener('change', (e) => {
            this.onionSkinRenderer.enabled = e.target.checked;
            this.render();
        });

        document.getElementById('onionSkinOpacity').addEventListener('input', (e) => {
            this.onionSkinRenderer.opacity = parseInt(e.target.value) / 100;
            document.getElementById('opacityLabel').textContent = e.target.value + '%';
            this.render();
        });

        document.getElementById('onionSkinBack').addEventListener('change', (e) => {
            this.onionSkinRenderer.framesBack = parseInt(e.target.value);
            this.render();
        });

        document.getElementById('onionSkinForward').addEventListener('change', (e) => {
            this.onionSkinRenderer.framesForward = parseInt(e.target.value);
            this.render();
        });

        // Edit controls
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Clear current layer?')) {
                const layer = this.layerManager.getActiveLayer();
                const cmd = new PAP.DrawCommand(layer, 'Clear');
                cmd.captureBeforeState();
                layer.clear();
                if (cmd.captureAfterState()) {
                    this.history.push(cmd);
                }
                this.render();
            }
        });

        // File controls
        document.getElementById('newProjectBtn').addEventListener('click', () => this.newProject());
        document.getElementById('openProjectBtn').addEventListener('click', () => {
            document.getElementById('loadProjectInput').click();
        });
        document.getElementById('loadProjectInput').addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadProject(e.target.files[0]);
        });
        document.getElementById('saveProjectBtn').addEventListener('click', () => this.saveProject());

        // Export controls
        document.getElementById('exportPNGBtn').addEventListener('click', () => this.exportPNG());
        document.getElementById('exportGIFBtn').addEventListener('click', () => this.exportGIF());
        document.getElementById('exportJSONBtn').addEventListener('click', () => this.exportJSON());
    }

    // --- EventBus subscriptions ---

    _bindEventBus() {
        PAP.EventBus.on('layers:changed', () => {
            this.layerManager.renderLayersList();
            this.render();
        });

        PAP.EventBus.on('layers:activeChanged', () => {
            this.layerManager.renderLayersList();
        });

        PAP.EventBus.on('history:undo', () => this.render());
        PAP.EventBus.on('history:redo', () => this.render());
    }

    // --- Tool Logic ---

    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    _performToolAction(x, y, button, pressure) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer || layer.locked) return;

        const color = button === 2 ? new Color(0, 0, 0, 0) : this.currentColor;

        switch (this.currentTool) {
            case 'pencil': {
                for (let dy = 0; dy < this.brushSize; dy++) {
                    for (let dx = 0; dx < this.brushSize; dx++) {
                        layer.setPixel(x + dx, y + dy, color);
                    }
                }
                break;
            }

            case 'eraser': {
                const transparent = new Color(0, 0, 0, 0);
                for (let dy = 0; dy < this.brushSize; dy++) {
                    for (let dx = 0; dx < this.brushSize; dx++) {
                        layer.setPixel(x + dx, y + dy, transparent);
                    }
                }
                break;
            }

            case 'fill':
                floodFill(layer.pixelData, x, y, color);
                break;
        }
    }

    _finalizeShape(endX, endY) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer || layer.locked) return;

        const startX = this.pointerHandler.startX;
        const startY = this.pointerHandler.startY;

        switch (this.currentTool) {
            case 'line':
                drawLine(layer.pixelData, startX, startY, endX, endY, this.currentColor);
                break;

            case 'rect':
                drawRect(layer.pixelData, startX, startY, endX, endY, this.currentColor, false);
                break;

            case 'circle': {
                const radius = Math.max(
                    Math.abs(endX - startX),
                    Math.abs(endY - startY)
                );
                drawCircle(layer.pixelData, startX, startY, radius, this.currentColor, false);
                break;
            }
        }
    }

    _pickColor(x, y) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer) return;

        const pixel = layer.pixelData.getPixel(x, y);
        this.currentColor = new Color(pixel.r, pixel.g, pixel.b, pixel.a);

        document.getElementById('colorPicker').value = this.currentColor.toHex();
        document.getElementById('colorHex').textContent = this.currentColor.toHex();
    }

    // --- Undo/Redo ---

    undo() {
        this.history.undo();
        this.render();
    }

    redo() {
        this.history.redo();
        this.render();
    }

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
            currentColor: this.currentColor
        });
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
            this.renderer.resizeCanvas(32, 32, this.zoom);
            this.pointerHandler.updateDimensions(32, 32, this.zoom);
            this.render();
        }
    }

    saveProject() {
        const projectData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            layerManager: this.layerManager.toJSON(),
            frameManager: this.frameManager.toJSON()
        };

        const blob = new Blob(
            [JSON.stringify(projectData, null, 2)],
            { type: 'application/json' }
        );

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        downloadFile(blob, `pixelart-${timestamp}.pixelart`);
    }

    loadProject(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                this.canvasWidth = projectData.canvasWidth;
                this.canvasHeight = projectData.canvasHeight;
                this.layerManager = LayerManager.fromJSON(projectData.layerManager);
                this.frameManager = FrameManager.fromJSON(projectData.frameManager, this.layerManager);
                this.animationPlayer.frameManager = this.frameManager;
                this.compositor.resize(this.canvasWidth, this.canvasHeight);

                document.getElementById('canvasWidth').value = this.canvasWidth;
                document.getElementById('canvasHeight').value = this.canvasHeight;
                this.renderer.resizeCanvas(this.canvasWidth, this.canvasHeight, this.zoom);
                this.pointerHandler.updateDimensions(this.canvasWidth, this.canvasHeight, this.zoom);

                this.history.clear();
                this.layerManager.renderLayersList();
                this.frameManager.renderFramesList();
                this.render();
            } catch (err) {
                alert('Error loading project: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // --- Export ---

    exportPNG() {
        const composited = this.compositor.composite(this.layerManager.layers);
        composited.toBlob(blob => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            downloadFile(blob, `pixelart-${timestamp}.png`);
        });
    }

    exportJSON() {
        const exportData = {
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            layers: this.layerManager.toJSON(),
            frames: this.frameManager.toJSON()
        };

        const blob = new Blob(
            [JSON.stringify(exportData, null, 2)],
            { type: 'application/json' }
        );

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        downloadFile(blob, `pixelart-${timestamp}.json`);
    }

    exportGIF() {
        alert('GIF export coming in Phase 6. Use "Export PNG" for single frame export.');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pixelArtPro = new PixelArtPro();
    console.log('PixelArtPro v2.0 initialized (Phase 1: Foundation)');
});

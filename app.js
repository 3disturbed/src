// Main Application Logic for PixelArtPro

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
        this.animationPlayer = new AnimationPlayer(this.frameManager, this.canvas);
        this.onionSkinRenderer = new OnionSkinRenderer();
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySteps = 50;
        
        // Drawing state
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.initializeCanvas();
        this.bindEvents();
        this.render();
    }

    initializeCanvas() {
        resizeCanvasAndCenter(this.canvas, this.canvasWidth, this.canvasHeight, this.zoom);
    }

    bindEvents() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTool(e.target.dataset.tool));
        });

        // Color picker
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.currentColor = Color.fromHex(e.target.value);
            document.getElementById('colorHex').textContent = this.currentColor.toHex();
        });

        // Brush size
        document.getElementById('brushSize').addEventListener('change', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeLabel').textContent = this.brushSize;
        });

        // Zoom
        document.getElementById('zoomSlider').addEventListener('change', (e) => {
            this.zoom = parseInt(e.target.value);
            resizeCanvasAndCenter(this.canvas, this.canvasWidth, this.canvasHeight, this.zoom);
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
            this.saveHistory();
            this.render();
        });

        document.getElementById('deleteLayerBtn').addEventListener('click', () => {
            this.layerManager.deleteLayer(this.layerManager.activeLayerIndex);
            this.saveHistory();
            this.render();
        });

        document.getElementById('duplicateLayerBtn').addEventListener('click', () => {
            this.layerManager.duplicateLayer(this.layerManager.activeLayerIndex);
            this.saveHistory();
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

        document.getElementById('onionSkinOpacity').addEventListener('change', (e) => {
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
                this.layerManager.getActiveLayer().clear();
                this.saveHistory();
                this.render();
            }
        });

        // File controls
        document.getElementById('newProjectBtn').addEventListener('click', () => this.newProject());
        document.getElementById('openProjectBtn').addEventListener('click', () => {
            document.getElementById('loadProjectInput').click();
        });
        document.getElementById('loadProjectInput').addEventListener('change', (e) => {
            this.loadProject(e.target.files[0]);
        });
        document.getElementById('saveProjectBtn').addEventListener('click', () => this.saveProject());

        // Export controls
        document.getElementById('exportPNGBtn').addEventListener('click', () => this.exportPNG());
        document.getElementById('exportGIFBtn').addEventListener('click', () => this.exportGIF());
        document.getElementById('exportJSONBtn').addEventListener('click', () => this.exportJSON());

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onCanvasMouseLeave(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    }

    resizeCanvas(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.layerManager.resizeAllLayers(width, height);
        this.frameManager.frames.forEach(frame => {
            frame.layers.forEach(layer => layer.resize(width, height));
        });
        resizeCanvasAndCenter(this.canvas, width, height, this.zoom);
        this.saveHistory();
        this.render();
    }

    onCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = Math.floor((e.clientX - rect.left) / this.zoom);
        const canvasY = Math.floor((e.clientY - rect.top) / this.zoom);

        // Clamp to canvas bounds
        if (canvasX < 0 || canvasX >= this.canvasWidth || 
            canvasY < 0 || canvasY >= this.canvasHeight) {
            return;
        }

        this.isDrawing = true;
        this.startX = canvasX;
        this.startY = canvasY;
        this.mouseX = canvasX;
        this.mouseY = canvasY;

        this.saveHistory();

        // Handle different tools
        if (this.currentTool !== 'eyedropper') {
            this.performToolAction(canvasX, canvasY, e.button);
        } else {
            this.pickColor(canvasX, canvasY);
        }

        this.render();
    }

    onCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = Math.floor((e.clientX - rect.left) / this.zoom);
        const canvasY = Math.floor((e.clientY - rect.top) / this.zoom);

        // Update position info
        if (canvasX >= 0 && canvasX < this.canvasWidth && 
            canvasY >= 0 && canvasY < this.canvasHeight) {
            document.getElementById('pixelInfo').textContent = 
                `x: ${canvasX}, y: ${canvasY}`;
        }

        if (!this.isDrawing) return;

        this.mouseX = canvasX;
        this.mouseY = canvasY;

        // Continuous drawing for certain tools
        if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
            this.performToolAction(canvasX, canvasY, 0);
        }

        this.render();
    }

    onCanvasMouseUp(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = Math.floor((e.clientX - rect.left) / this.zoom);
        const canvasY = Math.floor((e.clientY - rect.top) / this.zoom);

        // Finalize shapes
        if (['line', 'rect', 'circle'].includes(this.currentTool)) {
            this.finalizeShape(canvasX, canvasY);
        }

        this.isDrawing = false;
        this.render();
    }

    onCanvasMouseLeave(e) {
        this.isDrawing = false;
    }

    performToolAction(x, y, button) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer) return;

        const color = button === 2 ? new Color(255, 255, 255, 0) : this.currentColor;

        switch (this.currentTool) {
            case 'pencil':
                // Draw line from last position for smooth drawing
                drawLine(layer.pixelData, this.mouseX - this.brushSize + 1, 
                         this.mouseY - this.brushSize + 1, x, y, color);
                // Also draw at current position
                for (let dy = 0; dy < this.brushSize; dy++) {
                    for (let dx = 0; dx < this.brushSize; dx++) {
                        layer.setPixel(x + dx, y + dy, color);
                    }
                }
                break;

            case 'eraser':
                const transparent = new Color(0, 0, 0, 0);
                for (let dy = 0; dy < this.brushSize; dy++) {
                    for (let dx = 0; dx < this.brushSize; dx++) {
                        layer.setPixel(x + dx, y + dy, transparent);
                    }
                }
                break;

            case 'fill':
                floodFill(layer.pixelData, x, y, color);
                this.isDrawing = false;
                break;
        }
    }

    finalizeShape(endX, endY) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer) return;

        // Create a temporary layer for preview
        const tempData = layer.pixelData.clone();

        switch (this.currentTool) {
            case 'line':
                drawLine(layer.pixelData, this.startX, this.startY, endX, endY, this.currentColor);
                break;

            case 'rect':
                drawRect(layer.pixelData, this.startX, this.startY, endX, endY, this.currentColor, false);
                break;

            case 'circle':
                const radius = Math.max(
                    Math.abs(endX - this.startX),
                    Math.abs(endY - this.startY)
                );
                drawCircle(layer.pixelData, this.startX, this.startY, radius, this.currentColor, false);
                break;
        }
    }

    pickColor(x, y) {
        const layer = this.layerManager.getActiveLayer();
        if (!layer) return;

        const pixel = layer.pixelData.getPixel(x, y);
        this.currentColor = new Color(pixel.r, pixel.g, pixel.b, pixel.a);
        
        document.getElementById('colorPicker').value = this.currentColor.toHex();
        document.getElementById('colorHex').textContent = this.currentColor.toHex();
    }

    handleKeyDown(e) {
        // Tool shortcuts
        const shortcuts = {
            'p': 'pencil',
            'e': 'eraser',
            'b': 'fill',
            'i': 'eyedropper',
            'l': 'line',
            'r': 'rect',
            'c': 'circle',
            'z': () => { if (e.ctrlKey) { e.ctrlKey && e.shiftKey ? this.redo() : this.undo(); } },
            'y': () => { if (e.ctrlKey) this.redo(); }
        };

        if (shortcuts[e.key.toLowerCase()]) {
            const action = shortcuts[e.key.toLowerCase()];
            if (typeof action === 'string') {
                this.selectTool(action);
                e.preventDefault();
            } else if (typeof action === 'function') {
                action();
                e.preventDefault();
            }
        }
    }

    saveHistory() {
        // Remove any redo history after current point
        this.history.splice(this.historyIndex + 1);

        // Save current state
        const state = {
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            layers: this.layerManager.toJSON(),
            frames: this.frameManager.toJSON()
        };

        this.history.push(state);

        // Limit history
        if (this.history.length > this.maxHistorySteps) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.render();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.render();
        }
    }

    restoreState(state) {
        this.canvasWidth = state.canvasWidth;
        this.canvasHeight = state.canvasHeight;
        this.layerManager = LayerManager.fromJSON(state.layers);
        this.frameManager = FrameManager.fromJSON(state.frames, this.layerManager);
        resizeCanvasAndCenter(this.canvas, this.canvasWidth, this.canvasHeight, this.zoom);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw checkerboard background for transparency
        this.drawCheckerboard();
        
        // Draw composited layers
        const compositedCanvas = this.layerManager.composite();
        this.ctx.drawImage(compositedCanvas, 0, 0);

        // Draw grid if zoomed in
        if (this.zoom > 4) {
            this.drawGrid();
        }

        // Draw onion skin
        this.onionSkinRenderer.renderOnionSkin(
            this.canvas, this.ctx, this.frameManager, 
            this.layerManager, this.zoom
        );

        // Draw preview shapes while drawing
        if (this.isDrawing && ['line', 'rect', 'circle'].includes(this.currentTool)) {
            this.drawShapePreview();
        }
    }

    drawCheckerboard() {
        const squareSize = 4;
        const color1 = '#111';
        const color2 = '#222';

        for (let y = 0; y < this.canvas.height; y += squareSize) {
            for (let x = 0; x < this.canvas.width; x += squareSize) {
                this.ctx.fillStyle = ((x / squareSize + y / squareSize) % 2 === 0) ? color1 : color2;
                this.ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.zoom) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.zoom) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawShapePreview() {
        // Draw preview of shape being drawn
        this.ctx.strokeStyle = this.currentColor.toCSSString();
        this.ctx.globalAlpha = 0.5;

        switch (this.currentTool) {
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX * this.zoom, this.startY * this.zoom);
                this.ctx.lineTo(this.mouseX * this.zoom, this.mouseY * this.zoom);
                this.ctx.stroke();
                break;

            case 'rect':
                const w = (this.mouseX - this.startX) * this.zoom;
                const h = (this.mouseY - this.startY) * this.zoom;
                this.ctx.strokeRect(
                    this.startX * this.zoom,
                    this.startY * this.zoom,
                    w, h
                );
                break;

            case 'circle':
                const radius = Math.max(
                    Math.abs(this.mouseX - this.startX),
                    Math.abs(this.mouseY - this.startY)
                ) * this.zoom;
                this.ctx.beginPath();
                this.ctx.arc(
                    this.startX * this.zoom,
                    this.startY * this.zoom,
                    radius,
                    0,
                    Math.PI * 2
                );
                this.ctx.stroke();
                break;
        }

        this.ctx.globalAlpha = 1;
    }

    newProject() {
        if (confirm('Create a new project? Unsaved changes will be lost.')) {
            this.canvasWidth = 32;
            this.canvasHeight = 32;
            this.layerManager = new LayerManager(32, 32);
            this.frameManager = new FrameManager(this.layerManager);
            this.history = [];
            this.historyIndex = -1;
            this.saveHistory();
            document.getElementById('canvasWidth').value = 32;
            document.getElementById('canvasHeight').value = 32;
            resizeCanvasAndCenter(this.canvas, 32, 32, this.zoom);
            this.render();
        }
    }

    saveProject() {
        const projectData = {
            version: '1.0',
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
                
                document.getElementById('canvasWidth').value = this.canvasWidth;
                document.getElementById('canvasHeight').value = this.canvasHeight;
                resizeCanvasAndCenter(this.canvas, this.canvasWidth, this.canvasHeight, this.zoom);
                
                this.history = [];
                this.historyIndex = -1;
                this.saveHistory();
                this.render();
            } catch (err) {
                alert('Error loading project: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    exportPNG() {
        const compositedCanvas = this.layerManager.composite();
        compositedCanvas.toBlob(blob => {
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
        alert('GIF export requires an external library. Use "Export PNG" for single frame export.');
        // Note: Implement with a library like gif.js for full GIF support
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pixelArtPro = new PixelArtPro();
    console.log('PixelArtPro initialized');
});

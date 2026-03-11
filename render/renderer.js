// Main Render Pipeline
window.PAP = window.PAP || {};

PAP.Renderer = class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });

        this._checkerboardPattern = null;
        this._checkerboardSize = 0;
        this._marchingAntsOffset = 0;
        this._marchingAntsInterval = null;
    }

    render(state) {
        const {
            canvasWidth,
            canvasHeight,
            zoom,
            layerManager,
            frameManager,
            onionSkinRenderer,
            compositor,
            isDrawing,
            currentTool,
            startX,
            startY,
            mouseX,
            mouseY,
            currentColor,
            gridEnabled,
            mirrorEnabled,
            brushSize,
            lassoPoints,
            lassoSelection
        } = state;

        const ctx = this.ctx;
        const w = canvasWidth * zoom;
        const h = canvasHeight * zoom;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Checkerboard (transparency background)
        this._drawCheckerboard(w, h);

        // 2. Composite layers using proper compositor
        const composited = compositor.composite(layerManager.layers);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(composited, 0, 0, canvasWidth, canvasHeight, 0, 0, w, h);

        // 3. Onion skin
        if (onionSkinRenderer && onionSkinRenderer.enabled) {
            this._drawOnionSkin(state);
        }

        // 4. Grid overlay (only when enabled)
        if (gridEnabled && zoom > 4) {
            this._drawGrid(w, h, zoom);
        }

        // 5. Mirror guide line
        if (mirrorEnabled) {
            this._drawMirrorGuide(canvasWidth, h, zoom);
        }

        // 6. Shape preview while drawing
        if (isDrawing && ['line', 'rect', 'circle', 'rectFilled', 'circleFilled'].includes(currentTool)) {
            this._drawShapePreview(startX, startY, mouseX, mouseY, zoom, currentTool, currentColor);
        }

        // 7. Lasso preview (while drawing) or selection (marching ants)
        if (isDrawing && lassoPoints && lassoPoints.length >= 2) {
            this._drawLassoPreview(lassoPoints, zoom, currentTool, currentColor);
        }
        if (lassoSelection && lassoSelection.length >= 3) {
            this._drawMarchingAnts(lassoSelection, zoom);
        }

        // 8. Brush cursor preview (when not drawing shapes)
        if (mouseX !== undefined && mouseY !== undefined && !isDrawing) {
            this._drawBrushCursor(mouseX, mouseY, zoom, brushSize || 1, canvasWidth, canvasHeight);
        }
    }

    _drawCheckerboard(w, h) {
        const squareSize = 4;
        if (!this._checkerboardPattern || this._checkerboardSize !== squareSize) {
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = squareSize * 2;
            patternCanvas.height = squareSize * 2;
            const pCtx = patternCanvas.getContext('2d');
            pCtx.fillStyle = '#111';
            pCtx.fillRect(0, 0, squareSize * 2, squareSize * 2);
            pCtx.fillStyle = '#222';
            pCtx.fillRect(squareSize, 0, squareSize, squareSize);
            pCtx.fillRect(0, squareSize, squareSize, squareSize);
            this._checkerboardPattern = this.ctx.createPattern(patternCanvas, 'repeat');
            this._checkerboardSize = squareSize;
        }

        this.ctx.fillStyle = this._checkerboardPattern;
        this.ctx.fillRect(0, 0, w, h);
    }

    _drawGrid(w, h, zoom) {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = 0; x <= w; x += zoom) {
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, h);
        }
        for (let y = 0; y <= h; y += zoom) {
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(w, y + 0.5);
        }
        ctx.stroke();
    }

    _drawMirrorGuide(canvasWidth, h, zoom) {
        const ctx = this.ctx;
        const centerX = Math.floor(canvasWidth / 2) * zoom;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(centerX + 0.5, 0);
        ctx.lineTo(centerX + 0.5, h);
        ctx.stroke();

        ctx.restore();
    }

    _drawBrushCursor(mouseX, mouseY, zoom, brushSize, canvasWidth, canvasHeight) {
        if (mouseX < 0 || mouseY < 0 || mouseX >= canvasWidth || mouseY >= canvasHeight) return;

        const ctx = this.ctx;
        const offset = Math.floor(brushSize / 2);
        const startPx = (mouseX - offset) * zoom;
        const startPy = (mouseY - offset) * zoom;
        const size = brushSize * zoom;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(startPx + 0.5, startPy + 0.5, size, size);
        ctx.restore();
    }

    _drawShapePreview(startX, startY, mouseX, mouseY, zoom, tool, color) {
        const ctx = this.ctx;
        const cssColor = color.toCSSString();
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;

        switch (tool) {
            case 'line':
                ctx.strokeStyle = cssColor;
                ctx.beginPath();
                ctx.moveTo(startX * zoom + zoom / 2, startY * zoom + zoom / 2);
                ctx.lineTo(mouseX * zoom + zoom / 2, mouseY * zoom + zoom / 2);
                ctx.stroke();
                break;

            case 'rect': {
                ctx.strokeStyle = cssColor;
                const rx = Math.min(startX, mouseX) * zoom;
                const ry = Math.min(startY, mouseY) * zoom;
                const rw = (Math.abs(mouseX - startX) + 1) * zoom;
                const rh = (Math.abs(mouseY - startY) + 1) * zoom;
                ctx.strokeRect(rx, ry, rw, rh);
                break;
            }

            case 'rectFilled': {
                ctx.fillStyle = cssColor;
                const rx = Math.min(startX, mouseX) * zoom;
                const ry = Math.min(startY, mouseY) * zoom;
                const rw = (Math.abs(mouseX - startX) + 1) * zoom;
                const rh = (Math.abs(mouseY - startY) + 1) * zoom;
                ctx.fillRect(rx, ry, rw, rh);
                break;
            }

            case 'circle': {
                ctx.strokeStyle = cssColor;
                const radius = Math.max(
                    Math.abs(mouseX - startX),
                    Math.abs(mouseY - startY)
                ) * zoom;
                ctx.beginPath();
                ctx.arc(startX * zoom + zoom / 2, startY * zoom + zoom / 2, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }

            case 'circleFilled': {
                ctx.fillStyle = cssColor;
                const radius = Math.max(
                    Math.abs(mouseX - startX),
                    Math.abs(mouseY - startY)
                ) * zoom;
                ctx.beginPath();
                ctx.arc(startX * zoom + zoom / 2, startY * zoom + zoom / 2, radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
        }

        ctx.globalAlpha = 1;
    }

    _drawOnionSkin(state) {
        const {
            canvasWidth, canvasHeight, zoom,
            frameManager, onionSkinRenderer, compositor
        } = state;

        const os = onionSkinRenderer;
        const currentIndex = frameManager.currentFrameIndex;
        const w = canvasWidth * zoom;
        const h = canvasHeight * zoom;

        const ctx = this.ctx;

        // Previous frames (red tint)
        for (let i = 1; i <= os.framesBack; i++) {
            const fi = currentIndex - i;
            if (fi < 0 || fi >= frameManager.frames.length) continue;

            const frame = frameManager.frames[fi];
            const composited = compositor.compositeFrame(frame.layers);
            const fadeOpacity = os.opacity * (1 - (i - 1) / os.framesBack) * 0.5;

            ctx.globalAlpha = fadeOpacity;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(composited, 0, 0, canvasWidth, canvasHeight, 0, 0, w, h);

            // Red tint overlay
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgb(255, 180, 180)';
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Next frames (blue tint)
        for (let i = 1; i <= os.framesForward; i++) {
            const fi = currentIndex + i;
            if (fi < 0 || fi >= frameManager.frames.length) continue;

            const frame = frameManager.frames[fi];
            const composited = compositor.compositeFrame(frame.layers);
            const fadeOpacity = os.opacity * (1 - (i - 1) / os.framesForward) * 0.5;

            ctx.globalAlpha = fadeOpacity;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(composited, 0, 0, canvasWidth, canvasHeight, 0, 0, w, h);

            // Blue tint overlay
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgb(180, 180, 255)';
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.globalAlpha = 1;
    }

    _drawLassoPreview(points, zoom, tool, color) {
        if (points.length < 2) return;
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = tool === 'lassoFill' ? (color ? color.toCSSString() : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(points[0].x * zoom + zoom / 2, points[0].y * zoom + zoom / 2);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x * zoom + zoom / 2, points[i].y * zoom + zoom / 2);
        }

        // Show closing line back to start
        if (points.length >= 3) {
            ctx.lineTo(points[0].x * zoom + zoom / 2, points[0].y * zoom + zoom / 2);
        }

        if (tool === 'lassoFill' && points.length >= 3) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = color ? color.toCSSString() : 'rgba(255,255,255,0.3)';
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.stroke();
        ctx.restore();
    }

    _drawMarchingAnts(points, zoom) {
        if (points.length < 3) return;
        const ctx = this.ctx;

        ctx.save();
        ctx.lineWidth = 1;

        // Draw black base line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(points[0].x * zoom + zoom / 2, points[0].y * zoom + zoom / 2);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x * zoom + zoom / 2, points[i].y * zoom + zoom / 2);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw white animated dash on top
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -this._marchingAntsOffset;
        ctx.beginPath();
        ctx.moveTo(points[0].x * zoom + zoom / 2, points[0].y * zoom + zoom / 2);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x * zoom + zoom / 2, points[i].y * zoom + zoom / 2);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();

        // Animate marching ants
        this._marchingAntsOffset = (this._marchingAntsOffset + 0.5) % 12;
    }

    resizeCanvas(width, height, zoom) {
        const scaledW = width * zoom;
        const scaledH = height * zoom;
        this.canvas.width = scaledW;
        this.canvas.height = scaledH;
    }
};

// Main Render Pipeline
window.PAP = window.PAP || {};

PAP.Renderer = class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });

        this._checkerboardPattern = null;
        this._checkerboardSize = 0;
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
            currentColor
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

        // 4. Grid overlay
        if (zoom > 4) {
            this._drawGrid(w, h, zoom);
        }

        // 5. Shape preview while drawing
        if (isDrawing && ['line', 'rect', 'circle'].includes(currentTool)) {
            this._drawShapePreview(startX, startY, mouseX, mouseY, zoom, currentTool, currentColor);
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

    _drawShapePreview(startX, startY, mouseX, mouseY, zoom, tool, color) {
        const ctx = this.ctx;
        ctx.strokeStyle = color.toCSSString();
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;

        switch (tool) {
            case 'line':
                ctx.beginPath();
                ctx.moveTo(startX * zoom + zoom / 2, startY * zoom + zoom / 2);
                ctx.lineTo(mouseX * zoom + zoom / 2, mouseY * zoom + zoom / 2);
                ctx.stroke();
                break;

            case 'rect': {
                const rx = Math.min(startX, mouseX) * zoom;
                const ry = Math.min(startY, mouseY) * zoom;
                const rw = (Math.abs(mouseX - startX) + 1) * zoom;
                const rh = (Math.abs(mouseY - startY) + 1) * zoom;
                ctx.strokeRect(rx, ry, rw, rh);
                break;
            }

            case 'circle': {
                const radius = Math.max(
                    Math.abs(mouseX - startX),
                    Math.abs(mouseY - startY)
                ) * zoom;
                ctx.beginPath();
                ctx.arc(startX * zoom + zoom / 2, startY * zoom + zoom / 2, radius, 0, Math.PI * 2);
                ctx.stroke();
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

    resizeCanvas(width, height, zoom) {
        const scaledW = width * zoom;
        const scaledH = height * zoom;
        this.canvas.width = scaledW;
        this.canvas.height = scaledH;
    }
};

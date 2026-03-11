// GIF Export Module for DarkPixel
// Requires: gif.js library (https://github.com/jnordberg/gif.js)
// To use: Add <script src="gif.js"></script> before app.js

class GIFExporter {
    constructor() {
        this.gif = null;
        this.isProcessing = false;
    }

    /**
     * Export animation as GIF
     * @param {FrameManager} frameManager - The frame manager containing frames
     * @param {number} scale - Pixel scale for output
     */
    exportToGIF(frameManager, scale = 2) {
        if (typeof GIF === 'undefined') {
            alert('GIF export requires gif.js library. See gif-exporter.js for setup instructions.');
            return;
        }

        this.isProcessing = true;
        const button = document.getElementById('exportGIFBtn');
        const originalText = button.textContent;
        button.textContent = 'Creating GIF...';
        button.disabled = true;

        // Create GIF renderer
        this.gif = new GIF({
            workers: 2,
            quality: 10,
            width: frameManager.frames[0].layers[0].width * scale,
            height: frameManager.frames[0].layers[0].height * scale,
            workerScript: 'gif.worker.js' // Make sure this file is in your project directory
        });

        // Add each frame
        frameManager.frames.forEach((frame, index) => {
            const frameCanvas = this.createFrameCanvas(frame, scale);
            this.gif.addFrame(frameCanvas, {
                delay: frame.duration
            });
        });

        // When finished
        this.gif.on('finished', (blob) => {
            this.isProcessing = false;
            button.textContent = originalText;
            button.disabled = false;

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            downloadFile(blob, `pixelart-animation-${timestamp}.gif`);
        });

        // Handle errors
        this.gif.on('error', (error) => {
            console.error('GIF export error:', error);
            alert('Error creating GIF: ' + error.message);
            this.isProcessing = false;
            button.textContent = originalText;
            button.disabled = false;
        });

        // Start rendering
        this.gif.render();
    }

    /**
     * Create a canvas for a single frame
     * @private
     */
    createFrameCanvas(frame, scale) {
        const { width, height } = frame.layers[0];
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        const canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        const ctx = canvas.getContext('2d');

        // Draw checkerboard background
        const squareSize = 2;
        const color1 = '#ffffff';
        const color2 = '#cccccc';

        for (let y = 0; y < scaledHeight; y += squareSize) {
            for (let x = 0; x < scaledWidth; x += squareSize) {
                ctx.fillStyle = ((x / squareSize + y / squareSize) % 2 === 0) ? color1 : color2;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }

        // Composite all layers
        for (let i = frame.layers.length - 1; i >= 0; i--) {
            const layer = frame.layers[i];
            if (!layer.visible) continue;

            const imageData = layer.getImageData();
            const scaledImageData = this.scaleImageData(imageData, scale);
            ctx.globalAlpha = layer.opacity;
            ctx.putImageData(scaledImageData, 0, 0);
        }

        ctx.globalAlpha = 1;
        return canvas;
    }

    /**
     * Scale image data (for upscaling pixel art)
     * @private
     */
    scaleImageData(imageData, scale) {
        const src = imageData;
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = src.width * scale;
        scaledCanvas.height = src.height * scale;
        const ctx = scaledCanvas.getContext('2d');

        // Disable smoothing for pixel-perfect scaling
        ctx.imageSmoothingEnabled = false;

        // Draw original image scaled up
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = src.width;
        tempCanvas.height = src.height;
        tempCanvas.getContext('2d').putImageData(src, 0, 0);

        ctx.drawImage(tempCanvas, 0, 0, src.width, src.height,
                      0, 0, src.width * scale, src.height * scale);

        return ctx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
    }
}

// Installation Instructions:
// 1. Download gif.js library from https://github.com/jnordberg/gif.js
// 2. Copy 'gif.js' and 'gif.worker.js' to your project directory
// 3. Add this to your HTML before app.js:
//    <script src="gif.js"></script>
//    <script src="gif-exporter.js"></script>
// 4. Update the exportGIF method in app.js to use:
//    const exporter = new GIFExporter();
//    exporter.exportToGIF(this.frameManager, 2);

// Alternative: Use gif.js from CDN
// <script src="https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"></script>

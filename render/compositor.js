// Layer Compositor - fixes opacity/blend mode compositing
// Uses drawImage instead of putImageData so globalAlpha is respected
window.PAP = window.PAP || {};

PAP.Compositor = class Compositor {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // Main composite result
        this.outputCanvas = document.createElement('canvas');
        this.outputCanvas.width = width;
        this.outputCanvas.height = height;
        this.outputCtx = this.outputCanvas.getContext('2d');

        // Temp canvas for converting PixelData -> drawable image
        this._tempCanvas = document.createElement('canvas');
        this._tempCanvas.width = width;
        this._tempCanvas.height = height;
        this._tempCtx = this._tempCanvas.getContext('2d');
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.outputCanvas.width = width;
        this.outputCanvas.height = height;
        this._tempCanvas.width = width;
        this._tempCanvas.height = height;
    }

    composite(layers) {
        const ctx = this.outputCtx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Render bottom to top (layers[0] = bottom)
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (!layer.visible || layer.opacity <= 0) continue;

            // Put layer pixel data onto temp canvas
            const imageData = layer.pixelData.getImageData();
            this._tempCtx.clearRect(0, 0, this.width, this.height);
            this._tempCtx.putImageData(imageData, 0, 0);

            // Draw temp canvas onto output with opacity and blend mode
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode || 'source-over';
            ctx.drawImage(this._tempCanvas, 0, 0);
        }

        // Reset state
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        return this.outputCanvas;
    }

    compositeFrame(frameLayers) {
        return this.composite(frameLayers);
    }
};

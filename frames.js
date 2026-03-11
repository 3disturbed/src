// Frame and Animation Management System for PixelArtPro

class Frame {
    constructor(layerManager, frameNumber = 1) {
        this.id = Date.now();
        this.frameNumber = frameNumber;
        this.duration = 100; // milliseconds
        // Clone layers from current state
        this.layers = layerManager.layers.map(l => l.clone());
        this.layerManager = new LayerManager(layerManager.width, layerManager.height);
        this.layerManager.layers = this.layers;
    }

    clone() {
        const cloned = new Frame(null, this.frameNumber);
        cloned.id = Date.now();
        cloned.duration = this.duration;
        cloned.layers = this.layers.map(l => l.clone());
        return cloned;
    }

    toJSON() {
        return {
            id: this.id,
            frameNumber: this.frameNumber,
            duration: this.duration,
            layers: this.layers.map(l => l.toJSON())
        };
    }

    static fromJSON(obj, width, height) {
        const frame = new Frame(null, obj.frameNumber);
        frame.id = obj.id;
        frame.duration = obj.duration;
        const tempManager = new LayerManager(width, height);
        tempManager.layers = obj.layers.map(l => Layer.fromJSON(l));
        frame.layers = tempManager.layers;
        return frame;
    }
}

class FrameManager {
    constructor(layerManager) {
        this.frames = [];
        this.currentFrameIndex = 0;
        this.layerManager = layerManager;
        this.fps = 12;
        this.isPlaying = false;
        this.animationSpeed = 1000 / this.fps;
        
        // Create first frame
        this.addFrame();
    }

    addFrame(index = null) {
        const frame = new Frame(this.layerManager);
        if (index !== null) {
            this.frames.splice(index, 0, frame);
        } else {
            this.frames.push(frame);
        }
        this.renderFramesList();
        return frame;
    }

    deleteFrame(index) {
        if (this.frames.length === 1) {
            alert('Cannot delete the last frame');
            return false;
        }
        this.frames.splice(index, 1);
        if (this.currentFrameIndex >= this.frames.length) {
            this.currentFrameIndex = this.frames.length - 1;
        }
        this.loadFrame(this.currentFrameIndex);
        this.renderFramesList();
        return true;
    }

    duplicateFrame(index) {
        const frame = this.frames[index].clone();
        this.frames.splice(index + 1, 0, frame);
        this.setCurrentFrame(index + 1);
        this.renderFramesList();
        return frame;
    }

    setCurrentFrame(index) {
        if (index >= 0 && index < this.frames.length) {
            // Save current layer manager state to frame
            if (this.currentFrameIndex >= 0) {
                const currentFrame = this.frames[this.currentFrameIndex];
                currentFrame.layers = this.layerManager.layers.map(l => l.clone());
            }
            
            this.currentFrameIndex = index;
            this.loadFrame(index);
            this.renderFramesList();
        }
    }

    loadFrame(index) {
        const frame = this.frames[index];
        this.layerManager.layers = frame.layers.map(l => l.clone());
        this.layerManager.setActiveLayer(0);
        this.layerManager.renderLayersList();
    }

    setFPS(fps) {
        this.fps = Math.max(1, Math.min(60, fps));
        this.animationSpeed = 1000 / this.fps;
    }

    renderFramesList() {
        const framesList = document.getElementById('framesList');
        framesList.innerHTML = '';
        
        this.frames.forEach((frame, index) => {
            const frameItem = document.createElement('div');
            frameItem.className = 'frame-item';
            if (index === this.currentFrameIndex) {
                frameItem.classList.add('active');
            }
            
            const namePart = document.createElement('span');
            namePart.className = 'frame-name';
            namePart.textContent = `Frame ${frame.frameNumber} (${frame.duration}ms)`;
            
            frameItem.appendChild(namePart);
            frameItem.onclick = () => this.setCurrentFrame(index);
            frameItem.ondblclick = () => {
                const newDuration = prompt('Frame duration (ms):', frame.duration);
                if (newDuration && !isNaN(newDuration)) {
                    frame.duration = parseInt(newDuration);
                    this.renderFramesList();
                }
            };
            
            framesList.appendChild(frameItem);
        });
    }

    toJSON() {
        return {
            frames: this.frames.map(f => f.toJSON()),
            currentFrameIndex: this.currentFrameIndex,
            fps: this.fps
        };
    }

    static fromJSON(obj, layerManager) {
        const manager = new FrameManager(layerManager);
        manager.frames = obj.frames.map(f => 
            Frame.fromJSON(f, layerManager.width, layerManager.height)
        );
        manager.setCurrentFrame(obj.currentFrameIndex || 0);
        manager.setFPS(obj.fps || 12);
        return manager;
    }
}

class AnimationPlayer {
    constructor(frameManager, canvas) {
        this.frameManager = frameManager;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isPlaying = false;
        this.currentPlayIndex = 0;
        this.animationRAF = null;
        this.frameStartTime = 0;
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentPlayIndex = 0;
        this.frameStartTime = performance.now();
        this.scheduleNextFrame();
    }

    stop() {
        if (this.animationRAF) {
            cancelAnimationFrame(this.animationRAF);
        }
        this.isPlaying = false;
    }

    scheduleNextFrame() {
        const frame = this.frameManager.frames[this.currentPlayIndex];
        
        // Draw frame
        this.drawFrame(frame);
        
        // Schedule next frame
        const nextFrameTime = frame.duration;
        this.animationRAF = setTimeout(() => {
            this.currentPlayIndex = (this.currentPlayIndex + 1) % this.frameManager.frames.length;
            this.scheduleNextFrame();
        }, nextFrameTime);
    }

    drawFrame(frame) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Composite all layers
        for (let i = frame.layers.length - 1; i >= 0; i--) {
            const layer = frame.layers[i];
            if (!layer.visible) continue;
            
            const imageData = layer.getImageData();
            this.ctx.globalAlpha = layer.opacity;
            this.ctx.putImageData(imageData, 0, 0);
        }
        this.ctx.globalAlpha = 1;
    }
}

class OnionSkinRenderer {
    constructor() {
        this.enabled = false;
        this.opacity = 0.3;
        this.framesBack = 1;
        this.framesForward = 1;
    }

    renderOnionSkin(canvas, ctx, frameManager, layerManager, zoom) {
        if (!this.enabled) return;

        const currentIndex = frameManager.currentFrameIndex;
        const ghostCanvas = document.createElement('canvas');
        ghostCanvas.width = canvas.width;
        ghostCanvas.height = canvas.height;
        const ghostCtx = ghostCanvas.getContext('2d');

        // Draw previous frames
        const prevColor = 'rgba(255, 0, 0, ' + (this.opacity * 0.3) + ')';
        for (let i = 1; i <= this.framesBack; i++) {
            const frameIndex = currentIndex - i;
            if (frameIndex >= 0 && frameIndex < frameManager.frames.length) {
                const frame = frameManager.frames[frameIndex];
                ghostCtx.fillStyle = prevColor;
                ghostCtx.fillRect(0, 0, ghostCanvas.width, ghostCanvas.height);
                this.compositeFrame(ghostCtx, frame, this.opacity * 0.3);
            }
        }

        // Draw next frames
        const nextColor = 'rgba(0, 0, 255, ' + (this.opacity * 0.3) + ')';
        for (let i = 1; i <= this.framesForward; i++) {
            const frameIndex = currentIndex + i;
            if (frameIndex >= 0 && frameIndex < frameManager.frames.length) {
                const frame = frameManager.frames[frameIndex];
                ghostCtx.fillStyle = nextColor;
                ghostCtx.fillRect(0, 0, ghostCanvas.width, ghostCanvas.height);
                this.compositeFrame(ghostCtx, frame, this.opacity * 0.3);
            }
        }

        // Draw the ghost image to the main canvas
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(ghostCanvas, 0, 0);
        ctx.globalAlpha = 1;
    }

    compositeFrame(ctx, frame, opacity) {
        for (let i = frame.layers.length - 1; i >= 0; i--) {
            const layer = frame.layers[i];
            if (!layer.visible) continue;

            const imageData = layer.getImageData();
            ctx.globalAlpha = layer.opacity * opacity;
            ctx.putImageData(imageData, 0, 0);
        }
        ctx.globalAlpha = 1;
    }
}

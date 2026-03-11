// Frame and Animation Management System for PixelArtPro

class Frame {
    constructor(layerManager, frameNumber = 1) {
        this.id = Date.now() + Math.floor(Math.random() * 1000);
        this.frameNumber = frameNumber;
        this.duration = 100;
        if (layerManager) {
            this.layers = layerManager.layers.map(l => l.clone());
        } else {
            this.layers = [];
        }
    }

    clone() {
        const cloned = new Frame(null, this.frameNumber);
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
        frame.layers = obj.layers.map(l => Layer.fromJSON(l));
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
            if (this.currentFrameIndex >= 0 && this.currentFrameIndex < this.frames.length) {
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
        this.layerManager.activeLayerIndex = Math.min(
            this.layerManager.activeLayerIndex,
            this.layerManager.layers.length - 1
        );
        this.layerManager.renderLayersList();
    }

    setFPS(fps) {
        this.fps = Math.max(1, Math.min(60, fps));
        this.animationSpeed = 1000 / this.fps;
    }

    renderFramesList() {
        const framesList = document.getElementById('framesList');
        if (!framesList) return;
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
        manager.currentFrameIndex = obj.currentFrameIndex || 0;
        manager.setFPS(obj.fps || 12);
        return manager;
    }
}

class AnimationPlayer {
    constructor(frameManager, canvas, compositor) {
        this.frameManager = frameManager;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.compositor = compositor;
        this.isPlaying = false;
        this.currentPlayIndex = 0;
        this._timeoutId = null;
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentPlayIndex = 0;
        this.scheduleNextFrame();
        PAP.EventBus.emit('animation:play');
    }

    stop() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
        this.isPlaying = false;
        PAP.EventBus.emit('animation:stop');
    }

    scheduleNextFrame() {
        if (!this.isPlaying) return;

        const frame = this.frameManager.frames[this.currentPlayIndex];
        this.drawFrame(frame);

        this._timeoutId = setTimeout(() => {
            this.currentPlayIndex = (this.currentPlayIndex + 1) % this.frameManager.frames.length;
            this.scheduleNextFrame();
        }, frame.duration);
    }

    drawFrame(frame) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.compositor) {
            const composited = this.compositor.compositeFrame(frame.layers);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(composited, 0, 0, this.compositor.width, this.compositor.height,
                0, 0, this.canvas.width, this.canvas.height);
        } else {
            for (let i = frame.layers.length - 1; i >= 0; i--) {
                const layer = frame.layers[i];
                if (!layer.visible) continue;
                const imageData = layer.getImageData();
                ctx.globalAlpha = layer.opacity;
                ctx.putImageData(imageData, 0, 0);
            }
            ctx.globalAlpha = 1;
        }
    }
}

class OnionSkinRenderer {
    constructor() {
        this.enabled = false;
        this.opacity = 0.3;
        this.framesBack = 1;
        this.framesForward = 1;
    }
}

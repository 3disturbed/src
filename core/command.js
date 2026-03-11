// Command Pattern for Undo/Redo
window.PAP = window.PAP || {};

// Base command class
PAP.Command = class Command {
    execute() { throw new Error('execute() must be implemented'); }
    undo() { throw new Error('undo() must be implemented'); }
    redo() { this.execute(); }
};

// Draw command - captures pixel delta in a bounding box region
PAP.DrawCommand = class DrawCommand extends PAP.Command {
    constructor(layer, description = 'Draw') {
        super();
        this.layerId = layer.id;
        this.description = description;
        this.beforeData = null;
        this.afterData = null;
        this.bounds = null;
        this._layer = layer;
    }

    // Call before drawing begins - snapshots the layer
    captureBeforeState() {
        this._beforeSnapshot = this._layer.pixelData.clone();
    }

    // Call after drawing ends - computes the delta
    captureAfterState() {
        const before = this._beforeSnapshot;
        const after = this._layer.pixelData;
        const w = after.width;
        const h = after.height;

        // Find bounding box of changed pixels
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                if (before.data[idx] !== after.data[idx] ||
                    before.data[idx + 1] !== after.data[idx + 1] ||
                    before.data[idx + 2] !== after.data[idx + 2] ||
                    before.data[idx + 3] !== after.data[idx + 3]) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (maxX < 0) {
            // No changes
            this.bounds = null;
            this._beforeSnapshot = null;
            return false;
        }

        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        this.bounds = { x: minX, y: minY, w: bw, h: bh };
        this.beforeData = before.getRegion(minX, minY, bw, bh).data;
        this.afterData = after.getRegion(minX, minY, bw, bh).data;
        this._beforeSnapshot = null;
        return true;
    }

    execute() {
        // Already applied during drawing
    }

    undo() {
        if (!this.bounds) return;
        const layer = this._resolveLayer();
        if (layer) {
            layer.pixelData.setRegion(
                this.bounds.x, this.bounds.y,
                this.bounds.w, this.bounds.h,
                this.beforeData
            );
        }
    }

    redo() {
        if (!this.bounds) return;
        const layer = this._resolveLayer();
        if (layer) {
            layer.pixelData.setRegion(
                this.bounds.x, this.bounds.y,
                this.bounds.w, this.bounds.h,
                this.afterData
            );
        }
    }

    _resolveLayer() {
        // Look up layer from the current app state
        if (this._layer && this._layer.id === this.layerId) return this._layer;
        if (window.darkPixel && window.darkPixel.layerManager) {
            return window.darkPixel.layerManager.layers.find(l => l.id === this.layerId) || null;
        }
        return null;
    }
};

// Compound command - groups multiple commands into one undo step
PAP.CompoundCommand = class CompoundCommand extends PAP.Command {
    constructor(commands = [], description = 'Compound') {
        super();
        this.commands = commands;
        this.description = description;
    }

    execute() {
        for (const cmd of this.commands) cmd.execute();
    }

    undo() {
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }

    redo() {
        for (const cmd of this.commands) cmd.redo();
    }
};

// Layer structural command (add/delete/reorder)
PAP.LayerStructureCommand = class LayerStructureCommand extends PAP.Command {
    constructor(type, layerManager, data, description) {
        super();
        this.type = type; // 'add', 'delete', 'reorder'
        this.data = data;
        this.description = description || type + ' layer';
        this._layerManager = layerManager;
    }

    execute() {
        // Already applied
    }

    undo() {
        const lm = this._layerManager;
        switch (this.type) {
            case 'add':
                // Remove the added layer
                lm.layers.splice(this.data.index, 1);
                if (lm.activeLayerIndex >= lm.layers.length) {
                    lm.activeLayerIndex = Math.max(0, lm.layers.length - 1);
                }
                break;
            case 'delete':
                // Re-insert the deleted layer
                lm.layers.splice(this.data.index, 0, this.data.layer);
                lm.activeLayerIndex = this.data.previousActiveIndex;
                break;
            case 'reorder':
                lm.layers.splice(this.data.toIndex, 1);
                lm.layers.splice(this.data.fromIndex, 0, this.data.layer);
                lm.activeLayerIndex = this.data.previousActiveIndex;
                break;
        }
        PAP.EventBus.emit('layers:changed');
    }

    redo() {
        const lm = this._layerManager;
        switch (this.type) {
            case 'add':
                lm.layers.splice(this.data.index, 0, this.data.layer);
                lm.activeLayerIndex = this.data.index;
                break;
            case 'delete':
                lm.layers.splice(this.data.index, 1);
                if (lm.activeLayerIndex >= lm.layers.length) {
                    lm.activeLayerIndex = Math.max(0, lm.layers.length - 1);
                }
                break;
            case 'reorder':
                lm.layers.splice(this.data.fromIndex, 1);
                lm.layers.splice(this.data.toIndex, 0, this.data.layer);
                lm.activeLayerIndex = this.data.toIndex;
                break;
        }
        PAP.EventBus.emit('layers:changed');
    }
};

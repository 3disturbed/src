// Layer Management System for PixelArtPro

class Layer {
    constructor(name, width, height, id = null) {
        this.id = id || Date.now();
        this.name = name;
        this.width = width;
        this.height = height;
        this.pixelData = new PixelData(width, height);
        this.visible = true;
        this.opacity = 1;
        this.locked = false;
    }

    clone() {
        const cloned = new Layer(this.name + ' copy', this.width, this.height, Date.now());
        cloned.pixelData = this.pixelData.clone();
        cloned.visible = this.visible;
        cloned.opacity = this.opacity;
        return cloned;
    }

    getImageData() {
        return this.pixelData.getImageData();
    }

    setPixel(x, y, color) {
        if (!this.locked) {
            this.pixelData.setPixel(x, y, color);
        }
    }

    clear() {
        this.pixelData.clear();
    }

    resize(newWidth, newHeight) {
        const newData = new PixelData(newWidth, newHeight);
        
        // Copy existing data
        for (let y = 0; y < Math.min(this.height, newHeight); y++) {
            for (let x = 0; x < Math.min(this.width, newWidth); x++) {
                const pixel = this.pixelData.getPixel(x, y);
                newData.setPixel(x, y, new Color(pixel.r, pixel.g, pixel.b, pixel.a));
            }
        }
        
        this.pixelData = newData;
        this.width = newWidth;
        this.height = newHeight;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            width: this.width,
            height: this.height,
            data: Array.from(this.pixelData.data),
            visible: this.visible,
            opacity: this.opacity,
            locked: this.locked
        };
    }

    static fromJSON(obj) {
        const layer = new Layer(obj.name, obj.width, obj.height, obj.id);
        layer.pixelData.data = new Uint8ClampedArray(obj.data);
        layer.visible = obj.visible;
        layer.opacity = obj.opacity;
        layer.locked = obj.locked;
        return layer;
    }
}

class LayerManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.layers = [];
        this.activeLayerIndex = -1;
        this.compositedCanvas = document.createElement('canvas');
        this.compositedCanvas.width = width;
        this.compositedCanvas.height = height;
        
        // Create default layer
        this.addLayer('Background');
    }

    addLayer(name = null) {
        const layerName = name || `Layer ${this.layers.length + 1}`;
        const layer = new Layer(layerName, this.width, this.height);
        this.layers.push(layer);
        this.setActiveLayer(this.layers.length - 1);
        this.renderLayersList();
        return layer;
    }

    deleteLayer(index) {
        if (this.layers.length === 1) {
            alert('Cannot delete the last layer');
            return false;
        }
        this.layers.splice(index, 1);
        if (this.activeLayerIndex >= this.layers.length) {
            this.activeLayerIndex = this.layers.length - 1;
        }
        this.renderLayersList();
        return true;
    }

    duplicateLayer(index) {
        const layer = this.layers[index];
        const clone = layer.clone();
        this.layers.splice(index + 1, 0, clone);
        this.setActiveLayer(index + 1);
        this.renderLayersList();
        return clone;
    }

    setActiveLayer(index) {
        if (index >= 0 && index < this.layers.length) {
            this.activeLayerIndex = index;
            this.renderLayersList();
        }
    }

    getActiveLayer() {
        return this.layers[this.activeLayerIndex];
    }

    mergeDown(index) {
        if (index === 0 || index >= this.layers.length) return false;
        
        const topLayer = this.layers[index];
        const bottomLayer = this.layers[index - 1];
        
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;
        
        // Draw bottom layer
        const bottomImageData = bottomLayer.getImageData();
        ctx.putImageData(bottomImageData, 0, 0);
        
        // Draw top layer with opacity
        const topImageData = topLayer.getImageData();
        ctx.globalAlpha = topLayer.opacity;
        ctx.putImageData(topImageData, 0, 0);
        
        // Update bottom layer with merged data
        const mergedData = ctx.getImageData(0, 0, this.width, this.height);
        bottomLayer.pixelData.data.set(mergedData.data);
        
        // Remove top layer
        this.layers.splice(index, 1);
        if (this.activeLayerIndex === index) {
            this.activeLayerIndex = index - 1;
        }
        this.renderLayersList();
        return true;
    }

    toggleLayerVisibility(index) {
        if (index >= 0 && index < this.layers.length) {
            this.layers[index].visible = !this.layers[index].visible;
            this.renderLayersList();
        }
    }

    moveLayer(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.layers.length) return false;
        const layer = this.layers.splice(fromIndex, 1)[0];
        this.layers.splice(toIndex, 0, layer);
        this.setActiveLayer(toIndex);
        this.renderLayersList();
        return true;
    }

    resizeAllLayers(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        this.compositedCanvas.width = newWidth;
        this.compositedCanvas.height = newHeight;
        
        this.layers.forEach(layer => {
            layer.resize(newWidth, newHeight);
        });
    }

    composite() {
        const ctx = this.compositedCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.width, this.height);
        
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            if (!layer.visible) continue;
            
            const imageData = layer.getImageData();
            ctx.globalAlpha = layer.opacity;
            ctx.putImageData(imageData, 0, 0);
        }
        ctx.globalAlpha = 1;
        
        return this.compositedCanvas;
    }

    renderLayersList() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (i === this.activeLayerIndex) {
                layerItem.classList.add('active');
            }
            
            const visibilityToggle = document.createElement('span');
            visibilityToggle.className = 'layer-visibility';
            visibilityToggle.textContent = layer.visible ? '👁️' : '🚫';
            visibilityToggle.title = 'Toggle visibility';
            visibilityToggle.onclick = (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(i);
            };
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'layer-name';
            nameSpan.textContent = layer.name;
            nameSpan.title = layer.name;
            
            layerItem.appendChild(visibilityToggle);
            layerItem.appendChild(nameSpan);
            
            layerItem.onclick = () => this.setActiveLayer(i);
            layerItem.ondblclick = () => {
                const newName = prompt('Rename layer:', layer.name);
                if (newName && newName.trim()) {
                    layer.name = newName.trim();
                    this.renderLayersList();
                }
            };
            
            layersList.appendChild(layerItem);
        }
    }

    toJSON() {
        return {
            width: this.width,
            height: this.height,
            layers: this.layers.map(l => l.toJSON()),
            activeLayerIndex: this.activeLayerIndex
        };
    }

    static fromJSON(obj) {
        const manager = new LayerManager(obj.width, obj.height);
        manager.layers = obj.layers.map(l => Layer.fromJSON(l));
        manager.setActiveLayer(obj.activeLayerIndex || 0);
        return manager;
    }

    clear() {
        this.layers.forEach(layer => layer.clear());
    }
}

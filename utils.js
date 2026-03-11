// Utility functions for PixelArtPro

class ByteBuffer {
    constructor(data = null) {
        if (data) {
            this.buffer = new DataView(data);
            this.offset = 0;
        } else {
            this.data = [];
            this.offset = 0;
        }
    }

    static create() {
        return new ByteBuffer();
    }

    writeUint32(value) {
        const bytes = [
            (value >>> 24) & 0xFF,
            (value >>> 16) & 0xFF,
            (value >>> 8) & 0xFF,
            value & 0xFF
        ];
        this.data.push(...bytes);
    }

    writeUint8(value) {
        this.data.push(value & 0xFF);
    }

    writeString(str) {
        const encoded = new TextEncoder().encode(str);
        this.writeUint32(encoded.length);
        this.data.push(...encoded);
    }

    getBuffer() {
        return new Uint8Array(this.data).buffer;
    }
}

class Color {
    constructor(r, g, b, a = 255) {
        this.r = Math.max(0, Math.min(255, r));
        this.g = Math.max(0, Math.min(255, g));
        this.b = Math.max(0, Math.min(255, b));
        this.a = Math.max(0, Math.min(255, a));
    }

    static fromHex(hex) {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return new Color(r, g, b);
    }

    static fromRGBA(r, g, b, a) {
        return new Color(r, g, b, a);
    }

    toHex() {
        return '#' + [this.r, this.g, this.b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }

    toRGBA() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`;
    }

    toCSSString() {
        return this.a === 255 
            ? `rgb(${this.r}, ${this.g}, ${this.b})`
            : `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`;
    }

    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
}

class PixelData {
    constructor(width, height, data = null) {
        this.width = width;
        this.height = height;
        this.data = data || new Uint8ClampedArray(width * height * 4);
    }

    getPixel(x, y) {
        const idx = (y * this.width + x) * 4;
        return {
            r: this.data[idx],
            g: this.data[idx + 1],
            b: this.data[idx + 2],
            a: this.data[idx + 3]
        };
    }

    setPixel(x, y, color) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const idx = (y * this.width + x) * 4;
        this.data[idx] = color.r;
        this.data[idx + 1] = color.g;
        this.data[idx + 2] = color.b;
        this.data[idx + 3] = color.a;
    }

    fill(color) {
        for (let i = 0; i < this.data.length; i += 4) {
            this.data[i] = color.r;
            this.data[i + 1] = color.g;
            this.data[i + 2] = color.b;
            this.data[i + 3] = color.a;
        }
    }

    clone() {
        return new PixelData(this.width, this.height, new Uint8ClampedArray(this.data));
    }

    clear() {
        this.data.fill(0);
    }

    getImageData() {
        return new ImageData(this.data, this.width, this.height);
    }
}

// Bresenham's line algorithm
function drawLine(pixelData, x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0, y = y0;
    while (true) {
        pixelData.setPixel(x, y, color);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

// Draw rectangle
function drawRect(pixelData, x0, y0, x1, y1, color, filled = false) {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    if (filled) {
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                pixelData.setPixel(x, y, color);
            }
        }
    } else {
        // Draw outline
        for (let x = minX; x <= maxX; x++) {
            pixelData.setPixel(x, minY, color);
            pixelData.setPixel(x, maxY, color);
        }
        for (let y = minY; y <= maxY; y++) {
            pixelData.setPixel(minX, y, color);
            pixelData.setPixel(maxX, y, color);
        }
    }
}

// Draw circle using Bresenham's circle algorithm
function drawCircle(pixelData, cx, cy, radius, color, filled = false) {
    let x = radius;
    let y = 0;
    let dec = 3 - 2 * radius;

    const drawCirclePoints = (cx, cy, x, y) => {
        if (filled) {
            // Fill horizontal lines
            drawLine(pixelData, cx - x, cy + y, cx + x, cy + y, color);
            drawLine(pixelData, cx - x, cy - y, cx + x, cy - y, color);
            drawLine(pixelData, cx - y, cy + x, cx + y, cy + x, color);
            drawLine(pixelData, cx - y, cy - x, cx + y, cy - x, color);
        } else {
            pixelData.setPixel(cx + x, cy + y, color);
            pixelData.setPixel(cx - x, cy + y, color);
            pixelData.setPixel(cx + x, cy - y, color);
            pixelData.setPixel(cx - x, cy - y, color);
            pixelData.setPixel(cx + y, cy + x, color);
            pixelData.setPixel(cx - y, cy + x, color);
            pixelData.setPixel(cx + y, cy - x, color);
            pixelData.setPixel(cx - y, cy - x, color);
        }
    };

    drawCirclePoints(cx, cy, x, y);

    while (x >= y) {
        y++;
        if (dec > 0) {
            x--;
            dec = dec + 4 * (y - x) + 10;
        } else {
            dec = dec + 4 * y + 6;
        }
        drawCirclePoints(cx, cy, x, y);
    }
}

// Flood fill algorithm
function floodFill(pixelData, x, y, newColor) {
    if (x < 0 || x >= pixelData.width || y < 0 || y >= pixelData.height) return;

    const targetColor = pixelData.getPixel(x, y);
    if (targetColor.r === newColor.r && 
        targetColor.g === newColor.g && 
        targetColor.b === newColor.b && 
        targetColor.a === newColor.a) {
        return; // Same color, no need to fill
    }

    const queue = [[x, y]];
    const visited = new Set();
    
    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        const key = `${cx},${cy}`;
        
        if (visited.has(key)) continue;
        visited.add(key);

        if (cx < 0 || cx >= pixelData.width || cy < 0 || cy >= pixelData.height) continue;

        const pixel = pixelData.getPixel(cx, cy);
        if (pixel.r !== targetColor.r || 
            pixel.g !== targetColor.g || 
            pixel.b !== targetColor.b || 
            pixel.a !== targetColor.a) {
            continue;
        }

        pixelData.setPixel(cx, cy, newColor);

        queue.push([cx + 1, cy]);
        queue.push([cx - 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx, cy - 1]);
    }
}

// Canvas utilities
function resizeCanvasAndCenter(canvas, width, height, zoom) {
    const scaledWidth = width * zoom;
    const scaledHeight = height * zoom;
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    canvasWrapper.style.width = Math.min(scaledWidth, window.innerWidth - 520) + 'px';
    canvasWrapper.style.height = Math.min(scaledHeight, window.innerHeight - 100) + 'px';
}

// Image export helpers
function canvasToBlob(canvas) {
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob));
    });
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

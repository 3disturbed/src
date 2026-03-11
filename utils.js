// Utility functions for DarkPixel
// Color and PixelData classes have moved to core/color.js and core/pixel-data.js

window.PAP = window.PAP || {};

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

PAP.ByteBuffer = ByteBuffer;

// Drawing algorithms - namespaced under PAP

PAP.drawLine = function drawLine(pixelData, x0, y0, x1, y1, color) {
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
};

PAP.drawRect = function drawRect(pixelData, x0, y0, x1, y1, color, filled = false) {
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
        for (let x = minX; x <= maxX; x++) {
            pixelData.setPixel(x, minY, color);
            pixelData.setPixel(x, maxY, color);
        }
        for (let y = minY; y <= maxY; y++) {
            pixelData.setPixel(minX, y, color);
            pixelData.setPixel(maxX, y, color);
        }
    }
};

PAP.drawCircle = function drawCircle(pixelData, cx, cy, radius, color, filled = false) {
    let x = radius;
    let y = 0;
    let dec = 3 - 2 * radius;

    const drawCirclePoints = (cx, cy, x, y) => {
        if (filled) {
            PAP.drawLine(pixelData, cx - x, cy + y, cx + x, cy + y, color);
            PAP.drawLine(pixelData, cx - x, cy - y, cx + x, cy - y, color);
            PAP.drawLine(pixelData, cx - y, cy + x, cx + y, cy + x, color);
            PAP.drawLine(pixelData, cx - y, cy - x, cx + y, cy - x, color);
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
};

PAP.floodFill = function floodFill(pixelData, x, y, newColor) {
    if (x < 0 || x >= pixelData.width || y < 0 || y >= pixelData.height) return;

    const targetColor = pixelData.getPixel(x, y);
    if (targetColor.r === newColor.r &&
        targetColor.g === newColor.g &&
        targetColor.b === newColor.b &&
        targetColor.a === newColor.a) {
        return;
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
};

PAP.fillPolygon = function fillPolygon(pixelData, points, color) {
    if (points.length < 3) return;

    // Find bounding box
    let minY = Infinity, maxY = -Infinity;
    for (const p of points) {
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(pixelData.height - 1, Math.floor(maxY));

    // Scanline fill
    for (let y = minY; y <= maxY; y++) {
        const intersections = [];
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const yi = points[i].y, yj = points[j].y;
            const xi = points[i].x, xj = points[j].x;

            if ((yi <= y && yj > y) || (yj <= y && yi > y)) {
                const t = (y - yi) / (yj - yi);
                intersections.push(xi + t * (xj - xi));
            }
        }
        intersections.sort((a, b) => a - b);

        for (let k = 0; k < intersections.length - 1; k += 2) {
            const xStart = Math.max(0, Math.ceil(intersections[k]));
            const xEnd = Math.min(pixelData.width - 1, Math.floor(intersections[k + 1]));
            for (let x = xStart; x <= xEnd; x++) {
                pixelData.setPixel(x, y, color);
            }
        }
    }
};

PAP.strokePolygon = function strokePolygon(pixelData, points, color) {
    if (points.length < 2) return;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        PAP.drawLine(pixelData,
            Math.round(points[i].x), Math.round(points[i].y),
            Math.round(points[j].x), Math.round(points[j].y),
            color
        );
    }
};

// Backward compatibility - keep global function names working
function drawLine(pixelData, x0, y0, x1, y1, color) { PAP.drawLine(pixelData, x0, y0, x1, y1, color); }
function drawRect(pixelData, x0, y0, x1, y1, color, filled) { PAP.drawRect(pixelData, x0, y0, x1, y1, color, filled); }
function drawCircle(pixelData, cx, cy, radius, color, filled) { PAP.drawCircle(pixelData, cx, cy, radius, color, filled); }
function floodFill(pixelData, x, y, newColor) { PAP.floodFill(pixelData, x, y, newColor); }

PAP.downloadFile = function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

function downloadFile(blob, filename) { PAP.downloadFile(blob, filename); }

PAP.canvasToBlob = function canvasToBlob(canvas) {
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob));
    });
};

// PixelData class for PixelArtPro
window.PAP = window.PAP || {};

PAP.PixelData = class PixelData {
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
        return new PAP.PixelData(this.width, this.height, new Uint8ClampedArray(this.data));
    }

    clear() {
        this.data.fill(0);
    }

    getImageData() {
        return new ImageData(new Uint8ClampedArray(this.data), this.width, this.height);
    }

    getRegion(rx, ry, rw, rh) {
        rx = Math.max(0, rx);
        ry = Math.max(0, ry);
        rw = Math.min(rw, this.width - rx);
        rh = Math.min(rh, this.height - ry);

        const region = new Uint8ClampedArray(rw * rh * 4);
        for (let y = 0; y < rh; y++) {
            const srcStart = ((ry + y) * this.width + rx) * 4;
            const dstStart = y * rw * 4;
            region.set(this.data.subarray(srcStart, srcStart + rw * 4), dstStart);
        }
        return { x: rx, y: ry, width: rw, height: rh, data: region };
    }

    setRegion(rx, ry, rw, rh, regionData) {
        for (let y = 0; y < rh; y++) {
            if (ry + y < 0 || ry + y >= this.height) continue;
            const dstStart = ((ry + y) * this.width + rx) * 4;
            const srcStart = y * rw * 4;
            const copyWidth = Math.min(rw, this.width - rx) * 4;
            if (copyWidth > 0) {
                this.data.set(regionData.subarray(srcStart, srcStart + copyWidth), dstStart);
            }
        }
    }
};

// Backward compatibility
window.PixelData = PAP.PixelData;

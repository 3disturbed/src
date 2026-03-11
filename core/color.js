// Color class for DarkPixel
window.PAP = window.PAP || {};

PAP.Color = class Color {
    constructor(r, g, b, a = 255) {
        this.r = Math.max(0, Math.min(255, r | 0));
        this.g = Math.max(0, Math.min(255, g | 0));
        this.b = Math.max(0, Math.min(255, b | 0));
        this.a = Math.max(0, Math.min(255, a | 0));
    }

    static fromHex(hex) {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        const a = hex.length > 7 ? parseInt(hex.substr(7, 2), 16) : 255;
        return new PAP.Color(r, g, b, a);
    }

    static fromRGBA(r, g, b, a) {
        return new PAP.Color(r, g, b, a);
    }

    static fromHSL(h, s, l, a = 255) {
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(1, s));
        l = Math.max(0, Math.min(1, l));

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r, g, b;
        if (h < 60)       { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else               { r = c; g = 0; b = x; }

        return new PAP.Color(
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255),
            a
        );
    }

    static fromHSV(h, s, v, a = 255) {
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(1, s));
        v = Math.max(0, Math.min(1, v));

        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;

        let r, g, b;
        if (h < 60)       { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else               { r = c; g = 0; b = x; }

        return new PAP.Color(
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255),
            a
        );
    }

    toHex() {
        return '#' + [this.r, this.g, this.b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }

    toHexWithAlpha() {
        return '#' + [this.r, this.g, this.b, this.a]
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

    toHSL() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        if (max === min) return { h: 0, s: 0, l };

        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        let h;
        if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else                h = ((r - g) / d + 4) / 6;

        return { h: h * 360, s, l };
    }

    toHSV() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const v = max;

        if (max === 0) return { h: 0, s: 0, v };

        const d = max - min;
        const s = d / max;

        if (max === min) return { h: 0, s: 0, v };

        let h;
        if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else                h = ((r - g) / d + 4) / 6;

        return { h: h * 360, s, v };
    }

    equals(other) {
        return this.r === other.r && this.g === other.g &&
               this.b === other.b && this.a === other.a;
    }

    clone() {
        return new PAP.Color(this.r, this.g, this.b, this.a);
    }
};

// Backward compatibility - global alias
window.Color = PAP.Color;

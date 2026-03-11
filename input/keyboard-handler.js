// Keyboard Shortcut Handler
window.PAP = window.PAP || {};

PAP.KeyboardHandler = class KeyboardHandler {
    constructor() {
        this._shortcuts = new Map();
        this._enabled = true;

        document.addEventListener('keydown', (e) => this._onKeyDown(e));
    }

    register(combo, callback, description = '') {
        const key = this._normalizeCombo(combo);
        this._shortcuts.set(key, { callback, description });
    }

    unregister(combo) {
        const key = this._normalizeCombo(combo);
        this._shortcuts.delete(key);
    }

    _normalizeCombo(combo) {
        return combo.toLowerCase().split('+').sort().join('+');
    }

    _eventToCombo(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        parts.push(e.key.toLowerCase());
        return parts.sort().join('+');
    }

    _onKeyDown(e) {
        if (!this._enabled) return;

        // Don't capture when typing in inputs
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        const combo = this._eventToCombo(e);
        const shortcut = this._shortcuts.get(combo);

        if (shortcut) {
            e.preventDefault();
            shortcut.callback(e);
        }
    }

    enable() { this._enabled = true; }
    disable() { this._enabled = false; }
};

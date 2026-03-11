// PixelArtPro Configuration & Advanced Settings
// This file provides guidance on customizing and extending PixelArtPro

/**
 * APPLICATION CONFIGURATION
 * Modify these settings to customize behavior
 */
const CONFIG = {
    // Canvas dimensions (pixels)
    DEFAULT_CANVAS_WIDTH: 32,
    DEFAULT_CANVAS_HEIGHT: 32,
    MIN_CANVAS_SIZE: 8,
    MAX_CANVAS_SIZE: 512,

    // Drawing settings
    DEFAULT_BRUSH_SIZE: 1,
    MAX_BRUSH_SIZE: 32,
    DEFAULT_ZOOM: 16,
    MAX_ZOOM: 16,

    // Animation settings
    DEFAULT_FPS: 12,
    MIN_FPS: 1,
    MAX_FPS: 60,

    // Performance settings
    MAX_HISTORY_STEPS: 50,
    MAX_UNDO_DEPTH: 100,

    // Onion skin defaults
    DEFAULT_ONION_OPACITY: 0.3,
    DEFAULT_FRAMES_BACK: 1,
    DEFAULT_FRAMES_FORWARD: 1,

    // UI settings
    GRID_VISIBLE_ZOOM_THRESHOLD: 4,
    CHECKERBOARD_SQUARE_SIZE: 4,

    // Color defaults
    DEFAULT_COLOR: '#000000',
    TRANSPARENT_COLOR: 'rgba(0, 0, 0, 0)',

    // Export settings
    GIF_EXPORT_SCALE: 2,
    PNG_EXPORT_QUALITY: 1.0,

    // File settings
    PROJECT_FILE_EXTENSION: '.pixelart',
    PROJECT_FILE_MIME_TYPE: 'application/json',
    EXPORT_TIMESTAMP_FORMAT: 'YYYY-MM-DD_HH-mm-ss'
};

/**
 * THEME CONFIGURATION
 * Customize colors and appearance
 */
const THEMES = {
    dark: {
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#3498db',
        text: '#ecf0f1',
        background: '#1a1a1a',
        border: '#7f8c8d'
    },
    light: {
        primary: '#ecf0f1',
        secondary: '#bdc3c7',
        accent: '#3498db',
        text: '#2c3e50',
        background: '#ffffff',
        border: '#95a5a6'
    },
    vibrant: {
        primary: '#ff006e',
        secondary: '#8338ec',
        accent: '#3a86ff',
        text: '#ffbe0b',
        background: '#1a1a1a',
        border: '#fb5607'
    }
};

/**
 * KEYBOARD SHORTCUTS CONFIGURATION
 * Customize keyboard shortcuts here
 */
const SHORTCUTS = {
    'p': { tool: 'pencil', label: 'Pencil' },
    'e': { tool: 'eraser', label: 'Eraser' },
    'b': { tool: 'fill', label: 'Fill Bucket' },
    'i': { tool: 'eyedropper', label: 'Eye Dropper' },
    'l': { tool: 'line', label: 'Line' },
    'r': { tool: 'rect', label: 'Rectangle' },
    'c': { tool: 'circle', label: 'Circle' },

    // Edit shortcuts
    'ctrl+z': { action: 'undo', label: 'Undo' },
    'ctrl+y': { action: 'redo', label: 'Redo' },
    'ctrl+shift+z': { action: 'redo', label: 'Redo' },
    'ctrl+s': { action: 'save', label: 'Save Project' },
    'ctrl+n': { action: 'new', label: 'New Project' },
    'ctrl+o': { action: 'open', label: 'Open Project' }
};

/**
 * TOOL DEFINITIONS
 * Add custom tools by extending this configuration
 */
const TOOLS = {
    pencil: {
        name: 'Pencil',
        icon: '✏️',
        description: 'Draw freehand pixels',
        continuous: true,
        supportsSize: true,
        supportsColor: true
    },
    eraser: {
        name: 'Eraser',
        icon: '🧹',
        description: 'Erase pixels (make transparent)',
        continuous: true,
        supportsSize: true,
        supportsColor: false
    },
    fill: {
        name: 'Fill Bucket',
        icon: '🪣',
        description: 'Fill area with color',
        continuous: false,
        supportsSize: false,
        supportsColor: true
    },
    eyedropper: {
        name: 'Eye Dropper',
        icon: '🎯',
        description: 'Pick color from canvas',
        continuous: false,
        supportsSize: false,
        supportsColor: false
    },
    line: {
        name: 'Line',
        icon: '📏',
        description: 'Draw straight line',
        continuous: false,
        supportsSize: true,
        supportsColor: true
    },
    rect: {
        name: 'Rectangle',
        icon: '▭',
        description: 'Draw rectangle',
        continuous: false,
        supportsSize: true,
        supportsColor: true
    },
    circle: {
        name: 'Circle',
        icon: '●',
        description: 'Draw circle',
        continuous: false,
        supportsSize: true,
        supportsColor: true
    }
};

/**
 * FUTURE FEATURES
 * These features are planned for future versions
 */
const PLANNED_FEATURES = {
    // Selection tools
    rectSelect: {
        name: 'Rectangular Selection',
        description: 'Select rectangular area',
        priority: 'high'
    },
    freeSelect: {
        name: 'Free Selection',
        description: 'Select arbitrary shaped area',
        priority: 'high'
    },
    magicWand: {
        name: 'Magic Wand',
        description: 'Select by color',
        priority: 'medium'
    },

    // Transform tools
    move: {
        name: 'Move Tool',
        description: 'Move content within layer',
        priority: 'high'
    },
    rotate: {
        name: 'Rotate',
        description: 'Rotate layers or content',
        priority: 'medium'
    },
    scale: {
        name: 'Scale',
        description: 'Resize layers or content',
        priority: 'medium'
    },
    flip: {
        name: 'Flip',
        description: 'Flip horizontally or vertically',
        priority: 'medium'
    },

    // Advanced drawing
    gradient: {
        name: 'Gradient Tool',
        description: 'Draw gradients',
        priority: 'medium'
    },
    pattern: {
        name: 'Pattern Fill',
        description: 'Fill with patterns',
        priority: 'low'
    },
    spray: {
        name: 'Spray Can',
        description: 'Spray paint effect',
        priority: 'low'
    },

    // UI Features
    palettes: {
        name: 'Color Palettes',
        description: 'Save and manage color palettes',
        priority: 'high'
    },
    symmetry: {
        name: 'Symmetry Tools',
        description: 'Mirror and multi-axis symmetry',
        priority: 'medium'
    },
    guides: {
        name: 'Guides & Rulers',
        description: 'Visual alignment guides',
        priority: 'medium'
    },
    pixelSnap: {
        name: 'Pixel Snap',
        description: 'Snap tools to pixel grid',
        priority: 'low'
    },

    // Export enhancements
    gifExport: {
        name: 'GIF Export',
        description: 'Export animations as GIF files',
        priority: 'high',
        status: 'partial' // Module available in gif-exporter.js
    },
    spritesheet: {
        name: 'Sprite Sheet Export',
        description: 'Export all frames as sprite sheet',
        priority: 'medium'
    },
    webp: {
        name: 'WebP Export',
        description: 'Export as modern WebP format',
        priority: 'low'
    },

    // Advanced animation
    tweening: {
        name: 'Automatic Tweening',
        description: 'Auto-generate in-between frames',
        priority: 'medium'
    },
    timeline: {
        name: 'Advanced Timeline',
        description: 'Visual frame timeline editor',
        priority: 'medium'
    },
    preview: {
        name: 'Fullscreen Preview',
        description: 'Preview animation fullscreen',
        priority: 'low'
    }
};

/**
 * PERFORMANCE OPTIMIZATION TIPS
 * 
 * 1. Canvas Size: Smaller canvases use less memory
 *    - Start with 32x32 or 64x64
 *    - Resize down for mobile devices
 * 
 * 2. Frame Count: More frames = more memory
 *    - 10-20 frames typical for animation
 *    - Consider optimizing brush strokes
 * 
 * 3. Layer Count: Limit to 10-15 layers
 *    - Merge down when finished with layer
 *    - Use smart layer organization
 * 
 * 4. Undo Depth: Reduce MAX_HISTORY_STEPS if memory-constrained
 *    - Default is 50, lower to 20-30 if needed
 * 
 * 5. Browser: Use latest browser version
 *    - Modern browsers have better Canvas performance
 *    - Consider Chrome/Edge for best performance
 */

/**
 * PLUGIN SYSTEM (Future)
 * Structure for extending with plugins
 */
const PLUGIN_API = {
    // Tool plugins
    registerTool(name, toolDefinition) {
        // To implement: Add to TOOLS
    },

    // Color plugins
    registerColorSpace(name, colorSpace) {
        // To implement: Support CMYK, HSV, etc.
    },

    // Export plugins
    registerExporter(name, exportFunction) {
        // To implement: Add custom export formats
    },

    // Filter plugins
    registerFilter(name, filterFunction) {
        // To implement: Add image filters/effects
    }
};

/**
 * ACCESSIBILITY SETTINGS
 * Enhance usability for different needs
 */
const ACCESSIBILITY = {
    // High contrast mode
    highContrast: false,

    // Keyboard navigation
    keyboardOnly: false,

    // Screen reader hints
    ariaLabels: true,

    // Custom cursor size
    cursorSize: 'normal', // 'large', 'extra-large'

    // Animation preferences
    reduceMotion: false,

    // Text size
    fontSize: 'normal' // 'large', 'extra-large'
};

/**
 * DEVELOPMENT & DEBUG SETTINGS
 */
const DEBUG = {
    // Enable console logging
    verbose: false,

    // Show performance metrics
    showMetrics: false,

    // Show bounding boxes
    showBounds: false,

    // Freeze UI for testing
    freezeUI: false,

    // Auto-save interval (ms)
    autoSaveInterval: 0 // 0 = disabled
};

/**
 * EXPORT HELPERS
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, THEMES, TOOLS, SHORTCUTS };
}

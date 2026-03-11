# DarkPixel - HTML5 Canvas Pixel Editor

A fully-featured pixel art editor built with HTML5 Canvas, featuring layers, animation frames, onion skin support, and project save/load functionality.

## Features

### Core Drawing Tools
- **Pencil**: Draw freehand pixels
- **Eraser**: Remove pixels (transparent)
- **Fill Bucket**: Flood fill with current color
- **Eye Dropper**: Pick colors from the canvas
- **Line**: Draw straight lines
- **Rectangle**: Draw rectangles
- **Circle**: Draw circles

### Layer Management
- Create, delete, and duplicate layers
- Hide/show layer visibility
- Adjust layer opacity
- Lock layers to prevent editing
- Rename layers
- Layer composition for final output

### Animation & Frames
- Create multiple frames for animation
- Set frame duration (milliseconds)
- Adjust animation playback speed (FPS)
- Preview animation with play/stop controls
- Animated timeline with frame thumbnails

### Onion Skin
- Enable/disable onion skin overlay
- Adjust opacity of ghost frames
- Control how many frames to display before and after current frame
- Visual reference for smooth animation

### Editing Features
- Adjustable brush size
- Canvas resizing
- Full color picker with hex color display
- Zoom up to 16x
- Grid overlay when zoomed
- Undo/Redo with 50-step history

### Project Management
- **Save Projects**: Export project as `.pixelart` file
- **Load Projects**: Import previously saved projects
- **Export PNG**: Save current frame as PNG
- **Export JSON**: Export full project data as JSON
- **New Project**: Start fresh with default 32x32 canvas

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| P | Select Pencil |
| E | Select Eraser |
| B | Select Fill Bucket |
| I | Select Eye Dropper |
| L | Select Line |
| R | Select Rectangle |
| C | Select Circle |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z or Ctrl+Y | Redo |

## How to Use

### Getting Started
1. Open `index.html` in a modern web browser
2. A 32x32 pixel canvas will load with a default background layer
3. Select a tool from the Tools panel and start drawing

### Drawing
- **Left Click**: Draw with current color
- **Right Click**: Draw with transparent (eraser)
- **Mouse Move**: Update position indicator
- **Drag for Shapes**: Click and drag to draw lines, rectangles, or circles

### Working with Layers
1. Click **+ Layer** to add a new layer
2. Use the **Layers** panel to switch between layers
3. Click the eye icon to toggle visibility
4. Double-click a layer name to rename it
5. Use **Dup** to duplicate the active layer

### Creating Animations
1. Draw your first frame
2. Click **+ Frame** to add a new frame
3. Draw the next pose/position
4. Repeat for each frame
5. Adjust FPS in the frames panel
6. Click **▶ Play** to preview animation

### Using Onion Skin
1. Enable the **Onion Skin** checkbox
2. Adjust opacity to see ghost frames more/less clearly
3. Set "Frames Back" to see previous animation frames
4. Set "Frames Forward" to see upcoming animation frames
5. Great for creating smooth, fluid animations

### Exporting Your Work
- **Export PNG**: Saves current frame as PNG image
- **Export Data**: Saves full project data as JSON (includes all layers and frames)
- **Save Project**: Saves as `.pixelart` file for later editing

### Importing
- **Open**: Click Open to load a previously saved `.pixelart` project

## File Formats

### .pixelart Format
Custom JSON-based format containing:
- Canvas dimensions
- All layers with pixel data
- All animation frames
- Layer properties (opacity, visibility)
- Project metadata

### PNG Export
Standard PNG format showing the composited result of all visible layers

### JSON Export
Structured JSON containing all project data, useful for programmatic access

## Canvas Size

Default: 32x32 pixels
Adjustable: 8x8 to 512x512 pixels

The canvas can be resized at any time. Existing content is preserved when resizing to larger dimensions, and cropped when resizing to smaller dimensions.

## Color Picker

Click the color input field to open your system's color picker. The hexadecimal value is displayed next to the color picker for precision.

## Brush Size

Adjust brush size from 1 to 32 pixels. Larger brush sizes are useful for filling areas quickly when zoomed in.

## Performance Tips

1. **Zoom Strategically**: Use zoom to see fine details while editing
2. **Layer Organization**: Keep related pixels on separate layers
3. **Frame Optimization**: Avoid excessive frames for small animations
4. **History**: Undo/Redo are limited to 50 steps to manage memory
5. **Export First**: Always save/export before closing to avoid data loss

## Browser Compatibility

Requires a modern browser with:
- HTML5 Canvas support
- ES6 JavaScript support
- Local Storage (for history)
- File API (for import/export)

Tested on:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

Potential features for future versions:
- GIF export with gif.js library
- Selection tools (rectangular, free-select)
- Transform tools (rotate, flip, scale)
- More drawing shapes
- Gradient tools
- Pattern fills
- Layer blending modes
- Animation timeline preview
- Palette management
- Grid snap options

## Technical Details

### File Structure
```
DarkPixel/src/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── utils.js        # Utility classes and functions
├── layers.js       # Layer management system
├── frames.js       # Frame and animation management
└── app.js          # Main application logic
```

### Core Classes

**PixelData**: Low-level pixel manipulation
**Color**: Color representation and conversion
**Layer**: Individual drawing layer
**LayerManager**: Layer collection management
**Frame**: Animation frame container
**FrameManager**: Frame collection and playback
**AnimationPlayer**: Animation rendering engine
**OnionSkinRenderer**: Ghost frame visualization
**DarkPixel**: Main application controller

## Troubleshooting

### Canvas not responding
- Ensure browser supports HTML5 Canvas
- Check browser console for JavaScript errors
- Try refreshing the page

### Layers not saving
- Use "Save Project" button, not browser save (Ctrl+S)
- Ensure browser allows file downloads
- Check file permissions in downloads folder

### Animation plays too fast/slow
- Adjust FPS slider (lower = slower)
- Frame duration can be adjusted by double-clicking a frame

### Out of memory
- Reduce canvas size
- Reduce number of frames
- Clear history more frequently
- Close other browser tabs

## Credits

DarkPixel - A pixel art editor for creative pixel artists and game developers.

Built with vanilla JavaScript, HTML5 Canvas, and no dependencies.

## License

Feel free to use and modify for personal and commercial projects.

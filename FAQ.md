# PixelArtPro - Frequently Asked Questions

## Getting Started

### Q: How do I launch the editor?
**A:** Open `index.html` in your web browser. No installation or server required - it's entirely client-side!

### Q: What browsers are supported?
**A:** PixelArtPro works on all modern browsers:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Microsoft Edge 90+

For best performance, use the latest browser version.

### Q: Do I need internet to use PixelArtPro?
**A:** No! PixelArtPro works completely offline. All processing happens in your browser. However, you need to be able to open local HTML files.

### Q: Is my data saved automatically?
**A:** No. You must explicitly save your project using the "Save" button. Use Ctrl+S or click "Save Project" regularly.

---

## Drawing & Tools

### Q: How do I draw on the canvas?
**A:** 
1. Select a tool (Pencil is default)
2. Choose your color with the color picker
3. Click and drag on the canvas to draw
4. Adjust brush size with the brush size slider

### Q: Can I use my mouse right-click to erase?
**A:** Yes! When you right-click while using most tools, it draws with transparency (erases). This works with Pencil, Line, and shape tools.

### Q: What's the difference between Pencil and Eraser?
**A:** 
- **Pencil**: Draws with the selected color, supports transparency in the color
- **Eraser**: Specifically makes pixels transparent, useful for quick cleanup

### Q: How do the shape tools work?
**A:** Click and drag:
- **Line**: Drag from start to end point
- **Rectangle**: Drag from corner to opposite corner
- **Circle**: Drag from center outward to set radius

Release the mouse button to finalize the shape.

### Q: Can I adjust line thickness?
**A:** Use the brush size slider (1-32 pixels) to control thickness for all drawing tools.

### Q: How do I pick a color from the canvas?
**A:** Select the Eye Dropper tool (press `I`) and click on any pixel color to pick it.

### Q: What's the maximum brush size?
**A:** 32 pixels. For larger areas, use the Fill Bucket tool or draw multiple strokes.

---

## Layers

### Q: What are layers?
**A:** Layers are stacked transparent sheets. You can draw on each independently and arrange them. This keeps different parts of your art separate and edible.

### Q: How many layers can I have?
**A:** Theoretically unlimited, but practically limited by your computer's memory. Keep it under 20 layers for best performance.

### Q: Can I delete a layer?
**A:** Yes, but you must have at least one layer. The last remaining layer cannot be deleted.

### Q: How do I rename a layer?
**A:** Double-click on the layer name in the Layers panel and type the new name.

### Q: How do I reorder layers?
**A:** Currently, layers are displayed in fixed order (newest at top). Future versions will support dragging to reorder.

### Q: What does the eye icon mean?
**A:** Click it to toggle layer visibility. Hidden layers won't appear in the final composition.

### Q: Can I set layer opacity?
**A:** The Layers panel shows opacity settings. Click on a layer and adjust its opacity slider.

### Q: How do I merge layers?
**A:** Currently not implemented. In the future, you'll be able to merge down to combine layers.

---

## Animation & Frames

### Q: How do I create an animation?
**A:**
1. Draw your first frame (the app starts with Frame 1)
2. Click "+ Frame" in the Frames panel
3. Draw the next pose
4. Repeat for each frame
5. Click "▶ Play" to preview

### Q: What's the difference between frames and layers?
**A:**
- **Layers**: Different elements in the SAME frame (background, character, effects)
- **Frames**: Different states over TIME (animation progression)

### Q: How do I adjust animation speed?
**A:** Set the FPS (Frames Per Second) slider, or double-click a frame to adjust its duration in milliseconds.

### Q: Can I duplicate frames?
**A:** Yes! Select a frame and click "Dup" to duplicate it exactly. Great for making slight variations.

### Q: What's an onion skin?
**A:** A "ghost" overlay showing the previous and/or next frames. Enables smooth animation by seeing how movement flows between frames.

### Q: How do I use onion skin?
**A:**
1. Enable "Onion Skin" checkbox
2. Adjust opacity to see ghosts more or less
3. Set "Frames Back" to see previous frames
4. Set "Frames Forward" to see upcoming frames

### Q: What FPS should I use?
**A:** Common frame rates:
- **12 FPS**: Classic, choppy style
- **24 FPS**: Smooth, cinematic
- **12-15 FPS**: Games, pixel art animation
- **10-12 FPS**: Retro style

### Q: Can I export as GIF?
**A:** Yes, but it requires an additional library. See `gif-exporter.js` in the project for setup instructions.

---

## Saving & Export

### Q: What's the difference between Save and Export?
**A:**
- **Save**: Saves complete project with all layers/frames as `.pixelart` (JSON)
- **Export**: Saves specific format (PNG, JSON) for sharing/viewing

### Q: What format should I save in?
**A:** 
- **.pixelart**: For editing later - preserves everything
- **PNG**: For sharing - single image frame
- **JSON**: For data extraction - full project data

### Q: Can I open my saved project later?
**A:** Yes! Click "Open" and select your `.pixelart` file to reload it completely.

### Q: Where are my files saved?
**A:** Files go to your browser's default download folder (usually `~/Downloads/`).

### Q: Can I import images?
**A:** Not yet, but you can manually recreate pixel art from reference images by drawing over them.

### Q: How do I export for a game?
**A:** Export as PNG for single sprites, or use sprite sheet export (future feature) for multiple frames.

### Q: Is there a backup?
**A:** No automatic backup. Always save your work with "Save Project" regularly!

### Q: Can I share my work?
**A:** Yes!
- Share **.pixelart** file for others to edit
- Share **PNG** for viewing in any image viewer
- Share **JSON** for data integration

---

## Canvas

### Q: What's the default canvas size?
**A:** 32×32 pixels, which is a great start for pixel art.

### Q: Can I change canvas size?
**A:** Yes! Set width/height and click "Apply". Content shifts but isn't lost when resizing larger.

### Q: What are min/max sizes?
**A:** Minimum 8×8, maximum 512×512 pixels.

### Q: What happens if I resize to smaller?
**A:** Content gets cropped. Be careful! Save first if you want to preserve the original.

### Q: What does the checkerboard background mean?
**A:** It indicates transparency. Transparent areas show this pattern.

### Q: How do I see a grid?
**A:** Automatic! The grid appears when you zoom in past 4x zoom level.

### Q: Can I turn off the grid?
**A:** Currently always on when zoomed. Use low zoom to hide it.

---

## Performance & Troubleshooting

### Q: The editor is slow. What can I do?
**A:** 
- Use smaller canvas size
- Reduce number of frames
- Limit to 10-15 layers
- Close other browser tabs
- Use a newer browser

### Q: The canvas won't respond to clicks
**A:**
- Check browser console (F12) for errors
- Refresh the page
- Make sure you're in a supported browser
- Try a different browser

### Q: My changes aren't saving
**A:** You must click the "S" button or "Save Project". The browser's Save (Ctrl+S) won't work.

### Q: I accidentally deleted something. Can I undo?
**A:** Press Ctrl+Z or click the "↶ Undo" button. Up to 50 undo steps available.

### Q: Animation is choppy
**A:**
- Lower the FPS (frames per second)
- Reduce canvas size
- Check system resources
- Close other applications

### Q: File won't load
**A:**
- Ensure it's a valid .pixelart file
- Try opening with a text editor to verify it's valid JSON
- Re-save the project first
- No older versions supported

### Q: Color picker not working
**A:** Make sure you're using the Eye Dropper tool (press `I`), not the color picker button.

### Q: What if the editor crashes?
**A:**
- Refresh the page (F5)
- Previous work is lost unless saved
- Always save frequently!
- Check browser console for errors

### Q: How much memory does it use?
**A:** A 32×32 canvas uses ~4KB per layer. A 256×256 canvas uses ~250KB per layer. Stack accordingly.

---

## Keyboard Shortcuts

### Q: How do I use keyboard shortcuts?
**A:** Just press the key while focused on the canvas:

| Key | Action |
|-----|--------|
| P | Pencil |
| E | Eraser |
| B | Fill Bucket |
| I | Eye Dropper |
| L | Line |
| R | Rectangle |
| C | Circle |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+S | Save (not yet implemented) |

### Q: Can I customize shortcuts?
**A:** Not in the UI yet, but edit `config.js` to change shortcuts in the code.

---

## Advanced Topics

### Q: How do I add custom features?
**A:** See `config.js` for the plugin system structure (planned for future). You can also modify source files directly.

### Q: What's the file format for .pixelart?
**A:** It's JSON containing:
- Canvas dimensions
- Layer data with pixel arrays
- Frame data with timestamps
- Project metadata

### Q: Can I use this for commercial projects?
**A:** Yes! PixelArtPro is free to use commercially. No licensing required.

### Q: Is there a mobile version?
**A:** Not optimized for touch. Works on tablets but not ideal. Desktop recommended.

### Q: Can I use this offline?
**A:** Yes! No internet needed. Works completely locally.

### Q: How do I contribute improvements?
**A:** Currently this is a standalone project. Fork or modify the source code as needed for your use case.

---

## Feature Requests

### Q: Will you add [feature]?
**A:** Check the README.md for planned features. Many common requests are listed there.

### Q: How do I request a feature?
**A:** Review `config.js` PLANNED_FEATURES section. These are likely upcoming additions.

### Q: Is there a roadmap?
**A:** Features are listed in order of priority. Selection tools and transform tools are planned soon.

---

## Getting Help

### Q: Where's the documentation?
**A:** 
- README.md - Full feature guide
- index-welcome.html - Getting started guide
- This FAQ - Common questions

### Q: The UI is confusing
**A:** Check the tooltips (hover over buttons) and read the Getting Started section.

### Q: I found a bug!
**A:** Check the browser console (F12 → Console tab) for error messages. Note the exact steps to reproduce.

### Q: Can I contact support?
**A:** Review the troubleshooting section above. Most issues have common solutions.

---

## Tips & Tricks

### Q: How do I smooth my animations?
**A:** Enable onion skin with frames both back and forward. Each new frame should move slightly from the previous.

### Q: Best practices for pixel art?
**A:**
- Use consistent palette
- Keep brush size appropriate to canvas size
- Organize with layers
- Check animation in play mode
- Save frequently

### Q: How do I make a sprite?
**A:** Draw on layers, export as PNG, or create frames for animation.

### Q: What's a good workflow?
**A:**
1. Set canvas size
2. Create color base layers (background, character)
3. Add detail layers
4. Add shading/effects layers
5. Flatten through merge for final
6. Create frames for animation
7. Export

---

Last Updated: 2024
Version: 1.0

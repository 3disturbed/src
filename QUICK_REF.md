# DarkPixel - Quick Reference Guide

## File Structure

```
DarkPixel/src/
├── index.html              # Main editor application
├── index-welcome.html      # Welcome/getting started page
├── styles.css              # All styling
├── app.js                  # Main application controller
├── layers.js               # Layer management system
├── frames.js               # Animation & frame management
├── utils.js                # Utility functions & helpers
├── config.js               # Configuration & settings
├── gif-exporter.js         # Optional GIF export module
├── README.md               # Full documentation
├── FAQ.md                  # Frequently asked questions
└── QUICK_REF.md           # This file
```

## How to Use

### 1. Launch the App
Open `index.html` in your web browser

### 2. Main Interface Breakdown

```
┌─────────────────────────────────────────┐
│           HEADER (File Menu)            │
├─────────────┬─────────────────┬─────────┤
│   TOOLS     │  CANVAS AREA    │ LAYERS  │
│             │  (Main Editor)  │ FRAMES  │
│   - Pencil  │                 │         │
│   - Eraser  │                 │ ONION   │
│   - Fill    │                 │ SKIN    │
│   - Etc.    │                 │         │
│             │                 │ EXPORT  │
│   COLORS    │                 │         │
│   BRUSH     │                 │         │
│   ZOOM      │                 │         │
│   CANVAS    │                 │         │
│   EDIT      │                 │         │
└─────────────┴─────────────────┴─────────┘
```

## Tool Shortcuts

Press these keys to quickly switch tools:
- **P** = Pencil
- **E** = Eraser  
- **B** = Fill Bucket
- **I** = Eye Dropper
- **L** = Line
- **R** = Rectangle
- **C** = Circle
- **Ctrl+Z** = Undo
- **Ctrl+Y** = Redo

## Typical Workflow

### Creating Static Pixel Art
```
1. Set canvas size
   ↓
2. Select Pencil tool (P)
   ↓
3. Choose color & brush size
   ↓
4. Draw on canvas
   ↓
5. Create/organize layers for different elements
   ↓
6. Save as .pixelart
   ↓
7. Export as PNG for sharing
```

### Creating Animation
```
1. Set canvas size to match sprite
   ↓
2. Draw first frame
   ↓
3. Add new frame (+ Frame button)
   ↓
4. Draw next pose/frame
   ↓
5. Repeat until animation complete
   ↓
6. Test with Play button
   ↓
7. Adjust FPS if needed
   ↓
8. Enable Onion Skin for smoothing
   ↓
9. Save as .pixelart
   ↓
10. Export as PNG or GIF
```

## Color Control

```
Color Picker Workflow:
1. Click color input box
2. Choose color from system picker
3. Hex value displays automatically
4. Or paste hex code (e.g., #FF0000)
5. Right-click while drawing to erase
```

## Layer Management

```
Basic Layer Operations:
├─ Create:     Click "+ Layer"
├─ Delete:     Click "- Layer"  
├─ Duplicate:  Click "Dup"
├─ Hide:       Click eye icon
├─ Rename:     Double-click name
└─ Opacity:    Adjust slider
```

## Frame Management

```
Basic Frame Operations:
├─ Create:       Click "+ Frame"
├─ Delete:       Click "- Frame"
├─ Select:       Click on frame
├─ Edit Duration: Double-click frame
├─ Play:         Click ▶ button
└─ Stop:         Click ⏹ button
```

## Drawing Techniques

### Straight Lines
1. Select Line tool (L)
2. Click start point
3. Shift+click end point (or drag)
4. Release to finalize

### Rectangles
1. Select Rect tool (R)
2. Click-drag from corner
3. Release to create

### Circles
1. Select Circle tool (C)
2. Click-drag from center
3. Release to create

### Freehand
1. Select Pencil (P)
2. Click and drag to draw
3. Smooth curves with smaller brush

### Erase
1. Right-click while using any tool, OR
2. Select Eraser (E) tool
3. Draw to erase

### Fill Area
1. Select Fill Bucket (B)
2. Click area to fill
3. All connected same-color pixels fill

### Pick Color
1. Select Eye Dropper (I)
2. Click on color to pick
3. Color updated instantly

## Canvas Sizing

```
Quick Canvas Sizes:
- Thumbnail:    8×8 or 16×16
- Small:        32×32 (recommended for beginners)
- Medium:       64×64
- Large:        128×128
- HD:           256×256 or 512×512
```

## Zoom Levels

```
Zoom Slider (1x to 16x):
- 1x:  Fit canvas to window (maximum zoom out)
- 4x:  Good for detail work
- 8x:  Default comfortable level
- 16x: Pixel-perfect editing
  └─  Shows grid automatically
```

## Saving & Export

```
Save Workflow:
1. Work on your art
2. Click "Save" button
3. File downloads as pixelart-[timestamp].pixelart
4. Keep this for future editing

Export Workflow:
1. Click "Export PNG" for PNG image
2. Or "Export Data" for JSON
3. Or "Export GIF" for animation (with setup)

Reopen Saved Project:
1. Click "Open"
2. Select .pixelart file
3. All layers & frames restored
```

## Performance Tips

| Action | Impact | Tip |
|--------|--------|-----|
| Canvas Size | High | Keep under 256×256 for smooth performance |
| Layers | High | Limit to 10-15 max |
| Frames | Medium | 10-20 frames typical |
| Undo History | Medium | Undo history limited to 50 steps |
| Browser | High | Use latest Chrome/Firefox |

## Keyboard Mapping

```
Tool Selection (Press key):
P → Pencil
E → Eraser
B → Fill Bucket
I → Eye Dropper
L → Line
R → Rectangle
C → Circle

Edit (Combined keys):
Ctrl + Z → Undo
Ctrl + Y → Redo
Ctrl + Shift + Z → Redo (alternative)
```

## Color Hex Reference

```
Common Colors (Hex):
#000000 = Black
#FFFFFF = White
#FF0000 = Red
#00FF00 = Green
#0000FF = Blue
#FFFF00 = Yellow
#FF00FF = Magenta
#00FFFF = Cyan
#808080 = Gray
#FF8800 = Orange
```

## Right-Click Actions

While drawing, right-click does different things:
```
Right-click while drawing = Erase (removes pixels)
```

## Troubleshooting Checklist

- [ ] Refreshed the page (F5)
- [ ] Saved the project (don't use Ctrl+S)
- [ ] Used latest browser version
- [ ] Checked console for errors (F12)
- [ ] Closed other browser tabs
- [ ] Checked file format (.pixelart is JSON)
- [ ] Verified canvas fit on screen

## Animation FPS Guide

```
FPS Settings:
≤ 10 FPS  = Very choppy, retro style
12 FPS    = Classic, pixel art style
15 FPS    = Smooth, casual games
24 FPS    = Smooth, professional
30+ FPS   = Very smooth, advanced
```

## File Size Reference

```
Approximate file sizes:
32×32 + 1 layer    ≈ 4 KB
32×32 + 10 frames  ≈ 40 KB
64×64 + 1 layer    ≈ 16 KB
256×256 + 1 layer  ≈ 256 KB
```

## Limitations

```
Current Version (1.0):
- No selection tools
- No transform tools (rotate, flip, scale)
- No layer merging UI
- No gradient tool
- GIF export requires library setup
- Canvas size max 512×512
```

## Hidden Features

```
- Double-click layer name to rename
- Double-click frame to edit duration
- Right-click to erase
- Grid auto-shows when zoomed ≥4x
- Immediate color feedback in hex field
```

## Getting the Most Out

1. **Master the Tools** - Learn each tool's behavior
2. **Use Layers** - Organize different elements separately
3. **Practice Shortcuts** - Speed up your workflow with keys
4. **Save Often** - Don't lose work to browser crashes
5. **Use Onion Skin** - Essential for smooth animations
6. **Experiment** - Try different canvas/brush sizes
7. **Zoom Strategically** - See details AND big picture
8. **Reference Colors** - Build consistent palettes

## Version Info

```
DarkPixel v1.0
Built: 2024
Technology: HTML5 Canvas + Vanilla JavaScript
Size: ~50 KB total
Dependencies: None
License: Free to use
Browser Support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
```

---

**Need more help?** Check README.md or FAQ.md in the project folder!

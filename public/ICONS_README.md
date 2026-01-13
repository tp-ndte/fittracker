# PWA Icons Setup

This directory needs the following icon files for full PWA functionality:

## Required Files

- `favicon.ico` - 32x32px favicon
- `icon-192.png` - 192x192px PWA icon
- `icon-512.png` - 512x512px PWA icon
- `apple-touch-icon.png` - 180x180px Apple touch icon

## Option 1: Auto-generate (Recommended)

Run the included script to generate all icons from the SVG:

```bash
# Install ImageMagick first
brew install imagemagick

# Generate icons
chmod +x ../scripts/generate-icons.sh
../scripts/generate-icons.sh
```

## Option 2: Manual Creation

If you can't use the script:

1. **Use an online converter**:
   - Go to https://realfavicongenerator.net/
   - Upload `icon.svg`
   - Download generated icons
   - Place them in this directory

2. **Use design tools**:
   - Open `icon.svg` in your design tool
   - Export at required sizes
   - Save to this directory

## Option 3: Use Placeholder

For development/testing, you can use simple placeholder icons:

```bash
# Create simple favicons (requires ImageMagick)
convert -size 192x192 xc:#2563eb icon-192.png
convert -size 512x512 xc:#2563eb icon-512.png
convert -size 180x180 xc:#2563eb apple-touch-icon.png
convert -size 32x32 xc:#2563eb favicon.ico
```

## Verify Icons

After adding icons, check they're working:

1. Run `npm run build`
2. Run `npm run preview`
3. Open DevTools > Application > Manifest
4. Verify all icons are listed and loading

## Icon Guidelines

For best results:
- Use square images (1:1 aspect ratio)
- Include padding (safe zone: 10% from edges)
- Use simple, recognizable designs
- Test on both light and dark backgrounds
- Ensure visibility at small sizes (32x32)

## Current Status

- ✅ `icon.svg` - Source SVG provided
- ⚠️ Other icons need to be generated

Run the generation script to create all required icons!

#!/bin/bash

# Script to generate PWA icons from SVG
# Requires: imagemagick (install with: brew install imagemagick)

SVG_FILE="public/icon.svg"
PUBLIC_DIR="public"

# Check if imagemagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Install it with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    exit 1
fi

# Check if SVG file exists
if [ ! -f "$SVG_FILE" ]; then
    echo "Error: $SVG_FILE not found"
    exit 1
fi

echo "Generating icons from $SVG_FILE..."

# Generate favicon.ico
convert "$SVG_FILE" -resize 32x32 "$PUBLIC_DIR/favicon.ico"
echo "✓ Generated favicon.ico"

# Generate PNG icons
convert "$SVG_FILE" -resize 192x192 "$PUBLIC_DIR/icon-192.png"
echo "✓ Generated icon-192.png"

convert "$SVG_FILE" -resize 512x512 "$PUBLIC_DIR/icon-512.png"
echo "✓ Generated icon-512.png"

# Generate Apple Touch Icon
convert "$SVG_FILE" -resize 180x180 "$PUBLIC_DIR/apple-touch-icon.png"
echo "✓ Generated apple-touch-icon.png"

echo ""
echo "All icons generated successfully!"
echo "Icons are ready for PWA installation."

#!/usr/bin/env bash
# Regenerate the social card (og:image) preview.png from preview.svg.
#   - inkscape rasterises the SVG to a 1200x630 PNG
#   - pngquant compresses it (palette, ~lossless for this flat graphic)
set -euo pipefail
cd "$(dirname "$0")"

for tool in inkscape pngquant; do
  command -v "$tool" >/dev/null || { echo "error: '$tool' not found in PATH" >&2; exit 1; }
done

inkscape preview.svg --export-type=png --export-filename=preview.png -w 1200 -h 630
pngquant --quality=85-100 --strip --force --output preview.png preview.png

echo "preview.png: $(stat -c%s preview.png) bytes"

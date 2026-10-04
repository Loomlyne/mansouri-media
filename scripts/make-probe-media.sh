#!/usr/bin/env bash
# Generates the probe film and poster (test pattern only, no client content) into .probe/ (gitignored).
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG=${FFMPEG:-/opt/homebrew/bin/ffmpeg}
mkdir -p .probe

"$FFMPEG" -y -loglevel error \
  -f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=10" \
  -f lavfi -i "sine=frequency=440:duration=10" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -b:v 6M \
  -c:a aac -b:a 128k -shortest -movflags +faststart \
  .probe/test-9x16.mp4

# Poster: first frame at exactly 720x1280. This ffmpeg has no libwebp, so ImageMagick (libwebp) encodes it.
"$FFMPEG" -y -loglevel error -i .probe/test-9x16.mp4 -frames:v 1 -vf "scale=720:1280" .probe/poster-frame.png
if "$FFMPEG" -hide_banner -encoders 2>/dev/null | grep -q libwebp; then
  "$FFMPEG" -y -loglevel error -i .probe/poster-frame.png -c:v libwebp -quality 85 .probe/poster.webp
elif command -v cwebp >/dev/null; then
  cwebp -quiet -q 85 .probe/poster-frame.png -o .probe/poster.webp
elif command -v magick >/dev/null && magick -list format | grep -q 'WEBP.*rw'; then
  magick .probe/poster-frame.png -quality 85 .probe/poster.webp
else
  echo "no WebP encoder available (ffmpeg libwebp, cwebp, magick)" >&2
  exit 1
fi
rm -f .probe/poster-frame.png

for e in local preview production; do printf '%s' "$e" > ".probe/env-$e.txt"; done
ls -l .probe

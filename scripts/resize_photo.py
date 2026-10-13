#!/usr/bin/env python3
"""
Shrink a photo for the TVs: 1200 px on the long side, JPEG, no metadata.

    python3 scripts/resize_photo.py ~/Downloads/IMG_1234.jpg slides/baby/2026-10.jpg

Why:
  * A full-size phone photo (12+ MP, 3-6 MB) takes seconds to decode on a
    Fire Stick; 1200 px is plenty for a 620x700 frame on a 1080p TV.
  * Phones store rotation as an EXIF flag. Browsers mostly honour it, but
    baking the rotation into the pixels removes any doubt.
  * EXIF can include GPS coordinates of where the photo was taken. The site
    is public, so all metadata is dropped.

Keep the ORIGINAL photo outside this repo (e.g. ~/Documents/ramstar-private/).
Only the resized copy gets committed.

Needs Pillow:  python3 -m pip install Pillow
iPhone .HEIC photos also need:  python3 -m pip install pillow-heif
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

LONG_SIDE = 1200
QUALITY = 82
TARGET_KB = 400  # warn above this


def open_image(path):
    if path.suffix.lower() in (".heic", ".heif"):
        try:
            from pillow_heif import register_heif_opener
        except ImportError:
            sys.exit("HEIC photo: run  python3 -m pip install pillow-heif  (or export it as JPEG first)")
        register_heif_opener()
    return Image.open(path)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, dst = Path(sys.argv[1]).expanduser(), Path(sys.argv[2])
    if dst.suffix.lower() not in (".jpg", ".jpeg"):
        sys.exit("Output should end in .jpg")

    with open_image(src) as im:
        im = ImageOps.exif_transpose(im)      # apply the phone's rotation flag
        im = im.convert("RGB")                # drops alpha / CMYK / palette modes
        im.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)  # keeps aspect, never upscales
        # A fresh save without exif= writes no metadata at all.
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        w, h = im.size

    kb = dst.stat().st_size / 1024
    print(f"{dst}  {w}x{h}  {kb:.0f} KB")
    if kb > TARGET_KB:
        print(f"WARNING: over {TARGET_KB} KB; it will still work, but check the photo", file=sys.stderr)
    if w > h:
        print("Note: landscape photo; the frame is portrait, so the sides get cropped. "
              "Crop it yourself first if the face is off-centre.", file=sys.stderr)


if __name__ == "__main__":
    main()

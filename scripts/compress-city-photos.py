#!/usr/bin/env python3
"""Komprimerar stadsfotona i public/cities/ på plats.

Bilderna hämtas i 1280 pixlars bredd av scripts/fetch-city-photos.mjs och kan
vara nära en megabyte styck. Här skalas de om till högst 1200 pixlars bredd,
EXIF-data (inklusive orientering) bakas in och filerna sparas som progressiv
JPEG. Foton som redan är tillräckligt små hoppas över, så skriptet kan köras
om utan att kvaliteten försämras i onödan.

Körs automatiskt i slutet av fetch-city-photos.mjs, eller manuellt:
    python3 scripts/compress-city-photos.py
"""

import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("PIL (Pillow) saknas – hoppar över komprimering.")

MAX_WIDTH = 1200
# Stående foton blir annars onödigt tunga; bilden beskärs ändå vid visning.
MAX_PIXELS = 1_300_000
SKIP_BYTES = 300 * 1024
QUALITY = 70

here = os.path.dirname(os.path.abspath(__file__))
cities_dir = os.path.normpath(os.path.join(here, "..", "public", "cities"))

total_before = 0
total_after = 0

for name in sorted(os.listdir(cities_dir)):
    if not name.endswith(".jpg"):
        continue
    path = os.path.join(cities_dir, name)
    before = os.path.getsize(path)
    total_before += before

    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        scale = min(
            1.0,
            MAX_WIDTH / img.width,
            (MAX_PIXELS / (img.width * img.height)) ** 0.5,
        )
        if scale >= 1.0 and before <= SKIP_BYTES:
            total_after += before
            print(f"= {name}: {before // 1024} kB (redan liten, orörd)")
            continue
        if scale < 1.0:
            img = img.resize(
                (round(img.width * scale), round(img.height * scale)),
                Image.LANCZOS,
            )
        img.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    after = os.path.getsize(path)
    total_after += after
    print(f"✓ {name}: {before // 1024} kB -> {after // 1024} kB")

print(
    f"\nTotalt: {total_before // 1024} kB -> {total_after // 1024} kB"
)

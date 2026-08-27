#!/usr/bin/env python3
"""Komprimerar frågebilderna i public/quiz/ och gör dem till WebP.

Hämtskriptet lägger ner en <id>.jpg; här skalas den ner, sparas som
<id>.webp och jpg-filen tas bort. WebP ger ungefär fyrtio procent mindre
filer än JPEG vid samma kvalitet, och med sjuhundra bilder är det skillnaden
mellan tio och tjugo megabyte i spelarens cache.

Bilderna visas som mest i ett par hundra pixlars bredd - i en fyrfältsruta på
en telefon är de smalare än så. De hämtas i 900 pixlar och skalas här ner till
högst 640, vilket räcker med god marginal också på en näthinneskärm och gör
varje bild till några tiotal kilobyte i stället för några hundra.

Körs automatiskt i slutet av fetch-quiz-images.mjs, eller manuellt:
    python3 scripts/compress-quiz-images.py
"""

import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("PIL (Pillow) saknas – hoppar över komprimering.")

MAX_WIDTH = 560
MAX_PIXELS = 320_000
SKIP_BYTES = 0
QUALITY = 70

# Stationsvinjetterna ligger i samma mapp men visas i full skärmbredd, och
# behöver därför fler pixlar än en bild i en fyrfältsruta.
BRED_PREFIX = "station-"
BRED_WIDTH = 1100
BRED_PIXELS = 620_000
BRED_SKIP = 140 * 1024

here = os.path.dirname(os.path.abspath(__file__))
quiz_dir = os.path.normpath(os.path.join(here, "..", "public", "quiz"))

total_before = 0
total_after = 0

for name in sorted(os.listdir(quiz_dir)):
    if not name.endswith(".jpg"):
        continue
    path = os.path.join(quiz_dir, name)
    before = os.path.getsize(path)
    total_before += before

    bred = name.startswith(BRED_PREFIX)
    max_width = BRED_WIDTH if bred else MAX_WIDTH
    max_pixels = BRED_PIXELS if bred else MAX_PIXELS
    skip_bytes = BRED_SKIP if bred else SKIP_BYTES

    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        scale = min(
            1.0,
            max_width / img.width,
            (max_pixels / (img.width * img.height)) ** 0.5,
        )
        if scale < 1.0:
            img = img.resize(
                (round(img.width * scale), round(img.height * scale)),
                Image.LANCZOS,
            )
        out = path[:-4] + ".webp"
        img.save(out, "WEBP", quality=QUALITY, method=6)
    os.remove(path)

    after = os.path.getsize(out)
    total_after += after
    print(f"✓ {name}: {before // 1024} kB -> {after // 1024} kB")

print(f"\nTotalt: {total_before // 1024} kB -> {total_after // 1024} kB")

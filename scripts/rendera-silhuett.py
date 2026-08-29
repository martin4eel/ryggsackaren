"""
Renderar en OBJ-modell till en platt silhuett med genomskinlig bakgrund.

Handlaren i souvenirbutiken är en kontur, inte en figur med ljus och skugga,
och då behövs ingen riktig renderare: alla trianglar fylls i samma svarta
färg och projiceras ortografiskt. Resultatet blir modellens siluett rakt
framifrån - precis vad ett motljus ger.

  python3 scripts/rendera-silhuett.py <modell.obj> <ut.png> [gradtal] [bredd]

`gradtal` vrider modellen kring sin lodräta axel, så att man kan välja om
handlaren står rakt framifrån eller något vänd.
"""
import math
import sys
from PIL import Image, ImageDraw

obj, ut = sys.argv[1], sys.argv[2]
vinkel = math.radians(float(sys.argv[3]) if len(sys.argv) > 3 else 0.0)
bredd = int(sys.argv[4]) if len(sys.argv) > 4 else 600

hörn: list[tuple[float, float, float]] = []
ytor: list[list[int]] = []
for rad in open(obj, encoding='utf-8', errors='ignore'):
    if rad.startswith('v '):
        x, y, z = (float(t) for t in rad.split()[1:4])
        hörn.append((x, y, z))
    elif rad.startswith('f '):
        ytor.append([int(t.split('/')[0]) - 1 for t in rad.split()[1:]])

# Modeller exporteras med olika axel uppåt. Den axel som har störst utbredning
# är höjden, den näst största bredden, och den tredje är djupet man vrider
# kring - en platt siluettmodell har knappt något djup alls.
spann = [max(k[i] for k in hörn) - min(k[i] for k in hörn) for i in range(3)]
upp = spann.index(max(spann))
bred = max((i for i in range(3) if i != upp), key=lambda i: spann[i])
djup = ({0, 1, 2} - {upp, bred}).pop()
kos, sin = math.cos(vinkel), math.sin(vinkel)
plana = [(k[bred] * kos + k[djup] * sin, k[upp]) for k in hörn]
xs = [p[0] for p in plana]
ys = [p[1] for p in plana]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
skala = (bredd - 8) / (maxx - minx)
höjd = int((maxy - miny) * skala) + 8

bild = Image.new('RGBA', (bredd, höjd), (0, 0, 0, 0))
rit = ImageDraw.Draw(bild)
for yta in ytor:
    punkter = [
        (
            4 + (plana[i][0] - minx) * skala,
            höjd - 4 - (plana[i][1] - miny) * skala,
        )
        for i in yta
        if 0 <= i < len(plana)
    ]
    if len(punkter) >= 3:
        # Samma färg på fyllning och kant: annars lyser tunna sömmar igenom.
        rit.polygon(punkter, fill=(8, 5, 3, 255), outline=(8, 5, 3, 255))

bild.save(ut)
print(f'{ut}: {bredd}x{höjd}, {len(ytor)} ytor')

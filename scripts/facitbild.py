"""
Ritar facitbilden till ett pek-spel: fotot med numrerade ringar runt varje
träffyta och en förklaringsruta per punkt. Används för pilotens, lotsens och
tågprovets facit. Tågprovets handgjorda förlaga byttes 2026-08-29, när tre
av punkterna visade sig peka på fel instrument.

  python3 scripts/facitbild.py <foto.webp> <punkter.json> <ut.webp>

punkter.json: [{ "id", "namn", "x", "y", "r", "forklaring", "box": [bx, by] }]
där x, y, r, bx, by är procent av bildens bredd/höjd (r av bredden) och box
är rutans övre vänstra hörn.
"""
import json, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

FARGER = [(31, 95, 158), (46, 125, 79), (194, 86, 27), (138, 47, 107), (168, 38, 43), (107, 90, 46), (0, 128, 128), (90, 90, 90)]

def font(size, bold=False):
    for f in (['/System/Library/Fonts/Supplemental/Arial Bold.ttf'] if bold else ['/System/Library/Fonts/Supplemental/Arial.ttf']) + ['/System/Library/Fonts/Helvetica.ttc']:
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()

foto, punkter, ut = sys.argv[1:4]
im = Image.open(foto).convert('RGB')
W, H = im.size
d = ImageDraw.Draw(im, 'RGBA')
pts = json.load(open(punkter))
f_num = font(int(W * 0.022), True)
f_rub = font(int(W * 0.015), True)
f_txt = font(int(W * 0.0125))
nr = int(W * 0.016)
bw = int(W * 0.22)
lh = int(f_txt.size * 1.35)
topp = int(nr * 2.9)
lagda = []
for i, p in enumerate(pts):
    farg = FARGER[i % len(FARGER)]
    cx, cy, rr = p['x'] / 100 * W, p['y'] / 100 * H, p['r'] / 100 * W
    bx, by = p['box'][0] / 100 * W, p['box'][1] / 100 * H
    rader = textwrap.wrap(p['forklaring'], 34)
    bh = int(topp + lh * len(rader) + W * 0.012)
    # ring och pil först, så att rutorna sedan ligger ovanpå
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=farg + (255,), width=max(3, W // 300))
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=farg + (40,))
    ax = min(max(cx, bx + nr), bx + bw - nr)
    ay = by + bh if cy > by + bh else (by if cy < by else by + bh / 2)
    if by <= cy <= by + bh:
        ax = bx if cx < bx else bx + bw
    d.line([ax, ay, cx, cy], fill=farg + (255,), width=max(3, W // 350))
    lagda.append((farg, bx, by, bw, bh, rader, p['namn'], i))
for farg, bx, by, bw, bh, rader, namn, i in lagda:
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=int(W * 0.008), fill=(255, 255, 255, 240), outline=farg + (255,), width=max(2, W // 500))
    d.ellipse([bx + nr * 0.5, by + nr * 0.45, bx + nr * 2.5, by + nr * 2.45], fill=farg + (255,))
    d.text((bx + nr * 1.5, by + nr * 1.45), str(i + 1), fill=(255, 255, 255), font=f_num, anchor='mm')
    d.text((bx + nr * 3, by + nr * 0.9), namn.upper(), fill=(20, 20, 20), font=f_rub)
    for j, rad in enumerate(rader):
        d.text((bx + nr * 0.6, by + topp + j * lh), rad, fill=(30, 30, 30), font=f_txt)
im.save(ut, 'WEBP', quality=80, method=6)
print('skrev', ut, im.size)

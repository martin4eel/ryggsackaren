"""
Beskär ett spelarporträtt till huvud och axlar.

Lagvalsspelet visar fyra ansikten i en smal ruta. En helfigur på isen blir då
ett gult streck, och en bild där klubbmärket syns avslöjar dessutom svaret.
Det här skriptet klipper ut ansiktet ur den hämtade bilden och skriver över
webp-filen i public/quiz.

  python3 scripts/beskar-portratt.py <id> <vänster> <topp> <höger> <botten>

Måtten anges som andelar av bildens bredd och höjd (0-1). Kör om hämtningen
med --om skriver över filen igen, och då behöver beskärningen göras om.
"""
import sys
from PIL import Image

bild_id, v, t, h, b = sys.argv[1], *map(float, sys.argv[2:6])
sokvag = f'public/quiz/{bild_id}.webp'
im = Image.open(sokvag).convert('RGB')
W, H = im.size
ut = im.crop((int(W * v), int(H * t), int(W * h), int(H * b)))
ut.save(sokvag, 'WEBP', quality=82, method=6)
print(f'{bild_id}: {W}x{H} -> {ut.width}x{ut.height}')

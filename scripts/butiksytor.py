"""
Gör butikens ytor ur ett enda träfoto.

Souvenirbutiken är ett rum, och ett rum behöver riktiga ytor. I stället för
CSS-gradienter används ett fotografi av träpanel (Commons, CC BY-SA), som
klipps och tonas till tre ytor:

  butik-vagg.webp  mörk panel bakom hyllorna, kraftigt nertonad
  butik-disk.webp  diskens skiva, varmare och ljusare
  butik-bracka.webp  hyllplanet, en smal remsa

  python3 scripts/butiksytor.py <tra.jpg>

Att alla tre kommer ur samma foto är avsiktligt: det är samma trä i hela
rummet, precis som i en riktig butik som snickrats en gång.
"""
import sys
from PIL import Image, ImageEnhance, ImageFilter

kalla = Image.open(sys.argv[1]).convert('RGB')
W, H = kalla.size


def tona(im, ljus, mattnad, kontrast=1.0, blur=0.0):
    ut = ImageEnhance.Brightness(im).enhance(ljus)
    ut = ImageEnhance.Color(ut).enhance(mattnad)
    ut = ImageEnhance.Contrast(ut).enhance(kontrast)
    if blur:
        ut = ut.filter(ImageFilter.GaussianBlur(blur))
    return ut


# Väggen: en bred bit ur mitten, mörk och lätt suddig så att den lägger sig
# bakom allt annat utan att dra till sig blicken.
vagg = kalla.crop((0, int(H * 0.15), W, int(H * 0.85))).resize((900, 560))
tona(vagg, 0.30, 0.55, 1.05, 1.2).save('public/butik/butik-vagg.webp', 'WEBP', quality=72, method=6)

# Disken: samma trä men i lampans ljus - ljusare, varmare, skarpare.
disk = kalla.crop((int(W * 0.05), int(H * 0.30), int(W * 0.95), int(H * 0.72))).resize((1000, 320))
tona(disk, 0.72, 1.15, 1.08).save('public/butik/butik-disk.webp', 'WEBP', quality=78, method=6)

# Hyllplanet: en smal remsa, mitt emellan de två i ljushet.
bracka = kalla.crop((0, int(H * 0.42), W, int(H * 0.50))).resize((900, 40))
tona(bracka, 0.5, 0.9, 1.1).save('public/butik/butik-bracka.webp', 'WEBP', quality=80, method=6)

for namn in ('butik-vagg', 'butik-disk', 'butik-bracka'):
    im = Image.open(f'public/butik/{namn}.webp')
    print(namn, im.size)

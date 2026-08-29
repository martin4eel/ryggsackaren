"""
Gör om en inspelad röst till butiksrösten i souvenirbutiken.

Handlaren ska inte låta som en inspelning av en människa, utan som en röst
ur en gammal telefonlur: bandbegränsad, lite för snabb och lite trasig -
någonstans mellan simlish och rösten i en tv-spelstelefon från 2002. Orden
ska höras som prat utan att gå att uppfatta, för handlaren säger ändå
samma sak i texten bredvid.

  python3 scripts/rosteffekt.py <in.wav> <ut.wav> [tonhojning] [--telefon]

Kedjan: trimma tystnad, snabba upp (och därmed höja tonen), bandpassa som en
telefonlinje, mjuk överstyrning, kvantisera till åtta bitar, tona in och ut,
normalisera och sampla ner till 22 050 Hz. Allt i ren Python - maskinen har
varken ffmpeg eller numpy.
"""
import math, struct, sys


def las_wav(sokvag):
    d = open(sokvag, 'rb').read()
    i, fmt, data = 12, None, None
    while i < len(d) - 8:
        cid = d[i:i + 4]
        sz = struct.unpack('<I', d[i + 4:i + 8])[0]
        kropp = d[i + 8:i + 8 + sz]
        if cid == b'fmt ':
            fmt = kropp
        elif cid == b'data':
            data = kropp
        i += 8 + sz + (sz & 1)
    _, kanaler, sr, _, _, bitar = struct.unpack('<HHIIHH', fmt[:16])
    n = len(data) // (bitar // 8) // kanaler
    smp = struct.unpack(f'<{n * kanaler}h', data[:n * kanaler * 2])
    if kanaler > 1:
        smp = smp[0::kanaler]
    return sr, [x / 32768 for x in smp]


def skriv_wav(sokvag, sr, s):
    ut = b''.join(struct.pack('<h', max(-32768, min(32767, int(x * 32767)))) for x in s)
    hdr = (b'RIFF' + struct.pack('<I', 36 + len(ut)) + b'WAVEfmt ' +
           struct.pack('<IHHIIHH', 16, 1, 1, sr, sr * 2, 2, 16) +
           b'data' + struct.pack('<I', len(ut)))
    open(sokvag, 'wb').write(hdr + ut)


def trimma(s, sr, troskel=0.02, marginal=0.04):
    start = next((k for k, x in enumerate(s) if abs(x) > troskel), 0)
    slut = next((k for k in range(len(s) - 1, -1, -1) if abs(s[k]) > troskel), len(s) - 1)
    pad = int(sr * marginal)
    return s[max(0, start - pad):min(len(s), slut + pad)]


def samla_om(s, faktor):
    """Linjär omsampling. Snabbare uppspelning höjer tonen, som en bandspelare."""
    ut = []
    n = len(s)
    k = 0.0
    while k < n - 1:
        i = int(k)
        f = k - i
        ut.append(s[i] * (1 - f) + s[i + 1] * f)
        k += faktor
    return ut


def biquad(s, b0, b1, b2, a1, a2):
    ut = []
    x1 = x2 = y1 = y2 = 0.0
    for x in s:
        y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        ut.append(y)
        x2, x1 = x1, x
        y2, y1 = y1, y
    return ut


def hogpass(s, sr, f, q=0.707):
    w = 2 * math.pi * f / sr
    a = math.sin(w) / (2 * q)
    c = math.cos(w)
    a0 = 1 + a
    return biquad(s, (1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0,
                  -2 * c / a0, (1 - a) / a0)


def lagpass(s, sr, f, q=0.707):
    w = 2 * math.pi * f / sr
    a = math.sin(w) / (2 * q)
    c = math.cos(w)
    a0 = 1 + a
    return biquad(s, (1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0,
                  -2 * c / a0, (1 - a) / a0)


def overstyr(s, drev=2.6):
    return [math.tanh(x * drev) / math.tanh(drev) for x in s]


def kvantisera(s, bitar=8):
    steg = 2 ** (bitar - 1)
    return [round(x * steg) / steg for x in s]


def tona(s, sr, tid=0.02):
    n = int(sr * tid)
    ut = list(s)
    for k in range(min(n, len(ut))):
        ut[k] *= k / n
        ut[-1 - k] *= k / n
    return ut


def normalisera(s, topp=0.72):
    m = max((abs(x) for x in s), default=0)
    return [x * topp / m for x in s] if m else s


def brus(s, sr, niva=0.006):
    """Linjebrus: ett svagt sus som ligger under rösten hela samtalet."""
    ut = []
    frö = 12345
    for x in s:
        # Enkel linjär kongruensgenerator: samma brus varje gång skriptet körs,
        # så att en omkörning ger exakt samma fil.
        frö = (1103515245 * frö + 12345) % 2147483648
        ut.append(x + (frö / 2147483648 - 0.5) * 2 * niva)
    return ut


def knaster(s, sr, antal=7, styrka=0.16):
    """Enstaka knäppar i linjen, som en dålig kontakt i luren."""
    ut = list(s)
    frö = 99
    for k in range(antal):
        frö = (1103515245 * frö + 12345) % 2147483648
        i = int((frö / 2147483648) * max(1, len(ut) - 40))
        for j in range(12):
            if i + j < len(ut):
                ut[i + j] += styrka * (1 - j / 12) * (1 if j % 2 else -1)
    return ut


def kor(in_fil, ut_fil, tonhojning=1.14, ut_sr=22050, telefon=False):
    """
    `telefon` snävar av bandet ytterligare, lägger på linjebrus och några
    knäpp: skillnaden mellan en röst i rummet och en röst i en gammal lur.
    """
    sr, s = las_wav(in_fil)
    s = trimma(s, sr)
    s = samla_om(s, tonhojning * sr / ut_sr)   # ton upp och ner till 22 kHz
    sr = ut_sr
    if telefon:
        # Telefonbandet är smalare än radions: allt under 500 och över 2 400
        # Hz försvann i kopparledningen, och det är det örat känner igen.
        s = hogpass(s, sr, 520, 0.9)
        s = hogpass(s, sr, 520, 0.9)
        s = lagpass(s, sr, 2400, 0.9)
        s = lagpass(s, sr, 2400, 0.9)
        s = overstyr(s, 3.4)
        s = lagpass(s, sr, 2600)
        s = kvantisera(s, 7)
        s = brus(s, sr)
        s = knaster(s, sr)
        s = hogpass(s, sr, 480)
    else:
        s = hogpass(s, sr, 420)
        s = lagpass(s, sr, 2900)
        s = overstyr(s)
        s = lagpass(s, sr, 3200)               # jämna ut det överstyrningen rev upp
        s = kvantisera(s, 8)
    s = tona(s, sr)
    s = normalisera(s)
    skriv_wav(ut_fil, sr, s)
    print(f'{ut_fil}: {len(s) / sr:.2f} s @ {sr} Hz{" (telefon)" if telefon else ""}')


if __name__ == '__main__':
    kor(
        sys.argv[1],
        sys.argv[2],
        float(sys.argv[3]) if len(sys.argv) > 3 else 1.14,
        telefon='--telefon' in sys.argv,
    )

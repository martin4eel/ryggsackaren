import { LAND_PATH, MAP_HEIGHT, MAP_WIDTH } from '../data/worldMap';

/**
 * Ortografisk jordglob.
 *
 * Landmassan i data/worldMap.ts ligger i equirektangulär projektion, alltså
 * som en platt karta. En glob går inte att få fram genom att transformera den
 * bilden - projektionen är olinjär - så banan tolkas här tillbaka till
 * longitud och latitud en gång, och projiceras sedan om för varje bildruta.
 *
 * Datan är Natural Earth 110m: 122 polygoner och drygt femtusen punkter, litet
 * nog att räkna om sextio gånger i sekunden.
 */

export interface Vinkel {
  lon: number;
  lat: number;
}

type Polygon = Vinkel[];

/** Landpolygonerna i longitud och latitud, tolkade en gång vid start. */
const POLYGONER: Polygon[] = (() => {
  const ut: Polygon[] = [];
  // Banan består bara av M, L och Z, vilket gör tolkningen trivial.
  for (const del of LAND_PATH.split('M').slice(1)) {
    const tal = del.match(/-?\d+(?:\.\d+)?/g);
    if (!tal || tal.length < 6) continue;
    const poly: Polygon = [];
    for (let i = 0; i + 1 < tal.length; i += 2) {
      const x = Number(tal[i]);
      const y = Number(tal[i + 1]);
      poly.push({
        lon: (x / MAP_WIDTH) * 360 - 180,
        lat: 90 - (y / MAP_HEIGHT) * 180,
      });
    }
    ut.push(poly);
  }
  return ut;
})();

/** Grov mittpunkt per polygon, för att kunna sålla bort de bortvända. */
const MITTPUNKTER: Vinkel[] = POLYGONER.map((p) => {
  let lon = 0;
  let lat = 0;
  for (const v of p) {
    lon += v.lon;
    lat += v.lat;
  }
  return { lon: lon / p.length, lat: lat / p.length };
});

const rad = (d: number) => (d * Math.PI) / 180;

export interface Kamera {
  /** Mittpunkten globen är vänd mot */
  lon: number;
  lat: number;
  /** Klotets radie i ritytans enheter */
  r: number;
  cx: number;
  cy: number;
}

export interface Punkt {
  x: number;
  y: number;
  /** Falskt när punkten ligger på klotets bortre sida */
  synlig: boolean;
}

/** Projicerar en position på klotet till ritytan. */
export function projicera(p: Vinkel, k: Kamera): Punkt {
  const lat = rad(p.lat);
  const lat0 = rad(k.lat);
  const dLon = rad(p.lon - k.lon);
  const cosc =
    Math.sin(lat0) * Math.sin(lat) +
    Math.cos(lat0) * Math.cos(lat) * Math.cos(dLon);
  return {
    x: k.cx + k.r * Math.cos(lat) * Math.sin(dLon),
    y:
      k.cy -
      k.r *
        (Math.cos(lat0) * Math.sin(lat) -
          Math.sin(lat0) * Math.cos(lat) * Math.cos(dLon)),
    synlig: cosc > 0,
  };
}

/** Vinkelavstånd mellan två positioner, i grader. */
export function vinkelAvstand(a: Vinkel, b: Vinkel): number {
  const la = rad(a.lat);
  const lb = rad(b.lat);
  const d = rad(b.lon - a.lon);
  const c =
    Math.sin(la) * Math.sin(lb) + Math.cos(la) * Math.cos(lb) * Math.cos(d);
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

/**
 * Bygger landmassans bana för en given kameravinkel.
 *
 * Polygoner som helt ligger på baksidan hoppas över direkt. De som skärs av
 * horisonten bryts där, vilket ger en liten oregelbundenhet längs klotets kant
 * men undviker den betydligt fulare effekten av att kanten dras rakt över
 * klotet.
 */
export function landBana(k: Kamera): string {
  const bitar: string[] = [];
  for (let i = 0; i < POLYGONER.length; i++) {
    // Ligger hela polygonen bortom horisonten? Marginalen täcker utbredningen.
    if (vinkelAvstand(MITTPUNKTER[i]!, { lon: k.lon, lat: k.lat }) > 155) continue;
    const poly = POLYGONER[i]!;

    const projicerade = poly.map((v) => projicera(v, k));
    if (!projicerade.some((p) => p.synlig)) continue;

    /**
     * Polygonen klipps mot horisonten. Där konturen försvinner bakom klotet
     * följer banan i stället kantens båge fram till där den kommer tillbaka.
     *
     * Utan bågen sluts stora landmassor som Eurasien med en rak korda tvärs
     * över globen, och klämmer man i stället varje bakre punkt rakt ut mot
     * kanten sveper polygonen runt hela klotet och fyller det.
     */
    const kantvinkel = (p: Punkt): number =>
      Math.atan2(p.y - k.cy, p.x - k.cx);
    const punktPaKant = (v: number): { x: number; y: number } => ({
      x: k.cx + Math.cos(v) * k.r,
      y: k.cy + Math.sin(v) * k.r,
    });

    const rader: string[] = [];
    let öppen = false;
    let utvinkel: number | null = null;

    for (let j = 0; j <= projicerade.length; j++) {
      const p = projicerade[j % projicerade.length]!;
      if (p.synlig) {
        if (utvinkel !== null && öppen) {
          // Gå längs kanten från där konturen försvann till där den kommer in.
          const in_ = kantvinkel(p);
          let diff = in_ - utvinkel;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          const steg = Math.max(2, Math.round((Math.abs(diff) / Math.PI) * 24));
          for (let m = 1; m <= steg; m++) {
            const q = punktPaKant(utvinkel + (diff * m) / steg);
            rader.push(`L${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
          }
        }
        utvinkel = null;
        rader.push(
          `${öppen ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`
        );
        öppen = true;
      } else if (öppen && utvinkel === null) {
        // Första punkten bakom horisonten: minns var konturen gick ut.
        utvinkel = kantvinkel(p);
        const q = punktPaKant(utvinkel);
        rader.push(`L${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
      }
    }
    if (rader.length > 2) bitar.push(rader.join(''), 'Z');
  }
  return bitar.join('');
}

/** Meridianer och breddgrader, så att rotationen syns. */
export function gradnat(k: Kamera, steg = 30): string {
  const bitar: string[] = [];
  for (let lon = -180; lon < 180; lon += steg) {
    let öppen = false;
    for (let lat = -80; lat <= 80; lat += 5) {
      const p = projicera({ lon, lat }, k);
      if (!p.synlig) {
        öppen = false;
        continue;
      }
      bitar.push(`${öppen ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
      öppen = true;
    }
  }
  for (let lat = -60; lat <= 60; lat += steg) {
    let öppen = false;
    for (let lon = -180; lon <= 180; lon += 5) {
      const p = projicera({ lon, lat }, k);
      if (!p.synlig) {
        öppen = false;
        continue;
      }
      bitar.push(`${öppen ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
      öppen = true;
    }
  }
  return bitar.join('');
}

/**
 * Punkt längs storcirkeln mellan två positioner. Interpolationen sker på
 * enhetsvektorer, vilket ger den kortaste vägen över klotet oavsett var
 * datumlinjen råkar ligga.
 */
export function storcirkel(a: Vinkel, b: Vinkel, t: number): Vinkel {
  const la = rad(a.lat);
  const lo1 = rad(a.lon);
  const lb = rad(b.lat);
  const lo2 = rad(b.lon);
  const d = rad(vinkelAvstand(a, b));
  if (d < 1e-9) return { ...a };
  const s = Math.sin(d);
  const A = Math.sin((1 - t) * d) / s;
  const B = Math.sin(t * d) / s;
  const x = A * Math.cos(la) * Math.cos(lo1) + B * Math.cos(lb) * Math.cos(lo2);
  const y = A * Math.cos(la) * Math.sin(lo1) + B * Math.cos(lb) * Math.sin(lo2);
  const z = A * Math.sin(la) + B * Math.sin(lb);
  return {
    lat: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
    lon: (Math.atan2(y, x) * 180) / Math.PI,
  };
}

/** Storcirkeln som en bana, klippt mot horisonten. */
export function ruttBana(
  a: Vinkel,
  b: Vinkel,
  k: Kamera,
  fran = 0,
  till = 1,
  steg = 80
): string {
  const bitar: string[] = [];
  let öppen = false;
  for (let i = 0; i <= steg; i++) {
    const t = fran + ((till - fran) * i) / steg;
    const p = projicera(storcirkel(a, b, t), k);
    if (!p.synlig) {
      öppen = false;
      continue;
    }
    bitar.push(`${öppen ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    öppen = true;
  }
  return bitar.join('');
}

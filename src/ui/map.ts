import type { City } from '../data/types';
import { el, svgEl } from './dom';
import {
  gradnat,
  landBana,
  projicera,
  ruttBana,
  storcirkel,
  type Kamera,
  type Vinkel,
} from './globe';

/**
 * Resesekvensen mellan två städer.
 *
 * Här låg tidigare också den platta världskartan med zoom och panorering, som
 * resebyrån använde för att välja destination. Biljetterna köps på
 * stationerna nu, och kartan som karta ligger i ui/atlas.ts. Det som blev
 * kvar är filmen.
 */

// ------------------------------------------------------- resesekvensen

/**
 * Den lilla filmen mellan två städer, spelad på en roterande jordglob.
 *
 * Förloppet är tredelat, som en riktig kartsekvens: klotet zoomar ut från
 * avresestaden, fordonet följer storcirkeln medan jorden vrider sig under
 * det, och till sist zoomar klotet in mot målet. Kameran hålls på fordonet,
 * så det är landmassan som rör sig - vilket är det som säljer känslan av att
 * faktiskt förflytta sig.
 *
 * `onDone` anropas när sekvensen är klar eller när spelaren hoppar över den.
 * Den som bett systemet om mindre rörelse får slutbilden direkt.
 */
export interface TravelSceneOptions {
  from: City;
  to: City;
  /** Bygger fordonet i den storlek scenen ber om, centrerat kring origo. */
  vehicle: (size: number) => SVGElement;
  duration?: number;
  onDone: () => void;
}

const GLOB_STORLEK = 320;

export function renderTravelScene(options: TravelSceneOptions): HTMLElement {
  const { from, to, vehicle, onDone } = options;
  const reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const duration = reducedMotion ? 0 : (options.duration ?? 4200);

  const wrap = el('div', { class: 'travel-scene' });
  const S = GLOB_STORLEK;
  const svg = svgEl('svg', {
    class: 'globe',
    viewBox: `0 0 ${S} ${S}`,
    role: 'img',
    'aria-label': `Resa från ${from.name} till ${to.name}`,
  });

  const A = { lon: from.lon, lat: from.lat };
  const B = { lon: to.lon, lat: to.lat };

  /** Klotets radie under färden, när hela jorden ska synas. */
  const basR = S * 0.36;
  /** Radie vid start och slut, när kameran är nere vid staden. */
  const naraR = S * 0.82;

  const hav = svgEl('circle', { class: 'globe-sea', cx: S / 2, cy: S / 2 });
  const nat = svgEl('path', { class: 'globe-grid', d: '' });
  const land = svgEl('path', { class: 'globe-land', d: '' });
  const kvar = svgEl('path', { class: 'globe-route', d: '' });
  const spar = svgEl('path', { class: 'globe-trail', d: '' });
  const pinA = svgEl('g', { class: 'globe-pin globe-pin-from' });
  const pinB = svgEl('g', { class: 'globe-pin globe-pin-to' });
  const fordon = svgEl('g', { class: 'globe-vehicle' });
  svg.append(hav, nat, land, kvar, spar, pinA, pinB, fordon);
  wrap.append(svg);

  let klar = false;
  const avsluta = () => {
    if (klar) return;
    klar = true;
    onDone();
  };
  wrap.addEventListener('click', avsluta);

  const ritaPin = (
    g: SVGElement,
    plats: Vinkel,
    namn: string,
    k: Kamera,
    halo: boolean
  ) => {
    while (g.firstChild) g.removeChild(g.firstChild);
    const p = projicera(plats, k);
    if (!p.synlig) return;
    const r = Math.max(2.5, k.r * 0.016);
    const text = Math.max(9, k.r * 0.045);
    if (halo) {
      g.append(
        svgEl('circle', { class: 'globe-halo', cx: p.x, cy: p.y, r: r * 2.4 })
      );
    }
    g.append(
      svgEl('circle', { cx: p.x, cy: p.y, r, 'stroke-width': r * 0.35 })
    );
    g.append(
      svgEl(
        'text',
        {
          x: p.x,
          y: p.y - r * 1.9,
          'text-anchor': 'middle',
          'font-size': text,
          'stroke-width': text * 0.28,
        },
        namn
      )
    );
  };

  /** Ritar en hel bildruta för ett givet läge i förloppet. */
  const rita = (t: number) => {
    /**
     * Radien följer en U-kurva: nära vid avfärd, utzoomad under färden och
     * nära igen vid framkomsten.
     */
    const mjuk = (x: number) => x * x * (3 - 2 * x);
    const ut = mjuk(Math.min(1, t / 0.22));
    const in_ = mjuk(Math.max(0, (t - 0.78) / 0.22));
    const r = naraR + (basR - naraR) * ut - (basR - naraR) * in_;

    // Fordonet står stilla i mitten; klotet vrider sig under det.
    const fardT = Math.max(0, Math.min(1, (t - 0.12) / 0.76));
    const mjukFard = mjuk(fardT);
    const nu = storcirkel(A, B, mjukFard);
    const k: Kamera = { lon: nu.lon, lat: nu.lat, r, cx: S / 2, cy: S / 2 };

    hav.setAttribute('r', String(r));
    nat.setAttribute('d', gradnat(k));
    land.setAttribute('d', landBana(k));
    spar.setAttribute('d', ruttBana(A, B, k, 0, Math.max(0.001, mjukFard)));
    kvar.setAttribute('d', ruttBana(A, B, k, mjukFard, 1));
    spar.setAttribute('stroke-width', String(Math.max(1.4, r * 0.011)));
    kvar.setAttribute('stroke-width', String(Math.max(1, r * 0.007)));
    kvar.setAttribute('stroke-dasharray', `${r * 0.02} ${r * 0.02}`);

    ritaPin(pinA, A, from.name, k, false);
    ritaPin(pinB, B, to.name, k, true);

    // Riktningen tas ur nästa punkt på rutten, projicerad till skärmen.
    const framat = projicera(storcirkel(A, B, Math.min(1, mjukFard + 0.01)), k);
    const vinkel =
      (Math.atan2(framat.y - S / 2, framat.x - S / 2) * 180) / Math.PI;
    while (fordon.firstChild) fordon.removeChild(fordon.firstChild);
    fordon.append(vehicle(Math.max(14, r * 0.09)));
    fordon.setAttribute(
      'transform',
      `translate(${S / 2} ${S / 2}) rotate(${vinkel})`
    );
  };

  if (duration === 0) {
    rita(1);
    window.setTimeout(avsluta, 500);
    return wrap;
  }

  const start = performance.now();
  const step = (nu: number) => {
    if (klar) return;
    const t = Math.min(1, (nu - start) / duration);
    rita(t);
    if (t < 1) window.requestAnimationFrame(step);
    else window.setTimeout(avsluta, 600);
  };
  rita(0);
  window.requestAnimationFrame(step);

  return wrap;
}

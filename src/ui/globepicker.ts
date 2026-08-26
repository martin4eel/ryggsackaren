import { CITIES } from '../data/cities';
import type { City } from '../data/types';
import { button, el, svgEl } from './dom';
import {
  gradnat,
  landBana,
  projicera,
  storcirkel,
  vinkelAvstand,
  type Kamera,
} from './globe';

/**
 * Jordgloben på startskärmen: snurrbar, zoombar och klickbar.
 *
 * Till skillnad från resesekvensens glob ritas den här bara om när något
 * ändras - en dragning, en zoomning eller ett byte av stad - i stället för
 * varje bildruta. Med fyrtiosju stadsprickar ovanpå landmassan är det
 * skillnaden mellan att kunna ligga still och att brinna på ett batteri.
 */

export interface GlobePickerOptions {
  selectedId: string;
  onSelect: (city: City) => void;
}

export interface GlobePickerHandle {
  node: HTMLElement;
  /** Vrider klotet så att staden hamnar i mitten. */
  focus: (city: City, animera?: boolean) => void;
}

const S = 320;
const MIN_ZOOM = 0.9;
const MAX_ZOOM = 4;
/** Rörelse i skärmpixlar innan ett tryck räknas som dragning i stället för val. */
const DRAG_TROSKEL = 6;

export function renderGlobePicker(options: GlobePickerOptions): GlobePickerHandle {
  const vald = () => CITIES.find((c) => c.id === options.selectedId) ?? CITIES[0]!;
  let lon = vald().lon;
  let lat = vald().lat;
  let zoom = 1;

  const wrap = el('div', { class: 'globe-picker' });
  const svg = svgEl('svg', {
    class: 'globe globe-interactive',
    viewBox: `0 0 ${S} ${S}`,
    role: 'application',
    'aria-label': 'Jordglob. Dra för att snurra, tryck på en stad för att välja den.',
  });
  const hav = svgEl('circle', { class: 'globe-sea', cx: S / 2, cy: S / 2 });
  const nat = svgEl('path', { class: 'globe-grid', d: '' });
  const land = svgEl('path', { class: 'globe-land', d: '' });
  const prickar = svgEl('g', { class: 'globe-cities' });
  svg.append(hav, nat, land, prickar);
  wrap.append(svg);

  const kamera = (): Kamera => ({
    lon,
    lat,
    r: S * 0.42 * zoom,
    cx: S / 2,
    cy: S / 2,
  });

  /** Skärmpositioner för de städer som syns, för träffprövning vid klick. */
  let traffytor: Array<{ city: City; x: number; y: number }> = [];

  const rita = () => {
    const k = kamera();
    hav.setAttribute('r', String(k.r));
    nat.setAttribute('d', gradnat(k, 20));
    land.setAttribute('d', landBana(k));

    while (prickar.firstChild) prickar.removeChild(prickar.firstChild);
    traffytor = [];
    const r = Math.max(2.2, k.r * 0.015);
    const valdStad = vald();

    // Den valda staden ritas sist, annars täcks den av grannar som råkar
    // komma senare i listan. I Norden ligger städerna tätt nog att det syns.
    let valdGrupp: SVGElement | null = null;
    for (const city of CITIES) {
      const p = projicera({ lon: city.lon, lat: city.lat }, k);
      if (!p.synlig) continue;
      // Prickar bortom klotets synliga yta kan hamna precis på kanten.
      if (Math.hypot(p.x - k.cx, p.y - k.cy) > k.r) continue;
      traffytor.push({ city, x: p.x, y: p.y });
      const ar = city.id === valdStad.id;
      const g = svgEl('g', {
        class: `globe-city ${ar ? 'globe-city-on' : ''}`,
      });
      if (ar) {
        g.append(
          svgEl('circle', { class: 'globe-halo', cx: p.x, cy: p.y, r: r * 2.6 })
        );
      }
      g.append(
        svgEl('circle', {
          cx: p.x,
          cy: p.y,
          r: ar ? r * 1.4 : r,
          'stroke-width': r * 0.35,
        })
      );
      if (ar) valdGrupp = g;
      else prickar.append(g);
    }
    if (valdGrupp) prickar.append(valdGrupp);

    // Bara den valda staden får etikett. Fyrtiosju namn samtidigt går inte.
    const vp = projicera({ lon: valdStad.lon, lat: valdStad.lat }, k);
    if (vp.synlig) {
      const text = Math.max(11, k.r * 0.05);
      prickar.append(
        svgEl(
          'text',
          {
            class: 'globe-city-label',
            x: vp.x,
            // Avståndet måste utgå från textens höjd, inte prickens radie.
            // Med bara radien hamnade namnet ovanpå sin egen prick.
            y: vp.y - r - text * 0.7,
            'text-anchor': 'middle',
            'font-size': text,
            'stroke-width': text * 0.22,
          },
          valdStad.name
        )
      );
    }
  };

  /** Vrider klotet mjukt till en ny mittpunkt. */
  let avbrytAnimation: (() => void) | null = null;
  const focus = (city: City, animera = true) => {
    if (avbrytAnimation) avbrytAnimation();
    const fran = { lon, lat };
    const till = { lon: city.lon, lat: city.lat };
    const reducerad =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!animera || reducerad || vinkelAvstand(fran, till) < 0.5) {
      lon = till.lon;
      lat = till.lat;
      rita();
      return;
    }
    const start = performance.now();
    const tid = 600;
    let levande = true;
    avbrytAnimation = () => {
      levande = false;
    };
    const steg = (nu: number) => {
      if (!levande) return;
      const t = Math.min(1, (nu - start) / tid);
      const e = t * t * (3 - 2 * t);
      const p = storcirkel(fran, till, e);
      lon = p.lon;
      lat = p.lat;
      rita();
      if (t < 1) window.requestAnimationFrame(steg);
      else avbrytAnimation = null;
    };
    window.requestAnimationFrame(steg);
  };

  /**
   * Dragning snurrar klotet. Känsligheten skalas med zoomen, annars far
   * jorden iväg när man är inzoomad och rör sig knappt när man är utzoomad.
   */
  let drar = false;
  let flyttat = 0;
  let sistX = 0;
  let sistY = 0;

  svg.addEventListener('pointerdown', (e) => {
    drar = true;
    flyttat = 0;
    sistX = e.clientX;
    sistY = e.clientY;
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drar) return;
    const dx = e.clientX - sistX;
    const dy = e.clientY - sistY;
    sistX = e.clientX;
    sistY = e.clientY;
    flyttat += Math.abs(dx) + Math.abs(dy);
    const bredd = svg.getBoundingClientRect().width || S;
    const skala = (180 / bredd) / zoom;
    lon -= dx * skala;
    lat = Math.max(-85, Math.min(85, lat + dy * skala));
    if (avbrytAnimation) avbrytAnimation();
    rita();
  });
  const slappUpp = (e: PointerEvent) => {
    if (!drar) return;
    drar = false;
    try {
      svg.releasePointerCapture(e.pointerId);
    } catch {
      // Pekaren kan redan ha släppts av webbläsaren.
    }
    if (flyttat > DRAG_TROSKEL) return;

    // Ett tryck utan dragning: välj närmaste stad inom rimligt avstånd.
    const box = svg.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * S;
    const y = ((e.clientY - box.top) / box.height) * S;
    let bast: { city: City; d: number } | null = null;
    for (const t of traffytor) {
      const d = Math.hypot(t.x - x, t.y - y);
      if (!bast || d < bast.d) bast = { city: t.city, d };
    }
    if (bast && bast.d < 14) options.onSelect(bast.city);
  };
  svg.addEventListener('pointerup', slappUpp);
  svg.addEventListener('pointercancel', slappUpp);

  svg.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      rita();
    },
    { passive: false }
  );

  const zooma = (faktor: number) => {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * faktor));
    rita();
  };
  const knappar = el('div', { class: 'globe-zoom' });
  knappar.append(
    button('+', () => zooma(1.5), {
      class: 'map-btn',
      'aria-label': 'Zooma in',
      title: 'Zooma in',
      'data-sound': 'av',
    }),
    button('\u2212', () => zooma(1 / 1.5), {
      class: 'map-btn',
      'aria-label': 'Zooma ut',
      title: 'Zooma ut',
      'data-sound': 'av',
    })
  );
  wrap.append(knappar);

  rita();
  return { node: wrap, focus };
}

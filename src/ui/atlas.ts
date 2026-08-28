import { CITIES, CITY_BY_ID } from '../data/cities';
import type { City } from '../data/types';
import { LAND_PATH, MAP_HEIGHT, MAP_WIDTH } from '../data/worldMap';
import { el, svgEl } from './dom';

/**
 * Kartan.
 *
 * En riktig karta: ett vikt papper som vecklas ut när man öppnar den, med
 * vikmärken, gradnät, kompassros och en kartusch i hörnet. Rutten är dragen
 * med röd kulspets i besöksordning, startstaden inringad med ett "Start" i
 * marginalen och där man står sitter en nål. Ingenting annat - stadens och
 * landets fakta står på turistbyrån, där de hör hemma. Kartan är en karta.
 */

export interface AtlasOptions {
  city: City;
  homeCityId: string;
  visited: string[];
  /** Tillryggalagd sträcka på hela resan */
  distance: number;
  /** Resdag, för anteckningen i kartuschen */
  days: number;
}

/** Kartan beskärs i norr och söder; ingen destination ligger utanför. */
const VIEW_TOP = 30;
const VIEW_BOTTOM = 430;

function project(city: City): { x: number; y: number } {
  return {
    x: ((city.lon + 180) / 360) * MAP_WIDTH,
    y: ((90 - city.lat) / 180) * MAP_HEIGHT,
  };
}

/** Ett litet slumptal ur en sträng, för att skaka pennstrecken jämnt. */
function skak(seed: string, i: number): number {
  let h = 2166136261;
  const t = `${seed}|${i}`;
  for (let k = 0; k < t.length; k++) {
    h ^= t.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

/**
 * En rutt dragen för hand: mellan två städer går strecket i en svag båge
 * med små darrningar, som en linje dragen med kulspetspenna på ett papper
 * som ligger på ett knä.
 */
function pennlinje(punkter: Array<{ x: number; y: number }>): string {
  let d = '';
  for (let i = 0; i < punkter.length - 1; i++) {
    const a = punkter[i]!;
    const b = punkter[i + 1]!;
    const mx = (a.x + b.x) / 2 + skak('rutt', i) * 24;
    const my = (a.y + b.y) / 2 + skak('rutt-y', i) * 24;
    d += `${i === 0 ? `M${a.x.toFixed(1)} ${a.y.toFixed(1)} ` : ''}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)} `;
  }
  return d.trim();
}

function karta(city: City, homeCityId: string, visited: string[]): SVGElement {
  const svg = svgEl('svg', {
    class: 'karta-svg',
    viewBox: `0 ${VIEW_TOP} ${MAP_WIDTH} ${VIEW_BOTTOM - VIEW_TOP}`,
    role: 'img',
    'aria-label': `Världskarta med resan inritad. Du står i ${city.name}.`,
  });

  // Havet: papperets färg med en svag ton, som gammalt tryck.
  svg.append(
    svgEl('rect', { x: 0, y: VIEW_TOP, width: MAP_WIDTH, height: VIEW_BOTTOM - VIEW_TOP, class: 'karta-hav' })
  );

  // Gradnätet: var trettionde grad, tunt.
  const nat = svgEl('g', { class: 'karta-gradnat' });
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * MAP_WIDTH;
    nat.append(svgEl('line', { x1: x, y1: VIEW_TOP, x2: x, y2: VIEW_BOTTOM }));
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * MAP_HEIGHT;
    nat.append(svgEl('line', { x1: 0, y1: y, x2: MAP_WIDTH, y2: y, class: lat === 0 ? 'karta-ekvator' : '' }));
  }
  svg.append(nat);

  svg.append(svgEl('path', { d: LAND_PATH, class: 'karta-land' }));

  // Rutten, i kulspets.
  const punkter = visited
    .map((id) => CITY_BY_ID[id])
    .filter((c): c is City => Boolean(c))
    .map(project);
  if (punkter.length > 1) {
    const d = pennlinje(punkter);
    svg.append(svgEl('path', { d, class: 'karta-rutt-skugga' }), svgEl('path', { d, class: 'karta-rutt' }));
  }

  // Städerna: små punkter, besökta som bläckprickar.
  const bevist = new Set(visited);
  for (const c of CITIES) {
    const { x, y } = project(c);
    const harVarit = bevist.has(c.id);
    svg.append(
      svgEl('circle', {
        cx: x,
        cy: y,
        r: harVarit ? 3.2 : 1.8,
        class: `karta-stad ${harVarit ? 'karta-stad-bevist' : ''}`,
      })
    );
  }

  // Startstaden: inringad med pennan, namnet bredvid. Står man där man
  // började skrivs namnet bara en gång, vid nålen.
  const hem = CITY_BY_ID[homeCityId];
  const sammaStad = hem?.id === city.id;
  if (hem) {
    const p = project(hem);
    const r = 11;
    // En ring dragen för hand: inte helt sluten, lite oval.
    svg.append(
      svgEl('path', {
        d: `M${(p.x + r).toFixed(1)} ${p.y.toFixed(1)} a${r} ${r * 0.85} -8 1 1 ${(-r * 0.2).toFixed(1)} ${(-r * 0.75).toFixed(1)}`,
        class: 'karta-ring',
      })
    );
    if (!sammaStad) {
      const vansterHem = p.x > MAP_WIDTH * 0.8;
      svg.append(
        svgEl('text', {
          x: vansterHem ? p.x - r - 4 : p.x + r + 4,
          y: p.y + 5,
          class: `karta-anteckning ${vansterHem ? 'karta-anteckning-vanster' : ''}`,
        }, `Start: ${hem.name}`)
      );
    }
  }

  // Där man står: en nål med huvud, och "Här" i marginalen.
  const nu = project(city);
  const nal = svgEl('g', { class: 'karta-nal', transform: `translate(${nu.x.toFixed(1)} ${nu.y.toFixed(1)})` });
  nal.append(
    svgEl('ellipse', { cx: 1.5, cy: 1.5, rx: 3.5, ry: 1.6, class: 'karta-nal-skugga' }),
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: -14, class: 'karta-nal-skaft' }),
    svgEl('circle', { cx: 0, cy: -16, r: 4.6, class: 'karta-nal-huvud' }),
    svgEl('circle', { cx: -1.4, cy: -17.4, r: 1.3, class: 'karta-nal-glans' })
  );
  svg.append(nal);
  const vanster = nu.x > MAP_WIDTH * 0.8;
  svg.append(
    svgEl(
      'text',
      {
        x: vanster ? nu.x - 9 : nu.x + 9,
        y: nu.y - 20,
        class: `karta-anteckning karta-anteckning-har ${vanster ? 'karta-anteckning-vanster' : ''}`,
      },
      sammaStad ? `Här och start: ${city.name}` : `Här: ${city.name}`
    )
  );

  // Kompassros nere till vänster.
  const kx = 52;
  const ky = VIEW_BOTTOM - 52;
  const ros = svgEl('g', { class: 'karta-kompass', transform: `translate(${kx} ${ky})` });
  ros.append(
    svgEl('circle', { cx: 0, cy: 0, r: 22 }),
    svgEl('circle', { cx: 0, cy: 0, r: 15 }),
    svgEl('path', { d: 'M0 -26 L5 0 L0 26 L-5 0 Z', class: 'karta-kompass-ns' }),
    svgEl('path', { d: 'M-26 0 L0 5 L26 0 L0 -5 Z', class: 'karta-kompass-ov' }),
    svgEl('text', { x: 0, y: -30, class: 'karta-kompass-text' }, 'N')
  );
  svg.append(ros);

  return svg;
}

export function renderAtlasScreen(opts: AtlasOptions): HTMLElement {
  const { city, homeCityId, visited, distance, days } = opts;
  const wrap = el('div', { class: 'stack atlas' });
  const unika = new Set(visited).size;
  const hem = CITY_BY_ID[homeCityId];

  const blad = el('section', { class: 'karta-blad' });
  // Vikmärkena: två lodräta och ett vågrätt veck, som en karta i sex delar.
  blad.append(
    el('div', { class: 'karta-veck karta-veck-lod', style: 'left:33.3%' }),
    el('div', { class: 'karta-veck karta-veck-lod', style: 'left:66.6%' }),
    el('div', { class: 'karta-veck karta-veck-vag' })
  );
  const mal = city;
  const rullyta = el('div', { class: 'karta-rullyta' }, karta(city, homeCityId, visited));
  blad.append(rullyta);

  // Kartuschen: titel och resans siffror, som tryckt i ett hörn.
  blad.append(
    el('div', { class: 'karta-kartusch' },
      el('span', { class: 'karta-kartusch-titel' }, 'Världskarta'),
      el('span', { class: 'karta-kartusch-rad' }, 'Upptäckarens resa'),
      el('span', { class: 'karta-kartusch-rad' },
        `Dag ${days} · ${unika} av ${CITIES.length} städer · ${distance.toLocaleString('sv-SE')} km`
      )
    )
  );
  // Teckenförklaring, liten, i motsatt hörn.
  blad.append(
    el('div', { class: 'karta-legend' },
      hem?.id === city.id
        ? el('span', { class: 'karta-legend-rad' }, el('span', { class: 'karta-legend-nal' }), ` Här och start: ${city.name}`)
        : el('span', { class: 'karta-legend-rad' }, el('span', { class: 'karta-legend-ring' }), ` Start: ${hem?.name ?? '—'}`),
      hem?.id === city.id
        ? ''
        : el('span', { class: 'karta-legend-rad' }, el('span', { class: 'karta-legend-nal' }), ` Här: ${city.name}`),
      el('span', { class: 'karta-legend-rad' }, el('span', { class: 'karta-legend-streck' }), ' Resväg')
    )
  );
  wrap.append(blad);

  // På en smal skärm är kartan bredare än rutan: rulla fram till nålen.
  requestAnimationFrame(() => {
    const svg = rullyta.querySelector('svg');
    if (!svg) return;
    const bredd = svg.getBoundingClientRect().width;
    if (rullyta.scrollWidth <= rullyta.clientWidth + 4) return;
    const nu = project(mal);
    rullyta.scrollLeft = Math.max(0, (nu.x / MAP_WIDTH) * bredd - rullyta.clientWidth / 2);
  });

  return wrap;
}

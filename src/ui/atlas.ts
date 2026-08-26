import { CITIES, CITY_BY_ID } from '../data/cities';
import { CURRENCIES } from '../data/currencies';
import { COUNTRY_FACTS, CITY_POPULATION, populationText } from '../data/facts';
import type { City } from '../data/types';
import { LAND_PATH, MAP_HEIGHT, MAP_WIDTH } from '../data/worldMap';
import { el, svgEl } from './dom';

/**
 * Atlasen.
 *
 * Kartan var förut ett väljarreglage på resebyrån: man zoomade, panorerade och
 * prickade en stad för att få se biljettpriser. Biljetterna köps på
 * stationerna nu, och då blev det som återstod en karta utan uppgift.
 *
 * Här har den i stället fått vara karta. Ingen zoom, ingen panorering, inget
 * att träffa - bara hela världen på en gång, med rutten du rest inritad och
 * ett kryss där du står. Under den ligger det man annars skulle ha slagit upp
 * i en atlas: folkmängd, språk, religion, valuta och huvudstad.
 */

export interface AtlasOptions {
  city: City;
  homeCityId: string;
  visited: string[];
  money: (amount: number) => string;
  /** Vad boendet kostar per dygn här */
  dailyCost: number;
  /** Stadsbetyget från turistbyrån */
  rating: number;
  /** Tillryggalagd sträcka på hela resan */
  distance: number;
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

/** Tidszonen skriven som på en klocka på väggen. */
function utcLabel(utc: number): string {
  const tecken = utc < 0 ? '−' : '+';
  const abs = Math.abs(utc);
  const tim = Math.floor(abs);
  const min = Math.round((abs - tim) * 60);
  return `UTC${tecken}${tim}${min ? `:${String(min).padStart(2, '0')}` : ''}`;
}

/** Koordinater i grader och minuter, som i en riktig atlas. */
function coordLabel(city: City): string {
  const grad = (v: number, pos: string, neg: string) => {
    const hall = v >= 0 ? pos : neg;
    const abs = Math.abs(v);
    const heltal = Math.floor(abs);
    const min = Math.round((abs - heltal) * 60);
    return `${heltal}°${String(min).padStart(2, '0')}′ ${hall}`;
  };
  return `${grad(city.lat, 'N', 'S')}, ${grad(city.lon, 'Ö', 'V')}`;
}

function prisniva(costIndex: number): string {
  if (costIndex >= 1.35) return 'dyrt';
  if (costIndex >= 1.1) return 'ganska dyrt';
  if (costIndex >= 0.85) return 'medel';
  if (costIndex >= 0.6) return 'billigt';
  return 'mycket billigt';
}

/**
 * Världskartan, ritad en gång och sedan stilla. Rutten mellan de besökta
 * städerna dras som en linje i ordning, så att resan syns som en resa och inte
 * som en samling prickar.
 */
function karta(city: City, homeCityId: string, visited: string[]): SVGElement {
  const svg = svgEl('svg', {
    class: 'atlas-map',
    viewBox: `0 ${VIEW_TOP} ${MAP_WIDTH} ${VIEW_BOTTOM - VIEW_TOP}`,
    role: 'img',
    'aria-label': `Världskarta med ${city.name} utmärkt`,
  });

  /**
   * Havet ligger underst. Gradienten är svag med flit: en karta ska läsas, inte
   * beundras, och en kraftig ton drar blicken till bakgrunden.
   */
  const grad = svgEl('linearGradient', {
    id: 'atlas-havston',
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
  });
  grad.append(
    svgEl('stop', { offset: '0', 'stop-color': '#0e3750' }),
    svgEl('stop', { offset: '1', 'stop-color': '#0a2a3e' })
  );
  svg.append(svgEl('defs', {}, grad));
  svg.append(
    svgEl('rect', {
      x: 0,
      y: VIEW_TOP,
      width: MAP_WIDTH,
      height: VIEW_BOTTOM - VIEW_TOP,
      fill: 'url(#atlas-havston)',
    })
  );

  /**
   * Ingen gradnät. Kartan hade förut ekvatorn, vändkretsarna och polcirkeln
   * inritade, och de linjerna låg tvärs över Afrika och Grönland utan att
   * betyda något för spelaren - det såg ut som repor i bilden. Det som är kvar
   * är land, hav, rutt och städer.
   */
  svg.append(svgEl('path', { d: LAND_PATH, class: 'atlas-land' }));

  /**
   * Reserutan. Städerna ritas i besöksordning, dubbletter och alla, eftersom
   * en resa som går tillbaka till en stad faktiskt är en sträcka till.
   */
  const punkter = visited
    .map((id) => CITY_BY_ID[id])
    .filter((c): c is City => Boolean(c))
    .map(project);
  if (punkter.length > 1) {
    const d = punkter
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    svg.append(svgEl('path', { d, class: 'atlas-rutt' }));
  }

  const bevist = new Set(visited);
  for (const c of CITIES) {
    const { x, y } = project(c);
    const harVarit = bevist.has(c.id);
    const arHar = c.id === city.id;
    const arHem = c.id === homeCityId;
    if (arHem && !arHar) {
      svg.append(svgEl('circle', { cx: x, cy: y, r: 6, class: 'atlas-hemring' }));
    }
    svg.append(
      svgEl('circle', {
        cx: x,
        cy: y,
        r: arHar ? 5 : harVarit ? 3.4 : 2.4,
        class: `atlas-prick ${
          arHar ? 'atlas-har' : harVarit ? 'atlas-bevist' : ''
        }`,
      })
    );
  }

  // Där du står: en pulserande ring och stadens namn, alltid utskrivet.
  const nu = project(city);
  svg.append(
    svgEl('circle', { cx: nu.x, cy: nu.y, r: 9, class: 'atlas-puls' }),
    svgEl(
      'text',
      {
        x: nu.x,
        // Namnet läggs under pricken utom längst upp på kartan, där det
        // annars skulle hamna utanför beskärningen.
        y: nu.y < VIEW_TOP + 40 ? nu.y + 20 : nu.y - 13,
        class: 'atlas-dunamn',
      },
      city.name
    )
  );

  return svg;
}

export function renderAtlasScreen(opts: AtlasOptions): HTMLElement {
  const { city, homeCityId, visited, money, dailyCost, rating, distance } = opts;
  const wrap = el('div', { class: 'stack atlas' });
  const land = COUNTRY_FACTS[city.country];
  const valuta = CURRENCIES[city.currency];
  const folk = CITY_POPULATION[city.id];
  const unika = new Set(visited).size;
  const hem = CITY_BY_ID[homeCityId];

  // ---- kartan
  const kartpanel = el('section', { class: 'panel atlas-panel' });
  kartpanel.append(
    el('div', { class: 'panel-head' },
      el('h1', { class: 'title' }, 'Var i världen'),
      el('span', { class: 'tag' }, `${unika} av ${CITIES.length} städer`)
    ),
    el('div', { class: 'atlas-ram' }, karta(city, homeCityId, visited)),
    el('div', { class: 'atlas-teckenforklaring' },
      el('span', { class: 'atlas-nyckel atlas-nyckel-har' }, 'Du är här'),
      el('span', { class: 'atlas-nyckel atlas-nyckel-bevist' }, 'Besökt'),
      el('span', { class: 'atlas-nyckel atlas-nyckel-hem' },
        `Hemstad: ${hem?.name ?? '—'}`)
    ),
    el(
      'p',
      { class: 'muted' },
      unika > 1
        ? `Linjen är din väg hittills: ${visited
            .map((id) => CITY_BY_ID[id]?.name ?? id)
            .join(' → ')}. Sammanlagt ${distance.toLocaleString('sv-SE')} km.`
        : 'Resan har inte börjat än. Ta dig till en station så ritas rutten in här.'
    )
  );
  wrap.append(kartpanel);

  // ---- staden
  const rad = (etikett: string, varde: string) =>
    el('div', { class: 'fakta-rad' },
      el('span', { class: 'fakta-etikett' }, etikett),
      el('span', { class: 'fakta-varde' }, varde)
    );

  const stad = el('section', { class: 'panel' });
  stad.append(
    el('div', { class: 'panel-head' },
      el('h2', {}, city.name),
      el('span', { class: 'tag' }, city.country)
    ),
    el('p', { class: 'lede' }, city.blurb),
    el('div', { class: 'fakta' },
      folk ? rad('Folkmängd', populationText(folk)) : '',
      rad('Läge', coordLabel(city)),
      rad('Tidszon', utcLabel(city.utc)),
      rad('Sevärdhet', city.landmark),
      rad('Prisnivå', `${prisniva(city.costIndex)} · boende ${money(dailyCost)} per dygn`),
      rad('Ditt stadsbetyg', `${rating} av 100`)
    )
  );
  wrap.append(stad);

  // ---- landet
  const landpanel = el('section', { class: 'panel' });
  landpanel.append(
    el('div', { class: 'panel-head' },
      el('h2', {}, city.country),
      land?.capital === city.name
        ? el('span', { class: 'tag tag-huvudstad' }, 'Huvudstad')
        : ''
    )
  );
  if (land) {
    landpanel.append(
      el('div', { class: 'fakta' },
        rad('Huvudstad', land.capital),
        rad('Folkmängd', land.population),
        rad('Språk', land.language),
        rad('Religion', land.religion),
        rad(
          'Valuta',
          valuta
            ? `${valuta.name} (${valuta.code})`
            : city.currency
        )
      )
    );
  } else {
    landpanel.append(
      el('p', { class: 'muted' }, 'Det finns ingen landsfakta inlagd för det här landet än.')
    );
  }
  wrap.append(landpanel);

  return wrap;
}

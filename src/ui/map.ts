import { CITIES, CITY_BY_ID } from '../data/cities';
import type { City } from '../data/types';
import { LAND_PATH, MAP_HEIGHT, MAP_WIDTH } from '../data/worldMap';
import { svgEl } from './dom';

export interface MapOptions {
  currentCityId: string;
  homeCityId: string;
  visited: string[];
  /** Anropas när spelaren väljer en stad */
  onSelect: (city: City) => void;
  /** Om satt visas bara dessa städer som valbara */
  selectableIds?: string[];
  /** Rita reslinje från nuvarande stad till hovrad/vald stad */
  highlightId?: string;
}

const PAD = 8;

/**
 * Vi beskär kartan i norr och söder. Ingen destination ligger utanför, och
 * Antarktis tar bara plats. Resultatet blir en bredare, lägre karta som
 * passar både telefon och skärm.
 */
const VIEW_TOP = 24; // motsvarar cirka 81 grader nord
const VIEW_BOTTOM = 432; // motsvarar cirka 65 grader syd
const VIEW_HEIGHT = VIEW_BOTTOM - VIEW_TOP;

function project(city: City): { x: number; y: number } {
  return {
    x: ((city.lon + 180) / 360) * MAP_WIDTH,
    y: ((90 - city.lat) / 180) * MAP_HEIGHT,
  };
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function overlaps(a: Box, b: Box): boolean {
  return !(a.x2 < b.x1 || b.x2 < a.x1 || a.y2 < b.y1 || b.y2 < a.y1);
}

const LABEL_FONT_SIZE = 13;
/**
 * Uppmätt textbredd varierar med vilka tecken namnet innehåller. Korta namn
 * som "Rom" är breda per tecken, långa som "Reykjavík" smalare. Vi räknar
 * därför med ett påslag plus en fast marginal, så att kollisionsrutan aldrig
 * blir mindre än den renderade texten.
 */
const CHAR_WIDTH = 8.6;
const LABEL_PAD = 6;
const LABEL_GAP = 11;

type Anchor = 'start' | 'end' | 'middle';

interface Placement {
  dx: number;
  dy: number;
  anchor: Anchor;
}

/** Kandidatplaceringar i prioritetsordning: höger, vänster, under, över. */
/**
 * Kandidatplaceringar, genererade i växande ringar runt punkten. Nära
 * placeringar provas först, och först när allt är fullt flyttas etiketten
 * längre ut. Då ritas en tunn hjälplinje så att det syns vilken punkt
 * etiketten hör till, ungefär som i en tryckt atlas.
 */
const PLACEMENTS: Placement[] = (() => {
  const out: Placement[] = [];
  // Avstånd i steg utåt. Det första steget är den täta placeringen intill.
  const rings = [
    { dx: LABEL_GAP, dy: 4.5 },
    { dx: LABEL_GAP, dy: 18 },
    { dx: LABEL_GAP, dy: -10 },
    { dx: LABEL_GAP + 10, dy: 30 },
    { dx: LABEL_GAP + 10, dy: -22 },
    { dx: LABEL_GAP + 22, dy: 44 },
    { dx: LABEL_GAP + 22, dy: -36 },
    { dx: LABEL_GAP + 34, dy: 58 },
    { dx: LABEL_GAP + 34, dy: -50 },
  ];
  for (const r of rings) {
    out.push({ dx: r.dx, dy: r.dy, anchor: 'start' });
    out.push({ dx: -r.dx, dy: r.dy, anchor: 'end' });
  }
  // Rakt under och rakt över punkten fungerar också när sidorna är fulla.
  for (const dy of [19, -11, 32, -24, 46, -38]) {
    out.push({ dx: 0, dy, anchor: 'middle' });
  }
  return out;
})();

/**
 * Etiketter vars ankarpunkt ligger längre bort än så här från kartpunkten får
 * en hjälplinje, så att det alltid går att se vilken stad namnet hör till.
 */
const LEADER_THRESHOLD = 20;

function labelBox(
  x: number,
  y: number,
  text: string,
  p: Placement
): Box {
  const w = text.length * CHAR_WIDTH + LABEL_PAD;
  const cx = x + p.dx;
  const cy = y + p.dy;
  const x1 =
    p.anchor === 'start' ? cx : p.anchor === 'end' ? cx - w : cx - w / 2;
  // Textens baslinje ligger i cy, så rutan sträcker sig uppåt över versalhöjd
  // och en bit nedåt för staplar som i g och j.
  return {
    x1,
    y1: cy - LABEL_FONT_SIZE,
    x2: x1 + w,
    y2: cy + LABEL_FONT_SIZE * 0.4,
  };
}

/**
 * Ritar världskartan som SVG. Equirektangulär projektion, samma som
 * landmassans genererade path, så städerna hamnar på rätt plats.
 */
/**
 * Kartan i en behållare. På smala skärmar får svg:n en minimibredd så att
 * pinnar och namn blir läsbara, och behållaren kan svepas i sidled.
 */
export function renderMapFrame(options: MapOptions): HTMLElement {
  const frame = document.createElement('div');
  frame.className = 'map-frame';
  frame.append(renderMap(options));
  return frame;
}

export function renderMap(options: MapOptions): SVGElement {
  const {
    currentCityId,
    homeCityId,
    visited,
    onSelect,
    selectableIds,
    highlightId,
  } = options;

  const svg = svgEl('svg', {
    class: 'worldmap',
    viewBox: `${-PAD} ${VIEW_TOP - PAD} ${MAP_WIDTH + PAD * 2} ${
      VIEW_HEIGHT + PAD * 2
    }`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'group',
    'aria-label': 'Världskarta med destinationer',
  });

  const defs = svgEl('defs');
  const grad = svgEl('linearGradient', {
    id: 'sea',
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
  });
  grad.append(
    svgEl('stop', { offset: '0', 'stop-color': '#123f5c' }),
    svgEl('stop', { offset: '1', 'stop-color': '#0b2337' })
  );
  defs.append(grad);
  svg.append(defs);

  // Klippmask så att landmassan inte sticker ut ovanför eller under vyn.
  const clip = svgEl('clipPath', { id: 'mapclip' });
  clip.append(
    svgEl('rect', {
      x: -PAD,
      y: VIEW_TOP - PAD,
      width: MAP_WIDTH + PAD * 2,
      height: VIEW_HEIGHT + PAD * 2,
    })
  );
  defs.append(clip);

  svg.append(
    svgEl('rect', {
      x: -PAD,
      y: VIEW_TOP - PAD,
      width: MAP_WIDTH + PAD * 2,
      height: VIEW_HEIGHT + PAD * 2,
      fill: 'url(#sea)',
    })
  );

  const world = svgEl('g', { 'clip-path': 'url(#mapclip)' });

  // Latitud- och longitudlinjer
  const graticule = svgEl('g', { class: 'graticule' });
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * MAP_WIDTH;
    graticule.append(
      svgEl('line', { x1: x, y1: 0, x2: x, y2: MAP_HEIGHT })
    );
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * MAP_HEIGHT;
    graticule.append(
      svgEl('line', { x1: 0, y1: y, x2: MAP_WIDTH, y2: y })
    );
  }
  world.append(graticule);

  // Ekvatorn markeras tydligare
  const eqY = MAP_HEIGHT / 2;
  world.append(
    svgEl('line', {
      class: 'equator',
      x1: 0,
      y1: eqY,
      x2: MAP_WIDTH,
      y2: eqY,
    })
  );

  world.append(svgEl('path', { class: 'land', d: LAND_PATH }));

  // Reslinjen mellan besökta städer
  const trail = visited
    .map((id) => CITY_BY_ID[id])
    .filter((c): c is City => Boolean(c));
  if (trail.length > 1) {
    const routes = svgEl('g', { class: 'routes' });
    for (let i = 1; i < trail.length; i++) {
      routes.append(pathBetween(trail[i - 1]!, trail[i]!, 'route-done'));
    }
    world.append(routes);
  }

  if (highlightId && highlightId !== currentCityId) {
    const from = CITY_BY_ID[currentCityId];
    const to = CITY_BY_ID[highlightId];
    if (from && to) world.append(pathBetween(from, to, 'route-plan'));
  }

  /**
   * Etiketter placeras giriga: viktiga städer först, och varje etikett tar
   * första lediga position. Städer som inte får plats visar bara sin punkt,
   * med namnet tillgängligt via aria-label och destinationslistan.
   */
  const taken: Box[] = [];
  // Reservera punkterna själva så att ingen text hamnar ovanpå en annan stad.
  for (const city of CITIES) {
    const { x, y } = project(city);
    taken.push({ x1: x - 7, y1: y - 7, x2: x + 7, y2: y + 7 });
  }
  const priority = (city: City): number => {
    if (city.id === currentCityId) return 0;
    if (city.id === highlightId) return 1;
    if (city.id === homeCityId) return 2;
    if (visited.includes(city.id)) return 3;
    return 4;
  };
  const ordered = [...CITIES].sort(
    (a, b) => priority(a) - priority(b) || a.name.localeCompare(b.name, 'sv')
  );
  const labelPlacement = new Map<string, Placement | null>();
  for (const city of ordered) {
    const { x, y } = project(city);
    let chosen: Placement | null = null;
    for (const p of PLACEMENTS) {
      const box = labelBox(x, y, city.name, p);
      if (box.x1 < -PAD || box.x2 > MAP_WIDTH + PAD) continue;
      if (box.y1 < VIEW_TOP || box.y2 > VIEW_BOTTOM) continue;
      if (taken.some((t) => overlaps(t, box))) continue;
      chosen = p;
      taken.push(box);
      break;
    }
    labelPlacement.set(city.id, chosen);
  }

  const pins = svgEl('g', { class: 'pins' });
  for (const city of CITIES) {
    const { x, y } = project(city);
    const isCurrent = city.id === currentCityId;
    const isHome = city.id === homeCityId;
    const isVisited = visited.includes(city.id);
    const selectable =
      !isCurrent && (!selectableIds || selectableIds.includes(city.id));

    const classes = ['pin'];
    if (isCurrent) classes.push('pin-current');
    if (isHome) classes.push('pin-home');
    if (isVisited && !isCurrent) classes.push('pin-visited');
    if (city.id === highlightId) classes.push('pin-highlight');
    if (!selectable && !isCurrent) classes.push('pin-locked');

    const group = svgEl('g', {
      class: classes.join(' '),
      role: selectable ? 'button' : undefined,
      tabindex: selectable ? 0 : undefined,
      'aria-label': `${city.name}, ${city.country}`,
    });

    // Osynlig större träffyta gör pinnarna lätta att träffa med finger.
    group.append(svgEl('circle', { class: 'pin-hit', cx: x, cy: y, r: 16 }));
    if (isCurrent) {
      group.append(svgEl('circle', { class: 'pin-halo', cx: x, cy: y, r: 13 }));
    }
    group.append(svgEl('circle', { class: 'pin-dot', cx: x, cy: y, r: 6 }));

    const placement = labelPlacement.get(city.id) ?? null;
    if (placement) {
      // Ligger etiketten långt bort behöver den en linje tillbaka till punkten.
      // Vi mäter faktiskt avstånd, så att regeln blir densamma för alla städer.
      const far = Math.hypot(placement.dx, placement.dy) > LEADER_THRESHOLD;
      if (far) {
        const endX =
          placement.anchor === 'end'
            ? x + placement.dx + 3
            : placement.anchor === 'start'
              ? x + placement.dx - 3
              : x;
        group.append(
          svgEl('line', {
            class: 'pin-leader',
            x1: x,
            y1: y,
            x2: endX,
            y2: y + placement.dy - 4,
          })
        );
      }
      group.append(
        svgEl(
          'text',
          {
            class: 'pin-label',
            x: x + placement.dx,
            y: y + placement.dy,
            'text-anchor': placement.anchor,
          },
          city.name
        )
      );
    }

    if (selectable) {
      const activate = () => onSelect(city);
      group.addEventListener('click', activate);
      group.addEventListener('keydown', (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    }
    pins.append(group);
  }
  world.append(pins);
  svg.append(world);

  return svg;
}

/**
 * Ritar en bågformad linje mellan två städer. Om sträckan korsar
 * datumgränsen delas linjen i två delar så den inte skär över hela kartan.
 */
function pathBetween(from: City, to: City, className: string): SVGElement {
  const group = svgEl('g', { class: className });
  const dLon = to.lon - from.lon;

  if (Math.abs(dLon) <= 180) {
    group.append(svgEl('path', { d: arc(project(from), project(to)) }));
    return group;
  }

  // Kortaste vägen går runt kanten. Spegla målet, klipp vid kartkanten.
  const wrapEast = dLon < 0;
  const shifted: City = {
    ...to,
    lon: wrapEast ? to.lon + 360 : to.lon - 360,
  };
  const a = project(from);
  const b = project(shifted);
  // Andra halvan speglad tillbaka in i kartan
  const a2 = { x: a.x + (wrapEast ? -MAP_WIDTH : MAP_WIDTH), y: a.y };
  const b2 = project(to);
  group.append(svgEl('path', { d: arc(a, b) }));
  group.append(svgEl('path', { d: arc(a2, b2) }));
  return group;
}

function arc(
  a: { x: number; y: number },
  b: { x: number; y: number }
): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  // Böj linjen mot norr för att antyda storcirkelrutt
  const bend = Math.min(60, len * 0.16);
  const nx = -dy / (len || 1);
  const ny = dx / (len || 1);
  const cx = mx + nx * bend * (a.y > MAP_HEIGHT / 2 ? -1 : 1);
  const cy = my + ny * bend * (a.y > MAP_HEIGHT / 2 ? -1 : 1);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(
    1
  )} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

import { CITIES, CITY_BY_ID } from '../data/cities';
import type { City } from '../data/types';
import { LAND_PATH, MAP_HEIGHT, MAP_WIDTH } from '../data/worldMap';
import { button, svgEl } from './dom';

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

/** Kartrutans yttermått i SVG-enheter, inklusive marginal. */
const VIEW_X = -PAD;
const VIEW_Y = VIEW_TOP - PAD;
const VIEW_W = MAP_WIDTH + PAD * 2;
const VIEW_H = VIEW_HEIGHT + PAD * 2;

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 1.6;

/** Rörelse i skärmpixlar innan ett tryck räknas som dragning i stället för val. */
const DRAG_THRESHOLD = 8;

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

/**
 * Etiketterna ligger i ett lager som inte skalas med kartan, så de har alltid
 * samma storlek på skärmen. Måtten nedan är därför i SVG-enheter vid zoom 1,
 * vilket också är den skala lagret alltid ritas i.
 */
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

/**
 * Kandidatplaceringar, genererade i växande ringar runt punkten. Nära
 * placeringar provas först, och först när allt är fullt flyttas etiketten
 * längre ut. Då ritas en tunn hjälplinje så att det syns vilken punkt
 * etiketten hör till, ungefär som i en tryckt atlas.
 */
const PLACEMENTS: Placement[] = (() => {
  const out: Placement[] = [];
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

function labelBox(x: number, y: number, text: string, p: Placement): Box {
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

/** Kartans nuvarande vy: skala och förflyttning i SVG-enheter. */
interface ViewState {
  k: number;
  tx: number;
  ty: number;
}

/**
 * Kartan i en behållare, med zoomreglage. Zoom och panorering ändrar bara
 * kartans transform och ritar om pinnlagret, aldrig hela spelskärmen.
 */
export function renderMapFrame(options: MapOptions): HTMLElement {
  const frame = document.createElement('div');
  frame.className = 'map-frame';

  const { svg, setView, getView, zoomBy, reset } = renderMap(options);
  frame.append(svg);

  // Reglagen finns för att zoom ska gå att hitta och nå med tangentbord.
  const controls = document.createElement('div');
  controls.className = 'map-controls';
  const zoomIn = button('+', () => zoomBy(ZOOM_STEP), {
    class: 'map-btn',
    'aria-label': 'Zooma in',
    title: 'Zooma in',
  });
  const zoomOut = button('\u2212', () => zoomBy(1 / ZOOM_STEP), {
    class: 'map-btn',
    'aria-label': 'Zooma ut',
    title: 'Zooma ut',
  });
  const resetBtn = button('Hela världen', () => reset(), {
    class: 'map-btn map-btn-reset',
    'aria-label': 'Visa hela världen',
    title: 'Visa hela världen',
  });
  controls.append(zoomIn, zoomOut, resetBtn);
  frame.append(controls);

  // Reglagen speglar läget: går det inte att zooma mer stängs knappen av.
  const syncControls = () => {
    const { k } = getView();
    zoomIn.disabled = k >= MAX_ZOOM - 0.001;
    zoomOut.disabled = k <= MIN_ZOOM + 0.001;
    resetBtn.hidden = k <= MIN_ZOOM + 0.001;
  };
  syncControls();
  svg.addEventListener('ryggsackaren:view', syncControls as EventListener);
  void setView;

  return frame;
}

interface MapHandle {
  svg: SVGSVGElement;
  setView: (view: Partial<ViewState>) => void;
  getView: () => ViewState;
  zoomBy: (factor: number) => void;
  reset: () => void;
}

/**
 * Ritar världskartan som SVG. Equirektangulär projektion, samma som
 * landmassans genererade path, så städerna hamnar på rätt plats.
 *
 * Geografin ligger i ett lager som skalas vid zoom. Pinnar och namn ligger i
 * ett eget lager som inte skalas, utan räknas om vid varje vyändring. Därför
 * behåller texten samma storlek på skärmen, och när man zoomar in får fler
 * namn plats eftersom städerna glider ifrån varandra.
 */
export function renderMap(options: MapOptions): MapHandle {
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
    viewBox: `${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'group',
    'aria-label': 'Världskarta med destinationer. Zooma med två fingrar eller reglagen.',
  }) as SVGSVGElement;

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

  // Klippmask så att kartan aldrig ritas utanför rutan, oavsett zoom.
  const clip = svgEl('clipPath', { id: 'mapclip' });
  clip.append(
    svgEl('rect', { x: VIEW_X, y: VIEW_Y, width: VIEW_W, height: VIEW_H })
  );
  defs.append(clip);
  svg.append(defs);

  svg.append(
    svgEl('rect', {
      x: VIEW_X,
      y: VIEW_Y,
      width: VIEW_W,
      height: VIEW_H,
      fill: 'url(#sea)',
    })
  );

  // Allt kartinnehåll klipps mot rutan.
  const clipped = svgEl('g', { 'clip-path': 'url(#mapclip)' });

  // Geografilagret skalas vid zoom.
  const geo = svgEl('g', { class: 'map-geo' });

  const graticule = svgEl('g', { class: 'graticule' });
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * MAP_WIDTH;
    graticule.append(svgEl('line', { x1: x, y1: 0, x2: x, y2: MAP_HEIGHT }));
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * MAP_HEIGHT;
    graticule.append(svgEl('line', { x1: 0, y1: y, x2: MAP_WIDTH, y2: y }));
  }
  geo.append(graticule);

  const eqY = MAP_HEIGHT / 2;
  geo.append(
    svgEl('line', { class: 'equator', x1: 0, y1: eqY, x2: MAP_WIDTH, y2: eqY })
  );
  geo.append(svgEl('path', { class: 'land', d: LAND_PATH }));

  const trail = visited
    .map((id) => CITY_BY_ID[id])
    .filter((c): c is City => Boolean(c));
  if (trail.length > 1) {
    const routes = svgEl('g', { class: 'routes' });
    for (let i = 1; i < trail.length; i++) {
      routes.append(pathBetween(trail[i - 1]!, trail[i]!, 'route-done'));
    }
    geo.append(routes);
  }

  if (highlightId && highlightId !== currentCityId) {
    const from = CITY_BY_ID[currentCityId];
    const to = CITY_BY_ID[highlightId];
    if (from && to) geo.append(pathBetween(from, to, 'route-plan'));
  }

  clipped.append(geo);

  // Pinnlagret skalas inte, utan ritas om med skärmpositioner.
  const overlay = svgEl('g', { class: 'map-overlay' });
  clipped.append(overlay);
  svg.append(clipped);

  const view: ViewState = { k: 1, tx: 0, ty: 0 };

  /** Håller kartan inom rutan så att man inte kan dra ut i tomma intet. */
  const clampView = (next: ViewState): ViewState => {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.k));
    // Vid skala k täcker kartan VIEW_W * k. Överskottet är det vi får panorera.
    const slackX = VIEW_W * (k - 1);
    const slackY = VIEW_H * (k - 1);
    // Transformen sker kring rutans övre vänstra hörn i SVG-koordinater.
    const minTx = VIEW_X - (VIEW_X * k + slackX);
    const minTy = VIEW_Y - (VIEW_Y * k + slackY);
    const maxTx = VIEW_X - VIEW_X * k;
    const maxTy = VIEW_Y - VIEW_Y * k;
    return {
      k,
      tx: Math.min(maxTx, Math.max(minTx, next.tx)),
      ty: Math.min(maxTy, Math.max(minTy, next.ty)),
    };
  };

  const applyView = () => {
    geo.setAttribute(
      'transform',
      `translate(${view.tx.toFixed(3)} ${view.ty.toFixed(3)}) scale(${view.k.toFixed(4)})`
    );
    drawOverlay();
    svg.dispatchEvent(new CustomEvent('ryggsackaren:view'));
  };

  const setView = (partial: Partial<ViewState>) => {
    const next = clampView({ ...view, ...partial });
    view.k = next.k;
    view.tx = next.tx;
    view.ty = next.ty;
    applyView();
  };

  /** Zoomar kring en punkt i SVG-koordinater, så att punkten står stilla. */
  const zoomAround = (factor: number, px: number, py: number) => {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
    const actual = k / view.k;
    if (Math.abs(actual - 1) < 0.0001) return;
    // Punkten ska hamna på samma plats efter skalningen.
    setView({
      k,
      tx: px - (px - view.tx) * actual,
      ty: py - (py - view.ty) * actual,
    });
  };

  const zoomBy = (factor: number) =>
    zoomAround(factor, VIEW_X + VIEW_W / 2, VIEW_Y + VIEW_H / 2);

  const reset = () => setView({ k: 1, tx: 0, ty: 0 });

  /** Omvandlar en klientpunkt till SVG-koordinater. */
  const toSvg = (clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    // preserveAspectRatio xMidYMid meet: enhetlig skala, centrerad.
    const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
    const drawnW = VIEW_W * scale;
    const drawnH = VIEW_H * scale;
    const offsetX = rect.left + (rect.width - drawnW) / 2;
    const offsetY = rect.top + (rect.height - drawnH) / 2;
    return {
      x: VIEW_X + (clientX - offsetX) / scale,
      y: VIEW_Y + (clientY - offsetY) / scale,
    };
  };

  /**
   * Ritar pinnar och namn i skärmstorlek. Positionerna räknas om vid varje
   * vyändring, och etikettplaceringen görs på nytt eftersom det som var trångt
   * vid full utzoomning kan ha gott om plats när man zoomat in.
   */
  function drawOverlay(): void {
    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);

    const screenOf = (city: City) => {
      const p = project(city);
      return { x: p.x * view.k + view.tx, y: p.y * view.k + view.ty };
    };

    // Bara städer som syns i rutan behöver etiketter.
    /**
     * Bara städer som verkligen ligger inne i rutan ritas. Klippmasken döljer
     * det som hamnar utanför, men elementen skulle ändå finnas kvar och kunna
     * tas emot klick, ovanpå texten under kartan. Vi håller därför en liten
     * marginal innanför kanten så att inget klickbart hamnar utanför.
     */
    const inset = 6;
    const visibleCities = CITIES.filter((city) => {
      const s = screenOf(city);
      return (
        s.x >= VIEW_X + inset &&
        s.x <= VIEW_X + VIEW_W - inset &&
        s.y >= VIEW_Y + inset &&
        s.y <= VIEW_Y + VIEW_H - inset
      );
    });

    const taken: Box[] = [];
    for (const city of visibleCities) {
      const s = screenOf(city);
      taken.push({ x1: s.x - 7, y1: s.y - 7, x2: s.x + 7, y2: s.y + 7 });
    }

    const priority = (city: City): number => {
      if (city.id === currentCityId) return 0;
      if (city.id === highlightId) return 1;
      if (city.id === homeCityId) return 2;
      if (visited.includes(city.id)) return 3;
      return 4;
    };
    const ordered = [...visibleCities].sort(
      (a, b) => priority(a) - priority(b) || a.name.localeCompare(b.name, 'sv')
    );

    /**
     * Träffytan anpassas efter hur tätt städerna ligger. I Norden vid full
     * utzoomning skulle en fast radie på 16 låta Amsterdams osynliga träffyta
     * täcka Londons punkt, så att fel stad valdes. Radien begränsas därför
     * till halva avståndet till närmaste nabo. Zoomar man in glider städerna
     * ifrån varandra och ytorna växer tillbaka till full storlek.
     */
    const hitRadius = new Map<string, number>();
    for (const city of visibleCities) {
      const s = screenOf(city);
      let nearest = Infinity;
      for (const other of visibleCities) {
        if (other.id === city.id) continue;
        const o = screenOf(other);
        nearest = Math.min(nearest, Math.hypot(o.x - s.x, o.y - s.y));
      }
      const r = Number.isFinite(nearest)
        ? Math.max(7, Math.min(16, nearest / 2))
        : 16;
      hitRadius.set(city.id, r);
    }

    const placements = new Map<string, Placement | null>();
    for (const city of ordered) {
      const s = screenOf(city);
      let chosen: Placement | null = null;
      for (const p of PLACEMENTS) {
        const box = labelBox(s.x, s.y, city.name, p);
        if (box.x1 < VIEW_X || box.x2 > VIEW_X + VIEW_W) continue;
        if (box.y1 < VIEW_Y || box.y2 > VIEW_Y + VIEW_H) continue;
        if (taken.some((t) => overlaps(t, box))) continue;
        chosen = p;
        taken.push(box);
        break;
      }
      placements.set(city.id, chosen);
    }

    for (const city of visibleCities) {
      const { x, y } = screenOf(city);
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
      group.append(
        svgEl('circle', {
          class: 'pin-hit',
          cx: x,
          cy: y,
          r: hitRadius.get(city.id) ?? 16,
        })
      );
      if (isCurrent) {
        group.append(svgEl('circle', { class: 'pin-halo', cx: x, cy: y, r: 13 }));
      }
      group.append(svgEl('circle', { class: 'pin-dot', cx: x, cy: y, r: 6 }));

      const placement = placements.get(city.id) ?? null;
      if (placement) {
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
        // Dragning får inte råka välja en stad, därför kontrollen mot flaggan.
        group.addEventListener('click', (event) => {
          if (didPan) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          activate();
        });
        group.addEventListener('keydown', (event) => {
          const key = (event as KeyboardEvent).key;
          if (key === 'Enter' || key === ' ') {
            event.preventDefault();
            activate();
          }
        });
      }
      overlay.append(group);
    }
  }

  // ----------------------------------------------------------- interaktion

  /** Sätts när pekaren rört sig så mycket att det räknas som panorering. */
  let didPan = false;
  /** Pekar-id som svg-elementet fångat, eller null. */
  let captured: number | null = null;
  const pointers = new Map<number, { x: number; y: number }>();
  let panStart: { x: number; y: number; tx: number; ty: number } | null = null;
  let pinchStart: {
    dist: number;
    k: number;
    midX: number;
    midY: number;
    tx: number;
    ty: number;
  } | null = null;

  svg.addEventListener('pointerdown', (event) => {
    const e = event as PointerEvent;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    didPan = false;

    if (pointers.size === 1) {
      panStart = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const mid = toSvg((a!.x + b!.x) / 2, (a!.y + b!.y) / 2);
      pinchStart = {
        dist: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        k: view.k,
        midX: mid.x,
        midY: mid.y,
        tx: view.tx,
        ty: view.ty,
      };
      panStart = null;
    }
  });

  /**
   * Fångar pekaren först när panorering faktiskt börjat. Tar vi den redan vid
   * pointerdown omdirigeras alla följande händelser till svg-elementet, och då
   * når klicket aldrig fram till stadens pinne.
   */
  const capturePointer = (pointerId: number) => {
    if (captured || !svg.setPointerCapture) return;
    try {
      svg.setPointerCapture(pointerId);
      captured = pointerId;
    } catch {
      // Vissa webbläsare nekar capture, panorering fungerar ändå.
    }
  };

  svg.addEventListener('pointermove', (event) => {
    const e = event as PointerEvent;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchStart.dist > 0) {
        const factor = dist / pinchStart.dist;
        const k = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, pinchStart.k * factor)
        );
        const rel = k / pinchStart.k;
        didPan = true;
        capturePointer(e.pointerId);
        setView({
          k,
          tx: pinchStart.midX - (pinchStart.midX - pinchStart.tx) * rel,
          ty: pinchStart.midY - (pinchStart.midY - pinchStart.ty) * rel,
        });
      }
      event.preventDefault();
      return;
    }

    if (panStart) {
      const dxScreen = e.clientX - panStart.x;
      const dyScreen = e.clientY - panStart.y;
      if (
        !didPan &&
        Math.hypot(dxScreen, dyScreen) < DRAG_THRESHOLD
      ) {
        return;
      }
      // Vid zoom 1 finns inget spelrum, då är panorering meningslös.
      if (view.k <= MIN_ZOOM + 0.001) return;
      didPan = true;
      capturePointer(e.pointerId);
      const rect = svg.getBoundingClientRect();
      const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H) || 1;
      setView({
        tx: panStart.tx + dxScreen / scale,
        ty: panStart.ty + dyScreen / scale,
      });
      event.preventDefault();
    }
  });

  const endPointer = (event: Event) => {
    const e = event as PointerEvent;
    pointers.delete(e.pointerId);
    if (captured === e.pointerId) {
      try {
        svg.releasePointerCapture(e.pointerId);
      } catch {
        // Redan släppt, inget att göra.
      }
      captured = null;
    }
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) {
      panStart = null;
      // Nollställ först efter att klickhändelsen hunnit passera.
      window.setTimeout(() => {
        didPan = false;
      }, 0);
    }
  };
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);

  svg.addEventListener(
    'wheel',
    (event) => {
      const e = event as WheelEvent;
      // Utan detta skrollar sidan i stället för att kartan zoomar.
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAround(factor, p.x, p.y);
    },
    { passive: false }
  );

  // Dubbelklick zoomar in ett steg där man pekar.
  svg.addEventListener('dblclick', (event) => {
    const e = event as MouseEvent;
    e.preventDefault();
    const p = toSvg(e.clientX, e.clientY);
    zoomAround(ZOOM_STEP, p.x, p.y);
  });

  applyView();

  return {
    svg,
    setView,
    getView: () => ({ ...view }),
    zoomBy,
    reset,
  };
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

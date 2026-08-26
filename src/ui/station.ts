import type { TransportMode } from '../data/transport';
import type { City } from '../data/types';
import {
  durationText,
  hhmm,
  statusText,
  STAND_LABEL,
  type Departure,
} from '../game/departures';
import type { Route } from '../game/travel';
import type { Difficulty } from '../game/state';
import { renderBoard, type BoardHandle } from './board';
import { button, el, svgEl } from './dom';
import { startStation, stopStation } from './audio';
import { icon } from './icons';

/**
 * Stationerna som platser.
 *
 * En busstation och en flygplats hade tidigare exakt samma skärm: en lista med
 * städer. Det är den enskilt största skillnaden mellan ett spel och en meny.
 * Här får varje färdsätt en egen hall, en egen avgångstavla, en egen ljudbild
 * och ett eget ordval - "gate" på flygplatsen, "spår" på stationen, "läge" vid
 * bussterminalen och "kaj" i hamnen.
 *
 * Allt som går att boka kommer fortfarande ur game/travel.ts. Stationen hittar
 * aldrig på en förbindelse.
 */

export interface StationHandle {
  node: HTMLElement;
  stop: () => void;
}

export interface StationOpts {
  city: City;
  mode: TransportMode;
  difficulty: Difficulty;
  money: (amount: number) => string;
  /** Spelarens kassa, för att gråa ut det man inte har råd med */
  cash: number;
  onBuy: (city: City, route: Route) => void;
}

/**
 * Skylten över ingången. En stad med interkontinental trafik har en annan
 * anläggning än en småstad, och det ska stå på skylten: Köping har en station,
 * Stockholm en centralstation.
 */
const STATION_NAMN: Record<TransportMode, (c: City) => string> = {
  // "Stockholm internationella flygplats" blev tre rader på en telefon och la
  // sig över hela terminalen. Interkontinental trafik står i kickern i stället.
  flyg: (c) => `${c.name} flygplats`,
  tag: (c) => (c.hub ? `${c.name} centralstation` : `${c.name} station`),
  buss: (c) => (c.hub ? `${c.name} bussterminal` : `${c.name} busstation`),
  farja: (c) => `${c.name} färjeterminal`,
};

/** Skyltraden ovanför namnet. Flygplatser skyltar tvåspråkigt, som på riktigt. */
const STATION_KICKER: Record<TransportMode, (c: City) => string> = {
  flyg: (c) =>
    c.hub ? 'Avgående · International departures' : 'Avgående · Departures',
  tag: () => 'Fjärrtrafik · Avgångar',
  buss: () => 'Långfärdsbuss · Avgångar',
  farja: () => 'Färjetrafik · Avgångar',
};

const STATION_INFO: Record<TransportMode, string> = {
  flyg: 'Incheckning stänger 45 minuter före avgång. Håll utkik efter gateändringar.',
  tag: 'Spårändringar meddelas i högtalarna. Vagn 1 längst fram i tågets färdriktning.',
  buss: 'Bussarna avgår från numrerade lägen utanför terminalen. Bagage lastas i sidoluckan.',
  farja: 'Ombordstigning börjar en timme före avgång. Fordonsdäck stänger 20 minuter före.',
};

/**
 * Flygplatskod i tre bokstäver, härledd ur stadens namn. Ingen försöker
 * gissa den riktiga koden - poängen är att skylten ska se ut som en skylt.
 */
export function airportCode(city: City): string {
  const rent = city.name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[^A-Z]/g, '');
  if (rent.length <= 3) return rent.padEnd(3, 'X');
  const forsta = rent[0]!;
  const resten = rent.slice(1).replace(/[AEIOUY]/g, '');
  return (forsta + resten).slice(0, 3).padEnd(3, rent[rent.length - 1]!);
}

// ------------------------------------------------------------------ miljöer

/**
 * Hallens siluett, ritad i SVG ovanpå stadens foto. Fotot ligger kvar som det
 * man ser genom fönstret, så att stationen fortfarande hör till just den här
 * staden.
 */
function scen(mode: TransportMode): SVGElement {
  const svg = svgEl('svg', {
    class: 'station-scene-svg',
    viewBox: '0 0 400 170',
    preserveAspectRatio: 'xMidYMax slice',
    'aria-hidden': 'true',
  });
  const p = (d: string, cls: string) => svgEl('path', { d, class: cls });
  const rect = (x: number, y: number, w: number, h: number, cls: string) =>
    svgEl('rect', { x, y, width: w, height: h, class: cls });

  /** Resenärer i förgrunden. Samma familj av former på alla stationer. */
  const folk = (positions: Array<[number, number, boolean]>) => {
    const g = svgEl('g', { class: 'scene-folk' });
    for (const [x, h, vaska] of positions) {
      const y = 170 - h;
      g.append(
        svgEl('circle', { cx: x, cy: y + 5, r: 4.6, class: 'scene-fg' }),
        p(
          `M${x - 5.4} ${y + 11} q5.4 -3 10.8 0 l1.8 ${h - 12} h-14.4 z`,
          'scene-fg'
        )
      );
      if (vaska) {
        g.append(
          rect(x + 8, 170 - h * 0.42, 5.5, h * 0.42, 'scene-fg'),
          p(`M${x + 10.7} ${170 - h * 0.42} v-${h * 0.3}`, 'scene-fg-line')
        );
      }
    }
    return g;
  };

  if (mode === 'flyg') {
    // Glasfasad med planet utanför, hängande gateskylt och rullband.
    svg.append(
      rect(0, 0, 400, 26, 'scene-tak'),
      p('M0 26 h400 v3 h-400 z', 'scene-kant'),
      svgEl('g', { class: 'scene-glas' },
        ...[40, 100, 160, 220, 280, 340].map((x) => rect(x - 2, 26, 4, 96, 'scene-post'))
      ),
      // Flygplan i profil utanför glaset.
      svgEl('g', { class: 'scene-fordon' },
        p('M196 104 q34 -13 92 -9 l38 3 q10 1 10 5 t-10 5 l-40 3 q-58 4 -90 -7 z', 'scene-mg'),
        p('M244 96 l16 -22 h9 l-8 22 z', 'scene-mg'),
        p('M262 103 l30 -6 l26 4 l-28 6 z', 'scene-mg'),
        svgEl('circle', { cx: 322, cy: 100, r: 2.4, class: 'scene-blink' })
      ),
      rect(0, 122, 400, 48, 'scene-golv'),
      p('M0 122 h400', 'scene-fg-line'),
      folk([[54, 40, true], [92, 36, false], [300, 42, true], [346, 34, true]]),
      // Hängande gateskylt, i högra halvan så att den inte hamnar under
      // stationsnamnet på en smal skärm.
      svgEl('g', { class: 'scene-skylt' },
        rect(248, 30, 112, 22, 'scene-skyltplatta'),
        svgEl('text', { x: 304, y: 45, class: 'scene-skylttext' }, 'GATE A–F →')
      )
    );
    return svg;
  }

  if (mode === 'tag') {
    // Perrongtak på pelare, spår som viker av och en stationsklocka.
    svg.append(
      rect(0, 0, 400, 20, 'scene-tak'),
      svgEl('g', { class: 'scene-valv' },
        ...[0, 80, 160, 240, 320].map((x) =>
          p(`M${x} 20 q40 26 80 0`, 'scene-valv-bage')
        )
      ),
      ...[16, 130, 270, 384].map((x) => rect(x - 3, 20, 6, 104, 'scene-post')),
      // Tåget vid perrongen.
      /**
       * Tåget vid perrongen. Allt som ska synas ligger under y=70: skylten
       * upptar den övre tredjedelen av rutan, och ett tåg bakom rubriken är
       * inget tåg.
       */
      svgEl('g', { class: 'scene-fordon' },
        p('M0 74 h150 q14 0 16 12 v38 h-166 z', 'scene-mg'),
        ...[18, 46, 74, 102].map((x) => rect(x, 84, 18, 16, 'scene-ruta')),
        rect(126, 86, 16, 14, 'scene-ruta'),
        svgEl('circle', { cx: 158, cy: 114, r: 3.4, class: 'scene-blink' })
      ),
      rect(0, 124, 400, 46, 'scene-golv'),
      p('M0 124 h400', 'scene-fg-line'),
      // Spåret bortom perrongkanten.
      p('M172 168 L262 118 M196 168 L272 118', 'scene-ral'),
      folk([[212, 38, true], [246, 34, false], [318, 40, true]]),
      /**
       * Stationsklockan. Läget är valt för att överleva beskärningen: SVG:n
       * fyller rutan med `slice`, och på en telefon klipps kanterna medan en
       * bred skärm klipper toppen. Det som alltid syns är x 40-360, y 25-170.
       */
      svgEl('g', { class: 'scene-klocka' },
        rect(338, 26, 4, 14, 'scene-post'),
        svgEl('circle', { cx: 340, cy: 54, r: 15, class: 'scene-klockskiva' }),
        p('M340 54 v-9 M340 54 l6 4', 'scene-visare')
      )
    );
    return svg;
  }

  if (mode === 'buss') {
    // Terminaltak, numrerade lägen och två bussar med nosen mot perrongen.
    svg.append(
      rect(0, 8, 400, 12, 'scene-tak'),
      ...[30, 200, 370].map((x) => rect(x - 3, 20, 6, 100, 'scene-post')),
      svgEl('g', { class: 'scene-fordon' },
        p('M40 68 h116 q10 0 10 10 v54 h-126 z', 'scene-mg'),
        // Destinationsskylten över vindrutan, som på en riktig buss.
        rect(50, 74, 74, 9, 'scene-blind'),
        rect(50, 88, 96, 24, 'scene-ruta'),
        // Strålkastare och stötfångare, så att lådan blir en buss.
        svgEl('circle', { cx: 56, cy: 122, r: 4, class: 'scene-lykta' }),
        svgEl('circle', { cx: 150, cy: 122, r: 4, class: 'scene-lykta' }),
        rect(40, 128, 126, 4, 'scene-fg'),
        svgEl('circle', { cx: 160, cy: 112, r: 3, class: 'scene-blink' })
      ),
      svgEl('g', { class: 'scene-fordon-bak' },
        p('M246 78 h96 q8 0 8 8 v46 h-104 z', 'scene-mg'),
        rect(254, 83, 58, 7, 'scene-blind'),
        rect(254, 94, 80, 20, 'scene-ruta'),
        svgEl('circle', { cx: 260, cy: 124, r: 3, class: 'scene-lykta' }),
        svgEl('circle', { cx: 338, cy: 124, r: 3, class: 'scene-lykta' })
      ),
      rect(0, 132, 400, 38, 'scene-golv'),
      p('M0 132 h400', 'scene-fg-line'),
      // Målade markeringar på asfalten.
      p('M20 150 h60 M120 150 h60 M220 150 h60 M320 150 h60', 'scene-markering'),
      folk([[186, 32, true], [216, 28, false], [362, 34, true]]),
      svgEl('g', { class: 'scene-skylt' },
        rect(272, 30, 78, 20, 'scene-skyltplatta'),
        svgEl('text', { x: 311, y: 44, class: 'scene-skylttext' }, 'LÄGE 1–26')
      )
    );
    return svg;
  }

  // Hamnen: kaj, pollare, landgång och en skrovsida med lastport.
  svg.append(
    svgEl('g', { class: 'scene-fordon' },
      p('M212 30 h176 v78 q-88 12 -176 0 z', 'scene-mg'),
      ...[228, 254, 280, 306, 332].map((x) =>
        svgEl('circle', { cx: x, cy: 62, r: 6, class: 'scene-ruta' })
      ),
      rect(236, 82, 34, 26, 'scene-lastport'),
      rect(300, 6, 26, 26, 'scene-skorsten'),
      svgEl('circle', { cx: 216, cy: 34, r: 3, class: 'scene-blink' })
    ),
    // Landgång från kajen upp till lastporten.
    p('M150 148 L238 96 l10 6 L162 156 z', 'scene-mg'),
    rect(0, 118, 400, 52, 'scene-golv'),
    /**
     * Vattnet tar vid där kajen slutar. Utan den egna ytan låg vågorna ovanpå
     * kajen och det gick inte att se var man stod och var man skulle segla.
     */
    rect(178, 118, 222, 52, 'scene-sjo'),
    p('M0 118 h400 M178 118 v52', 'scene-fg-line'),
    svgEl('g', { class: 'scene-vatten' },
      p('M186 130 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0', 'scene-vag'),
      p('M182 146 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0', 'scene-vag scene-vag-2')
    ),
    ...[36, 96].map((x) =>
      svgEl('g', {},
        p(`M${x} 118 v-14 q0 -5 6 -5 t6 5 v14 z`, 'scene-fg'),
        p(`M${x + 6} 106 q26 16 54 2`, 'scene-fg-line')
      )
    ),
    folk([[132, 36, true], [166, 32, true]])
  );
  return svg;
}

// ------------------------------------------------------------------- skärmen

export function renderStation(opts: StationOpts): StationHandle {
  const { city, mode, difficulty, money, onBuy } = opts;
  const wrap = el('div', { class: 'stack station', 'data-mode': mode });
  let board: BoardHandle | null = null;
  let sheet: HTMLElement | null = null;

  startStation(mode);

  // ---- hallen
  const scene = el('section', { class: 'station-scene' });
  const foto = el('img', {
    class: 'station-scene-photo',
    src: `./cities/${city.id}.jpg`,
    alt: '',
    loading: 'lazy',
    decoding: 'async',
  }) as HTMLImageElement;
  foto.addEventListener('error', () => foto.remove());
  scene.append(foto, el('div', { class: 'station-scene-scrim' }), scen(mode));
  scene.append(
    el('div', { class: 'station-plate' },
      // Kicker och landsmärke på samma rad, så att skylten blir två rader
      // och inte tre. Tre rader lade sig över tåget vid perrongen.
      el('div', { class: 'station-plate-top' },
        el('span', { class: 'station-kicker' }, STATION_KICKER[mode](city)),
        el('span', { class: 'station-code' },
          icon(mode),
          mode === 'flyg' ? airportCode(city) : city.country
        )
      ),
      el('h1', { class: 'station-name' }, STATION_NAMN[mode](city))
    )
  );
  wrap.append(scene);

  // ---- biljettvyn
  /**
   * Escape stänger biljetten. Utan det fångar spelets egen Esc-hantering
   * tangenten och kastar ut spelaren till stadsbilden med biljetten öppen.
   */
  const sheetTangent = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !sheet) return;
    e.preventDefault();
    e.stopPropagation();
    stangSheet();
  };

  const stangSheet = () => {
    if (!sheet) return;
    sheet.classList.add('sheet-ut');
    const gammal = sheet;
    sheet = null;
    window.removeEventListener('keydown', sheetTangent, true);
    document.body.classList.remove('sheet-oppen');
    window.setTimeout(() => gammal.remove(), 220);
  };

  const oppnaSheet = (d: Departure) => {
    stangSheet();
    const rad = (etikett: string, varde: string | Node, tone?: string) =>
      el('div', { class: `ticket-line ${tone ?? ''}` },
        el('span', { class: 'ticket-label' }, etikett),
        el('span', { class: 'ticket-value' }, varde)
      );
    const gate = `${STAND_LABEL[mode]} ${d.stand}`;
    const har_rad = opts.cash >= d.route.price;
    const kort = el('div', { class: 'ticket-sheet', role: 'dialog', 'aria-modal': 'true' },
      el('div', { class: 'ticket-stub' },
        el('span', { class: 'ticket-kicker' }, `${city.name} → ${d.city.name}`),
        el('h2', { class: 'ticket-dest' }, d.city.name),
        el('span', { class: 'ticket-country' }, d.city.country)
      ),
      el('div', { class: 'ticket-body' },
        rad('Avgång', hhmm(d.time + d.delay)),
        rad('Restid', durationText(d.minutes)),
        rad(
          'Transport',
          `${d.operator} · ${d.code}`
        ),
        rad(gate.split(' ')[0]!, d.stand),
        d.code === '—' ? '' : rad('Status', statusText(d)),
        d.terminal ? rad('Terminal', d.terminal.replace('Terminal ', '')) : '',
        rad(
          'Resdagar',
          `${d.route.days} ${d.route.days === 1 ? 'dag' : 'dagar'}`
        ),
        rad('Pris', money(d.route.price), 'ticket-price'),
        d.status === 'installd'
          ? el('p', { class: 'ticket-note ticket-note-varning' },
              'Turen är inställd. Du bokas om till nästa avgång utan extra kostnad.')
          : d.delay > 0
            ? el('p', { class: 'ticket-note' },
                `Avgången är ${d.delay} minuter försenad. Resan tar lika lång tid ändå.`)
            : el('p', { class: 'ticket-note' }, d.route.desc)
      ),
      el('div', { class: 'ticket-actions' },
        button(
          har_rad ? 'Köp biljett' : 'Kassan räcker inte',
          () => {
            if (!har_rad) return;
            stangSheet();
            onBuy(d.city, d.route);
          },
          {
            class: `btn ${har_rad ? 'btn-primary' : 'btn-ghost'}`,
            disabled: har_rad ? undefined : true,
          }
        ),
        button('Avbryt', stangSheet, { class: 'btn btn-ghost' })
      )
    );
    const overlay = el('div', { class: 'sheet-overlay' }, kort);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) stangSheet();
    });
    sheet = overlay;
    document.body.append(overlay);
    document.body.classList.add('sheet-oppen');
    window.addEventListener('keydown', sheetTangent, true);
    kort.querySelector('button')?.focus({ preventScroll: true });
  };

  // ---- tavlan
  board = renderBoard({
    from: city,
    mode,
    difficulty,
    money,
    onPick: oppnaSheet,
  });
  wrap.append(board.node);
  wrap.append(el('p', { class: 'station-info' }, STATION_INFO[mode]));

  /**
   * Ingen stadslista under tavlan längre. Tavlan visar hela linjenätet och har
   * ett eget sökfält, så listan var samma uppgifter en gång till - och den var
   * så lång på en storflygplats att tavlan trycktes ur bild.
   *
   * Vägen tillbaka ligger i statusraden, som sitter fast i överkanten.
   */
  return {
    node: wrap,
    stop: () => {
      board?.stop();
      stangSheet();
      stopStation();
    },
  };
}

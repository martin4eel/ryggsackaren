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
import { button, el } from './dom';
import { quizImageAlt, quizImageUrl } from '../data/quizImages';
import { pseudoRandom } from '../game/rules';
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
  /**
   * Spelarens kassa, läst när den behövs och inte när stationen byggs. En
   * händelse som ändrar pengarna ska inte tvinga fram en ombyggd tavla.
   */
  cash: () => number;
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
 * Hallens foto.
 *
 * Här satt tidigare en tecknad siluett - glasfasad, perrongtak, bussnosar,
 * skrov - ritad i SVG. Den fyllde sin plats men det syntes att den var ritad,
 * och en station ska se ut som en station. Nu är det fotografier, fyra per
 * färdsätt, valda ur stadens id så att samma stad alltid får samma hall och
 * två grannstäder sällan får samma.
 */
const HALL_ANTAL = 4;

function hallBild(city: City, mode: TransportMode): string {
  const n = 1 + (Math.floor(pseudoRandom(`${city.id}|hall|${mode}`) * HALL_ANTAL) % HALL_ANTAL);
  return `station-${mode}-${n}`;
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
  const bildId = hallBild(city, mode);
  const foto = el('img', {
    class: 'station-scene-photo',
    src: quizImageUrl(bildId),
    alt: quizImageAlt(bildId),
    loading: 'eager',
    decoding: 'async',
  }) as HTMLImageElement;
  foto.addEventListener('error', () => foto.remove());
  scene.append(foto, el('div', { class: 'station-scene-scrim' }));
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
    const har_rad = opts.cash() >= d.route.price;
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

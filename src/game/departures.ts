import { CITIES } from '../data/cities';
import { FERRY_LINES } from '../data/transport';
import { operatorsFor } from '../data/operators';
import type { TransportMode } from '../data/transport';
import type { City } from '../data/types';
import { distanceKm, pseudoRandom } from './rules';
import { availableRoutes, type Route } from './travel';
import type { Difficulty } from './state';

/**
 * Avgångstavlorna.
 *
 * Det här är stationernas skyltfönster, inte en tidtabellssimulering. Tiderna
 * på tavlan styr ingenting: en spelare ska aldrig behöva vänta på att klockan
 * ska bli 15:10 för att få resa. Tavlan finns för att en tågstation ska se ut
 * som en tågstation.
 *
 * Två saker skiljer den här modulen från resten av reselogiken:
 *
 *  1. Priset, restiden och vilka städer som går att nå kommer alltid från
 *     game/travel.ts. Tavlan hittar aldrig på en förbindelse som inte går att
 *     boka, och aldrig ett pris som inte är det man betalar.
 *  2. Allt annat - avgångstid, linjenummer, gate, spår, status - är
 *     presentation. Det får ändra sig medan man tittar, och det gör det.
 */

export type Status =
  | 'itid'
  | 'incheckning'
  | 'boarding'
  | 'snart'
  | 'sistautrop'
  | 'forsenad'
  | 'installd';

export interface Departure {
  /** Stabil nyckel, så att en rad kan uppdateras i stället för att ritas om */
  id: string;
  city: City;
  mode: TransportMode;
  /** Biljetten som faktiskt bokas när raden trycks */
  route: Route;
  /**
   * Avgångstid som minuter efter midnatt på tavlans dag. Presentation, inte
   * speltid: den styr ingenting, den står bara på skylten.
   */
  time: number;
  /** 0 för i dag, 1 för i morgon. Färjor går sällan nog för att det märks. */
  dag: number;
  /** Försening i minuter. 0 när tåget går i tid. */
  delay: number;
  /** Linjebeteckning: "NF 218", "IC 421", "BUSS 401", "M/S Aurora" */
  code: string;
  /** Bolaget som kör */
  operator: string;
  /** Gate, spår, läge eller kaj */
  stand: string;
  /** Terminal, för flyg och färja */
  terminal?: string;
  /** Restid i minuter, för biljettvyn */
  minutes: number;
  status: Status;
  /** Sant tills raden ritats en gång, så att den kan glida in */
  fresh?: boolean;
}

/** Rubriken på lägeskolumnen skiljer sig mellan stationerna. */
export const STAND_LABEL: Record<TransportMode, string> = {
  flyg: 'Gate',
  tag: 'Spår',
  buss: 'Läge',
  farja: 'Kaj',
};

export const STATUS_LABEL: Record<Status, string> = {
  itid: 'I tid',
  incheckning: 'Incheckning',
  boarding: 'Boarding',
  snart: 'Avgår snart',
  sistautrop: 'Sista utrop',
  forsenad: 'Försenad',
  installd: 'Inställd',
};

/** Påstigningsordet skiljer sig mellan färdsätten. */
const BOARDING_WORD: Record<TransportMode, string> = {
  flyg: 'Boarding',
  tag: 'Påstigning',
  buss: 'Påstigning',
  farja: 'Ombordstigning',
};

export function statusText(d: Departure): string {
  if (d.status === 'boarding') return BOARDING_WORD[d.mode];
  if (d.status === 'forsenad' && d.delay > 0) return `Försenad ${d.delay} min`;
  return STATUS_LABEL[d.status];
}

/** "I morgon" och liknande, för avgångar som inte går i dag. */
export function dayLabel(dag: number): string | undefined {
  if (dag <= 0) return undefined;
  if (dag === 1) return 'I morgon';
  return `Om ${dag} dygn`;
}

/** Klockslag som HH:MM. Minuter över ett dygn rullar runt. */
export function hhmm(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Restid skriven som människor säger den. */
export function durationText(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h < 24) return m === 0 ? `${h} tim` : `${h} tim ${m} min`;
  const d = Math.floor(h / 24);
  const rest = h % 24;
  return rest === 0 ? `${d} dygn` : `${d} dygn ${rest} tim`;
}

/**
 * Ungefärlig restid dörr till dörr, i minuter.
 *
 * Talet är till för biljettvyn - "restid 3 tim 5 min" säger mer än "1 resdag".
 * Tågets hastighet kommer ur landets järnvägsstandard, så att sträckan
 * Cusco-Puno tar den tid den faktiskt tar medan Paris-Barcelona går undan.
 * Det är samma sträcka i spelets ögon; det är fordonet som skiljer.
 */
export function travelMinutes(from: City, to: City, mode: TransportMode): number {
  const km = distanceKm(from, to);
  if (mode === 'flyg') {
    // Marktid på flygplatserna: incheckning, säkerhet, taxning och bagage.
    const mark = 150;
    const langt = km > 4000 && !(from.hub && to.hub) ? 150 : 0;
    return Math.round(mark + langt + (km / 800) * 60 + 25);
  }
  if (mode === 'farja') {
    // Färjor gör 17-19 knop, plus ombordstigning och landgång.
    return Math.round(70 + (km / 33) * 60);
  }
  if (mode === 'buss') {
    // Landsvägsfart med pauser. Långa sträckor har fler stopp per mil.
    const fart = km > 900 ? 55 : 63;
    return Math.round(25 + (km / fart) * 60);
  }
  const a = operatorsFor(from.country).rail?.speed ?? 80;
  const b = operatorsFor(to.country).rail?.speed ?? 80;
  // Tåget går inte fortare än den sämsta rälsen på sträckan.
  const fart = Math.min(a, b);
  return Math.round(20 + (km / fart) * 60);
}

/** Fartyget som trafikerar sträckan, om det är en färjelinje. */
function ferryLine(from: City, to: City) {
  return FERRY_LINES.find(
    (l) =>
      (l.a === from.id && l.b === to.id) || (l.b === from.id && l.a === to.id)
  );
}

/** Heltal ur en deterministisk hash, i intervallet [min, max]. */
function pick(seed: string, min: number, max: number): number {
  return min + Math.floor(pseudoRandom(seed) * (max - min + 1));
}

/**
 * Linjebeteckningen. Flyget får bolagets kod och ett flightnummer, tåget en
 * prefix efter hur snabb banan är, bussen ett linjenummer och färjan sitt
 * fartygsnamn.
 */
function lineCode(from: City, to: City, mode: TransportMode, slot: number): string {
  const seed = `${from.id}|${to.id}|${mode}|${slot}`;
  if (mode === 'flyg') {
    const code = operatorsFor(from.country).air.code;
    return `${code} ${pick(seed, 100, 989)}`;
  }
  if (mode === 'farja') {
    const line = ferryLine(from, to);
    return line ? `M/S ${line.fartyg}` : 'M/S Nordkap';
  }
  if (mode === 'buss') {
    return `Buss ${pick(seed, 100, 899)}`;
  }
  const fart = Math.min(
    operatorsFor(from.country).rail?.speed ?? 80,
    operatorsFor(to.country).rail?.speed ?? 80
  );
  const prefix = fart >= 170 ? 'HS' : fart >= 105 ? 'IC' : 'RE';
  return `${prefix} ${pick(seed, 100, 989)}`;
}

function operatorName(from: City, to: City, mode: TransportMode): string {
  const ops = operatorsFor(from.country);
  if (mode === 'flyg') return ops.air.name;
  if (mode === 'buss') return ops.bus;
  if (mode === 'tag') return ops.rail?.name ?? 'Regionalbanan';
  return ferryLine(from, to)?.rederi ?? 'Rederiet';
}

const GATE_BOKSTAV = 'ABCDEF';

function standFor(mode: TransportMode, seed: string): string {
  if (mode === 'flyg')
    return `${GATE_BOKSTAV[pick(seed + 'g', 0, 5)]}${pick(seed + 'n', 1, 42)}`;
  if (mode === 'tag') return String(pick(seed, 1, 18));
  if (mode === 'buss') return String(pick(seed, 1, 26));
  return String(pick(seed, 1, 9));
}

function terminalFor(mode: TransportMode, seed: string): string | undefined {
  if (mode === 'flyg') return `Terminal ${pick(seed + 't', 1, 4)}`;
  if (mode === 'farja') return `Terminal ${'ABC'[pick(seed + 't', 0, 2)]}`;
  return undefined;
}

/**
 * Hur många avgångar en tavla visar. En storflygplats har fler rader än en
 * färjeterminal, och det är just skillnaden som gör stationerna olika.
 */
const BOARD_SIZE: Record<TransportMode, number> = {
  flyg: 11,
  tag: 10,
  buss: 9,
  farja: 5,
};

/** Hur tätt avgångarna ligger i minuter. Färjan är gles, tunnelbanan tät. */
const SPACING: Record<TransportMode, number> = {
  flyg: 14,
  tag: 17,
  buss: 21,
  farja: 55,
};

export interface BoardOptions {
  from: City;
  mode: TransportMode;
  difficulty: Difficulty;
  /** Klockslag tavlan utgår från, minuter efter midnatt */
  now: number;
}

/**
 * Alla destinationer stationen trafikerar, i den ordning tavlan brukar visa
 * dem: nära och billigt oftast, men alltid med några långa linjer i listan så
 * att en flygplats känns som en flygplats.
 */
export function stationDestinations(
  from: City,
  mode: TransportMode,
  difficulty: Difficulty
): Array<{ city: City; route: Route }> {
  const out: Array<{ city: City; route: Route }> = [];
  for (const to of CITIES) {
    if (to.id === from.id) continue;
    const route = availableRoutes(from, to, difficulty).find((r) => r.mode === mode);
    if (route) out.push({ city: to, route });
  }
  return out.sort((a, b) => a.route.price - b.route.price);
}

/**
 * Väljer ut de destinationer som står på tavlan just nu.
 *
 * Urvalet viktas mot de närmaste - dit går det flest turer - men var tredje
 * plats reserveras för en längre linje, så att tavlan i Stockholm också kan
 * skylta med Bangkok. `rotation` gör att urvalet förskjuts över tid, vilket är
 * det som får tavlan att byta innehåll medan man står och tittar.
 */
function selectDestinations(
  all: Array<{ city: City; route: Route }>,
  count: number,
  rotation: number
): Array<{ city: City; route: Route }> {
  if (all.length <= count) return all.slice();
  const nara = all.slice(0, Math.ceil(all.length / 2));
  const langt = all.slice(Math.ceil(all.length / 2));
  const valda: Array<{ city: City; route: Route }> = [];
  const sedda = new Set<string>();
  for (let i = 0; i < count; i++) {
    const pool = i % 3 === 2 && langt.length > 0 ? langt : nara;
    // Rotationen förskjuter startpunkten, så att listan vandrar med tiden.
    for (let försök = 0; försök < pool.length; försök++) {
      const idx = (rotation + i * 7 + försök * 3) % pool.length;
      const kandidat = pool[idx]!;
      if (sedda.has(kandidat.city.id)) continue;
      sedda.add(kandidat.city.id);
      valda.push(kandidat);
      break;
    }
  }
  return valda;
}

/** Statusen som följer av hur långt det är kvar till avgång. */
export function statusForMinutes(kvar: number, mode: TransportMode): Status {
  if (kvar <= 2) return 'sistautrop';
  if (kvar <= 8) return 'snart';
  if (kvar <= 22) return 'boarding';
  if (mode === 'flyg' && kvar <= 50) return 'incheckning';
  return 'itid';
}

/**
 * Bygger en hel tavla, plus en reserv att fylla på med när avgångar rullar
 * bort. Anropas när stationen öppnas; därefter lever tavlan vidare av sig
 * själv i ui/board.ts.
 */
export interface Board {
  rows: Departure[];
  /** Kommande avgångar i tur och ordning, för påfyllning underifrån. */
  reserve: Departure[];
}

export function buildBoard(opts: BoardOptions): Board {
  const { from, mode, difficulty, now } = opts;
  const alla = stationDestinations(from, mode, difficulty);
  if (alla.length === 0) return { rows: [], reserve: [] };

  /**
   * Färjor går på utsatta tider, ett par gånger om dygnet. Att lotta fram
   * avgångar var tjugonde minut skulle göra hamnen till en tunnelbana. Här
   * läggs i stället linjernas riktiga turlista ut, tre dygn framåt, och tavlan
   * visar de närmaste - också när de närmaste är i morgon bitti.
   */
  if (mode === 'farja') {
    const turlista: Departure[] = [];
    for (const dest of alla) {
      const line = ferryLine(from, dest.city);
      const tider = line?.avgangar ?? [8 * 60, 20 * 60];
      for (let dag = 0; dag < 4; dag++) {
        tider.forEach((t, i) => {
          const abs = t + dag * 1440;
          if (abs < now - 20) return;
          turlista.push(makeDeparture(from, dest, mode, abs, i, now));
        });
      }
    }
    turlista.sort((a, b) => a.time - b.time);
    /**
     * Tavlan skyltar bara med i dag och i morgon. En riktig färjeterminal
     * skriver inte upp turen om tre dygn; den ligger i reserven och glider in
     * underifrån först när dagens sista tur lagt ut.
     */
    const nara = turlista.filter((d) => d.dag < 2).slice(0, BOARD_SIZE.farja);
    return {
      rows: nara,
      reserve: turlista.filter((d) => !nara.includes(d)),
    };
  }

  const rotation = Math.floor(now / 37);
  const antal = Math.min(BOARD_SIZE[mode], alla.length);
  const valda = selectDestinations(alla, antal, rotation);

  const rows: Departure[] = [];
  let tid = now + 4;
  valda.forEach((v, i) => {
    tid += pick(`${from.id}|${v.city.id}|${mode}|${i}|s`, 3, SPACING[mode]);
    rows.push(makeDeparture(from, v, mode, tid, i, now));
  });
  rows.sort((a, b) => a.time - b.time);
  return { rows, reserve: [] };
}

/**
 * En enskild rad. Bryts ut så att tavlan kan fylla på med nya avgångar när
 * gamla rullar bort, utan att bygga om allt.
 */
export function makeDeparture(
  from: City,
  dest: { city: City; route: Route },
  mode: TransportMode,
  time: number,
  slot: number,
  now: number
): Departure {
  const seed = `${from.id}|${dest.city.id}|${mode}|${slot}|${Math.floor(time / 60)}`;
  return {
    // Tiden ingår i nyckeln, annars delar två turer till samma stad rad.
    id: `${dest.city.id}|${mode}|${Math.round(time)}`,
    city: dest.city,
    mode,
    route: dest.route,
    time,
    dag: Math.floor(time / 1440),
    delay: 0,
    code: lineCode(from, dest.city, mode, slot),
    operator: operatorName(from, dest.city, mode),
    stand: standFor(mode, seed),
    terminal: terminalFor(mode, seed),
    minutes: travelMinutes(from, dest.city, mode),
    status: statusForMinutes(time - now, mode),
  };
}

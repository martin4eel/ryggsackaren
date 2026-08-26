import {
  FERRY_LINKS,
  LAND_ADJACENCY,
  MODE_COST,
  MODE_KM_PER_DAY,
  MODE_LABELS,
  MODE_RANGE,
  type TransportMode,
} from '../data/transport';
import type { City } from '../data/types';
import { distanceKm } from './rules';
import type { Difficulty } from './state';

/**
 * All reselogik på ett ställe. Gränssnittet frågar efter rutter och får
 * färdiga alternativ tillbaka; det ska aldrig behöva veta något om
 * landregioner, färjelinjer eller avståndstak.
 *
 * Ordningen är: stadsdata -> avstånd -> transportregler -> tillgängliga
 * rutter -> pris. Vill man ändra balansen räcker det att röra den här filen
 * och data/transport.ts.
 */

export interface Route {
  mode: TransportMode;
  /** Färdsättets namn, t.ex. "Tåg" */
  label: string;
  /** Pris i basenheter */
  price: number;
  /** Restid i dagar */
  days: number;
  /** Kort beskrivning som visas på biljetten */
  desc: string;
}

/** Ett färdsätt som inte går att ta, med skälet formulerat för spelaren. */
export interface BlockedRoute {
  mode: TransportMode;
  label: string;
  reason: string;
}

const ferryKey = (a: string, b: string) => [a, b].sort().join('|');

const FERRY_BY_KEY = new Map(
  FERRY_LINKS.map(([a, b, desc]) => [ferryKey(a, b), desc])
);

/** Finns det en färjelinje mellan städerna? */
export function ferryDesc(from: City, to: City): string | undefined {
  return FERRY_BY_KEY.get(ferryKey(from.id, to.id));
}

/**
 * Krävs mellanlandning? Bara på riktigt långa sträckor, och bara när någon av
 * ändpunkterna saknar interkontinental flygplats.
 */
export function needsConnection(from: City, to: City, km: number): boolean {
  return km > 4000 && !(from.hub && to.hub);
}

/** Går det att ta sig mellan städerna på marken, utan att korsa ett hav? */
export function landConnected(from: City, to: City): boolean {
  if (from.landRegion === to.landRegion) return true;
  return (LAND_ADJACENCY[from.landRegion] ?? []).includes(to.landRegion);
}

/**
 * Priset skalar med avståndet men inte rakt av: sträckan över 200 mil räknas
 * med tjugo procents rabatt. Utan den dämpningen blir interkontinentala flyg
 * så dyra att de aldrig blir ett alternativ, och med helt linjär prissättning
 * blir de i stället oproportionerligt billiga per mil jämfört med tåget.
 */
function effectiveKm(km: number): number {
  return km <= 2000 ? km : 2000 + (km - 2000) * 0.8;
}

/**
 * Turisten reser tio procent billigare. Skillnaden är medvetet liten: det är
 * samma karta och samma nätverk i båda lägena, det är marginalerna som
 * skiljer.
 */
function priceFactor(difficulty: Difficulty): number {
  return difficulty === 'turist' ? 0.9 : 1;
}

function priceFor(mode: TransportMode, km: number, difficulty: Difficulty): number {
  const { base, perKm } = MODE_COST[mode];
  return Math.round((base + effectiveKm(km) * perKm) * priceFactor(difficulty));
}

function daysFor(mode: TransportMode, km: number): number {
  return Math.max(1, Math.round(km / MODE_KM_PER_DAY[mode]));
}

/** Beskrivningen på biljetten, olika för varje färdsätt och sträcka. */
function describe(mode: TransportMode, from: City, to: City, km: number): string {
  if (mode === 'farja') {
    return ferryDesc(from, to) ?? 'Överfarten tar en natt.';
  }
  if (mode === 'buss') {
    return km > 700
      ? 'Nattbuss med byten på vägen. Billigast som finns, och du ser landet.'
      : 'Lokalbussen tar tid men kostar nästan ingenting.';
  }
  if (mode === 'tag') {
    return km > 1400
      ? 'Flera tåg och minst ett nattåg. Långsamt, men du vaknar framme.'
      : 'Bekvämt och lagom snabbt, med utsikt hela vägen.';
  }
  return km > 4000
    ? 'Långdistansflyg med mellanlandning. Dyrt, men det finns ingen annan väg.'
    : 'Direktflyg. Snabbast möjliga sträcka, och du betalar för det.';
}

/**
 * Alla färdsätt som faktiskt går att ta mellan två städer, billigast först.
 *
 * Flyget läggs alltid till när sträckan är lång nog, så att listan aldrig kan
 * bli tom. Två städer som ligger närmare än flygets undre gräns hänger alltid
 * ihop på marken eller med färja, vilket valideringen kontrollerar.
 */
export function availableRoutes(
  from: City,
  to: City,
  difficulty: Difficulty
): Route[] {
  if (from.id === to.id) return [];
  const km = distanceKm(from, to);
  const routes: Route[] = [];

  const add = (mode: TransportMode) => {
    routes.push({
      mode,
      label: MODE_LABELS[mode],
      price: priceFor(mode, km, difficulty),
      days: daysFor(mode, km),
      desc: describe(mode, from, to, km),
    });
  };

  const onLand = landConnected(from, to);
  if (onLand && km <= MODE_RANGE.buss.max) add('buss');
  if (onLand && from.rail && to.rail && km <= MODE_RANGE.tag.max) add('tag');
  if (ferryDesc(from, to) && km <= MODE_RANGE.farja.max) add('farja');
  // Flyg kräver en flygplats i båda ändar. Köping har ingen, så därifrån
  // får man ta sig till en granne på marken först.
  if (km >= MODE_RANGE.flyg.min && from.airport && to.airport) add('flyg');

  /**
   * Långa flyg från en stad utan interkontinental flygplats går via en hub.
   * Resan säljs fortfarande som en biljett, men kostar en dag och femton
   * procent extra. Det är så en resa från Katmandu faktiskt går till, och det
   * ger de stora flygplatserna ett värde utan att någon behöver planera byten.
   */
  if (needsConnection(from, to, km)) {
    const flight = routes.find((r) => r.mode === 'flyg');
    if (flight) {
      flight.days += 1;
      flight.price = Math.round(flight.price * 1.15);
      const via = from.hub ? to.name : from.name;
      flight.desc = `Ingen interkontinental trafik från ${via}, så resan går via en större flygplats. En dag extra.`;
    }
  }

  return routes.sort((a, b) => a.price - b.price);
}

/**
 * Färdsätten som inte går, med skälet skrivet så att spelaren lär sig något
 * av det. Ett "det gick inte" utan förklaring är den sortens svar som får en
 * att tro att spelet är trasigt.
 */
export function blockedRoutes(from: City, to: City): BlockedRoute[] {
  if (from.id === to.id) return [];
  const km = distanceKm(from, to);
  const onLand = landConnected(from, to);
  const out: BlockedRoute[] = [];

  const block = (mode: TransportMode, reason: string) =>
    out.push({ mode, label: MODE_LABELS[mode], reason });

  if (!onLand) {
    block('buss', 'Det finns ingen landförbindelse hela vägen dit.');
  } else if (km > MODE_RANGE.buss.max) {
    block('buss', `För långt för buss. Gränsen går vid ${MODE_RANGE.buss.max.toLocaleString('sv-SE')} km.`);
  }

  if (!onLand) {
    block('tag', 'Det går ingen räls hela vägen dit.');
  } else if (!from.rail) {
    block('tag', `${from.name} saknar fjärrtågtrafik.`);
  } else if (!to.rail) {
    block('tag', `${to.name} saknar fjärrtågtrafik.`);
  } else if (km > MODE_RANGE.tag.max) {
    block('tag', `För långt för tåg. Gränsen går vid ${MODE_RANGE.tag.max.toLocaleString('sv-SE')} km.`);
  }

  if (!ferryDesc(from, to)) {
    block('farja', 'Ingen färjelinje trafikerar den här sträckan.');
  }

  if (!from.airport) {
    block('flyg', `${from.name} har ingen flygplats. Ta dig vidare på marken först.`);
  } else if (!to.airport) {
    block('flyg', `${to.name} har ingen flygplats.`);
  } else if (km < MODE_RANGE.flyg.min) {
    block('flyg', 'För kort sträcka för att flyga. Ta dig fram på marken.');
  }

  return out;
}

/**
 * Destinationer som går att nå från en stad med ett visst färdsätt.
 *
 * Används av stadens skyltar: en busstation visas bara om bussen faktiskt tar
 * en någonstans. På Island finns varken buss eller tåg som når en annan stad i
 * spelet, så där står bara flygplatsen.
 */
export function destinationsByMode(
  from: City,
  mode: TransportMode,
  difficulty: Difficulty,
  cities: readonly City[]
): Array<{ city: City; route: Route }> {
  const ut: Array<{ city: City; route: Route }> = [];
  for (const to of cities) {
    if (to.id === from.id) continue;
    const rutt = availableRoutes(from, to, difficulty).find((r) => r.mode === mode);
    if (rutt) ut.push({ city: to, route: rutt });
  }
  return ut.sort((a, b) => a.route.price - b.route.price);
}

/**
 * Billigaste sättet att ta sig till en stad, för listan över destinationer.
 * Returnerar aldrig undefined för två olika städer.
 */
export function cheapestRoute(
  from: City,
  to: City,
  difficulty: Difficulty
): Route | undefined {
  return availableRoutes(from, to, difficulty)[0];
}

/**
 * Snabbaste sättet, för att kunna visa "från X kr" och "så fort som Y dagar"
 * sida vid sida i destinationslistan.
 */
export function fastestRoute(
  from: City,
  to: City,
  difficulty: Difficulty
): Route | undefined {
  const routes = availableRoutes(from, to, difficulty);
  if (routes.length === 0) return undefined;
  return routes.reduce((best, r) => (r.days < best.days ? r : best));
}

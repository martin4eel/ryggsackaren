import { CITY_ALTITUDE, CITY_CLIMATE, type Climate } from '../data/climate';
import type { City } from '../data/types';
import { pseudoRandom } from './rules';

/**
 * Väder och tid på dygnet.
 *
 * Ingenting av det här påverkar spelet - boendet kostar detsamma i regn. Det
 * finns för att samma stad ska se olika ut varje gång man kommer dit: Bangkok
 * i monsunregn en kväll, Bangkok i sol en morgon. En stad som alltid ser
 * likadan ut är en bild; en stad som har väder är en plats.
 *
 * Datumet är resans startdag plus antalet resdagar, så årstiden följer när
 * man faktiskt spelar: börjar man i december är det vinter i Stockholm och
 * sommar i Sydney. Klockslaget är stadens lokala tid just nu, ur den riktiga
 * klockan och stadens tidszon - spelar man på kvällen hemma är det morgon i
 * Tokyo, precis som det är.
 */

export type WeatherKind = 'sol' | 'moln' | 'regn' | 'sno' | 'dis';
export type DayPeriod = 'natt' | 'morgon' | 'dag' | 'kvall';

export interface Weather {
  kind: WeatherKind;
  /** Grader Celsius, avrundat */
  temp: number;
  period: DayPeriod;
  /** Lokal tid som HH:MM */
  clock: string;
  /** "Regn · 24° · kväll 19:40" */
  text: string;
  /** Tecken för vädret, för skylten */
  glyph: string;
}

/** Årsmedel och halva årssvängningen per klimattyp, i grader. */
const KLIMAT: Record<Climate, { mean: number; amp: number }> = {
  nordiskt: { mean: 7, amp: 11 },
  tempererat: { mean: 11, amp: 8 },
  medelhav: { mean: 17, amp: 8 },
  oken: { mean: 24, amp: 9 },
  tropiskt: { mean: 27, amp: 2 },
  monsun: { mean: 28, amp: 3 },
  hogland: { mean: 22, amp: 3 },
  subtropiskt: { mean: 16, amp: 10 },
};

const GLYPH: Record<WeatherKind, string> = {
  sol: '☀',
  moln: '☁',
  regn: '☂',
  sno: '❄',
  dis: '≋',
};

const LABEL: Record<WeatherKind, string> = {
  sol: 'Sol',
  moln: 'Molnigt',
  regn: 'Regn',
  sno: 'Snö',
  dis: 'Disigt',
};

const PERIOD_LABEL: Record<DayPeriod, string> = {
  natt: 'natt',
  morgon: 'morgon',
  dag: 'dag',
  kvall: 'kväll',
};

/** Dag på året, 0-365, för resans startdatum plus resdagarna. */
function dayOfYear(startDate: string, days: number): number {
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return 170;
  d.setDate(d.getDate() + days);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/** Lokal tid i staden just nu, som timmar med decimaler. */
export function localHour(city: City, now = new Date()): number {
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
  return ((utcH + city.utc) % 24 + 24) % 24;
}

export function dayPeriod(hour: number): DayPeriod {
  if (hour < 5 || hour >= 22) return 'natt';
  if (hour < 9) return 'morgon';
  if (hour < 17) return 'dag';
  return 'kvall';
}

/** Slår fram ett väder ur en lista med vikter. */
function pick(r: number, alternativ: Array<[WeatherKind, number]>): WeatherKind {
  const total = alternativ.reduce((s, [, w]) => s + w, 0);
  let roll = r * total;
  for (const [kind, w] of alternativ) {
    roll -= w;
    if (roll <= 0) return kind;
  }
  return alternativ[alternativ.length - 1]![0];
}

export function weatherFor(
  city: City,
  startDate: string,
  days: number,
  now = new Date()
): Weather {
  const climate = CITY_CLIMATE[city.id] ?? 'tempererat';
  const k = KLIMAT[climate];
  const doy = dayOfYear(startDate, days);
  /**
   * Årstiden som en kurva med topp den 20 juli och botten den 20 januari,
   * vänd upp och ner söder om ekvatorn.
   */
  let season = -Math.cos((2 * Math.PI * (doy - 20)) / 365);
  if (city.lat < 0) season = -season;

  // Samma stad, samma dag - samma väder. Det ska inte byta när man går in i
  // butiken och ut igen.
  const seed = `${city.id}|${days}`;
  const brus = (pseudoRandom(seed + '|t') - 0.5) * 5;
  const hojd = CITY_ALTITUDE[city.id] ?? 0;
  const temp = Math.round(k.mean + k.amp * season - hojd * 0.003 + brus);

  const sommar = season > 0.3;
  const vinter = season < -0.3;
  const regntid = climate === 'monsun' && doy >= 152 && doy <= 273;
  const r = pseudoRandom(seed + '|v');
  let kind: WeatherKind;
  switch (climate) {
    case 'monsun':
      kind = regntid
        ? pick(r, [['regn', 65], ['moln', 25], ['sol', 10]])
        : pick(r, [['sol', 60], ['moln', 30], ['regn', 10]]);
      break;
    case 'tropiskt':
      kind = pick(r, [['sol', 50], ['moln', 25], ['regn', 25]]);
      break;
    case 'oken':
      kind = pick(r, [['sol', 85], ['dis', 10], ['moln', 5]]);
      break;
    case 'medelhav':
      kind = sommar
        ? pick(r, [['sol', 80], ['moln', 15], ['regn', 5]])
        : pick(r, [['sol', 45], ['moln', 35], ['regn', 20]]);
      break;
    case 'nordiskt':
      kind =
        temp <= 1
          ? pick(r, [['sno', 40], ['moln', 40], ['sol', 20]])
          : pick(r, [['sol', 40], ['moln', 40], ['regn', 20]]);
      break;
    case 'hogland':
      kind = pick(r, [['sol', 55], ['moln', 30], ['regn', 15]]);
      break;
    case 'subtropiskt':
      kind = vinter
        ? pick(r, [['sol', 55], ['moln', 30], ['regn', 10], ['sno', 5]])
        : pick(r, [['sol', 50], ['moln', 30], ['regn', 20]]);
      break;
    default:
      kind = pick(r, [['sol', 35], ['moln', 40], ['regn', 25]]);
  }
  if (kind === 'sno' && temp > 2) kind = 'regn';

  const hour = localHour(city, now);
  const period = dayPeriod(hour);
  const hh = String(Math.floor(hour)).padStart(2, '0');
  const mm = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
  const clock = `${hh}:${mm}`;
  // På natten är "sol" inte rätt ord.
  const label = kind === 'sol' && period === 'natt' ? 'Klart' : LABEL[kind];
  return {
    kind,
    temp,
    period,
    clock,
    glyph: GLYPH[kind],
    text: `${label} · ${temp}° · ${PERIOD_LABEL[period]} ${clock}`,
  };
}

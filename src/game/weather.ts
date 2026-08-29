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
 *
 * Vädret har tio ansikten, inte fem. Skillnaden mellan duggregn och skyfall,
 * mellan dis över öknen och dimma över Themsen, mellan snö och snöstorm är
 * skillnaden mellan väder och en ikon.
 */

export type WeatherKind =
  | 'sol'
  | 'hetta'
  | 'moln'
  | 'regn'
  | 'skyfall'
  | 'aska'
  | 'sno'
  | 'snostorm'
  | 'dis'
  | 'dimma'
  | 'storm';
export type DayPeriod = 'natt' | 'morgon' | 'dag' | 'skymning' | 'kvall';

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
  /** Vind, 0 stiltje till 3 storm. Styr hur snett regnet faller. */
  wind: 0 | 1 | 2 | 3;
  /** En rad om hur vädret känns just här, till stadsskärmen. */
  line: string;
  /** Är det regn i någon form (för blöta gator och ljud). */
  wet: boolean;
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
  hetta: '☀',
  moln: '☁',
  regn: '☂',
  skyfall: '☔',
  aska: '⚡',
  sno: '❄',
  snostorm: '❄',
  dis: '∿',
  dimma: '≡',
  storm: '≋',
};

const LABEL: Record<WeatherKind, string> = {
  sol: 'Sol',
  hetta: 'Hetta',
  moln: 'Molnigt',
  regn: 'Regn',
  skyfall: 'Skyfall',
  aska: 'Åska',
  sno: 'Snö',
  snostorm: 'Snöstorm',
  dis: 'Dis',
  dimma: 'Dimma',
  storm: 'Storm',
};

const PERIOD_LABEL: Record<DayPeriod, string> = {
  natt: 'natt',
  morgon: 'morgon',
  dag: 'dag',
  skymning: 'skymning',
  kvall: 'kväll',
};

/**
 * Raderna under bilden. {stad} och {sevardhet} byts ut. De ska låta som en
 * reseskildring och inte som en väderrapport - vädret är det man gör i det.
 */
const NATT_LINES: string[] = [
  'Klar natt över {stad}. Gatorna har lugnat sig och stjärnorna syns trots ljuset.',
  'Stilla och klart. {sevardhet} är upplyst och nästan tomt på folk. Nästan.',
  'Natten är sval och torr. Någonstans spelar en radio, och en hund svarar.',
  'Klart och tyst. Nattkiosken är den enda som har öppet, och den har allt.',
];

const LINES: Record<WeatherKind, string[]> = {
  sol: [
    'Solen står högt över {stad}. Skuggorna är korta och kaféstolarna vända mot gatan.',
    'Klarblått över {sevardhet}. Någon säljer solglasögon som inte behövs, eftersom alla redan har.',
    'En sådan dag då {stad} ser ut som på vykorten. Det gör den inte alltid.',
    'Torrt, ljust och lite för varmt i skuggan. Vattenflaskan är dagens viktigaste utrustning.',
  ],
  hetta: [
    'Hettan dallrar över asfalten. {stad} rör sig långsamt och håller sig på skuggsidan.',
    'Trettio grader innan frukost. Vid {sevardhet} står turisterna under de få träd som finns.',
    'Luften står stilla och taxibilarna går på tomgång med rutorna uppe. Ingen skyndar sig.',
    'Så varmt att asfalten ger efter. Marknaden stänger mitt på dagen och öppnar igen vid sju.',
  ],
  moln: [
    'Lågt molntäcke över {stad}. Ljuset är platt och fotona blir ärligare än vanligt.',
    'Grått, men torrt. {sevardhet} ser äldre ut i det här ljuset, på ett bra sätt.',
    'Molnen driver in från väster och ingen tittar upp. Det är en vanlig dag.',
    'Mulet och ljummet. Duvorna har tagit över torget och delar inte med sig.',
  ],
  regn: [
    'Det regnar över {stad}. Paraplyförsäljarna dök upp ur ingenstans, som alltid.',
    'Ett stilla regn som inte tänker sluta. Trottoarerna speglar neonskyltarna.',
    'Regn på {sevardhet}. Kön är kortare än vanligt, och det är inte det sämsta.',
    'Duggregn och rullväskor. Alla har bråttom och ingen kommer fram torr.',
  ],
  skyfall: [
    'Skyfall. Gatorna i {stad} står under vatten och mopederna kör ändå.',
    'Himlen öppnade sig utan förvarning. Under ett portvalv står sex främlingar och en cykel och väntar.',
    'Regnet slår mot plåttaken så att man inte hör sig själv tänka. Det går över om en timme, säger alla.',
    'Ett regn som gör rännstenen till en flod. {sevardhet} skymtar bakom vattnet.',
  ],
  aska: [
    'Åskan mullrar över {stad}. Blixtarna kommer tätare, och luften luktar het sten.',
    'Ett oväder rullar in över {sevardhet}. Fotograferna stannar kvar; alla andra går in.',
    'Blixt, tordön, och så regnet. Kaféerna fyller på med folk som inte hade tänkt fika.',
    'Åskväder. Strömmen blinkade till på hotellet och alla tittade upp samtidigt.',
  ],
  sno: [
    'Det snöar över {stad}. Ljuden försvinner, och staden går på tå.',
    'Stora, långsamma flingor över {sevardhet}. Inte kallt nog för att snön ska ligga länge.',
    'Snö i luften och salt på trottoarerna. Alla har rätt skor utom du.',
    'Ett tunt lager nysnö på bänkarna. Ingen har satt sig än.',
  ],
  snostorm: [
    'Snöstorm. Man ser inte till andra sidan gatan, och bussarna går ändå, ungefär.',
    'Vinden driver snön vågrätt genom {stad}. Femtio meter känns som en expedition.',
    'Yrsnö och halvmeterhöga drivor vid {sevardhet}. Stadens plogbilar är hjältar i dag.',
    'Snön piskar in från sidan. Hotellreceptionen erbjuder te, och du tackar ja.',
  ],
  dis: [
    'Ett gulaktigt dis ligger över {stad}. Solen är en vit skiva, och sanden knastrar mellan tänderna.',
    'Diset gör {sevardhet} till en silhuett. Kamerorna hittar inget att fokusera på.',
    'Sanddis från öknen. Butikerna sopar trottoarerna för tredje gången i dag.',
    'Torrt, dammigt och konturlöst. Staden ser ut som ett gammalt fotografi av sig själv.',
  ],
  dimma: [
    'Dimma över {stad}. {sevardhet} är borta, men ljudet av staden finns kvar.',
    'Tjock morgondimma. Gatlyktorna lyser fortfarande, och taxibilarna kör med helljus.',
    'Ett grått täcke ligger över floden och tar halva staden med sig.',
    'Dimman lättar inte. Rundturen med båt är inställd, och guiden ser lättad ut.',
  ],
  storm: [
    'Storm över {stad}. Paraplyer i papperskorgarna, vändade ut och in.',
    'Kuling från havet. Skyltarna smäller och {sevardhet} har stängt utsiktsplatsen.',
    'Vinden tar tag i allt som inte är fastskruvat. Kaféerna har plockat in stolarna.',
    'Blåst som får skyltarna att vagga. Alla går lutade framåt, som i en film.',
  ],
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
  if (hour < 8.5) return 'morgon';
  if (hour < 17) return 'dag';
  if (hour < 19) return 'skymning';
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

const WET = new Set<WeatherKind>(['regn', 'skyfall', 'aska']);

/**
 * Förhandsvisning: sätt `localStorage['ryggsackaren-vader']` till t.ex.
 * "aska|natt|3" (väder|dygnsdel|vind) för att tvinga fram ett väder. Finns
 * för att kunna titta på alla tio utan att vänta på dem.
 */
function override(): { kind: WeatherKind; period?: DayPeriod; wind?: 0 | 1 | 2 | 3 } | null {
  try {
    const v = localStorage.getItem('ryggsackaren-vader');
    if (!v) return null;
    const [kind, period, wind] = v.split('|');
    if (!kind || !(kind in LABEL)) return null;
    return {
      kind: kind as WeatherKind,
      period: period && period in PERIOD_LABEL ? (period as DayPeriod) : undefined,
      wind: wind ? (Math.max(0, Math.min(3, Number(wind))) as 0 | 1 | 2 | 3) : undefined,
    };
  } catch {
    return null;
  }
}

export function weatherFor(
  city: City,
  startDate: string,
  days: number,
  now = new Date()
): Weather {
  const tvang = override();
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
  let temp = Math.round(k.mean + k.amp * season - hojd * 0.003 + brus);

  const sommar = season > 0.3;
  const vinter = season < -0.3;
  const host = !sommar && !vinter && doy > 182;
  const regntid = climate === 'monsun' && doy >= 152 && doy <= 273;
  const r = pseudoRandom(seed + '|v');
  let kind: WeatherKind;
  switch (climate) {
    case 'monsun':
      kind = regntid
        ? pick(r, [['regn', 30], ['skyfall', 25], ['aska', 15], ['moln', 22], ['sol', 8]])
        : pick(r, [['sol', 50], ['hetta', 18], ['moln', 22], ['regn', 10]]);
      break;
    case 'tropiskt':
      kind = pick(r, [['sol', 38], ['hetta', 8], ['moln', 20], ['regn', 14], ['skyfall', 10], ['aska', 10]]);
      break;
    case 'oken':
      kind = sommar
        ? pick(r, [['sol', 50], ['hetta', 35], ['dis', 12], ['moln', 3]])
        : pick(r, [['sol', 68], ['hetta', 6], ['dis', 14], ['storm', 5], ['moln', 7]]);
      break;
    case 'medelhav':
      kind = sommar
        ? pick(r, [['sol', 62], ['hetta', 18], ['moln', 12], ['regn', 4], ['aska', 4]])
        : pick(r, [['sol', 40], ['moln', 30], ['regn', 18], ['storm', 8], ['dimma', 4]]);
      break;
    case 'nordiskt':
      kind =
        temp <= 1
          ? pick(r, [['sno', 30], ['snostorm', 9], ['moln', 33], ['sol', 20], ['dimma', 8]])
          : host
            ? pick(r, [['sol', 25], ['moln', 35], ['regn', 25], ['storm', 10], ['dimma', 5]])
            : pick(r, [['sol', 40], ['moln', 33], ['regn', 18], ['aska', 4], ['storm', 5]]);
      break;
    case 'hogland':
      kind = pick(r, [['sol', 42], ['moln', 25], ['regn', 15], ['dimma', 10], ['aska', 8]]);
      break;
    case 'subtropiskt':
      kind = vinter
        ? pick(r, [['sol', 52], ['moln', 28], ['regn', 12], ['sno', 5], ['dimma', 3]])
        : sommar
          ? pick(r, [['sol', 36], ['hetta', 18], ['moln', 18], ['regn', 12], ['skyfall', 6], ['aska', 10]])
          : pick(r, [['sol', 45], ['moln', 30], ['regn', 18], ['storm', 7]]);
      break;
    default:
      // tempererat: London, Dublin, Amsterdam, Paris, Berlin - dimman hör hit.
      kind = pick(r, [['sol', 22], ['moln', 32], ['regn', 24], ['dimma', 12], ['storm', 6], ['aska', 4]]);
  }
  if ((kind === 'sno' || kind === 'snostorm') && temp > 2) kind = 'regn';
  if (tvang) kind = tvang.kind;
  if (kind === 'hetta' && temp < 26) temp = 26 + Math.round(pseudoRandom(seed + '|h') * 8);

  // Vinden: storm och snöstorm blåser alltid, resten lottas.
  const w = pseudoRandom(seed + '|w');
  let wind: 0 | 1 | 2 | 3;
  if (kind === 'storm' || kind === 'snostorm') wind = 3;
  else if (kind === 'skyfall' || kind === 'aska') wind = w < 0.5 ? 2 : 1;
  else if (kind === 'dimma' || kind === 'hetta') wind = 0;
  else wind = w < 0.45 ? 0 : w < 0.85 ? 1 : 2;
  if (tvang?.wind !== undefined) wind = tvang.wind;

  const hour = localHour(city, now);
  const period = tvang?.period ?? dayPeriod(hour);
  const hh = String(Math.floor(hour)).padStart(2, '0');
  const mm = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
  const clock = `${hh}:${mm}`;
  // På natten är "sol" inte rätt ord.
  const label =
    kind === 'sol' && period === 'natt'
      ? 'Klart'
      : kind === 'hetta' && period === 'natt'
        ? 'Tropiknatt'
        : LABEL[kind];
  const rader =
    period === 'natt' && (kind === 'sol' || kind === 'hetta' || kind === 'dis') ? NATT_LINES : LINES[kind];
  const rad = rader[Math.floor(pseudoRandom(seed + '|l') * rader.length)]!;
  const line = rad.replace(/\{stad\}/g, city.name).replace(/\{sevardhet\}/g, city.landmark);
  return {
    kind,
    temp,
    period,
    clock,
    glyph: GLYPH[kind],
    wind,
    line,
    wet: WET.has(kind),
    text: `${label} · ${temp}° · ${PERIOD_LABEL[period]} ${clock}`,
  };
}

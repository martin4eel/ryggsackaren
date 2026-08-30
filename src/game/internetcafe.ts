import { CITY_BY_ID } from '../data/cities';
import { JOB_BY_ID } from '../data/jobs';
import { STAMPS } from './rules';
import type { GameState } from './state';

/**
 * Internetcaféet: det enda i spelet som lämnar den egna webbläsaren.
 *
 * Två spelare som reser var för sig ska kunna se var den andra befinner sig.
 * Lösningen är avsiktligt liten: den som vill dela trycker på en knapp och får
 * ett sexsiffrigt nummer, ungefär som en Kahoot-pin. Numret läses upp eller
 * skickas till en kompis, som slår in det i sitt eget café och därefter ser
 * samma sex rader varje gång hen tittar in.
 *
 * Vad som delas är hela listan: namn, stad och land, antal besökta städer,
 * antal stämplar, den senaste stämpeln och det senast avklarade yrket.
 * Ingenting mer - inte
 * pengarna, inte ryggsäcken, inte facit på frågorna. Den som får numret ska
 * kunna heja, inte spionera.
 *
 * Ingenting skickas i väg förrän spelaren själv tryckt på "Dela min
 * resedagbok". Innan dess vet servern inte att spelaren finns, och trycker man
 * på "Sluta dela" raderas dagboken där.
 */

/** Det som syns för den som slår in numret. */
export interface Resedagbok {
  namn: string;
  stad: string;
  land: string;
  /**
   * Antal olika städer som besökts, hemstaden inräknad. Saknas på dagböcker
   * som skrevs innan raden fanns - de ligger kvar på servern i sextio dagar.
   */
  stader?: number;
  stamplar: number;
  /** Vilken resdag resenären är inne på */
  dag: number;
  senasteStampel?: { namn: string; tecken: string; dag: number };
  senasteYrke?: { titel: string; stad: string; dag: number };
}

/** En hämtad dagbok, med tidpunkten servern senast fick en uppdatering. */
export interface HamtadDagbok {
  id: string;
  dagbok: Resedagbok;
  /** När resenären senast synkade, i millisekunder */
  uppdaterad: number;
}

/** Den egna delningen, som den ligger i webbläsaren. */
interface EgenDelning {
  id: string;
  /** Hemligheten som ger rätt att skriva. Lämnar aldrig den här enheten. */
  nyckel: string;
  /** Senaste lyckade synk, i millisekunder */
  synkad: number;
  /** Dagboken vi senast skickade, för att slippa skicka oförändrat */
  senast?: string;
}

interface Sparat {
  egen?: EgenDelning;
  /**
   * Om den egna rutan ligger hopfälld. Den som redan delar kommer hit för att
   * se hur det går för de andra, inte för att läsa sitt eget nummer igen.
   */
  minimerad?: boolean;
  /** Kompisarnas nummer, i den ordning de lades till */
  foljer: string[];
  /** Senast hämtade dagbok per nummer, så att caféet har något att visa direkt */
  cache: Record<string, HamtadDagbok & { hamtad: number }>;
}

const LAGRINGSNYCKEL = 'ryggsackaren.internetcafe.v1';

/**
 * Adressen till caféet. Går att peka om vid bygget med VITE_INTERNETCAFE, så
 * att en workers.dev-adress kan provköras innan domänen är på plats.
 */
export const CAFE_URL: string = (
  (import.meta.env['VITE_INTERNETCAFE'] as string | undefined) ??
  'https://cafe.upptackaren.se'
).replace(/\/+$/, '');

/**
 * Kortaste tid mellan två synkningar. Kompisen behöver inte se varje steg i
 * realtid - det räcker gott att dagboken är några minuter gammal, och spelet
 * ska inte ligga och prata med nätet medan man svarar på frågor.
 */
const SYNK_PAUS_MS = 3 * 60 * 1000;

/** Hur gammal en hämtad kompisdagbok får vara innan caféet hämtar om den. */
export const FARSK_MS = 60 * 1000;

/** Hur många kompisar som får plats i caféet. */
export const MAX_FOLJER = 8;

/** Tidsgräns för alla anrop. Ett café som inte svarar ska inte hänga spelet. */
const TIMEOUT_MS = 8000;

function las(): Sparat {
  try {
    const raw = localStorage.getItem(LAGRINGSNYCKEL);
    if (!raw) return { foljer: [], cache: {} };
    const parsed = JSON.parse(raw) as Partial<Sparat>;
    return {
      egen: parsed.egen,
      minimerad: parsed.minimerad,
      foljer: Array.isArray(parsed.foljer) ? parsed.foljer.filter(giltigtId) : [],
      cache: parsed.cache && typeof parsed.cache === 'object' ? parsed.cache : {},
    };
  } catch {
    return { foljer: [], cache: {} };
  }
}

function spara(s: Sparat): void {
  try {
    localStorage.setItem(LAGRINGSNYCKEL, JSON.stringify(s));
  } catch {
    // Privat läge eller fullt utrymme. Caféet fungerar den här sessionen ändå.
  }
}

export function giltigtId(id: unknown): id is string {
  return typeof id === 'string' && /^\d{6}$/.test(id);
}

/** Numret som det skrivs för ögat: 123 456. */
export function formateraId(id: string): string {
  return `${id.slice(0, 3)} ${id.slice(3)}`;
}

/** Plockar ut siffrorna ur något en spelare skrivit eller klistrat in. */
export function tolkaId(text: string): string | null {
  const siffror = text.replace(/\D/g, '');
  return giltigtId(siffror) ? siffror : null;
}

/** Det egna numret, om spelaren delar sin resa. */
export function egetId(): string | null {
  return las().egen?.id ?? null;
}

export function egenSynk(): number {
  return las().egen?.synkad ?? 0;
}

/**
 * Om den egna rutan ska ligga hopfälld. Förvalt ja: har man väl ett nummer är
 * det kompisarnas resor man kommer hit för att titta på. Rutan fälls ut igen
 * med ett tryck, och valet ligger kvar.
 */
export function arMinimerad(): boolean {
  return las().minimerad ?? true;
}

export function sattMinimerad(v: boolean): void {
  const s = las();
  s.minimerad = v;
  spara(s);
}

/** Kompisarnas nummer, i den ordning de lades till. */
export function foljda(): string[] {
  return las().foljer;
}

/** Senast hämtade dagbok för ett nummer, om vi har någon. */
export function cachad(id: string): (HamtadDagbok & { hamtad: number }) | null {
  return las().cache[id] ?? null;
}

/**
 * Bygger dagboken ur speltillståndet. Allt som ska ut på nätet passerar den
 * här funktionen, så att det går att se på ett ställe exakt vad som delas.
 */
export function byggDagbok(state: GameState): Resedagbok {
  const stad = CITY_BY_ID[state.currentCityId];
  const dagbok: Resedagbok = {
    namn: state.playerName || 'Resenären',
    stad: stad?.name ?? 'Okänd stad',
    land: stad?.country ?? '',
    // Samma räkning som statusraden: olika städer, inte antal resor.
    stader: new Set(state.visited).size,
    stamplar: state.stamps.length,
    dag: state.days,
  };

  // Stämplarna läggs till i den ordning de delas ut, så den sista i listan är
  // också den senaste.
  const sistaId = state.stamps[state.stamps.length - 1];
  const stampel = sistaId ? STAMPS.find((x) => x.id === sistaId) : undefined;
  if (stampel) {
    dagbok.senasteStampel = {
      namn: stampel.name,
      tecken: stampel.glyph,
      dag: state.stampDays[stampel.id] ?? state.days,
    };
  }

  if (state.senasteYrke) {
    const jobb = JOB_BY_ID[state.senasteYrke.jobId];
    const dar = CITY_BY_ID[state.senasteYrke.cityId];
    if (jobb) {
      dagbok.senasteYrke = {
        titel: jobb.title,
        stad: dar?.name ?? '',
        // Bakåtifyllda skift saknar dag; då får dagens siffra duga.
        dag: state.senasteYrke.dag ?? state.days,
      };
    }
  }

  return dagbok;
}

async function anrop(
  vag: string,
  init: RequestInit & { nyckel?: string } = {}
): Promise<unknown> {
  const { nyckel, ...rest } = init;
  const styr = new AbortController();
  const timer = window.setTimeout(() => styr.abort(), TIMEOUT_MS);
  try {
    const svar = await fetch(`${CAFE_URL}${vag}`, {
      ...rest,
      signal: styr.signal,
      headers: {
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(nyckel ? { 'x-nyckel': nyckel } : {}),
      },
    });
    const kropp = (await svar.json().catch(() => null)) as { fel?: string } | null;
    if (!svar.ok) {
      throw new CafeFel(kropp?.fel ?? `caféet svarade ${svar.status}`, svar.status);
    }
    return kropp;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Ett fel från caféet, med statuskoden kvar så att UI:t kan välja ordalydelse. */
export class CafeFel extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'CafeFel';
  }
}

/**
 * Börjar dela resan. Skapar dagboken på servern och sparar nummer och nyckel
 * här. Returnerar numret att visa upp.
 */
export async function startaDelning(state: GameState): Promise<string> {
  const dagbok = byggDagbok(state);
  const svar = (await anrop('/dagbok', {
    method: 'POST',
    body: JSON.stringify(dagbok),
  })) as { id?: string; nyckel?: string };

  if (!giltigtId(svar.id) || typeof svar.nyckel !== 'string') {
    throw new CafeFel('caféet svarade något oväntat');
  }
  const s = las();
  s.egen = {
    id: svar.id,
    nyckel: svar.nyckel,
    synkad: Date.now(),
    senast: JSON.stringify(dagbok),
  };
  spara(s);
  return svar.id;
}

/**
 * Slutar dela och raderar dagboken på servern. Numret här glöms även om
 * servern inte svarar - annars sitter spelaren fast i en delning hen bett att
 * få avsluta.
 */
export async function slutaDela(): Promise<void> {
  const s = las();
  const egen = s.egen;
  delete s.egen;
  spara(s);
  if (!egen) return;
  await anrop(`/dagbok/${egen.id}`, { method: 'DELETE', nyckel: egen.nyckel });
}

/**
 * Skickar upp dagboken om något ändrats och det gått tillräckligt länge sedan
 * sist. Anropas efter varje sparad förändring i spelet och gör oftast
 * ingenting alls.
 *
 * Fel sväljs med flit: en resa ska aldrig avbrytas för att caféet ligger nere.
 */
export async function kanskeSynka(
  state: GameState,
  opts: { tvinga?: boolean } = {}
): Promise<void> {
  const s = las();
  const egen = s.egen;
  if (!egen) return;
  const dagbok = JSON.stringify(byggDagbok(state));
  if (dagbok === egen.senast && !opts.tvinga) return;
  if (!opts.tvinga && Date.now() - egen.synkad < SYNK_PAUS_MS) return;

  try {
    await anrop(`/dagbok/${egen.id}`, {
      method: 'PUT',
      nyckel: egen.nyckel,
      body: dagbok,
    });
    // Läses om: spelet kan ha sparat något annat i caféet under tiden.
    const nu = las();
    if (nu.egen?.id === egen.id) {
      nu.egen.synkad = Date.now();
      nu.egen.senast = dagbok;
      spara(nu);
    }
  } catch (err) {
    // En dagbok som städats bort på servern (sextio dagars tystnad) ska inte
    // spöka kvar som ett nummer spelaren tror fungerar.
    if (err instanceof CafeFel && err.status === 404) {
      const nu = las();
      if (nu.egen?.id === egen.id) {
        delete nu.egen;
        spara(nu);
      }
    }
  }
}

/** Hämtar en dagbok och lägger den i cachen. */
export async function hamta(id: string): Promise<HamtadDagbok> {
  const svar = (await anrop(`/dagbok/${id}`)) as Partial<HamtadDagbok>;
  if (!svar.dagbok || typeof svar.dagbok !== 'object') {
    throw new CafeFel('caféet svarade något oväntat');
  }
  const hamtad: HamtadDagbok = {
    id,
    dagbok: svar.dagbok,
    uppdaterad: typeof svar.uppdaterad === 'number' ? svar.uppdaterad : Date.now(),
  };
  const s = las();
  s.cache[id] = { ...hamtad, hamtad: Date.now() };
  spara(s);
  return hamtad;
}

/**
 * Lägger till en kompis att följa. Numret hämtas först, så att ett felskrivet
 * nummer aldrig hamnar i listan.
 */
export async function folj(id: string): Promise<HamtadDagbok> {
  const hamtad = await hamta(id);
  const s = las();
  if (!s.foljer.includes(id)) {
    if (s.foljer.length >= MAX_FOLJER) s.foljer.shift();
    s.foljer.push(id);
    spara(s);
  }
  return hamtad;
}

export function slutaFolja(id: string): void {
  const s = las();
  s.foljer = s.foljer.filter((x) => x !== id);
  delete s.cache[id];
  spara(s);
}

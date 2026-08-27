import type { TransportMode } from '../data/transport';
import type { Huvudkategori, Category } from '../data/types';

export type Difficulty = 'turist' | 'globetrotter';

export type Screen =
  | 'start'
  | 'stad'
  /** En station: busstation, tågstation, hamn eller flygplats */
  | 'station'
  /** Atlasen: var i världen du står, och fakta om staden och landet */
  | 'varldskarta'
  /** Turistbyråns broschyr: fakta om staden, innan provet */
  | 'broschyr'
  | 'turistbyra'
  | 'tidning'
  | 'jobb'
  | 'souvenir'
  | 'ryggsack'
  | 'telefon'
  | 'slut';

/**
 * Skärmar som funnits men tagits bort. En sparfil som ligger på en av dem
 * lyfts till stadsbilden i stället för att kasta spelaren ut i en tom vy.
 */
const KANDA_SKARMAR = new Set<Screen>([
  'start',
  'stad',
  'station',
  'varldskarta',
  'broschyr',
  'turistbyra',
  'tidning',
  'jobb',
  'souvenir',
  'ryggsack',
  'telefon',
  'slut',
]);

export interface BackpackItem {
  souvenirId: string;
  /** Vad du betalade i basenheter */
  paid: number;
  /** Var du köpte den */
  boughtIn: string;
}

export interface CityProgress {
  /** Bästa resultat på turistbyrån, 0-100 */
  rating: number;
  /** Antal gånger du frågat ut turistbyrån */
  visits: number;
  /** Jobb-id:n du redan arbetat klart sedan senaste annonsbytet */
  workedJobs: string[];
  /** Dagen då tidningens annonser senast förnyades */
  adsRefreshedDay?: number;
  /**
   * Skyltar du vänt upp på stadsbilden. En stad du aldrig varit i ligger med
   * baksidan upp - du vet inte vad som finns här förrän du sett efter.
   */
  revealed?: string[];
  /** Mystikskyltar som redan gett det de hade att ge. */
  spent?: string[];
  /** Resdagen då du först kom hit, för raden om återbesök. */
  firstDay?: number;
}

export interface GameState {
  version: 2;
  screen: Screen;
  difficulty: Difficulty;
  /** Resenärens namn, angivet vid start och tryckt i passet */
  playerName: string;
  /** Startstaden, som också är slutmålet */
  homeCityId: string;
  /** Valutan alla belopp visas i */
  homeCurrency: string;
  currentCityId: string;
  /** Pengar i basenheter (SEK) */
  money: number;
  /** Skuld till mamma och pappa i basenheter */
  debt: number;
  /** Antal resdagar som förflutit */
  days: number;
  /** Summa tidszoner du korsat */
  timezonesCrossed: number;
  /** Total flugen sträcka i km */
  distance: number;
  /** Antal resor per färdsätt */
  tripsByMode: Partial<Record<TransportMode, number>>;
  /** Tillryggalagd sträcka per färdsätt, i kilometer */
  kmByMode: Partial<Record<TransportMode, number>>;
  /** Besökta städer i ordning */
  visited: string[];
  /** Framsteg per stad */
  progress: Record<string, CityProgress>;
  backpack: BackpackItem[];
  /** Certifikat per kategori, ett per godkänt skift */
  certificates: Partial<Record<Category, number>>;
  /** Poäng per huvudkategori: ett per genomfört skift. Öppnar löneklass 2 och 3. */
  points: Partial<Record<Huvudkategori, number>>;
  /** Antal rätta och felaktiga svar totalt */
  correct: number;
  wrong: number;
  /** Antal gånger du ringt hem */
  callsHome: number;
  /** Serie av felsvar, används för barnvänlig utjämning */
  wrongStreak: number;
  /** Statistik: totalt intjänat och spenderat */
  earned: number;
  spent: number;
  /** Längsta obrutna svit av rätta svar under hela resan */
  bestStreak: number;
  /** Antal avslutade arbetsskift */
  shiftsWorked: number;
  /** Skift utan ett enda felsvar */
  perfectShifts: number;
  /** Felfria arkadmoment */
  perfectMinigames: number;
  /** Högsta kassa du haft samtidigt */
  peakMoney: number;
  /** Största vinsten på en enskild souvenir */
  bestTrade: number;
  /** Stämplar i passet, id:n ur data/stamps.ts */
  stamps: string[];
  /** Vilken resdag varje stämpel togs, för datumet som trycks i stämpeln */
  stampDays: Record<string, number>;
  /** Har snabbguiden i startstaden visats? */
  seenIntro: boolean;
  /**
   * Rätt och fel per stad, räknat på både turistbyråns prov och jobbfrågorna
   * som besvarats där. Används för att visa vilka städer du hade koll på och
   * vilka som avslöjade dig.
   */
  cityStats: Record<string, { correct: number; wrong: number }>;
  /**
   * Anseende. Byggs upp av hederliga val i händelserna och rivs av oärliga.
   * Öppnar och stänger vissa händelser, och räknas in i slutpoängen - så att
   * det finns ett skäl att lämna in plånboken som inte är pengar.
   */
  rykte: number;
  /**
   * Händelser som redan slagit till. Varje händelse inträffar högst en gång
   * per resa, så listan är också spärren mot att något upprepas.
   */
  eventsSeen: string[];
  /** Resdagen då senaste händelsen slog till, för andrummet mellan dem. */
  lastEventDay?: number;
  /**
   * Hur många souvenirer och stämplar som fanns när ryggsäcken senast
   * öppnades. Skillnaden mot dagens tal är notisen på ryggsäcksknappen, och
   * den ska nollas av att man tittar - inte ligga kvar som ett fast antal.
   */
  packSeen: { souvenirs: number; stamps: number };
  /**
   * Datumet resan började, som ISO-datum. Årstiden i vädret följer det, så
   * att en resa som börjar i december har vinter i Norden och sommar i
   * Sydney.
   */
  startDate: string;
  /**
   * Händelsen som väntar på svar eller på att kvitteras. Den ligger i
   * tillståndet i stället för i gränssnittet, så att ett val man ställts inför
   * inte försvinner för att fliken laddades om.
   *
   * `chosen` är index i händelsens `choices`, `outcome` index i det valets
   * `outcomes`. Båda saknas tills spelaren svarat.
   */
  pendingEvent?: {
    eventId: string;
    chosen?: number;
    outcome?: number;
  };
  /** Sista resultatet, sätts när spelet är över */
  outcome?: 'vinst' | 'pank';
  finalScore?: number;
}

const STORAGE_KEY = 'ryggsackaren.save.v1';

export function createGame(
  homeCityId: string,
  homeCurrency: string,
  difficulty: Difficulty,
  playerName: string
): GameState {
  return {
    version: 2,
    screen: 'stad',
    difficulty,
    playerName,
    homeCityId,
    homeCurrency,
    currentCityId: homeCityId,
    // Hemstaden är den enda stad man vet när man kom till.
    progress: {
      [homeCityId]: { rating: 0, visits: 0, workedJobs: [], revealed: [], spent: [], firstDay: 0 },
    },
    money: difficulty === 'turist' ? 6000 : 4000,
    debt: 0,
    days: 0,
    timezonesCrossed: 0,
    distance: 0,
    tripsByMode: {},
    kmByMode: {},
    visited: [homeCityId],
    backpack: [],
    certificates: {},
    points: {},
    correct: 0,
    wrong: 0,
    callsHome: 0,
    wrongStreak: 0,
    earned: 0,
    spent: 0,
    bestStreak: 0,
    shiftsWorked: 0,
    perfectShifts: 0,
    perfectMinigames: 0,
    peakMoney: difficulty === 'turist' ? 6000 : 4000,
    bestTrade: 0,
    stamps: [],
    stampDays: {},
    seenIntro: false,
    cityStats: {},
    rykte: 0,
    eventsSeen: [],
    packSeen: { souvenirs: 0, stamps: 0 },
    startDate: new Date().toISOString().slice(0, 10),
  };
}

/** Hämtar (eller skapar) frågestatistiken för en stad. */
export function getCityStats(
  state: GameState,
  cityId: string
): { correct: number; wrong: number } {
  let stats = state.cityStats[cityId];
  if (!stats) {
    stats = { correct: 0, wrong: 0 };
    state.cityStats[cityId] = stats;
  }
  return stats;
}

export function getProgress(state: GameState, cityId: string): CityProgress {
  let p = state.progress[cityId];
  // Äldre sparfiler saknar fälten; de fylls i vid första uppslaget.
  if (p) {
    p.revealed ??= [];
    p.spent ??= [];
  }
  if (!p) {
    p = { rating: 0, visits: 0, workedJobs: [], revealed: [], spent: [] };
    state.progress[cityId] = p;
  }
  return p;
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Privat läge eller fullt lagringsutrymme - spelet fungerar ändå.
  }
}

/**
 * Läser sparfilen och lyfter äldre versioner till dagens form. En resa som
 * påbörjades innan passet och resehändelserna fanns ska kunna spelas klart,
 * så de nya fälten fylls i med nollvärden i stället för att sparfilen kastas.
 */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<Partial<GameState>, 'version'> & {
      version?: number;
    };
    if (parsed?.version !== 1 && parsed?.version !== 2) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

function migrate(
  save: Omit<Partial<GameState>, 'version'> & { version?: number }
): GameState {
  const state = save as GameState;
  state.version = 2;
  state.bestStreak ??= 0;
  state.shiftsWorked ??= 0;
  state.perfectShifts ??= 0;
  state.perfectMinigames ??= 0;
  state.peakMoney ??= Math.max(0, state.money ?? 0);
  state.bestTrade ??= 0;
  state.stamps ??= [];
  state.stampDays ??= {};
  // En pågående resa har redan passerat introduktionen.
  state.seenIntro ??= true;
  /**
   * Resebyrån och biljettvalet ('karta' och 'resa') finns inte längre - de
   * ersattes av stationerna och atlasen. En sparfil som stannade där landar
   * på stadsbilden, där alla skyltar finns.
   */
  if (!KANDA_SKARMAR.has(state.screen)) state.screen = 'stad';
  state.cityStats ??= {};
  state.points ??= {};
  state.rykte ??= 0;
  state.eventsSeen ??= [];
  state.startDate ??= new Date().toISOString().slice(0, 10);
  // En pågående resa har redan sett det som ligger i ryggsäcken.
  state.packSeen ??= {
    souvenirs: state.backpack?.length ?? 0,
    stamps: state.stamps?.length ?? 0,
  };
  /**
   * Det gamla resehändelsesystemet sparade hela händelsen i `lastEvent`. Den
   * formen finns inte längre, och en halvkvitterad gammal händelse är inte
   * värd att lyfta över - den slängs, och nästa resa ger en ny.
   */
  delete (state as { lastEvent?: unknown }).lastEvent;
  state.tripsByMode ??= {};
  state.kmByMode ??= {};
  // Resor som påbörjades innan namnet fanns får en neutral benämning.
  state.playerName ||= 'Resenären';
  return state;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignoreras
  }
}

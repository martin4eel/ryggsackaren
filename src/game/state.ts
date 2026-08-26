import type { TravelEvent } from '../data/events';
import type { Category } from '../data/types';

export type Difficulty = 'turist' | 'globetrotter';

export type Screen =
  | 'start'
  | 'valjstad'
  | 'karta'
  | 'stad'
  | 'turistbyra'
  | 'tidning'
  | 'jobb'
  | 'souvenir'
  | 'ryggsack'
  | 'telefon'
  | 'resa'
  | 'slut';

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
}

export interface GameState {
  version: 2;
  screen: Screen;
  difficulty: Difficulty;
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
  /** Besökta städer i ordning */
  visited: string[];
  /** Framsteg per stad */
  progress: Record<string, CityProgress>;
  backpack: BackpackItem[];
  /** Certifikat per kategori, ett per godkänt skift */
  certificates: Partial<Record<Category, number>>;
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
  /** Har snabbguiden i startstaden visats? */
  seenIntro: boolean;
  /**
   * Händelsen från senaste resan. Den ligger kvar tills spelaren kvitterat
   * den på stadsskärmen, så att den överlever en omladdning mitt i.
   */
  lastEvent?: TravelEvent;
  /** Sista resultatet, sätts när spelet är över */
  outcome?: 'vinst' | 'pank';
  finalScore?: number;
}

const STORAGE_KEY = 'ryggsackaren.save.v1';

export function createGame(
  homeCityId: string,
  homeCurrency: string,
  difficulty: Difficulty
): GameState {
  return {
    version: 2,
    screen: 'stad',
    difficulty,
    homeCityId,
    homeCurrency,
    currentCityId: homeCityId,
    money: difficulty === 'turist' ? 6000 : 4000,
    debt: 0,
    days: 0,
    timezonesCrossed: 0,
    distance: 0,
    visited: [homeCityId],
    progress: {},
    backpack: [],
    certificates: {},
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
    seenIntro: false,
  };
}

export function getProgress(state: GameState, cityId: string): CityProgress {
  let p = state.progress[cityId];
  if (!p) {
    p = { rating: 0, visits: 0, workedJobs: [] };
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
  // En pågående resa har redan passerat introduktionen.
  state.seenIntro ??= true;
  return state;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignoreras
  }
}

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
  version: 1;
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
    version: 1,
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

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed?.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignoreras
  }
}

import type { Difficulty, GameState } from './state';

/**
 * Resedagboken: de senaste avslutade resorna, sparade vid sidan av den
 * pågående sparfilen.
 *
 * Poängen ligger kvar även när man börjar om, så att man kan jämföra resor
 * med varandra. Allt bor i webbläsaren - ingen server, ingen inloggning,
 * ingen synk mellan enheter. Två bröder som spelar på var sin telefon har var
 * sin lista, och får jämföra genom att visa varandra skärmen.
 */

export interface Highscore {
  /** Tidpunkt i millisekunder, används för sortering och datumvisning */
  at: number;
  score: number;
  /** Titeln som poängen gav */
  title: string;
  difficulty: Difficulty;
  outcome: 'vinst' | 'pank';
  days: number;
  cities: number;
  stamps: number;
  /** Träffsäkerhet i procent */
  accuracy: number;
  homeCityName: string;
  /** Vem som gjorde resan */
  playerName: string;
  /** Staden med bäst respektive sämst facit, om underlaget räcker */
  bestCity?: { name: string; correct: number; total: number };
  worstCity?: { name: string; correct: number; total: number };
}

const STORAGE_KEY = 'ryggsackaren.resedagbok.v1';
const MAX_ENTRIES = 10;

/**
 * Minsta antal besvarade frågor innan en stad får räknas som bäst eller sämst.
 * Utan gränsen vinner alltid någon stad där man råkade svara rätt på en enda
 * fråga, vilket inte säger något om vad man kan.
 */
export const MIN_ANSWERS_FOR_RANKING = 4;

export function loadHighscores(): Highscore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Highscore[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((h) => typeof h?.score === 'number');
  } catch {
    return [];
  }
}

/** Lägger till en resa och behåller de tio bästa, högst poäng först. */
export function saveHighscore(entry: Highscore): Highscore[] {
  const all = [...loadHighscores(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Privat läge eller fullt utrymme - resan räknas ändå, den sparas bara inte.
  }
  return all;
}

export function clearHighscores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignoreras
  }
}

/**
 * Städerna du hade bäst respektive sämst koll på. Bara städer med tillräckligt
 * underlag räknas, och det krävs minst två sådana för att en jämförelse ska
 * betyda något.
 */
export function cityKnowledge(
  state: GameState,
  cityName: (id: string) => string | undefined
): { best?: Highscore['bestCity']; worst?: Highscore['worstCity'] } {
  const ranked = Object.entries(state.cityStats)
    .map(([id, s]) => ({
      name: cityName(id) ?? id,
      correct: s.correct,
      total: s.correct + s.wrong,
    }))
    .filter((c) => c.total >= MIN_ANSWERS_FOR_RANKING)
    .sort((a, b) => {
      const share = b.correct / b.total - a.correct / a.total;
      // Vid lika andel vinner den med störst underlag.
      return share !== 0 ? share : b.total - a.total;
    });

  if (ranked.length < 2) return {};
  return { best: ranked[0], worst: ranked[ranked.length - 1] };
}

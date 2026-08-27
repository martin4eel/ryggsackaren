import { CITY_BY_ID } from '../data/cities';
import { buildStamps, type Stamp } from '../data/stamps';
import { optionCount } from './difficulty';
import { JOB_BY_ID } from '../data/jobs';
import { SOUVENIR_BY_ID } from '../data/souvenirs';
import type { City, Job, Question, Souvenir } from '../data/types';
import { JOB_QUESTIONS } from '../data/questions/jobQuestions';
import { CITY_QUESTIONS } from '../data/questions/cityQuestions';
import type { Difficulty, GameState } from './state';
import { getProgress } from './state';

const EARTH_RADIUS_KM = 6371;

/** Storcirkelavstånd mellan två städer i kilometer. */
export function distanceKm(a: City, b: City): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)));
}

// Resealternativen bor numera i game/travel.ts, som väger in landregioner,
// järnväg, färjelinjer och avstånd i stället för att erbjuda samma tre
// biljetter mellan alla städer.

/** Kostnad per natt för vandrarhem och mat i en stad. */
export function dailyCost(city: City, difficulty: Difficulty): number {
  const base = 250 * city.costIndex;
  return Math.round(difficulty === 'turist' ? base * 0.8 : base);
}

// Skillnaderna mellan lägena bor i game/difficulty.ts och re-exporteras här,
// så att allt spelregelrelaterat fortsatt går att importera från ett ställe.
export {
  DIFFICULTY_INFO,
  arcadeSlack,
  certificateThreshold,
  optionCount,
} from './difficulty';

/**
 * Certifikat räknade mot ett visst jobb. Ett certifikat i samma ämne är
 * värt två: den som jobbat som kock två gånger får söka kökschefsjobbet
 * före den som samlat tre olika.
 */
export function certificateWeight(state: GameState, job: Job): number {
  let total = 0;
  for (const [category, n] of Object.entries(state.certificates)) {
    total += (n ?? 0) * (category === job.category ? 2 : 1);
  }
  return total;
}

/** Vad ett jobb kräver, i certifikat (viktade) och stadsbetyg. */
export function jobRequirement(job: Job): { certs: number; rating: number } {
  if (job.wageClass === 1) return { certs: 0, rating: 0 };
  if (job.wageClass === 2) return { certs: 1, rating: 50 };
  return { certs: 3, rating: 75 };
}

/**
 * Man börjar längst ner. Löneklass 1 är öppen för alla; högre klasser kräver
 * certifikat från tidigare skift, och därtill ett stadsbetyg som visar att
 * man kan något om platsen. Ett högt betyg ensamt räcker inte - det går inte
 * att plugga sig förbi golvet, bara att jobba sig upp.
 */
export function canTakeJob(state: GameState, job: Job): boolean {
  const need = jobRequirement(job);
  if (need.certs === 0) return true;
  const rating = getProgress(state, state.currentCityId).rating;
  return certificateWeight(state, job) >= need.certs && rating >= need.rating;
}

export function jobRequirementText(job: Job): string {
  if (job.wageClass === 1) return 'Inga krav';
  if (job.wageClass === 2)
    return 'Kräver ett certifikat och minst 50 i stadsbetyg';
  return 'Kräver tre certifikat (ett i ämnet räknas dubbelt) och minst 75 i stadsbetyg';
}

/** Lön per rätt svar i basenheter. */
export function wagePerCorrect(
  job: Job,
  city: City,
  difficulty: Difficulty
): number {
  const classFactor = job.wageClass === 1 ? 1 : job.wageClass === 2 ? 1.6 : 2.3;
  const base = 160 * classFactor * (0.75 + city.costIndex * 0.45);
  return Math.round(difficulty === 'turist' ? base : base * 1.15);
}

/**
 * Utjämning från originalet: efter flera felsvar i rad ger nästa rätta svar
 * extra pengar, så att spelet inte blir ohjälpsamt hårt.
 */
export function pityBonus(wrongStreak: number, wage: number): number {
  if (wrongStreak < 3) return 0;
  return Math.round(wage * Math.min(1.5, (wrongStreak - 2) * 0.5));
}

/**
 * Svarsserien ger en multiplikator på lönen. Den växer snabbt i början och
 * planar sedan ut, så att en bra svit känns direkt utan att ett enda skift
 * kan avgöra hela resan.
 */
export function comboMultiplier(streak: number): number {
  if (streak < 2) return 1;
  return Math.min(2, 1 + (streak - 1) * 0.2);
}

/** Hur många steg av multiplikatorn som visas i mätaren. */
export const COMBO_STEPS = 6;

/**
 * Snabbhetsbonus: den som svarar inom några sekunder får ett påslag på
 * dagslönen. Efter tolv sekunder ger den ingenting, så den premierar att
 * kunna svaret utan att straffa den som tänker efter.
 */
export function speedBonus(ms: number, wage: number): number {
  const fast = 2500;
  const slow = 12000;
  if (ms <= fast) return Math.round(wage * 0.4);
  if (ms >= slow) return 0;
  const share = 1 - (ms - fast) / (slow - fast);
  return Math.round(wage * 0.4 * share);
}

/** Souvenirpris i en stad, med lokal variation som är stabil per dag. */
export function souvenirPrice(
  souvenir: Souvenir,
  city: City,
  daySeed: number,
  selling: boolean
): number {
  let factor = 1;
  if (souvenir.cheapIn.includes(city.region)) factor *= 0.6;
  if (souvenir.hotIn.includes(city.region)) factor *= 1.65;
  factor *= 0.85 + city.costIndex * 0.2;
  // Deterministiskt "marknadsbrus" utifrån stad, vara och dag.
  const noise = pseudoRandom(`${city.id}|${souvenir.id}|${Math.floor(daySeed / 3)}`);
  factor *= 0.9 + noise * 0.25;
  // Butiken tar mellanskillnad när du säljer.
  if (selling) factor *= 0.82;
  return Math.max(20, Math.round(souvenir.basePrice * factor));
}

/** Enkel deterministisk hash till [0,1). */
export function pseudoRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Skifta till positivt och normalisera
  return ((h >>> 0) % 100000) / 100000;
}

/** Blandar en array (Fisher-Yates) utan att röra originalet. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export interface PreparedQuestion {
  question: Question;
  /** Alternativen i visningsordning */
  options: string[];
  /** Index i options som är rätt */
  correctIndex: number;
  /**
   * Bilderna parallellt med `options`, för bildfrågor. Blandas ihop med
   * alternativen så att bild och etikett aldrig kan glida isär.
   */
  images?: string[];
}

/** Väljer alternativ enligt svårighetsgrad och blandar dem. */
export function prepareQuestion(
  question: Question,
  difficulty: Difficulty
): PreparedQuestion {
  /**
   * En reglagefråga har inga alternativ att blanda. Svaret dras fram på en
   * skala, och rättningen sker mot talet i `reglage` i stället för mot ett
   * index.
   */
  if (question.reglage) {
    return { question, options: [], correctIndex: 0 };
  }

  const count = Math.min(optionCount(difficulty), question.a.length);
  const correct = question.a[0]!;

  /**
   * Bildfrågor blandas som par. Att blanda etiketterna för sig och bilderna
   * för sig skulle ge fyra foton med fel namn under - och det märks först när
   * spelaren svarat fel på något hen kunde.
   */
  if (question.bilder) {
    const par = question.a.map((label, i) => ({
      label,
      bild: question.bilder![i] ?? '',
    }));
    const ratt = par[0]!;
    const fel = shuffle(par.slice(1)).slice(0, count - 1);
    const blandade = shuffle([ratt, ...fel]);
    return {
      question,
      options: blandade.map((p) => p.label),
      correctIndex: blandade.indexOf(ratt),
      images: blandade.map((p) => p.bild),
    };
  }

  const distractors = shuffle(question.a.slice(1)).slice(0, count - 1);
  const options = shuffle([correct, ...distractors]);
  return {
    question,
    options,
    correctIndex: options.indexOf(correct),
  };
}

/** Frågor för turistbyrån i en stad, filtrerade på svårighet. */
export function cityQuizQuestions(
  cityId: string,
  difficulty: Difficulty,
  count = 5
): PreparedQuestion[] {
  const pool = CITY_QUESTIONS[cityId] ?? [];
  const eligible =
    difficulty === 'turist' ? pool.filter((q) => q.d === 1) : pool;
  const source = eligible.length >= count ? eligible : pool;
  return shuffle(source)
    .slice(0, count)
    .map((q) => prepareQuestion(q, difficulty));
}

/** Frågor för ett arbetsskift. */
export function jobQuestions(
  job: Job,
  difficulty: Difficulty
): PreparedQuestion[] {
  const pool = JOB_QUESTIONS[job.id] ?? [];
  const eligible =
    difficulty === 'turist' ? pool.filter((q) => q.d === 1) : pool;
  const source = eligible.length >= job.shiftLength ? eligible : pool;
  return shuffle(source)
    .slice(0, job.shiftLength)
    .map((q) => prepareQuestion(q, difficulty));
}

/** Jobb som annonseras i staden idag. */
export function cityJobs(city: City): Job[] {
  return city.jobs.map((id) => JOB_BY_ID[id]).filter((j): j is Job => Boolean(j));
}

/** Souvenirer till försäljning i staden. */
export function citySouvenirs(city: City): Souvenir[] {
  return city.souvenirs
    .map((id) => SOUVENIR_BY_ID[id])
    .filter((s): s is Souvenir => Boolean(s));
}

/** Lån hemifrån: mindre för varje samtal. */
export function loanAmount(state: GameState): number {
  const base = 2000;
  return Math.round(base * Math.max(0.3, 1 - state.callsHome * 0.25));
}

/**
 * Räntan på ett lån hemifrån. Föräldrarna lånar inte ut gratis: skulden som
 * läggs på är en femtedel större än det som sätts in, så att ett samtal dag
 * ett är en kostnad och inte ett självklart drag.
 */
export const LOAN_INTEREST = 0.2;
export function loanDebt(amount: number): number {
  return Math.round(amount * (1 + LOAN_INTEREST));
}

/** Värdet av ryggsäcken om den säljs hemma. */
export function backpackHomeValue(state: GameState): number {
  const home = CITY_BY_ID[state.homeCityId];
  if (!home) return 0;
  return state.backpack.reduce((sum, item) => {
    const s = SOUVENIR_BY_ID[item.souvenirId];
    if (!s) return sum;
    return sum + souvenirPrice(s, home, state.days, true);
  }, 0);
}

/** Passets stämplar, med stadsregionerna inkopplade. */
export const STAMPS: Stamp[] = buildStamps((id) => CITY_BY_ID[id]?.region);

export const STAMP_BY_ID: Record<string, Stamp> = Object.fromEntries(
  STAMPS.map((s) => [s.id, s])
);

/**
 * Prövar alla stämplar och lämnar tillbaka dem som just förtjänats. Anropas
 * efter varje förändring; de som redan sitter i passet prövas inte om.
 */
export function newStamps(state: GameState): Stamp[] {
  const earned: Stamp[] = [];
  for (const stamp of STAMPS) {
    if (state.stamps.includes(stamp.id)) continue;
    if (stamp.test(state)) {
      state.stamps.push(stamp.id);
      earned.push(stamp);
    }
  }
  return earned;
}

/** Titel att skryta med på slutskärmen. */
export function rankTitle(score: number): { title: string; desc: string } {
  if (score >= 90000)
    return { title: 'Legendarisk ryggsäckare', desc: 'Det här gör ingen efter dig.' };
  if (score >= 65000)
    return { title: 'Världsvan globetrotter', desc: 'Du har sett mer än de flesta hinner på ett helt liv.' };
  if (score >= 45000)
    return { title: 'Rutinerad resenär', desc: 'Packningen sitter, ekonomin höll och kartan är läst.' };
  if (score >= 28000)
    return { title: 'Van ryggsäckare', desc: 'En riktig resa, med både arbete och äventyr.' };
  if (score >= 15000)
    return { title: 'Nyfiken nybörjare', desc: 'Du kom hem, och du kom hem klokare.' };
  return { title: 'Hemvändare', desc: 'Resan blev kort, men den blev av.' };
}

/** Kassan räknas bara upp till hit. Resten är bara pengar. */
export const SCORE_CASH_CAP = 25000;

/**
 * Slutpoäng: resande först, pengar sedan.
 *
 * Kassan har ett tak och certifikat räknas per ämne, så att fyrtio skift i
 * samma stad inte slår en resa jorden runt. Det som ger mest är städer,
 * världsdelar, stämplar och tempo - alltså att faktiskt vara ryggsäckare.
 */
export function finalScore(state: GameState): number {
  const cash = Math.min(SCORE_CASH_CAP, state.money - state.debt);
  const bag = backpackHomeValue(state);
  const answered = state.correct + state.wrong;
  const accuracy = answered > 0 ? state.correct / answered : 0;
  // Första certifikatet i ett ämne är värt mest; bredd slår upprepning.
  let certPoints = 0;
  for (const n of Object.values(state.certificates)) {
    if ((n ?? 0) > 0) certPoints += 900 + ((n ?? 1) - 1) * 250;
  }
  const uniqueCities = new Set(state.visited).size;
  const cityPoints = uniqueCities * 1500;
  // Olika världsdelar är värda mer än flera städer i samma hörn av världen.
  const regions = new Set(
    state.visited.map((id) => CITY_BY_ID[id]?.region).filter(Boolean)
  ).size;
  const stampPoints = state.stamps.length * 900;
  /**
   * Anseendet räknas in, åt båda hållen. Att lämna in plånboken ska löna sig
   * på slutet också för den som inte fick hittelön, och att behålla pengarna
   * ska kosta något mer än en rad i en resedagbok.
   */
  const rykte = Math.max(-6, Math.min(12, state.rykte ?? 0)) * 700;
  /**
   * Tempobonus: dagar per stad. Åtta dagar per stad ger drygt hälften, den
   * som stannar tjugo dagar i varje stad får ingenting, och en resa på
   * 30 städer på 60 dagar får full pott.
   */
  const daysPerCity = uniqueCities > 0 ? state.days / uniqueCities : 99;
  const pace = Math.max(0, Math.min(12000, 12000 - (daysPerCity - 2) * 600));
  return Math.max(
    0,
    Math.round(
      cash * 0.6 +
        bag * 0.9 +
        cityPoints +
        regions * 2000 +
        stampPoints +
        rykte +
        certPoints +
        accuracy * 6000 +
        pace
    )
  );
}

/** Har du besökt tillräckligt för att få avsluta resan hemma? */
export function canFinish(state: GameState): boolean {
  return (
    state.currentCityId === state.homeCityId &&
    new Set(state.visited).size >= 5
  );
}

export const MIN_CITIES_TO_FINISH = 5;

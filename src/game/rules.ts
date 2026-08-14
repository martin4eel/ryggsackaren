import { CITY_BY_ID } from '../data/cities';
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

export type TravelClass = 'budget' | 'standard' | 'express';

export interface TravelOption {
  klass: TravelClass;
  label: string;
  /** Pris i basenheter */
  price: number;
  /** Restid i dagar */
  days: number;
  desc: string;
}

/**
 * Tre alternativ per sträcka: billigt och långsamt, eller dyrt och snabbt.
 * Precis som i originalet är tid också en resurs, eftersom boendet kostar.
 */
export function travelOptions(from: City, to: City): TravelOption[] {
  const km = distanceKm(from, to);
  const base = 180 + km * 0.42;
  const flightDays = Math.max(1, Math.round(km / 4000));
  return [
    {
      klass: 'budget',
      label: 'Buss, tåg och båt',
      price: Math.round(base * 0.55),
      days: flightDays + Math.max(1, Math.round(km / 1400)),
      desc: 'Långsamt, obekvämt och billigt. Du ser mer på vägen.',
    },
    {
      klass: 'standard',
      label: 'Turistklass',
      price: Math.round(base),
      days: flightDays + 1,
      desc: 'Vanligt flyg med mellanlandning. Rimligt pris och tid.',
    },
    {
      klass: 'express',
      label: 'Direktflyg',
      price: Math.round(base * 1.75),
      days: flightDays,
      desc: 'Snabbast möjliga väg. Kostar men sparar dagar.',
    },
  ];
}

/** Kostnad per natt för vandrarhem och mat i en stad. */
export function dailyCost(city: City, difficulty: Difficulty): number {
  const base = 210 * city.costIndex;
  return Math.round(difficulty === 'turist' ? base * 0.8 : base);
}

/** Hur många svarsalternativ som visas. */
export function optionCount(difficulty: Difficulty): number {
  return difficulty === 'turist' ? 3 : 4;
}

/** Betyg 0-100 översatt till högsta löneklass du får söka. */
export function allowedWageClass(rating: number): 1 | 2 | 3 {
  if (rating >= 85) return 3;
  if (rating >= 50) return 2;
  return 1;
}

/**
 * Ett jobb kan låsas upp antingen av bra betyg på turistbyrån eller av
 * certifikat du samlat i samma kategori tidigare på resan.
 */
export function canTakeJob(state: GameState, job: Job): boolean {
  const rating = getProgress(state, state.currentCityId).rating;
  if (job.wageClass <= allowedWageClass(rating)) return true;
  const certs = state.certificates[job.category] ?? 0;
  if (job.wageClass === 2 && certs >= 1) return true;
  if (job.wageClass === 3 && certs >= 2) return true;
  return false;
}

export function jobRequirementText(job: Job): string {
  if (job.wageClass === 1) return 'Inga krav';
  if (job.wageClass === 2)
    return 'Kräver minst 50 i stadsbetyg eller 1 certifikat i ämnet';
  return 'Kräver minst 85 i stadsbetyg eller 2 certifikat i ämnet';
}

/** Lön per rätt svar i basenheter. */
export function wagePerCorrect(
  job: Job,
  city: City,
  difficulty: Difficulty
): number {
  const classFactor = job.wageClass === 1 ? 1 : job.wageClass === 2 ? 1.7 : 2.6;
  const base = 190 * classFactor * (0.75 + city.costIndex * 0.45);
  return Math.round(difficulty === 'turist' ? base : base * 1.25);
}

/**
 * Utjämning från originalet: efter flera felsvar i rad ger nästa rätta svar
 * extra pengar, så att spelet inte blir ohjälpsamt hårt.
 */
export function pityBonus(wrongStreak: number, wage: number): number {
  if (wrongStreak < 3) return 0;
  return Math.round(wage * Math.min(1.5, (wrongStreak - 2) * 0.5));
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
}

/** Väljer alternativ enligt svårighetsgrad och blandar dem. */
export function prepareQuestion(
  question: Question,
  difficulty: Difficulty
): PreparedQuestion {
  const count = Math.min(optionCount(difficulty), question.a.length);
  const correct = question.a[0]!;
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

/** Lån hemifrån: större belopp men växande skuld. */
export function loanAmount(state: GameState): number {
  const base = 2500;
  return Math.round(base * Math.max(0.4, 1 - state.callsHome * 0.15));
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

/** Slutpoäng: pengar, souvenirvärde, kunskap och effektivitet. */
export function finalScore(state: GameState): number {
  const cash = state.money - state.debt;
  const bag = backpackHomeValue(state);
  const answered = state.correct + state.wrong;
  const accuracy = answered > 0 ? state.correct / answered : 0;
  const certs = Object.values(state.certificates).reduce(
    (a, b) => a + (b ?? 0),
    0
  );
  const uniqueCities = new Set(state.visited).size;
  const cityPoints = uniqueCities * 1200;
  /**
   * Effektivitetsbonus istället för ren snabbhet: den som ser många städer
   * på få dagar belönas, men en grundlig resa nollas inte ut.
   */
  const efficiency =
    state.days > 0 ? Math.min(15000, (uniqueCities / state.days) * 260000) : 0;
  return Math.max(
    0,
    Math.round(
      cash * 0.6 +
        bag * 0.9 +
        cityPoints +
        certs * 700 +
        accuracy * 6000 +
        efficiency
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

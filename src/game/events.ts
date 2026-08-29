import { CITY_BY_ID } from '../data/cities';
import {
  EVENTS,
  EVENT_BY_ID,
  type EventContext,
  type EventEffect,
  type EventOutcome,
  type EventTrigger,
  type GameEvent,
} from '../data/events';
import { CITY_POPULATION } from '../data/facts';
import { SOUVENIR_BY_ID } from '../data/souvenirs';
import type { City } from '../data/types';
import type { GameState } from './state';
import { getProgress } from './state';

/**
 * Händelsemotorn: vad som kan hända, hur ofta, och vad det leder till.
 *
 * Datan i data/events.ts vet ingenting om spelet - den är listor och texter.
 * All koppling till tillståndet ligger här, så att en ny händelse går att
 * skriva utan att röra en rad kod.
 *
 * Turordningen är alltid densamma: ett tillfälle inträffar (man reser, sover,
 * jobbar, handlar, går ut), motorn slår om något ska hända, väljer bland de
 * händelser som passar tillfället och tillståndet, och lägger den i
 * `state.pendingEvent`. Först när spelaren svarat verkställs något.
 */

/**
 * Hur ofta något händer vid varje sorts tillfälle, som andel.
 *
 * Talen är satta så att en resa fortfarande känns som förut, medan de nya
 * tillfällena är sällsynta nog att inte bli en fråga man klickar bort. Att gå
 * ut på stan är undantaget: där är händelsen hela poängen med att gå ut.
 */
export const EVENT_CHANCE: Record<EventTrigger, number> = {
  resa: 0.22,
  boende: 0.1,
  arbete: 0.25,
  sevardhet: 1,
  stad: 1,
  handel: 0.12,
  mote: 1,
  vantan: 0.12,
};

/**
 * Andrum mellan händelser som slår till av sig själva: har något hänt de
 * senaste dagarna får spelet vara i fred ett tag. Utan det kunde ett skift
 * ge en händelse på jobbet, en på vandrarhemmet och en på bussen därifrån,
 * och då är det inte längre händelser utan bakgrundsbrus.
 */
export const EVENT_COOLDOWN_DAYS = 3;

/**
 * Hur många mystikskyltar en stad har på stadsbilden.
 *
 * Antalet följer folkmängden, för att en storstad ska ha mer att snubbla över
 * än en småstad. Köping får en, Stockholm två, Tokyo fyra. Skyltarna är
 * engångshändelser - de finns kvar tills man vänt upp dem, och sedan aldrig
 * mer i just den staden.
 */
export function mysterySpotCount(cityId: string): number {
  const folk = CITY_POPULATION[cityId] ?? 0;
  if (folk >= 9_000_000) return 5;
  if (folk >= 2_500_000) return 4;
  if (folk >= 500_000) return 3;
  /*
   * Minst två: den första brickan är alltid frågan om staden, så en stad med
   * bara en plats skulle få en fråga och ingenting som händer. Köping ska
   * vara mindre än Kairo, men inte tomt.
   */
  return 2;
}

/** Allt motorn behöver veta om spelaren, i en form datan kan läsa. */
export function eventContext(state: GameState, city: City): EventContext {
  return {
    money: state.money,
    days: state.days,
    rykte: state.rykte,
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    landmark: city.landmark,
    region: city.region,
    costIndex: city.costIndex,
    backpack: state.backpack.length,
    visited: new Set(state.visited).size,
    rating: getProgress(state, city.id).rating,
    certificates: Object.values(state.certificates).reduce((a, b) => a + (b ?? 0), 0),
    debt: state.debt,
  };
}

/**
 * Byter ut platshållarna mot stadens egna uppgifter. Samma händelse ska låta
 * som att den skrivits för just den här staden.
 */
export function fillText(text: string, city: City): string {
  return text
    .replace(/\{stad\}/g, city.name)
    .replace(/\{land\}/g, city.country)
    .replace(/\{sevardhet\}/g, city.landmark);
}

/** Ett slumpat val ur en lista med vikter. */
function weighted<T extends { weight?: number }>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  const total = items.reduce((sum, i) => sum + (i.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Händelser som passar tillfället och tillståndet just nu. Sorteringen är
 * likgiltig; vikterna sköter urvalet.
 */
export function eligibleEvents(
  trigger: EventTrigger,
  ctx: EventContext,
  seen: readonly string[]
): GameEvent[] {
  return EVENTS.filter((e) => {
    if (!e.triggers.includes(trigger)) return false;
    /**
     * Varje händelse inträffar högst en gång per resa. Att möta samma hund på
     * samma gata två gånger får världen att krympa, och att möta den två
     * gånger i samma stad får den att se trasig ut. Priset är att banken måste
     * vara djup nog för en lång resa, vilket valideringen vakar över.
     */
    if (seen.includes(e.id)) return false;
    if (e.villkor && !e.villkor(ctx)) return false;
    return true;
  });
}

/**
 * Slår om något ska hända, och i så fall vad. Returnerar `null` när
 * tillfället passerar utan att något inträffar - vilket är det vanliga.
 *
 * En händelse som redan väntar på svar blockerar nya. Två frågor på skärmen
 * samtidigt skulle betyda att den ena besvaras utan att ha lästs.
 */
/**
 * Reservbankerna. Sevärdheten har sexton egna händelser och resan kan gå
 * genom femtiotvå städer: någon gång kring den sextonde staden är den egna
 * banken tom, och dagen vid landmärket blev då en dag utan innehåll. Då lånas
 * en händelse ur de breda banker som fortfarande har något kvar - en scen på
 * stan eller ett möte passar lika bra vid Akropolis som på en gata.
 */
const RESERV: Record<EventTrigger, EventTrigger[]> = {
  sevardhet: ['stad', 'mote'],
  mote: ['stad', 'sevardhet'],
  handel: ['stad', 'mote'],
  boende: ['stad', 'vantan'],
  arbete: ['stad', 'mote'],
  vantan: ['resa', 'stad'],
  resa: ['vantan', 'stad'],
  stad: ['mote', 'sevardhet'],
};

function reservEvents(
  trigger: EventTrigger,
  ctx: EventContext,
  seen: readonly string[]
): GameEvent[] {
  for (const reserv of RESERV[trigger] ?? []) {
    const kandidater = eligibleEvents(reserv, ctx, seen);
    if (kandidater.length) return kandidater;
  }
  return [];
}

export function rollEvent(
  state: GameState,
  city: City,
  trigger: EventTrigger,
  /** Sannolikheten, om den ska skilja sig från standarden för tillfället. */
  chance = EVENT_CHANCE[trigger]
): GameEvent | null {
  if (state.pendingEvent) return null;
  // Det man själv valt (gatan, sevärdheten, mystikbrickan) går alltid;
  // slumpen får vänta tills det gått några dagar sedan sist.
  if (chance < 1 && state.days - (state.lastEventDay ?? -99) < EVENT_COOLDOWN_DAYS) return null;
  if (Math.random() >= chance) return null;
  const ctx = eventContext(state, city);
  const kandidater = eligibleEvents(trigger, ctx, state.eventsSeen);
  const vald = weighted(
    kandidater.length ? kandidater : reservEvents(trigger, ctx, state.eventsSeen)
  );
  if (!vald) return null;
  state.pendingEvent = { eventId: vald.id };
  state.eventsSeen.push(vald.id);
  state.lastEventDay = state.days;
  return vald;
}

/** Händelsen som väntar, om någon gör det. */
export function pendingEvent(state: GameState): GameEvent | null {
  const id = state.pendingEvent?.eventId;
  return id ? (EVENT_BY_ID[id] ?? null) : null;
}

/** Det som faktiskt hände, när spelaren svarat. */
export function pendingOutcome(state: GameState): EventOutcome | null {
  const p = state.pendingEvent;
  const event = pendingEvent(state);
  if (!p || !event) return null;
  if (p.chosen === undefined || p.outcome === undefined) return null;
  return event.choices?.[p.chosen]?.outcomes[p.outcome] ?? null;
}

/** En rad i sammanfattningen av vad en effekt gjorde. */
export interface EffectLine {
  text: string;
  tone: 'bra' | 'daligt' | 'neutral';
}

/**
 * Beskriver en effekt utan att verkställa den.
 *
 * Behövs för att kunna visa vad som hände också efter en omladdning: då är
 * effekten redan verkställd och sparad, men sammanfattningen fanns bara i
 * gränssnittet. Beskrivningen här är den nominella - vilken souvenir som
 * försvann går inte att veta i efterhand, bara att någon gjorde det.
 */
export function describeEffect(
  effect: EventEffect | undefined,
  money: (amount: number) => string,
  dailyCost: number
): EffectLine[] {
  const rader: EffectLine[] = [];
  if (!effect) return rader;
  if (effect.money) {
    rader.push({
      text: `${effect.money > 0 ? '+' : '−'}${money(Math.abs(effect.money))}`,
      tone: effect.money > 0 ? 'bra' : 'daligt',
    });
  }
  if (effect.days) {
    const kostnad = dailyCost * effect.days;
    rader.push({
      text:
        `${effect.days} ${effect.days === 1 ? 'extra dag' : 'extra dagar'}` +
        (kostnad > 0 ? ` · boende ${money(kostnad)}` : ''),
      tone: 'daligt',
    });
  }
  if (effect.rating) {
    rader.push({
      text: `Stadsbetyg ${effect.rating > 0 ? '+' : '−'}${Math.abs(effect.rating)}`,
      tone: effect.rating > 0 ? 'bra' : 'daligt',
    });
  }
  if (effect.rykte) {
    rader.push({
      text: effect.rykte > 0 ? 'Bättre anseende' : 'Sämre anseende',
      tone: effect.rykte > 0 ? 'bra' : 'daligt',
    });
  }
  if (effect.souvenir) {
    const s = SOUVENIR_BY_ID[effect.souvenir];
    if (s) rader.push({ text: `${s.name} i ryggsäcken`, tone: 'bra' });
  }
  if (effect.tapparSouvenir) {
    rader.push({ text: 'En souvenir är borta', tone: 'daligt' });
  }
  if (effect.certifikat) {
    rader.push({ text: `Certifikat i ${effect.certifikat}`, tone: 'bra' });
  }
  return rader;
}

/**
 * Effekten som hör till den händelse som väntar - antingen det valda utfallets
 * eller, för en händelse utan val, händelsens egen.
 */
export function pendingEffect(state: GameState): EventEffect | undefined {
  const event = pendingEvent(state);
  if (!event) return undefined;
  if (!event.choices) return event.effect;
  return pendingOutcome(state)?.effect;
}

/**
 * Verkställer en effekt och beskriver den i klartext.
 *
 * Beloppen räknas in i resans statistik på samma sätt som alla andra pengar,
 * så att intjänat och spenderat fortsätter stämma. Dagar dras med boendet i
 * staden man står i, precis som en resdag.
 */
export function applyEffect(
  state: GameState,
  effect: EventEffect | undefined,
  city: City,
  /** Kostnaden per dygn här, som spelet räknar den. */
  dailyCost: number,
  /** Formaterar belopp i spelarens valuta. */
  money: (amount: number) => string
): EffectLine[] {
  const rader: EffectLine[] = [];
  if (!effect) return rader;

  if (effect.money) {
    state.money += effect.money;
    if (effect.money > 0) state.earned += effect.money;
    else state.spent += -effect.money;
    state.peakMoney = Math.max(state.peakMoney, state.money);
    rader.push({
      text: `${effect.money > 0 ? '+' : '−'}${money(Math.abs(effect.money))}`,
      tone: effect.money > 0 ? 'bra' : 'daligt',
    });
  }

  if (effect.days) {
    const kostnad = dailyCost * effect.days;
    state.days += effect.days;
    state.money -= kostnad;
    state.spent += kostnad;
    rader.push({
      text:
        `${effect.days} ${effect.days === 1 ? 'extra dag' : 'extra dagar'}` +
        (kostnad > 0 ? ` · boende ${money(kostnad)}` : ''),
      tone: 'daligt',
    });
  }

  if (effect.rating) {
    const p = getProgress(state, city.id);
    const fore = p.rating;
    // Betyget är fortfarande ett betyg: det kan inte gå utanför skalan.
    p.rating = Math.max(0, Math.min(100, p.rating + effect.rating));
    const diff = p.rating - fore;
    if (diff !== 0) {
      rader.push({
        text: `Stadsbetyg ${diff > 0 ? '+' : '−'}${Math.abs(diff)}`,
        tone: diff > 0 ? 'bra' : 'daligt',
      });
    }
  }

  if (effect.rykte) {
    state.rykte += effect.rykte;
    rader.push({
      text: effect.rykte > 0 ? 'Bättre anseende' : 'Sämre anseende',
      tone: effect.rykte > 0 ? 'bra' : 'daligt',
    });
  }

  if (effect.souvenir) {
    const s = SOUVENIR_BY_ID[effect.souvenir];
    if (s) {
      state.backpack.push({ souvenirId: s.id, paid: 0, boughtIn: city.id });
      rader.push({ text: `${s.name} i ryggsäcken`, tone: 'bra' });
    }
  }

  /**
   * Att bli av med en souvenir tar den billigaste först. Att förlora resans
   * dyraste fynd på en slumphändelse är den sortens sak som får någon att
   * sluta spela.
   */
  if (effect.tapparSouvenir && state.backpack.length > 0) {
    let index = 0;
    let lagst = Infinity;
    state.backpack.forEach((item, i) => {
      if (item.paid < lagst) {
        lagst = item.paid;
        index = i;
      }
    });
    const borta = state.backpack.splice(index, 1)[0];
    const namn = borta ? SOUVENIR_BY_ID[borta.souvenirId]?.name : undefined;
    rader.push({
      text: namn ? `${namn} är borta` : 'En souvenir är borta',
      tone: 'daligt',
    });
  }

  if (effect.certifikat) {
    state.certificates[effect.certifikat] =
      (state.certificates[effect.certifikat] ?? 0) + 1;
    rader.push({ text: `Certifikat i ${effect.certifikat}`, tone: 'bra' });
  }

  return rader;
}

/**
 * Spelaren väljer. Utfallet lottas bland valets möjliga följder, verkställs,
 * och sparas i tillståndet så att det står kvar om sidan laddas om.
 */
export function chooseEvent(
  state: GameState,
  index: number,
  city: City,
  dailyCost: number,
  money: (amount: number) => string
): EffectLine[] {
  const p = state.pendingEvent;
  const event = pendingEvent(state);
  if (!p || !event?.choices) return [];
  const choice = event.choices[index];
  if (!choice) return [];
  const utfall = weighted(choice.outcomes);
  if (!utfall) return [];
  p.chosen = index;
  p.outcome = choice.outcomes.indexOf(utfall);
  return applyEffect(state, utfall.effect, city, dailyCost, money);
}

/**
 * En händelse utan val verkställs direkt när den slår till. Den har inget att
 * svara på, så det finns inget att vänta med.
 */
export function applyImmediate(
  state: GameState,
  event: GameEvent,
  city: City,
  dailyCost: number,
  money: (amount: number) => string
): EffectLine[] {
  if (event.choices) return [];
  return applyEffect(state, event.effect, city, dailyCost, money);
}

/** Kvitterar den väntande händelsen. */
export function clearEvent(state: GameState): void {
  state.pendingEvent = undefined;
}

/** Staden en händelse hör hemma i, för texter och effekter. */
export function eventCity(state: GameState): City {
  return CITY_BY_ID[state.currentCityId]!;
}

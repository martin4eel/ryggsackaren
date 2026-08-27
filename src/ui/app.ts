import { HUVUDKATEGORIER, HUVUD_LABELS } from '../data/jobs';
import { CITIES, CITY_BY_ID } from '../data/cities';
import { CITY_FACTS } from '../data/cityFacts';
import { CURRENCIES, formatMoney } from '../data/currencies';
import type { EventTone, EventTrigger } from '../data/events';
import { SOUVENIR_BY_ID } from '../data/souvenirs';
import type { City, Job, Souvenir } from '../data/types';
import {
  COMBO_STEPS,
  DIFFICULTY_INFO,
  MIN_CITIES_TO_FINISH,
  STAMPS,
  STAMP_BY_ID,
  backpackHomeValue,
  canFinish,
  canTakeJob,
  cityJobs,
  cityQuizQuestions,
  citySouvenirs,
  dailyCost,
  distanceKm,
  finalScore,
  jobQuestions,
  prepareQuestion,
  jobRequirementText,
  jobRequirement,
  pointsIn,
  arcadeSlack,
  certificateThreshold,
  comboMultiplier,
  loanAmount,
  loanDebt,
  newStamps,
  pityBonus,
  pseudoRandom,
  rankTitle,
  souvenirPrice,
  speedBonus,
  wagePerCorrect,
  type PreparedQuestion,
} from '../game/rules';
import { MODE_LABELS, type TransportMode } from '../data/transport';
import { destinationsByMode, type Route } from '../game/travel';
import {
  cityKnowledge,
  loadHighscores,
  saveHighscore,
  type Highscore,
} from '../game/highscores';
import {
  clearSave,
  createGame,
  getCityStats,
  getProgress,
  loadGame,
  saveGame,
  type Difficulty,
  type GameState,
} from '../game/state';
import {
  cycleVolume,
  playCombo,
  playSound,
  volumeLabel,
  volumeLevel,
  type Sound,
} from './audio';
import { button, clear, el } from './dom';
import { icon, iconGroup, type IconName } from './icons';
import {
  renderMinigame,
  stopAllMinigames,
  type MinigameResult,
} from './minigames';
import type { Stamp } from '../data/stamps';
import { renderTravelScene } from './map';
import { renderStation, type StationHandle } from './station';
import { renderAtlasScreen } from './atlas';
import {
  applyEffect,
  applyImmediate,
  chooseEvent,
  mysterySpotCount,
  clearEvent,
  describeEffect,
  eventContext,
  fillText,
  pendingEffect,
  pendingEvent,
  pendingOutcome,
  rollEvent,
  type EffectLine,
} from '../game/events';
import { renderEventCard } from './eventcard';
import { weatherFor, type Weather } from '../game/weather';
import { CITY_PAPERS } from '../data/newspapers';
import { annonserFor, type Kontaktannons } from '../data/kontaktannonser';
import { CITY_HEADLINES } from '../data/headlines';
import { ALLMAN_REAKTION, QUIZ_IMAGE_BY_ID, quizImageAlt, quizImageUrl } from '../data/quizImages';
import { COIN_QUESTIONS } from '../data/questions/coinQuestions';

interface QuizSession {
  /**
   * `mynt` är en enda fråga om staden, från en bricka på stadsbilden. Den
   * kostar ingen dag och ger inget skift - bara ett stadsbetyg och en slant
   * om man kan svaret.
   */
  kind: 'turistbyra' | 'jobb' | 'mynt';
  questions: PreparedQuestion[];
  index: number;
  correct: number;
  /** Pengar tjänade under skiftet */
  earnings: number;
  job?: Job;
  /** Svar som väntar på att bekräftas */
  answered?: {
    picked: number;
    /** Utbetalning för det här svaret, 0 vid fel */
    payout: number;
    /** Del av utbetalningen som kom av svarsserien */
    combo: number;
    /** Del av utbetalningen som kom av att svaret gick fort */
    speed: number;
    /** Talet spelaren drog fram, för reglagefrågor */
    reglage?: number;
  };
  /** När den nuvarande frågan visades, för snabbhetsbonusen */
  askedAt: number;
  /** Obruten svit av rätta svar inom det här passet */
  streak: number;
  /** Längsta sviten under passet */
  bestStreak: number;
  /** Utfall per arbetsdag, används till stämpelkortet */
  dayResults: boolean[];
  /**
   * Skiftets sista moment är ett arkadspel. 'fragor' medan frågorna pågår,
   * 'brief' när uppgiften presenteras, 'spelar' under spelet och 'klart' när
   * resultatet visas.
   */
  phase: 'fragor' | 'brief' | 'spelar' | 'klart';
  /** Resultatet av arkadmomentet */
  minigameResult?: MinigameResult;
  /** Bonus som arkadmomentet gav */
  bonus?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  geografi: 'Geografi',
  natur: 'Natur',
  historia: 'Historia',
  mat: 'Mat och dryck',
  sport: 'Sport',
  musik: 'Musik',
  konst: 'Konst',
  film: 'Film och teater',
  teknik: 'Teknik',
  medicin: 'Medicin',
  sprak: 'Språk',
  ekonomi: 'Ekonomi',
  hav: 'Sjöfart och hav',
  djur: 'Djur',
  rymden: 'Rymden',
  trafik: 'Trafik',
  bygg: 'Bygg',
  mode: 'Mode och textil',
  samhalle: 'Samhälle och jämställdhet',
};

/**
 * Stadsfotona hämtas från Wikimedia Commons av scripts/fetch-city-photos.mjs
 * och ligger med stabila namn i public/cities/, så att service workern kan
 * cacha dem för offline-spel. Relativ sökväg, precis som ikonerna, så att
 * det fungerar när spelet ligger i en undermapp.
 */
function cityPhotoUrl(city: City): string {
  return `./cities/${city.id}.jpg`;
}

/**
 * Ett stadsfoto som döljer sig självt om filen saknas, så att en trasig
 * bildikon aldrig visas. Klassen sätts på containern om den getts.
 */
function photoImg(city: City, cls: string, hideParent?: HTMLElement): HTMLImageElement {
  const img = el('img', {
    class: cls,
    src: cityPhotoUrl(city),
    alt: `${city.landmark} i ${city.name}`,
    loading: 'lazy',
    decoding: 'async',
  });
  img.addEventListener(
    'error',
    () => {
      if (hideParent) hideParent.classList.add('no-photo');
      else img.classList.add('no-photo');
    },
    { once: true }
  );
  return img;
}

const VOLUME_ICONS = ['ljud-av', 'ljud-halv', 'ljud-pa'] as const;

/**
 * Högtalarknappen stegar mellan av, dämpat och fullt ljud. Ikonen byts på
 * plats i stället för att hela skärmen byggs om, så att knappen ligger kvar
 * under fingret och sidans rullning inte störs.
 */
function audioButton(cls: string): HTMLButtonElement {
  const paint = (b: HTMLButtonElement) => {
    clear(b);
    b.append(icon(VOLUME_ICONS[volumeLevel()]));
    const label = `${volumeLabel()} – tryck för att byta`;
    b.setAttribute('aria-label', label);
    b.setAttribute('title', label);
  };
  const b = button(
    '',
    () => {
      cycleVolume();
      paint(b);
      // Kvittera det nya läget hörbart, så att man vet vad man valt.
      playSound('valj');
    },
    { class: cls, 'data-sound': 'av' }
  );
  paint(b);
  return b;
}

/**
 * Jämförelseform för sökning. Å, ä och ö är egna bokstäver i svenskan, men
 * den som skriver fort i en sökruta hoppar över prickarna. Genom att fälla
 * ihop diakriterna hittar "gote" Göteborg och "kopenhamn" Köpenhamn.
 */
function searchKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Arbetsgivarens namn i en viss stad. Yrkena delas mellan städer, så en stad
 * kan skriva över namnet för att det ska höra hemma där.
 */
function employerFor(city: City, job: Job): string {
  return city.employers?.[job.id] ?? job.employer;
}

/**
 * Har spelaren sett spelloopen på startskärmen? Flaggan bor för sig själv och
 * inte i sparfilen: startskärmen har inget speltillstånd att läsa ur, och
 * förklaringen ska förbli undanstoppad även efter att en resa raderats.
 */
/**
 * Ljudet som hör till en händelses ton. En absurd händelse ska inte låta som
 * en förlust, och en stämningsbild ska knappt låta alls.
 */
const EVENT_LJUD: Record<EventTone, Sound> = {
  bra: 'mynt',
  daligt: 'fel',
  blandat: 'valj',
  absurd: 'blipp',
  allvar: 'varning',
  stamning: 'sida',
};

const HJALP_NYCKEL = 'ryggsackaren.hjalp-visad';

function markeraHjalpSedd(): void {
  try {
    localStorage.setItem(HJALP_NYCKEL, 'ja');
  } catch {
    // ignoreras
  }
}

/**
 * Vem som svarar när man ringer hem. Mamma och pappa lånar ut pengar; de
 * andra utfallen kostar bara ett mynt och en stunds väntan.
 */
type Svarare = 'mamma' | 'pappa' | 'ingen' | 'upptaget' | 'fel';

interface PhoneCall {
  phase: 'ringer' | 'svar';
  svarare: Svarare;
  /** Vad som sägs, eller vad som hände. */
  rad: string;
}

/** Repliker i luren. `{stad}` byts mot staden man ringer från. */
const MAMMA_SVARAR = [
  'Älskling! Äntligen! Äter du ordentligt? Har du mössa? Det är säkert kallt i {stad}.',
  'Jag visste att det var du. Jag kände det i vänster knä. Hur är det med magen?',
  'Pappa står bredvid och skakar på huvudet. Jag låtsas att jag inte ser honom. Hur mycket behöver du?',
  'Gud vad du låter smal. Kan man höra det? Jag hör det. Har du tvättat något sedan du åkte?',
  'Moster Gun frågade om dig i söndags. Jag sa att du är i {stad} och lever på luft. Hon blev orolig.',
  'Vi har gjort om ditt rum till gym. Nej, jag skojar. Det är förråd. Vad har hänt?',
  'Grannen sa att man kan bli kidnappad i {stad}. Är du kidnappad? Blinka två gånger.',
];
const PAPPA_SVARAR = [
  'Hrm. Pappa här. Vad har hänt nu då?',
  'Vet du vad klockan är här? Nej, det gör du väl inte. Du vet ju inte var {stad} ligger heller.',
  'Jag har lagt in det i ett kalkylblad. Cell B7. Den är röd.',
  'Din mor säger att jag ska vara snäll. ... Hur mycket?',
  'Jag lyssnar. Jag säger inget, men jag lyssnar. Det är skillnad.',
  'När jag var i din ålder tog jag ett jobb. Vilket som helst. Hrm. Nå?',
  'Jag hade just somnat i fåtöljen. Tack för det. Vad kostar det den här gången?',
];
const INGEN_SVARAR = [
  'Det ringer och ringer. De sitter väl i trädgården och låtsas att de inte hör.',
  'Telefonsvararen: "Hej, det är familjen. Vi är inte hemma. Eller så är vi det. Prova igen."',
  'Ingen svarar. Det är torsdag, så mamma är på vattengympa och pappa har glömt var telefonen ligger.',
  'Efter åtta signaler lyfter någon luren och lägger på. Det var nog pappa.',
];
const UPPTAGET = [
  'Upptaget. Mamma pratar med moster Gun. Det kan ta en timme. Eller två.',
  'Upptaget. Pappa ringer banken för att fråga om det går att spärra barn.',
  'Upptaget. Någon där hemma står och pratar om dig, känns det som.',
];
const FEL_NUMMER = [
  'En pizzeria i Neapel svarar. De undrar om du vill ha extra ost. Du lägger på, hungrig.',
  'En mansröst säger "Vatikanens växel, vart får jag koppla?". Du lägger på och ber om ursäkt.',
  'En dam svarar på ett språk du inte kan. Hon låter arg. Du lägger på och hoppas att hon saknar nummerpresentatör.',
  'Fel nummer. Någon i {stad} svarar "Hallå?" precis som hemma, men det är inte hemma.',
  'Du har slagit numret till Fröken Ur. Klockan är för mycket. Du lägger på.',
  'En kvinna svarar "Turistbyrån!". Du står ju precis bredvid den.',
];
const MAMMA_LANAR = [
  '"Jag skickar med en gång. Och glöm inte att skicka vykort!"',
  '"Det är inte lån, det är förskott på julklappen. På alla julklappar."',
  '"Säg inget till pappa. Han sitter bredvid. Han hör allt. Hej pappa."',
];
const PAPPA_LANAR = [
  '"Hrm." Pengarna kommer ändå. Han suckar så att luren blir fuktig.',
  '"Det här skrivs upp. Cell B8." Det låter som att han faktiskt skriver.',
  '"Sista gången." Det är fjärde gången han säger det.',
];
const MAMMA_BETALAR = [
  '"Nämen, vad snäll du är. Behåll det, vetja. Nej? Okej då."',
  '"Pappa! Barnet betalar tillbaka! ... Han hörde inte. Han står och tittar på grillen."',
];
const PAPPA_BETALAR = [
  '"Jaså." En lång tystnad. Sedan: "Bra." Det är det finaste han sagt på ett år.',
  '"Jag stryker en rad i kalkylbladet." Han låter nästan rörd.',
];

/**
 * Motivet på bilden reagerar på svaret, i Monty Python-anda. Rätt svar ger
 * ett "Bra jobbat!" och en liten studs. Fel svar klistrar ett fotoutklipp av
 * en mun med tungan ute över motivets ansikte, en replik i pratbubbla, och
 * så kommer den stora foten ner från himlen - också den ett riktigt foto,
 * friklippt, som i Gilliams animationer. Inget är ritat.
 */
/**
 * Utklippen som klistras på bilden när man svarat fel, i Terry Gilliams
 * anda: en mun över motivets ansikte och en hand som dömer. Varianterna
 * lottas per bild så att samma motiv alltid får samma mun - och så att det
 * inte är samma tumme varje gång.
 */
const MUNNAR = [
  { fil: 'mun', klass: 'py-mun-tunga' },
  { fil: 'lappar', klass: 'py-mun-lappar' },
  { fil: 'lappar-2', klass: 'py-mun-lappar' },
] as const;
const TUMMAR = ['tumme-1', 'tumme-2', 'tumme-3'] as const;

function reaktionsLager(bildId: string, ratt: boolean): HTMLElement {
  const info = QUIZ_IMAGE_BY_ID[bildId];
  const ansikte = info?.ansikte ?? { x: 50, y: 45, b: 32 };
  const rep = info?.reaktion ?? ALLMAN_REAKTION;
  const rad = ratt ? 'Bra jobbat!' : slumpa(rep.fel);
  const lager = el('span', {
    class: `py ${ratt ? 'py-ratt' : 'py-fel'}`,
    'aria-hidden': 'true',
  });
  if (!ratt) {
    const mun = MUNNAR[Math.floor(pseudoRandom(`mun|${bildId}`) * MUNNAR.length)]!;
    const tumme = TUMMAR[Math.floor(Math.random() * TUMMAR.length)]!;
    lager.append(
      el('img', {
        class: `py-mun ${mun.klass}`,
        src: `./reaktion/${mun.fil}.webp`,
        alt: '',
        // Munnen sitter i nedre delen av ansiktet, lite på sned som ett
        // urklipp som klistrats dit i hast.
        style: `left:${ansikte.x}%;top:${ansikte.y + ansikte.b * 0.12}%;width:${ansikte.b * 0.55}%;--lut:${((ansikte.x * 7) % 11) - 5}deg`,
      })
    );
    lager.append(
      el('span', {
        class: 'py-bubbla',
        style: `left:${Math.min(70, Math.max(30, ansikte.x))}%;top:${Math.max(3, ansikte.y - ansikte.b * 0.95).toFixed(0)}%`,
      }, rad)
    );
    // Tummen ner kommer in från sidan och slår ner, som en domares.
    lager.append(
      el('img', { class: 'py-tumme', src: `./reaktion/${tumme}.webp`, alt: '' })
    );
    return lager;
  }
  lager.append(
    el('span', {
      class: 'py-bubbla',
      style: `left:${Math.min(70, Math.max(30, ansikte.x))}%;top:${Math.max(3, ansikte.y - ansikte.b * 0.95).toFixed(0)}%`,
    }, rad)
  );
  return lager;
}

function slumpa<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)]!;
}

/** Regionnamn som visas i passet och på slutskärmen. */
const REGION_LABELS: Record<string, string> = {
  norden: 'Norden',
  europa: 'Europa',
  nordamerika: 'Nordamerika',
  latinamerika: 'Latinamerika',
  afrika: 'Afrika',
  mellanostern: 'Mellanöstern',
  asien: 'Asien',
  oceanien: 'Oceanien',
};

export class App {
  private root: HTMLElement;
  private state: GameState | null = null;
  private quiz: QuizSession | null = null;
  private toast: string | null = null;
  /** Visas när spelaren tryckt på Börja om och ska bekräfta */
  private confirmRestart = false;
  /**
   * Pågående samtal i telefonkiosken. Null tills man lyft luren; sedan
   * ringer det, och sedan svarar någon - eller ingen.
   */
  private phoneCall: PhoneCall | null = null;
  private phoneTimer: number | null = null;
  /** Svaret på en kontaktannons man just besvarat, tills tidningen lämnas. */
  private kontaktSvar: { id: string; text: string; rader: EffectLine[] } | null = null;
  private toastTimer: number | null = null;
  /**
   * Skärmen byggs om från grunden vid varje förändring. Vid skärmbyte ska vyn
   * börja högst upp, men vid en ombyggnad på samma skärm - som när man svarat
   * på en fråga - ska rullningen ligga kvar där den var.
   */
  private scrollToTopNext = true;
  /** Element som ska ha tangentbordsfokus när ombyggnaden är klar. */
  private focusAfterRender: HTMLElement | null = null;
  private startPick: { cityId: string; difficulty: Difficulty; name: string } = {
    cityId: 'stockholm',
    difficulty: 'turist',
    name: '',
  };
  /** Stämplar som just delats ut och ska visas som en kvittens */
  private stampToast: Stamp | null = null;
  private stampTimer: number | null = null;
  /** Sökfältet på startskärmens stadslista */
  private cityFilter = '';
  /**
   * Är spelförklaringen utfälld? Första gången någon öppnar spelet står den
   * öppen; därefter ligger den bakom hjälpknappen.
   */
  /** Lägenas punktlistor på startskärmen är hopfällda tills man ber om dem. */
  private showModeDetails = false;
  /** Stämplarna som återstår visas som brickor; beskrivningarna fälls ut. */
  private showStampDetails = false;
  /** Skydd mot att samma resa skrivs till dagboken två gånger */
  private journeySaved = false;
  /** Dagboken som den såg ut när resan just avslutades */
  private latestHighscores: Highscore[] = [];
  /**
   * Tidsstämpeln på resan som nyss skrevs in. Listan sorteras på poäng, så
   * den nya raden ligger sällan först - utan det här skulle "Nyss" hamna på
   * bästa resan i stället för den man just spelat.
   */
  private lastJourneyAt: number | undefined;
  /**
   * Resan som just bokats, medan filmen mellan städerna rullar. Den ligger i
   * minnet och inte i sparfilen: laddas sidan om mitt i sekvensen är resan
   * redan genomförd i tillståndet, och spelaren hamnar i den nya staden.
   */
  private travelScene: {
    from: City;
    to: City;
    mode: TransportMode;
    km: number;
    days: number;
  } | null = null;
  /**
   * Filmens nod. Scenen ritar sig själv med requestAnimationFrame, och en
   * omritning av skärmen - notisen som stängs efter 3,6 sekunder - fick den
   * att byggas om från bildruta noll. Nu byggs den en gång per resa.
   */
  private filmNode: HTMLElement | null = null;
  /** Brickan som just vänts upp, för inslaget i ikonraden. */
  private nyBricka: string | null = null;
  /**
   * Vilken station man gått in i. Resebyrån är uppdelad i busstation,
   * tågstation, flygplats och hamn, som i förlagan, och listan visar då bara
   * de destinationer det färdsättet faktiskt når.
   */
  private travelFilter: TransportMode | null = null;

  /**
   * Sammanfattningen av vad den senaste händelsen ledde till. Den lever bara i
   * gränssnittet; efter en omladdning härleds den ur den sparade händelsen i
   * stället, vilket ger samma rader så när som på vilken souvenir som föll
   * bort.
   */
  private eventEffects: EffectLine[] | null = null;

  /**
   * Stationsskärmen äger egna timers, en ljudmatta och en tavla som lever
   * vidare medan den ligger uppe. Den får därför inte byggas om för varje
   * render - en avisering som dyker upp skulle annars nolla tavlan och starta
   * om hallens ljud. Handtaget sparas med sin identitet och återanvänds så
   * länge det är samma station och samma kassa.
   */
  private station: {
    handle: StationHandle;
    mode: TransportMode;
    cityId: string;
  } | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  start(): void {
    const saved = loadGame();
    if (saved) {
      this.state = saved;
      // Undvik att återuppta mitt i en fråga, sessionen är inte sparad.
      if (saved.screen === 'jobb' || saved.screen === 'turistbyra') {
        saved.screen = 'stad';
      }
    }
    this.bindKeyboard();
    this.render();
  }

  /**
   * Tangentbordsstyrning. Frågorna går att besvara med 1-4 eller A-D och
   * kvitteras med Enter, så att ett helt skift kan spelas utan att flytta
   * handen. Escape backar till staden. Genvägarna stängs av så fort fokus
   * ligger i ett textfält eller en rullgardin.
   */
  private bindKeyboard(): void {
    window.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const s = this.state;
      if (!s || this.confirmRestart) return;

      /**
       * En obesvarad händelse äger tangentbordet. A-C väljer, Enter går vidare
       * när svaret är givet, och Escape gör ingenting - en fråga man ställts
       * inför ska besvaras, inte kringgås.
       */
      const handelse = pendingEvent(s);
      if (handelse) {
        const besvarad = s.pendingEvent?.chosen !== undefined;
        if (!besvarad && handelse.choices) {
          const val = 'abc'.indexOf(event.key.toLowerCase());
          const siffra = '123'.indexOf(event.key);
          const i = val >= 0 ? val : siffra;
          const choice = i >= 0 ? handelse.choices[i] : undefined;
          if (choice) {
            event.preventDefault();
            const ctx = eventContext(s, this.city);
            if (!choice.villkor || choice.villkor(ctx)) this.answerEvent(i);
          }
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.closeEvent();
        }
        return;
      }

      const quiz = this.quiz;
      const inQuestions =
        quiz && quiz.phase === 'fragor' &&
        (s.screen === 'jobb' || s.screen === 'turistbyra');

      if (inQuestions && !quiz.answered) {
        const current = quiz.questions[quiz.index];
        if (!current) return;
        /**
         * En reglagefråga har inga alternativ. Piltangenterna hör till
         * reglaget, och Enter lämnar in det tal som står inställt.
         */
        if (current.question.reglage) {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          const input = this.root.querySelector<HTMLInputElement>('.reglage-input');
          if (!input) return;
          event.preventDefault();
          this.answerQuestion(0, Number(input.value));
          return;
        }
        const key = event.key.toLowerCase();
        // 1-4 och a-d pekar på samma alternativ, i visningsordning.
        const digit = '1234'.indexOf(key);
        const letter = 'abcd'.indexOf(key);
        const pick = digit >= 0 ? digit : letter;
        if (pick >= 0 && pick < current.options.length) {
          event.preventDefault();
          playSound('klick');
          this.answerQuestion(pick);
        }
        return;
      }

      if (inQuestions && quiz.answered && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        this.advanceQuiz();
        return;
      }

      if (event.key === 'Escape' && s.screen !== 'stad' && s.screen !== 'slut') {
        // Mitt i ett skift ligger pengarna på spel, så där backar vi inte.
        if (s.screen === 'jobb') return;
        event.preventDefault();
        this.quiz = null;
        this.go('stad');
      }
    });
  }

  // ---------------------------------------------------------------- hjälpare

  private money(amount: number): string {
    const code = this.state?.homeCurrency ?? 'SEK';
    return formatMoney(amount, code);
  }

  private get city(): City {
    const s = this.state!;
    return CITY_BY_ID[s.currentCityId]!;
  }

  private go(screen: GameState['screen']): void {
    if (screen !== 'tidning') this.kontaktSvar = null;
    // Att öppna ryggsäcken kvitterar notisen på knappen.
    if (screen === 'ryggsack' && this.state) {
      this.state.packSeen = {
        souvenirs: this.state.backpack.length,
        stamps: this.state.stamps.length,
      };
    }
    if (!this.state) return;
    // Ett arkadmoment kan ha timers igång. Stäng av dem vid skärmbyte.
    stopAllMinigames();
    const changed = this.state.screen !== screen;
    this.state.screen = screen;
    saveGame(this.state);
    // Bara ett faktiskt skärmbyte ska rulla upp till toppen.
    if (changed) this.scrollToTopNext = true;
    this.render();
  }

  /**
   * Tillbaka till startskärmen med allt nollställt. Används både av Börja om
   * i statusraden och av knappen på slutskärmen, så att de två inte kan glida
   * ifrån varandra och lämna kvar något.
   */
  private resetToStart(): void {
    stopAllMinigames();
    clearSave();
    this.state = null;
    this.quiz = null;
    this.confirmRestart = false;
    this.laggPa();
    this.travelScene = null;
    this.journeySaved = false;
    this.lastJourneyAt = undefined;
    this.toast = null;
    this.stampToast = null;
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    if (this.stampTimer !== null) {
      window.clearTimeout(this.stampTimer);
      this.stampTimer = null;
    }
    // Kartornas zoomläge hör till den avslutade resan.
    this.scrollToTopNext = true;
    this.render();
  }

  private notify(message: string): void {
    this.toast = message;
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast = null;
      this.render();
    }, 3600);
  }

  /**
   * Kör efter varje förändring: håller reda på toppnoteringar, delar ut nya
   * stämplar och sparar. Att samla det här på ett ställe gör att ingen ny
   * händelse kan glömma bort passet.
   */
  private commit(): void {
    const s = this.state;
    if (!s) return;
    s.peakMoney = Math.max(s.peakMoney, s.money);
    const earned = newStamps(s);
    // Dagen stämpeln togs trycks sedan i själva stämpeln, som ett datum.
    for (const stamp of earned) s.stampDays[stamp.id] = s.days;
    saveGame(s);
    if (earned.length > 0) {
      // Bara den första visas som kvittens; resten finns i passet.
      this.stampToast = earned[0]!;
      playSound('stampla');
      if (this.stampTimer !== null) window.clearTimeout(this.stampTimer);
      this.stampTimer = window.setTimeout(() => {
        this.stampToast = null;
        this.render();
      }, 4200);
    }
  }

  /** Drar levnadskostnad för ett antal dagar och kontrollerar konkurs. */
  /**
   * Ett tillfälle inträffar. Motorn slår om något händer, och en händelse utan
   * val verkställs på en gång - den har inget att svara på. En händelse med
   * val ligger kvar tills spelaren svarat.
   */
  private fireEvent(trigger: EventTrigger, chance?: number): void {
    const s = this.state!;
    const city = this.city;
    const event = rollEvent(s, city, trigger, chance);
    if (!event) return;
    const kostnad = dailyCost(city, s.difficulty);
    this.eventEffects = event.choices
      ? []
      : applyImmediate(s, event, city, kostnad, (n) => this.money(n));
    playSound(EVENT_LJUD[event.tone]);
    this.commit();
  }

  /** Spelaren svarar. Utfallet lottas och verkställs. */
  private answerEvent(index: number): void {
    const s = this.state!;
    const city = this.city;
    this.eventEffects = chooseEvent(
      s,
      index,
      city,
      dailyCost(city, s.difficulty),
      (n) => this.money(n)
    );
    const utfall = pendingOutcome(s);
    playSound(EVENT_LJUD[utfall?.tone ?? pendingEvent(s)?.tone ?? 'blandat']);
    this.commit();
    if (this.checkBroke()) return;
    this.render();
  }

  /** Kvitterar händelsen och går vidare. */
  private closeEvent(): void {
    const s = this.state!;
    clearEvent(s);
    this.eventEffects = null;
    this.commit();
    if (this.checkBroke()) return;
    this.render();
  }

  /**
   * Kortet som ligger över skärmen. Byggs ur tillståndet, så att en obesvarad
   * fråga finns kvar efter en omladdning i stället för att tyst försvinna.
   */
  private renderEventOverlay(): HTMLElement | null {
    const s = this.state!;
    const event = pendingEvent(s);
    if (!event) return null;
    const city = this.city;
    const besvarad = s.pendingEvent?.chosen !== undefined;
    const utfall = pendingOutcome(s);
    const rader =
      this.eventEffects ??
      describeEffect(
        pendingEffect(s),
        (n) => this.money(n),
        dailyCost(city, s.difficulty)
      );
    const kort = renderEventCard({
      event,
      city,
      ctx: eventContext(s, city),
      text: (raw) => fillText(raw, city),
      money: (n) => this.money(n),
      outcomeText: besvarad || !event.choices ? (utfall?.text ?? '') : undefined,
      outcomeTone: utfall?.tone,
      effects: besvarad || !event.choices ? rader : undefined,
      onChoose: (i) => this.answerEvent(i),
      onClose: () => this.closeEvent(),
    });
    return el('div', { class: 'event-overlay' }, kort);
  }

  private spendDays(count: number, city: City): void {
    const s = this.state!;
    const cost = dailyCost(city, s.difficulty) * count;
    s.days += count;
    s.money -= cost;
    s.spent += cost;
  }

  private checkBroke(): boolean {
    const s = this.state!;
    if (s.money > -1500) return false;
    // Även en resa som slutar i konkurs ska få med sig det den hunnit klara.
    newStamps(s);
    s.outcome = 'pank';
    s.finalScore = finalScore(s);
    s.screen = 'slut';
    this.recordJourney();
    saveGame(s);
    playSound('forlust');
    this.render();
    return true;
  }

  // ------------------------------------------------------------------ render

  private render(): void {
    // Rullningsläget måste läsas av innan innehållet rivs, annars har sidan
    // redan krympt och webbläsaren har justerat positionen.
    const keepScroll = this.scrollToTopNext ? null : window.scrollY;
    this.scrollToTopNext = false;

    /**
     * Stationen rivs innan DOM töms, annars ligger dess timers och ljudmatta
     * kvar och spelar för en skärm som inte finns längre. Är det samma station
     * som ska ritas igen sparas den däremot - noden överlever att kopplas ur
     * dokumentet, och tavlan tappar varken sina rader eller sin ljudbild.
     */
    const s0 = this.state;
    const behallStation =
      this.station !== null &&
      s0 !== null &&
      s0.screen === 'station' &&
      this.travelFilter === this.station.mode &&
      s0.currentCityId === this.station.cityId &&
      !this.travelScene;
    if (!behallStation) {
      this.station?.handle.stop();
      this.station = null;
    }

    clear(this.root);
    const s = this.state;

    if (!s) {
      this.root.append(this.renderStart());
      this.afterRender(keepScroll);
      return;
    }

    /**
     * Resesekvensen är en mellanspelsscen och ritas utan statusrad. Raden
     * visar redan den nya staden, eftersom resan är genomförd i tillståndet
     * innan filmen börjar, och skulle alltså avslöja vart man är på väg.
     */
    if (this.travelScene) {
      const scene = this.travelScene;
      const filmskal = el('div', { class: 'shell' });
      const film = el('main', { class: 'view', 'data-screen': 'resefilm' });
      this.filmNode ??= this.renderTravelFilm(scene);
      film.append(this.filmNode);
      filmskal.append(film);
      this.root.append(filmskal);
      this.afterRender(null);
      return;
    }

    const shell = el('div', { class: 'shell' });
    if (s.screen !== 'slut') shell.append(this.renderHud());

    const main = el('main', { class: 'view', 'data-screen': s.screen });
    switch (s.screen) {
      case 'stad':
        main.append(this.renderCity());
        break;
      case 'broschyr':
        main.append(this.renderBrochure());
        break;
      case 'turistbyra':
        main.append(
          this.renderQuiz(this.quiz?.kind === 'mynt' ? this.city.name : 'Turistbyrån')
        );
        break;
      case 'tidning':
        main.append(this.renderNewspaper());
        break;
      case 'jobb':
        main.append(this.renderQuiz(this.quiz?.job?.title ?? 'Arbete'));
        break;
      case 'station':
        main.append(this.renderStationScreen(this.travelFilter ?? 'buss'));
        break;
      case 'varldskarta':
        main.append(this.renderAtlas());
        break;
      case 'souvenir':
        main.append(this.renderShop());
        break;
      case 'ryggsack':
        main.append(this.renderBackpack());
        break;
      case 'telefon':
        main.append(this.renderPhone());
        break;
      case 'slut':
        main.append(this.renderEnd());
        break;
      default:
        main.append(this.renderCity());
    }
    shell.append(main);

    if (this.toast) {
      shell.append(el('div', { class: 'toast', role: 'status' }, this.toast));
    }
    if (this.stampToast) {
      shell.append(
        el(
          'div',
          { class: 'stamp-toast', role: 'status' },
          el('span', { class: 'stamp-mark' }, this.stampToast.glyph),
          el(
            'span',
            { class: 'stamp-toast-text' },
            el('strong', {}, `Ny stämpel: ${this.stampToast.name}`),
            el('span', {}, this.stampToast.desc)
          )
        )
      );
    }
    /**
     * Händelsekortet läggs sist, över allt annat. En obesvarad fråga ska inte
     * gå att klicka förbi - och en händelse kan slå till på vilken skärm som
     * helst, så kortet hör hemma här och inte i en enskild vy.
     */
    const eventCard = this.renderEventOverlay();
    if (eventCard) shell.append(eventCard);
    if (this.confirmRestart) {
      shell.append(this.renderRestartDialog());
    }
    this.root.append(shell);
    this.afterRender(keepScroll);
  }

  /**
   * Återställer rullning och flyttar fokus efter en ombyggnad. Fokus måste
   * sättas om explicit, eftersom elementet som var fokuserat har hunnit
   * tas bort ur dokumentet och fokus då hamnar på body.
   */
  private afterRender(keepScroll: number | null): void {
    if (keepScroll === null) window.scrollTo(0, 0);
    else window.scrollTo(0, keepScroll);

    const target = this.focusAfterRender;
    this.focusAfterRender = null;
    // preventScroll, så att fokuseringen inte rullar undan det vi just
    // återställt ovan.
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------- startskärm

  private renderStart(): HTMLElement {
    const wrap = el('div', { class: 'shell start-shell' });
    const hero = el('section', { class: 'panel hero' });
    hero.append(
      // Startskärmen saknar statusrad, så ljudknappen får en egen plats här.
      audioButton('hud-icon-btn hero-audio'),
      el('p', { class: 'kicker' }, 'Jorden runt på frågor och jobb'),
      el('h1', { class: 'title' }, 'Ryggsäckaren'),
      el(
        'p',
        { class: 'lede' },
        'Du har en enkelbiljett, för lite pengar och hela världen framför dig. ' +
          'Fyll i passet, så börjar resan.'
      ),
    );
    // Reglerna i fyra korta steg, alltid synliga: man ska inte behöva leta.
    const regler = el('ol', { class: 'loop loop-kompakt' });
    const steg: Array<[string, string]> = [
      ['Lär dig staden', 'Turistbyråns prov ger betyg.'],
      ['Ta ett jobb', 'Rätt svar är lön. Skiftet ger poäng i sitt yrkesområde.'],
      ['Gör en affär', 'Köp souvenirer billigt, sälj dem långt bort.'],
      ['Res vidare', `Minst ${MIN_CITIES_TO_FINISH} städer, sedan hem. Boendet kostar varje dag.`],
    ];
    steg.forEach(([rubrik, text], i) => {
      regler.append(
        el('li', {},
          el('span', { class: 'loop-num' }, String(i + 1)),
          el('span', { class: 'loop-text' }, el('strong', {}, rubrik), el('span', {}, text))
        )
      );
    });
    hero.append(regler);

    /**
     * Spelförklaringen tar en halv skärm och behövs bara en gång. Den står
     * öppen första gången någon öppnar spelet och ligger därefter bakom
     * hjälpknappen. Utfällningen sker på plats, utan att sidan byggs om, så
     * att ett halvskrivet namn inte tappar fokus.
     */
    const hasSave = Boolean(loadGame());
    if (hasSave) {
      const resumeRow = el('div', { class: 'row' });
      resumeRow.append(
        button(
          'Fortsätt sparad resa',
          () => {
            const saved = loadGame();
            if (!saved) return;
            this.state = saved;
            if (saved.screen === 'jobb' || saved.screen === 'turistbyra') {
              saved.screen = 'stad';
            }
            this.scrollToTopNext = true;
            this.render();
          },
          { class: 'btn btn-primary' }
        ),
        button(
          'Radera sparfil',
          () => {
            clearSave();
            this.render();
          },
          { class: 'btn btn-ghost' }
        )
      );
      hero.append(resumeRow);
    }
    wrap.append(hero);

    /**
     * Ordningen är medveten: först vilket slags resenär man är, sedan vem man
     * är, och sist var man är född. Svårighetsgraden färgar allt annat, så den
     * ska väljas innan man börjar fundera på städer.
     */
    /**
     * Namn och läge delar panel. Två paneler med var sin rubrik, brödtext och
     * luft gjorde startskärmen en och en halv skärm längre på en telefon än
     * den behövde vara, för två fält.
     */
    // ---- resenärstyp, överst: valet färgar allt som står i passet
    const diffPanel = el('section', { class: 'panel' });
    diffPanel.append(
      el('h2', {}, 'Hur van resenär är du?'),
      el(
        'p',
        { class: 'muted' },
        'Samma spel och samma regler – det är kraven som skiljer. Valet gäller hela resan.'
      )
    );
    const diffRow = el('div', {
      class: `mode-grid ${this.showModeDetails ? 'mode-grid-open' : ''}`,
    });
    const modes: Difficulty[] = ['turist', 'globetrotter'];
    for (const id of modes) {
      const info = DIFFICULTY_INFO[id];
      const selected = this.startPick.difficulty === id;
      const bullets = el('ul', { class: 'mode-bullets' });
      for (const line of info.bullets) bullets.append(el('li', {}, line));
      diffRow.append(
        button(
          el('span', { class: 'mode-body' },
            el('span', { class: 'mode-head' },
              el('span', { class: 'mode-name' }, info.name),
              el('span', { class: 'mode-check', 'aria-hidden': 'true' }, selected ? '✓' : '')
            ),
            el('span', { class: 'mode-tagline' }, info.tagline),
            bullets
          ),
          () => {
            this.startPick.difficulty = id;
            playSound('valj');
            this.render();
          },
          {
            class: `mode ${selected ? 'mode-on' : ''}`,
            'aria-pressed': selected ? 'true' : 'false',
            'data-sound': 'av',
          }
        )
      );
    }
    diffPanel.append(diffRow);
    const modeToggle = button(
      this.showModeDetails ? 'Dölj skillnaderna' : 'Vad skiljer lägena?',
      () => {
        this.showModeDetails = !this.showModeDetails;
        diffRow.classList.toggle('mode-grid-open', this.showModeDetails);
        modeToggle.textContent = this.showModeDetails
          ? 'Dölj skillnaderna'
          : 'Vad skiljer lägena?';
        modeToggle.setAttribute('aria-expanded', this.showModeDetails ? 'true' : 'false');
      },
      {
        class: 'btn btn-ghost btn-small mode-toggle',
        'aria-expanded': this.showModeDetails ? 'true' : 'false',
      }
    );
    diffPanel.append(modeToggle);
    wrap.append(diffPanel);

    /**
     * Passet. Namn och födelseort fylls i direkt i passets personuppgiftssida,
     * med fotoruta, myndighetsrader och en maskinläsbar rad som skriver om
     * sig medan man skriver. Det är samma pass som sedan ligger i ryggsäcken.
     */
    const pass = el('section', { class: 'passport startpass' });
    const sida = el('div', { class: 'passport-page passport-data startpass-sida' });
    sida.append(
      el('div', { class: 'passport-head' },
        el('span', {}, 'Ryggsäckarpass · Passport'),
        el('span', {}, 'Sid. 1')
      )
    );

    // Fotorutan. Fotografen kom inte.
    const foto = el('div', { class: 'pass-foto', 'aria-hidden': 'true' },
      el('span', { class: 'pass-foto-ord' }, 'FOTO'),
      el('span', { class: 'pass-foto-not' }, 'Fotografen kom inte. Se ut som du brukar.'),
      el('span', { class: 'pass-foto-stamp' }, 'GODKÄND')
    );

    let uppdateraStart: () => void = () => {};
    const nameInput = el('input', {
      class: 'field name-input pdata-input',
      type: 'text',
      maxlength: '24',
      placeholder: 'SKRIV DITT NAMN',
      'aria-label': 'Ditt namn',
      value: this.startPick.name,
      autocomplete: 'off',
      spellcheck: 'false',
    }) as HTMLInputElement;
    const foddValue = el('span', { class: 'pdata-value' });

    sida.append(
      el('div', { class: 'startpass-topp' },
        foto,
        el('div', { class: 'startpass-namn' },
          el('span', { class: 'pdata-label' }, 'Namn'),
          nameInput,
          el('span', { class: 'pdata-label' }, 'Född i'),
          foddValue
        )
      )
    );

    // ---- född i: sökfältet och listan
    const search = el('input', {
      class: 'field search',
      type: 'search',
      placeholder: 'Sök stad eller land',
      'aria-label': 'Sök födelsestad',
      value: this.cityFilter,
    }) as HTMLInputElement;
    const list = el('div', { class: 'city-list' });
    const listRam = el('div', { class: 'city-list-ram' }, list);
    const listRakna = el('p', { class: 'city-list-antal' });
    const uppdateraSkugga = () => {
      const kvar = list.scrollHeight - list.scrollTop - list.clientHeight;
      listRam.dataset['slut'] = kvar <= 4 ? 'ja' : 'nej';
      listRam.dataset['rullbar'] = list.scrollHeight > list.clientHeight + 4 ? 'ja' : 'nej';
    };
    list.addEventListener('scroll', uppdateraSkugga);

    const cityCard = el('div', { class: 'city-card' });
    const paintCityCard = () => {
      clear(cityCard);
      const c = CITY_BY_ID[this.startPick.cityId]!;
      const bild = photoImg(c, 'city-card-photo', cityCard);
      cityCard.append(
        bild,
        el('div', { class: 'city-card-body' },
          el('p', { class: 'kicker' }, c.country),
          el('h3', { class: 'city-card-name' }, c.name),
          el('p', { class: 'city-card-blurb' }, c.blurb),
          el('div', { class: 'city-card-facts' },
            el('span', {}, `Sevärdhet: ${c.landmark}`),
            el('span', {},
              `Valuta: ${CURRENCIES[c.currency]?.name ?? c.currency}`),
            el('span', {}, `Prisnivå: ${prisniva(c.costIndex)}`)
          )
        )
      );
    };

    const paintPass = () => {
      const c = CITY_BY_ID[this.startPick.cityId]!;
      foddValue.textContent = `${c.name}, ${c.country}`;
    };

    const valjStad = (c: City) => {
      this.startPick.cityId = c.id;
      playSound('valj');
      paintCityCard();
      paintList();
      paintPass();
      uppdateraStart();
    };

    const paintList = () => {
      clear(list);
      const needle = searchKey(this.cityFilter.trim());
      const matches = CITIES.filter(
        (c) =>
          needle === '' ||
          searchKey(c.name).includes(needle) ||
          searchKey(c.country).includes(needle)
      );
      if (matches.length === 0) {
        list.append(el('p', { class: 'muted' }, 'Ingen stad matchar sökningen.'));
        return;
      }
      const svenska = matches.filter((c) => c.country === 'Sverige');
      const ovriga = matches.filter((c) => c.country !== 'Sverige');
      const grupp = (rubrik: string, stader: City[]) => {
        if (stader.length === 0) return;
        list.append(el('h3', { class: 'city-group' }, rubrik));
        for (const c of stader) {
          const on = c.id === this.startPick.cityId;
          list.append(
            button(
              el('span', { class: 'city-row' },
                el('span', { class: 'city-row-name' }, c.name),
                el('span', { class: 'city-row-country' }, c.country)
              ),
              () => valjStad(c),
              { class: `city-row-btn ${on ? 'city-row-on' : ''}`, 'data-sound': 'av' }
            )
          );
        }
      };
      const ordning = ['stockholm', 'goteborg', 'malmo', 'vasteras', 'koping'];
      svenska.sort(
        (a, b) =>
          (ordning.indexOf(a.id) + 1 || 99) - (ordning.indexOf(b.id) + 1 || 99)
      );
      listRakna.textContent =
        matches.length === CITIES.length
          ? `${CITIES.length} städer. Rulla i listan eller sök.`
          : `${matches.length} ${matches.length === 1 ? 'träff' : 'träffar'}.`;
      grupp('Sverige', svenska);
      for (const region of Object.keys(REGION_LABELS)) {
        grupp(
          REGION_LABELS[region] ?? region,
          ovriga
            .filter((c) => c.region === region)
            .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
        );
      }
    };

    search.addEventListener('input', () => {
      this.cityFilter = search.value;
      paintList();
    });
    nameInput.addEventListener('input', () => {
      this.startPick.name = nameInput.value;
      uppdateraStart();
    });

    paintCityCard();
    paintList();
    paintPass();
    requestAnimationFrame(uppdateraSkugga);

    const fodd = el('div', { class: 'passport-page startpass-sida startpass-fodd' });
    fodd.append(
      el('div', { class: 'passport-head' },
        el('span', {}, 'Födelseort · Place of birth'),
        el('span', {}, 'Sid. 2')
      ),
      el('div', { class: 'row' }, search),
      listRakna,
      listRam
    );
    // Vykortet på passets första sida, under namnet: så ser man vart man hör.
    sida.append(cityCard);

    pass.append(el('div', { class: 'passport-spread startpass-spread' }, sida, fodd));
    wrap.append(pass);

    const actions = el('div', { class: 'panel actions-panel' });
    const startBtn = button(
      '',
      () => {
        const name = this.startPick.name.trim();
        if (!name) {
          /**
           * Ingen notis här: notify() ritar inte om av sig själv, och ett
           * render() skulle byta ut fältet och slå ut fokus vi just satt.
           * Fokus plus en kort skakning säger samma sak, direkt vid fältet.
           */
          nameInput.focus();
          nameInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
          nameInput.classList.remove('input-nudge');
          void nameInput.offsetWidth;
          nameInput.classList.add('input-nudge');
          return;
        }
        // Förklaringen räknas som läst först när någon faktiskt reser iväg.
        markeraHjalpSedd();
        const city = CITY_BY_ID[this.startPick.cityId]!;
        this.state = createGame(
          city.id,
          city.currency,
          this.startPick.difficulty,
          name
        );
        saveGame(this.state);
        this.notify(
          `${name}, resan börjar i ${city.name}. Besök minst ${MIN_CITIES_TO_FINISH} städer innan du kommer hem.`
        );
        this.scrollToTopNext = true;
        this.render();
      },
      { class: 'btn btn-primary btn-big' }
    );
    const paintStartButton = () => {
      const ready = this.startPick.name.trim().length > 0;
      const stad = CITY_BY_ID[this.startPick.cityId]!;
      startBtn.textContent = ready
        ? `Res iväg från ${stad.name}`
        : 'Skriv ditt namn först';
      startBtn.classList.toggle('btn-waiting', !ready);
    };
    paintStartButton();
    uppdateraStart = paintStartButton;
    actions.append(startBtn);
    wrap.append(actions);

    const journal = this.renderJournal();
    if (journal) wrap.append(journal);

    wrap.append(
      el(
        'p',
        { class: 'footnote' },
        'Ett hyllningsspel till Backpacker 2. Frågor och innehåll är nyskrivna.'
      )
    );
    return wrap;
  }

  /**
   * Resedagboken. Visas på startskärmen så att man ser vad man ska slå, och
   * på slutskärmen så att den nyss avslutade resan hamnar i sitt sammanhang.
   * `highlightAt` markerar raden som just lades till.
   */
  private renderJournal(highlightAt?: number): HTMLElement | null {
    const entries = this.latestHighscores.length
      ? this.latestHighscores
      : loadHighscores();
    if (entries.length === 0) return null;

    const panel = el('section', { class: 'panel' });
    panel.append(
      el('div', { class: 'panel-head' },
        el('h2', {}, 'Resedagboken'),
        el(
          'span',
          { class: 'tag' },
          entries.length === 1 ? 'En resa' : `${entries.length} resor`
        )
      ),
      el(
        'p',
        { class: 'muted' },
        'Dina avslutade resor, bäst först. De sparas i den här webbläsaren.'
      )
    );

    const list = el('div', { class: 'journal' });
    entries.forEach((h, i) => {
      const isNew = highlightAt !== undefined && h.at === highlightAt;
      const row = el('article', {
        class: `journal-row ${isNew ? 'journal-new' : ''}`,
      });
      const date = new Date(h.at).toLocaleDateString('sv-SE');
      row.append(
        el('span', { class: 'journal-rank' }, `${i + 1}`),
        el('span', { class: 'journal-body' },
          el('span', { class: 'journal-title' },
            h.title,
            isNew ? el('span', { class: 'journal-flag' }, 'Nyss') : null
          ),
          el(
            'span',
            { class: 'journal-meta' },
            `${h.playerName ? `${h.playerName} · ` : ''}` +
              `${DIFFICULTY_INFO[h.difficulty].name} · ${h.cities} städer på ${h.days} dagar · ` +
              `${h.accuracy}% rätt · ${h.stamps} stämplar · ` +
              `${h.outcome === 'vinst' ? `hem till ${h.homeCityName}` : 'pank på vägen'} · ${date}`
          ),
          h.bestCity && h.worstCity
            ? el(
                'span',
                { class: 'journal-cities' },
                `Bäst koll: ${h.bestCity.name} (${h.bestCity.correct}/${h.bestCity.total})` +
                  ` · Sämst: ${h.worstCity.name} (${h.worstCity.correct}/${h.worstCity.total})`
              )
            : null
        ),
        el('span', { class: 'journal-score' }, h.score.toLocaleString('sv-SE'))
      );
      list.append(row);
    });
    panel.append(list);
    return panel;
  }

  /**
   * Vad du kunde och inte kunde, stad för stad. Kräver ett par besvarade
   * frågor per stad för att inte utse en vinnare på ett enda lyckoskott.
   */
  private renderCityKnowledge(): HTMLElement | null {
    const s = this.state!;
    const { best, worst } = cityKnowledge(s, (id) => CITY_BY_ID[id]?.name);
    if (!best || !worst) return null;
    const panel = el('section', { class: 'panel' });
    panel.append(el('h2', {}, 'Vad kunde du bäst?'));
    const grid = el('div', { class: 'know-grid' });
    const card = (
      label: string,
      city: { name: string; correct: number; total: number },
      tone: string
    ) =>
      el('div', { class: `know know-${tone}` },
        el('span', { class: 'know-label' }, label),
        el('span', { class: 'know-city' }, city.name),
        el(
          'span',
          { class: 'know-share' },
          `${city.correct} av ${city.total} rätt · ${Math.round(
            (city.correct / city.total) * 100
          )}%`
        )
      );
    grid.append(
      card('Bäst koll', best, 'bra'),
      card('Mest att läsa på', worst, 'svag')
    );
    panel.append(grid);
    return panel;
  }

  // -------------------------------------------------------------------- HUD

  private renderHud(): HTMLElement {
    const s = this.state!;
    const city = this.city;
    const hud = el('header', { class: 'hud' });

    const left = el('div', { class: 'hud-place' });
    left.append(
      el('span', { class: 'hud-city' }, city.name),
      el('span', { class: 'hud-country' }, city.country),
      // Läget syns hela resan, så att man vet vilka regler som gäller.
      el(
        'span',
        {
          class: `hud-mode hud-mode-${s.difficulty}`,
          title: DIFFICULTY_INFO[s.difficulty].tagline,
        },
        DIFFICULTY_INFO[s.difficulty].name
      )
    );

    const stats = el('div', { class: 'hud-stats' });
    stats.append(
      stat('Kassa', this.money(s.money), s.money < 0 ? 'bad' : undefined),
      stat('Dag', String(s.days)),
      stat('Städer', `${new Set(s.visited).size}/${CITIES.length}`),
      stat('Stämplar', `${s.stamps.length}/${STAMPS.length}`),
      stat('Skuld', this.money(s.debt), s.debt > 0 ? 'warn' : undefined)
    );

    // Börja om finns alltid tillgängligt, oavsett vilken skärm du är på.
    const restart = button('Börja om', () => this.askRestart(), {
      class: 'hud-restart',
      title: 'Avsluta resan och börja om från början',
    });

    const actions = el('div', { class: 'hud-actions' });

    /**
     * Vägen tillbaka hör hemma här uppe, inte längst ner på sidan. Statusraden
     * sitter fast i överkanten på varje skärm, så knappen är alltid inom
     * räckhåll utan att man först måste rulla förbi tjugo platsannonser.
     *
     * Under ett arbetsskift finns den inte: där ligger pengarna på spel, och
     * skiftet lämnar man genom att sjukanmäla sig.
     */
    if (s.screen !== 'stad' && s.screen !== 'slut' && s.screen !== 'jobb') {
      actions.append(
        button(
          el('span', { class: 'hud-back-body' },
            el('span', { class: 'hud-back-pil', 'aria-hidden': 'true' }, '\u2190'),
            el('span', {}, 'Till staden')
          ),
          () => {
            this.quiz = null;
            this.travelFilter = null;
            this.go('stad');
          },
          {
            class: 'hud-back',
            title: `Tillbaka till ${city.name}`,
            'aria-label': `Tillbaka till ${city.name}`,
          }
        )
      );
    }

    /**
     * Ryggsäcken ligger uppe till höger på varje skärm, större än de andra
     * knapparna. Den var förut en skylt bland tio andra på stadsbilden, vilket
     * betydde att man fick resa hem till staden för att titta i sin egen
     * ryggsäck. Antalet souvenirer och stämplar står på den.
     */
    let packKnapp: HTMLButtonElement | null = null;
    if (s.screen !== 'slut') {
      const packat = s.backpack.length;
      /**
       * Notisen är det som är nytt sedan ryggsäcken senast öppnades: köpta
       * souvenirer och tagna stämplar. Att visa det totala antalet såg ut
       * som en notis som aldrig gick att kvittera.
       */
      const nya =
        Math.max(0, packat - s.packSeen.souvenirs) +
        Math.max(0, s.stamps.length - s.packSeen.stamps);
      const iRyggsacken = s.screen === 'ryggsack';
      packKnapp = button(
        el('span', { class: 'hud-pack-body' },
          icon('skylt-ryggsack'),
          nya > 0 ? el('span', { class: 'hud-pack-tal' }, String(nya)) : ''
        ),
        // Knappen är en växel: i ryggsäcken tar den en tillbaka till staden.
        () => this.go(iRyggsacken ? 'stad' : 'ryggsack'),
        {
          class: `hud-pack ${iRyggsacken ? 'hud-pack-har' : ''}`,
          title: iRyggsacken
            ? 'Stäng ryggsäcken'
            : `Ryggsäck och pass: ${packat} ${
                packat === 1 ? 'souvenir' : 'souvenirer'
              }, ${s.stamps.length} stämplar${nya > 0 ? `, ${nya} nytt` : ''}`,
          'aria-label': iRyggsacken
            ? 'Stäng ryggsäcken och gå tillbaka till staden'
            : `Ryggsäck och pass. ${packat} souvenirer, ${s.stamps.length} stämplar${
                nya > 0 ? `, ${nya} nytt sedan sist` : ''
              }.`,
          'aria-pressed': iRyggsacken ? 'true' : 'false',
        }
      );
    }

    // Ljudknappen ligger alltid synlig i statusraden, som i förlagan.
    actions.append(audioButton('hud-icon-btn'), restart);
    // Ryggsäcken sist, alltså ytterst till höger.
    if (packKnapp) actions.append(packKnapp);

    hud.append(left, stats, actions);
    return hud;
  }

  /**
   * Frågar först, eftersom en resa kan ha pågått länge. Bekräftelsen visas som
   * en egen ruta i stället för en systemdialog, så att den fungerar likadant
   * på telefon och dator.
   */
  private askRestart(): void {
    if (this.confirmRestart) return;
    stopAllMinigames();
    this.confirmRestart = true;
    this.render();
  }

  private renderRestartDialog(): HTMLElement {
    const s = this.state!;
    const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
    const box = el('section', { class: 'panel dialog' });
    const cancel = button(
      'Nej, fortsätt spela',
      () => {
        this.confirmRestart = false;
        this.render();
      },
      { class: 'btn btn-ghost' }
    );
    box.append(
      el('h2', {}, 'Börja om från början?'),
      el(
        'p',
        { class: 'muted' },
        `Din nuvarande resa raderas: dag ${s.days}, ${
          new Set(s.visited).size
        } besökta städer och ${this.money(s.money)} i kassan. Det går inte att ångra.`
      ),
      el('div', { class: 'row' },
        button('Ja, börja om', () => this.resetToStart(), {
          class: 'btn btn-primary',
        }),
        cancel
      )
    );
    overlay.append(box);
    // Fokus läggs på det ofarliga valet, så att ett slentrianmässigt Enter
    // inte råkar radera resan.
    this.focusAfterRender = cancel;
    return overlay;
  }

  // ------------------------------------------------------------------- stad

  private renderCity(): HTMLElement {
    const s = this.state!;
    const city = this.city;
    const p = getProgress(s, city.id);
    const wrap = el('div', { class: 'stack' });

    // Stadsvyn öppnar med ett vykort av staden, likt förlagan. Namn och
    // land ligger ovanpå bilden; saknas fotot faller vyn tillbaka på en
    // enfärgad bricka (klassen no-photo) i stället för en bruten bildikon.
    /**
     * Vädret och tiden på dygnet färgar fotot. Ingenting av det påverkar
     * spelet; det finns för att Bangkok i monsunregn en kväll och Bangkok i
     * sol en morgon ska vara två olika bilder av samma stad.
     */
    const vader = weatherFor(city, s.startDate, s.days);
    const hero = el('section', { class: 'city-hero' });
    hero.append(
      photoImg(city, 'city-hero-img', hero),
      el('div', { class: 'city-hero-scrim' }),
      el(
        'div',
        // Texten ligger överst i bilden; skyltarna tar underkanten.
        { class: 'city-hero-text city-hero-text-top' },
        el(
          'p',
          { class: 'kicker' },
          `${city.country} · ${CURRENCIES[city.currency]?.name ?? city.currency}`
        ),
        el('h1', { class: 'city-hero-title' }, city.name),
        this.renderWeatherPill(vader),
        el('p', { class: 'city-vader-rad' }, vader.line)
      ),
    );

    /**
     * Skyltarna ligger på stadsbilden, som i förlagan, i stället för i en
     * meny under den. Raden med förklaringen byts ut mot beskrivningen av den
     * skylt man pekar på, så att texten finns kvar för den som behöver den
     * utan att ta plats hela tiden.
     */
    const hint = el(
      'p',
      { class: 'sign-hint' },
      'Tryck på en skylt för att gå dit.'
    );
    /** Uppvända ikoner, i en rad under bilden där de är lätta att hitta. */
    const signs = el('div', { class: 'signs' });
    /** Nedvända mynt, utspridda över stadsbilden. */
    const mynt = el('div', { class: 'city-coins' });

    /**
     * En plats i staden. Antingen en av stadens funktioner, en mystikbricka
     * som döljer en händelse, eller en frågebricka om staden man står i.
     */
    interface Plats {
      id: string;
      ikon: IconName;
      namn: string;
      beskrivning: string;
      onClick: () => void;
      /**
       * En bricka som löser ut sig själv när den vänds: mystikbrickorna och
       * frågebrickan. De försvinner efteråt.
       */
      bricka?: boolean;
      /**
       * En handling som bara går att göra en gång per stad. Till skillnad från
       * en bricka vänds den upp som vilken ikon som helst och används sedan
       * när man vill - men bara den gången.
       */
      engangs?: boolean;
      /** Sant när platsen är förbrukad och ska bära en bock. */
      klar?: boolean;
    }

    const platser: Plats[] = [];
    const plats = (
      id: string,
      ikon: IconName,
      namn: string,
      beskrivning: string,
      onClick: () => void,
      extra: Partial<Plats> = {}
    ) => platser.push({ id, ikon, namn, beskrivning, onClick, ...extra });

    plats(
      'turistbyra',
      'skylt-info',
      'Turistbyrån',
      p.visits === 0
        ? 'Svara på frågor om staden för att få ett betyg som öppnar bättre jobb.'
        : `Gör om provet för att höja ditt betyg (nu ${p.rating}/100).`,
      () => {
        playSound('sida');
        this.go('broschyr');
      }
    );
    plats('tidning', 'skylt-tidning', 'Tidningen', 'Läs platsannonserna och ta ett arbetsskift.', () => {
      playSound('sida');
      this.go('tidning');
    });
    plats(
      'souvenir',
      'skylt-souvenir',
      'Souvenirer',
      'Köp lokalt och sälj där varan är eftertraktad.',
      () => {
        playSound('marknad');
        this.go('souvenir');
      }
    );
    /**
     * Stationerna. En skylt sätts upp bara om färdsättet faktiskt tar en
     * någonstans: på Island finns varken buss eller tåg som når en annan stad
     * i spelet, så där står bara flygplatsen.
     */
    const stationer: Array<[TransportMode, IconName, string, string]> = [
      ['buss', 'skylt-buss', 'Busstation', 'Långsamt och billigt till närbelägna städer.'],
      ['tag', 'skylt-tag', 'Tågstation', 'Bekvämt och lagom snabbt på räls.'],
      ['farja', 'skylt-farja', 'Hamnen', 'Färjor till städer på andra sidan vattnet.'],
      ['flyg', 'skylt-resa', 'Flygplats', 'Snabbast över långa avstånd, men dyrast.'],
    ];
    for (const [mode, ikon, namn, beskrivning] of stationer) {
      const antal = destinationsByMode(city, mode, s.difficulty, CITIES).length;
      if (antal === 0) continue;
      plats(
        mode,
        ikon,
        namn,
        `${beskrivning} ${antal} ${antal === 1 ? 'destination' : 'destinationer'} härifrån.`,
        () => {
          this.travelFilter = mode;
          playSound('valj');
          this.go('station');
          this.fireEvent('vantan');
          this.render();
        }
      );
    }
    /**
     * Sevärdheten och en dag ute på gatorna. Båda kostar en dag och ger
     * garanterat en händelse - och båda finns bara en gång per stad. Att kunna
     * trycka om och om igen gjorde dem till en spak att dra i, inte till något
     * man gör en gång och minns.
     */
    const stanKlar = (p.spent ?? []).includes('stan');
    plats(
      'stan',
      'skylt-stad',
      'Ut på stan',
      stanKlar
        ? `Du har redan gått runt i ${city.name}. Nästa stad har egna gator.`
        : `Gå runt på gatorna en dag och se vad som händer. Kostar en dag (${this.money(
            dailyCost(city, s.difficulty)
          )}).`,
      () => this.gaUtPaStan(),
      { engangs: true, klar: stanKlar }
    );
    const sevardKlar = (p.spent ?? []).includes('sevardhet');
    plats(
      'sevardhet',
      'skylt-sevardhet',
      city.landmark,
      sevardKlar
        ? `Du har varit vid ${city.landmark}. En gång räcker.`
        : `Tillbringa en dag vid ${city.landmark}. Kostar en dag (${this.money(
            dailyCost(city, s.difficulty)
          )}).`,
      () => this.besokSevardhet(),
      { engangs: true, klar: sevardKlar }
    );
    plats(
      'karta',
      'skylt-karta',
      'Kartan',
      'Se var i världen du står, och läs på om staden och landet.',
      () => {
        playSound('sida');
        this.go('varldskarta');
      }
    );
    plats('telefon', 'skylt-telefon', 'Telefonen', 'Ring hem och låna pengar om kassan är tom.', () => {
      playSound('telefonbabbel');
      this.go('telefon');
    });

    /**
     * Brickorna som inte är funktioner. Antalet följer stadens storlek, och
     * den största av dem är alltid en fråga om staden man står i - resten
     * döljer händelser. Båda sorterna finns bara en gång per stad.
     */
    const spent = p.spent ?? [];
    const antalBrickor = mysterySpotCount(city.id);
    const harFraga = antalBrickor >= 2;
    if (harFraga && !spent.includes('fraga')) {
      platser.push({
        id: 'fraga',
        ikon: 'skylt-mystik',
        namn: 'En fråga om staden',
        beskrivning: 'Något att svara på om platsen du står på.',
        bricka: true,
        onClick: () => this.oppnaMyntfraga(),
      });
    }
    for (let i = 0; i < antalBrickor - (harFraga ? 1 : 0); i++) {
      const id = `mystik-${i}`;
      if (spent.includes(id)) continue;
      platser.push({
        id,
        ikon: 'skylt-mystik',
        namn: 'Något händer',
        beskrivning: 'Något du inte visste fanns här.',
        bricka: true,
        onClick: () => this.oppnaMystik(id),
      });
    }

    /**
     * Ordningen lottas per stad och ligger fast. Med en fast ordning skulle en
     * spelare lära sig att första brickan alltid är turistbyrån, och då är det
     * ingen upptäckt kvar att göra.
     */
    platser.sort(
      (a, b) =>
        pseudoRandom(`${city.id}|${a.id}|ordning`) -
        pseudoRandom(`${city.id}|${b.id}|ordning`)
    );

    const revealed = p.revealed ?? [];
    /** Hemstaden känner man till. Där ligger funktionerna uppvända från start. */
    const arVand = (pl: Plats) =>
      revealed.includes(pl.id);

    const DOLD_TIPS = 'Nedvänd bricka. Tryck för att se vad som finns här.';
    const nedvanda = platser.filter((pl) => !arVand(pl));

    /**
     * Myntens placering på fotot. Bilden delas i ett rutnät och varje mynt får
     * sin egen ruta, med en lottad förskjutning inuti den. Utan rutnätet
     * hamnar två mynt ovanpå varandra så fort det är fler än ett par, och en
     * rad längs nederkanten var vad vi ville bort från.
     *
     * Övre vänstra hörnet lämnas fritt: där står stadens namn.
     */
    /**
     * Rutnätet måste rymma alla brickor på en gång. En stad kan ha elva
     * funktioner och fyra brickor, alltså femton mynt; med tolv rutor lade sig
     * två av dem ovanpå varandra och det gick inte att träffa den understa.
     */
    const KOLUMNER = 5;
    const RADER = 4;
    const rutor: number[] = [];
    for (let r = 0; r < RADER; r++) {
      for (let k = 0; k < KOLUMNER; k++) {
        // Stadsnamnet och valutaraden tar fyra av fem rutor i översta raden;
        // "Argentina · argentinska pesos" når åttio procent av bredden.
        if (r === 0 && k < 4) continue;
        rutor.push(r * KOLUMNER + k);
      }
    }
    const valdaRutor = rutor
      .map((ruta) => ({
        ruta,
        k: pseudoRandom(`${city.id}|ruta|${ruta}`),
      }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.ruta);

    nedvanda.forEach((pl) => {
      /**
       * Rutan väljs efter platsens index i HELA listan, inte bland de ovända.
       * Räknar man bland de ovända flyttar sig alla mynt bakom det man just
       * vände, och det ser ut som om myntet byttes ut mot ett annat.
       */
      const ruta = valdaRutor[platser.indexOf(pl) % valdaRutor.length]!;
      const rad = Math.floor(ruta / KOLUMNER);
      const kol = ruta % KOLUMNER;
      const jx = pseudoRandom(`${city.id}|${pl.id}|x`);
      const jy = pseudoRandom(`${city.id}|${pl.id}|y`);
      /**
       * Förskjutningen hålls liten. Ett helt fritt läge inuti rutan låter två
       * grannar glida ihop tills de överlappar, och då är den ena omöjlig att
       * trycka på.
       */
      const vanster = ((kol + 0.35 + jx * 0.3) / KOLUMNER) * 100;
      // Översta raden ligger under valutaraden, inte bredvid den.
      const topp = ((rad + (rad === 0 ? 0.6 : 0.35) + jy * 0.3) / RADER) * 100;
      /**
       * Myntet har två sidor. Framsidan är silver med kompassrosen; baksidan
       * är det brickan visar sig vara: funktionens egen ikon, en stjärna för
       * en händelse, ett frågetecken för en fråga. Vändningen slutar med
       * baksidan upp, och den ligger kvar en stund innan något händer - så
       * att man hinner se vad man vände upp.
       */
      const baksidaIkon: IconName = pl.id === 'fraga' ? 'fraga' : pl.ikon;
      const b = button(
        el('span', { class: 'coin-3d' },
          el('span', { class: 'coin-face coin-face-fram' }, icon('mynt')),
          el('span', { class: `coin-face coin-face-bak ${pl.bricka ? 'coin-face-bricka' : ''}` },
            icon(baksidaIkon)
          ),
          el('span', { class: 'coin-edge', 'aria-hidden': 'true' })
        ),
        // Mystik- och frågebrickor löser ut sig själva när de vänds. En
        // funktion vänds bara upp och ligger sedan kvar i raden nedanför.
        () => this.vandBricka(pl.id, pl.bricka ? pl.onClick : undefined),
        {
          class: 'city-coin',
          style:
            `left:${vanster.toFixed(1)}%;top:${topp.toFixed(1)}%;` +
            // Varje mynt vaggar i egen fas och eget tempo, annars rör sig
            // hela rutan i takt och det ser ut som ett enda mynt.
            `--fas:${(-pseudoRandom(`${city.id}|${pl.id}|fas`) * 3.6).toFixed(2)}s;` +
            `--takt:${(3.2 + pseudoRandom(`${city.id}|${pl.id}|takt`) * 1.2).toFixed(2)}s`,
          title: DOLD_TIPS,
          'aria-label': DOLD_TIPS,
          'data-spot': pl.id,
        }
      );
      mynt.append(b);
    });

    for (const pl of platser) {
      if (!arVand(pl)) continue;
      const b = button(
        el('span', { class: 'sign-body' },
          el('span', { class: `sign-badge ${pl.klar ? 'sign-badge-klar' : ''}` },
            icon(pl.ikon),
            pl.klar ? el('span', { class: 'sign-bock', 'aria-hidden': 'true' }, '\u2713') : ''
          ),
          el('span', { class: 'sign-name' }, pl.namn)
        ),
        () => {
          if (pl.klar) return;
          pl.onClick();
        },
        {
          class: `sign ${pl.klar ? 'sign-klar' : ''} ${this.nyBricka === pl.id ? 'sign-ny' : ''}`,
          title: pl.beskrivning,
          'aria-label': `${pl.namn}. ${pl.beskrivning}`,
          'data-spot': pl.id,
          disabled: pl.klar ? true : undefined,
        }
      );
      const visa = () => {
        hint.textContent = pl.beskrivning;
      };
      const doljs = () => {
        hint.textContent =
          nedvanda.length > 0
            ? `${nedvanda.length} ${
                nedvanda.length === 1 ? 'bricka' : 'brickor'
              } kvar att vända på.`
            : 'Tryck på en skylt för att gå dit.';
      };
      b.addEventListener('pointerenter', visa);
      b.addEventListener('focus', visa);
      b.addEventListener('pointerleave', doljs);
      b.addEventListener('blur', doljs);
      signs.append(b);
    }
    if (nedvanda.length > 0) {
      hint.textContent =
        revealed.length === 0 && city.id !== s.homeCityId
          ? 'Du har aldrig varit här. Vänd på brickorna för att se vad staden har.'
          : `${nedvanda.length} ${
              nedvanda.length === 1 ? 'bricka' : 'brickor'
            } kvar att vända på.`;
    }
    hero.append(mynt);
    // Inslaget spelas en gång; nästa omritning ska inte spela det igen.
    this.nyBricka = null;
    // Ikonraden ligger under fotot, inte ovanpå det: fotot är stadsbilden och
    // ska synas, och en uppvänd ikon ska vara lätt att hitta igen.
    wrap.append(
      hero,
      signs,
      el('div', { class: 'hero-foot' },
        hint,
        el(
          'a',
          {
            class: 'photo-credit',
            href: './cities/ATTRIBUTION.md',
            target: '_blank',
            rel: 'noopener',
            title: 'Fotokrediter',
          },
          'Foto: Wikimedia Commons'
        )
      )
    );

    // Snabbguiden visas en enda gång, i startstaden, innan första resan.
    if (!s.seenIntro) {
      const intro = el('section', { class: 'panel intro' });
      intro.append(
        el('p', { class: 'kicker' }, 'Så här går det till'),
        el('h2', {}, 'Din första dag'),
        el(
          'ol',
          { class: 'intro-steps' },
          el('li', {}, 'Gå till turistbyrån. Provet ger ett stadsbetyg som öppnar bättre jobb.'),
          el('li', {}, 'Ta ett skift ur tidningen. Varje rätt svar är en dagslön, och sista passet är ett arkadmoment.'),
          el('li', {}, 'Köp en souvenir där den tillverkas och sälj den långt hemifrån.'),
          el('li', {}, `Res vidare. Besök minst ${MIN_CITIES_TO_FINISH} städer och kom tillbaka hit för att avsluta resan.`)
        ),
        el(
          'p',
          { class: 'muted' },
          'Boendet dras varje dag, så tid är också pengar. På tangentbordet svarar du med 1-4 eller A-D.'
        ),
        button(
          'Jag är med',
          () => {
            s.seenIntro = true;
            this.commit();
            this.render();
          },
          { class: 'btn btn-primary' }
        )
      );
      wrap.append(intro);
    }

    const antalBesok = s.visited.filter((id) => id === city.id).length;
    const ordningstal = (n: number) =>
      n === 2 ? 'Andra' : n === 3 ? 'Tredje' : n === 4 ? 'Fjärde' : `${n}:e`;
    const aterbesok =
      antalBesok > 1 && p.firstDay !== undefined && p.firstDay < s.days
        ? `${ordningstal(antalBesok)} besöket i ${city.name}. Första gången var dag ${p.firstDay}.`
        : '';
    const info = el('section', { class: 'panel city-panel' });
    info.append(
      el('p', { class: 'lede' }, city.blurb),
      el(
        'p',
        { class: 'muted' },
        `Vandrarhem och mat kostar ${this.money(
          dailyCost(city, s.difficulty)
        )} per dag. Stadsbetyg: ${p.rating}/100.`
      ),
      // Ett återbesök ska kännas som ett återbesök, inte som en ny stad.
      aterbesok ? el('p', { class: 'city-aterbesok' }, aterbesok) : ''
    );
    wrap.append(info);

    if (s.currentCityId === s.homeCityId && new Set(s.visited).size > 1) {
      const finish = el('section', { class: 'panel' });
      const enough = canFinish(s);
      finish.append(
        el('h2', {}, 'Avsluta resan'),
        el(
          'p',
          { class: 'muted' },
          enough
            ? 'Du är hemma igen. Avsluta resan och räkna ihop poängen.'
            : `Du är hemma, men har bara besökt ${
                new Set(s.visited).size
              } av minst ${MIN_CITIES_TO_FINISH} städer. Res vidare först.`
        )
      );
      if (enough) {
        finish.append(
          button(
            'Kom hem och räkna poäng',
            () => {
              // Passet stämplas färdigt innan poängen räknas, annars går de
              // stämplar som förtjänas av själva hemkomsten förlorade och
              // räknas heller inte in i slutpoängen.
              this.commit();
              s.outcome = 'vinst';
              s.finalScore = finalScore(s);
              this.recordJourney();
              playSound('seger');
              this.go('slut');
            },
            { class: 'btn btn-primary' }
          )
        );
      }
      wrap.append(finish);
    }

    return wrap;
  }

  // ----------------------------------------------------------- turistbyrån

  /**
   * En dag ute i staden. Alltid en händelse - annars vore det bara en dag som
   * kostade pengar. Vilken sorts tillfälle det blir lottas: gatan är vanligast,
   * sevärdheten och mötet med någon lika sannolika sinsemellan.
   */
  private gaUtPaStan(): void {
    const s0 = this.state!;
    const city = this.city;
    const p = getProgress(s0, city.id);
    p.spent ??= [];
    if (p.spent.includes('stan')) return;
    p.spent.push('stan');
    playSound('valj');
    this.spendDays(1, city);
    this.commit();
    if (this.checkBroke()) return;
    // Gatan är vanligast, men ungefär var tredje gång är det någon man möter.
    const trigger: EventTrigger = Math.random() < 0.36 ? 'mote' : 'stad';
    this.fireEvent(trigger, 1);
    if (!this.state?.pendingEvent) {
      // Alla händelser för tillfället var redan förbrukade. Dagen gick ändå.
      this.notify(`En dag i ${city.name} utan att något särskilt hände.`);
    }
    this.render();
  }

  /**
   * Vänder upp en nedvänd bricka på stadsbilden.
   *
   * Vändningen får en halv sekund för sig själv innan skärmen ritas om, så att
   * myntet hinner snurra klart och landa. Utan pausen byts brickan ut mitt i
   * rörelsen och det ser ut som ett fel i stället för som en avslöjning.
   */
  private vandBricka(spotId: string, losUt?: () => void): void {
    const s = this.state!;
    const p = getProgress(s, s.currentCityId);
    if (p.revealed?.includes(spotId)) return;
    playSound('mynt');
    const knapp = this.root.querySelector<HTMLElement>(
      `.city-coin[data-spot="${spotId}"]`
    );
    knapp?.classList.add('city-coin-vand');
    // Inga fler mynt får vändas medan det här ligger och visar sig.
    this.root
      .querySelectorAll<HTMLButtonElement>('.city-coin')
      .forEach((c) => (c.disabled = true));
    this.nyBricka = spotId;
    window.setTimeout(() => {
      const nu = this.state;
      if (!nu) return;
      const prog = getProgress(nu, nu.currentCityId);
      prog.revealed ??= [];
      if (!prog.revealed.includes(spotId)) prog.revealed.push(spotId);
      if (losUt) {
        losUt();
        return;
      }
      this.commit();
      this.scrollToTopNext = false;
      this.render();
    }, 1150);
  }

  /**
   * En mystikbricka som vänts upp. Den ger en händelse ur stadens liv och
   * försvinner sedan - den fanns bara en gång.
   */
  private oppnaMystik(spotId: string): void {
    const s = this.state!;
    const p = getProgress(s, s.currentCityId);
    p.spent ??= [];
    if (!p.spent.includes(spotId)) p.spent.push(spotId);
    // Samma slags händelser som gatan och mötena ger, men utan dagskostnad:
    // det här är något man hittar, inte något man ägnar en dag åt.
    const trigger: EventTrigger =
      Math.random() < 0.3 ? 'sevardhet' : Math.random() < 0.5 ? 'mote' : 'stad';
    this.fireEvent(trigger, 1);
    if (!this.state?.pendingEvent) {
      this.notify('Det visade sig inte vara något särskilt.');
    }
    this.commit();
    this.scrollToTopNext = false;
    this.render();
  }

  /**
   * En frågebricka. En enda fråga om staden man står i, alltid med ett foto
   * till. Den kostar ingen dag - det är något man hittar, inte något man
   * ägnar en dag åt - och finns bara en gång per stad.
   */
  private oppnaMyntfraga(): void {
    const s0 = this.state!;
    const city = this.city;
    const p = getProgress(s0, city.id);
    p.spent ??= [];
    if (p.spent.includes('fraga')) return;
    const fraga = COIN_QUESTIONS[city.id];
    if (!fraga) return;
    p.spent.push('fraga');
    playSound('sida');
    this.quiz = {
      kind: 'mynt',
      questions: [prepareQuestion(fraga, s0.difficulty)],
      index: 0,
      correct: 0,
      earnings: 0,
      bonus: 0,
      streak: 0,
      bestStreak: 0,
      dayResults: [],
      phase: 'fragor',
      askedAt: performance.now(),
    };
    this.commit();
    this.go('turistbyra');
  }

  /** En dag vid stadens sevärdhet. Alltid en händelse, som gatan. */
  private besokSevardhet(): void {
    const s0 = this.state!;
    const city = this.city;
    const p = getProgress(s0, city.id);
    p.spent ??= [];
    if (p.spent.includes('sevardhet')) return;
    p.spent.push('sevardhet');
    playSound('sida');
    this.spendDays(1, city);
    this.commit();
    if (this.checkBroke()) return;
    this.fireEvent('sevardhet', 1);
    if (!this.state?.pendingEvent) {
      this.notify(`En stilla dag vid ${city.landmark}.`);
    }
    this.render();
  }

  /**
   * Turistbyråns broschyr. Gratis att läsa, och det är meningen att man ska:
   * provet handlar om staden, och här står sådant som är bra att veta innan.
   */
  private renderBrochure(): HTMLElement {
    const s = this.state!;
    const city = this.city;
    const p = getProgress(s, city.id);
    const fakta = CITY_FACTS[city.id] ?? [];
    const wrap = el('div', { class: 'stack broschyr' });

    const panel = el('section', { class: 'panel' });
    panel.append(
      el('div', { class: 'panel-head' },
        el('h2', {}, 'Turistbyrån'),
        el('span', { class: 'tag' }, city.name)
      ),
      el('p', { class: 'lede' }, city.blurb)
    );
    if (fakta.length) {
      panel.append(
        el('h3', { class: 'broschyr-rubrik' }, `Bra att veta om ${city.name}`),
        el('ul', { class: 'broschyr-lista' }, ...fakta.map((t) => el('li', {}, t)))
      );
    }
    panel.append(
      el('p', { class: 'broschyr-not' },
        p.visits === 0
          ? 'Provet är fem frågor om staden. Betyget avgör vilka jobb du får söka. Det kostar en dag.'
          : `Ditt betyg i ${city.name} är ${p.rating} av 100. Ett nytt prov kostar en dag och kan bara höja det.`
      ),
      el('div', { class: 'row' },
        button('Gör provet', () => this.startCityQuiz(), { class: 'btn btn-primary' }),
        button('Tillbaka', () => this.go('stad'), { class: 'btn btn-ghost' })
      )
    );
    wrap.append(panel);
    return wrap;
  }

  /** Väderskylten: vad det är för väder och hur mycket klockan är, lokalt. */
  private renderWeatherPill(vader: Weather): HTMLElement {
    return el('span', { class: 'city-vader', title: 'Väder och lokal tid' },
      el('span', { class: 'city-vader-glyph', 'aria-hidden': 'true' }, vader.glyph),
      el('span', {}, vader.text)
    );
  }

  private startCityQuiz(): void {
    const s = this.state!;
    const questions = cityQuizQuestions(s.currentCityId, s.difficulty, 5);
    if (questions.length === 0) {
      this.notify('Turistbyrån har stängt i dag.');
      return;
    }
    this.quiz = {
      kind: 'turistbyra',
      questions,
      index: 0,
      correct: 0,
      earnings: 0,
      dayResults: [],
      phase: 'fragor',
      askedAt: performance.now(),
      streak: 0,
      bestStreak: 0,
    };
    this.go('turistbyra');
  }

  // ------------------------------------------------------------- tidningen

  private renderNewspaper(): HTMLElement {
    const s = this.state!;
    const city = this.city;
    const p = getProgress(s, city.id);
    // Nya annonser varje vecka, så att man aldrig blir helt fast utan inkomst.
    if (p.adsRefreshedDay === undefined) p.adsRefreshedDay = s.days;
    if (s.days - p.adsRefreshedDay >= 7 && p.workedJobs.length > 0) {
      p.workedJobs = [];
      p.adsRefreshedDay = s.days;
    }
    const wrap = el('div', { class: 'stack' });

    /**
     * Tidningen är ett vitt bredsidesark: ett huvud i frakturstil, en
     * datumrad, dagens stora rubrik, en artikel i spalter med ett svartvitt
     * foto, notiser, platsannonserna och sist den personliga sidan med
     * kontaktannonser. Varje stad har sin egen tidning med eget namn och egna
     * artiklar, så att Bangkok inte läser samma blad som Berlin.
     */
    const tidning = CITY_PAPERS[city.id] ?? {
      namn: `${city.name} Daily`,
      devis: 'Oberoende morgontidning',
      grundad: 1900,
      artiklar: (CITY_HEADLINES[city.id] ?? []).map((rubrik) => ({ rubrik, text: '' })),
      notiser: [],
    };
    const artiklar = tidning.artiklar;
    const huvud = artiklar[s.days % Math.max(1, artiklar.length)];
    const andra = artiklar.length > 1 ? artiklar[(s.days + 1) % artiklar.length] : undefined;
    const notiser = tidning.notiser
      .map((n, i) => ({ n, k: pseudoRandom(`${city.id}|notis|${s.days}|${i}`) }))
      .sort((a, b) => a.k - b.k)
      .slice(0, 4)
      .map((x) => x.n);
    const vader = weatherFor(city, s.startDate, s.days);
    const datum = new Date(s.startDate);
    datum.setDate(datum.getDate() + s.days);
    const datumText = datum.toLocaleDateString('sv-SE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const nummer = 1 + ((datum.getFullYear() - tidning.grundad) * 300 + s.days * 7 + city.id.length) % 9000;

    const blad = el('section', { class: 'panel tidning', lang: 'sv' });
    blad.append(
      el('header', { class: 'tidning-huvud' },
        el('div', { class: 'tidning-ovan' },
          el('span', {}, `Grundad ${tidning.grundad}`),
          el('span', {}, `Nr ${nummer}`),
          el('span', {}, `Pris ${this.money(5)}`)
        ),
        el('h1', { class: 'tidning-namn' }, tidning.namn),
        el('p', { class: 'tidning-devis' }, tidning.devis),
        el('div', { class: 'tidning-datumrad' },
          el('span', {}, `Dag ${s.days} på resan`),
          el('span', { class: 'tidning-datum' }, datumText.charAt(0).toUpperCase() + datumText.slice(1)),
          el('span', {}, `${vader.glyph} ${vader.text}`)
        )
      )
    );

    if (huvud) {
      blad.append(el('h2', { class: 'tidning-rubrik' }, huvud.rubrik));
      const uppslag = el('div', { class: 'tidning-uppslag' });
      const foto = el('figure', { class: 'tidning-foto' },
        el('img', {
          src: `./cities/${city.id}.jpg`,
          alt: `Foto från ${city.name}`,
          loading: 'lazy',
          decoding: 'async',
        }),
        el('figcaption', {}, `${city.landmark}, ${city.name}. Arkivbild.`)
      );
      const text = el('div', { class: 'tidning-text' });
      if (huvud.text) {
        const meningar = huvud.text.split(/(?<=[.!?])\s+/);
        text.append(
          el('p', { class: 'tidning-ingress' }, meningar[0] ?? ''),
          ...(meningar.length > 1 ? [el('p', {}, meningar.slice(1).join(' '))] : [])
        );
      }
      if (andra) {
        text.append(
          el('h3', { class: 'tidning-underrubrik' }, andra.rubrik),
          el('p', {}, andra.text)
        );
      }
      if (notiser.length > 0) {
        text.append(
          el('h4', { class: 'tidning-korthet' }, 'I korthet'),
          el('ul', { class: 'tidning-notiser' }, ...notiser.map((n) => el('li', {}, n)))
        );
      }
      uppslag.append(foto, text);
      blad.append(uppslag);
    }

    // ------------------------------------------------------- platsannonser
    blad.append(
      el('div', { class: 'paper-avdelning' },
        el('h2', { class: 'paper-avdelning-namn' }, 'Platsannonser'),
        el(
          'span',
          { class: 'paper-avdelning-meta' },
          p.visits === 0 ? 'Inget stadsbetyg än' : `Stadsbetyg ${p.rating}`
        )
      ),
      p.visits === 0
        ? el('p', { class: 'muted paper-tips' },
            'Du har inte varit på turistbyrån än. Utan stadsbetyg får du bara de enklaste jobben.')
        : ''
    );

    const list = el('div', { class: 'paper-annonser' });
    for (const job of cityJobs(city)) {
      const allowed = canTakeJob(s, job);
      const worked = p.workedJobs.includes(job.id);
      const wage = wagePerCorrect(job, city, s.difficulty);
      const card = el('article', {
        class: `job ${worked ? 'job-klar' : allowed ? '' : 'job-locked'}`,
      });
      card.append(
        el('p', { class: 'annons-etikett' }, 'Sökes'),
        el('div', { class: 'job-head' },
          el('h3', {}, job.title),
          el('span', { class: `tag tag-w${job.wageClass}` }, `Löneklass ${job.wageClass}`)
        ),
        el('p', { class: 'job-employer' }, employerFor(city, job)),
        el('p', {}, job.ad),
        el(
          'p',
          { class: 'muted' },
          `${HUVUD_LABELS[job.huvud]} · ${CATEGORY_LABELS[job.category] ?? job.category} · ${
            job.shiftLength
          } arbetsdagar · ${this.money(wage)} per rätt svar`
        )
      );

      if (worked) {
        const wait = 7 - (s.days - (p.adsRefreshedDay ?? s.days));
        card.append(
          el(
            'p',
            { class: 'note' },
            `Du har redan gjort ett skift här. Nya annonser om ${Math.max(
              1,
              wait
            )} dagar.`
          )
        );
      } else if (!allowed) {
        const need = jobRequirement(job);
        const har = pointsIn(s, job.huvud);
        card.append(
          el('p', { class: 'note' },
            `${jobRequirementText(job)}. Du har ${har} av ${need.points} poäng` +
              (need.rating ? ` och ${p.rating} i betyg.` : '.')
          )
        );
      } else {
        card.append(
          button('Sök jobbet', () => this.startJob(job), {
            class: 'btn btn-primary',
          })
        );
      }
      list.append(card);
    }
    blad.append(list);

    // ------------------------------------------------------ kontaktannonser
    /**
     * Den personliga sidan. Tre annonser i veckan, lottade ur regionens
     * pool, minus dem man redan svarat på eller bläddrat förbi. Att svara
     * kostar en dag och ger något - inte alltid det annonsen lovade.
     */
    const spent = p.spent ?? [];
    const vecka = Math.floor(s.days / 7);
    const pool = annonserFor(city.region).filter(
      (a) => !spent.includes(`kontakt:${a.id}`) && !spent.includes(`bort:${a.id}`)
    );
    const valda = pool
      .map((a) => ({ a, k: pseudoRandom(`${city.id}|kontakt|${vecka}|${a.id}`) }))
      .sort((x, y) => x.k - y.k)
      .slice(0, 3)
      .map((x) => x.a);
    const svar = this.kontaktSvar;
    if (valda.length > 0 || svar) {
      blad.append(
        el('div', { class: 'paper-avdelning' },
          el('h2', { class: 'paper-avdelning-namn' }, 'Personligt'),
          el('span', { class: 'paper-avdelning-meta' }, 'Att svara kostar en dag')
        )
      );
      const sida = el('div', { class: 'kontakt-sida' });
      if (svar) {
        sida.append(
          el('article', { class: 'kontakt kontakt-svar' },
            el('p', { class: 'annons-etikett' }, 'Du svarade'),
            el('p', { class: 'kontakt-text' }, svar.text),
            svar.rader.length > 0
              ? el('ul', { class: 'kontakt-rader' },
                  ...svar.rader.map((r) => el('li', { class: `kontakt-rad kontakt-rad-${r.tone}` }, r.text))
                )
              : ''
          )
        );
      }
      for (const a of valda) {
        sida.append(
          el('article', { class: 'kontakt' },
            el('h3', { class: 'kontakt-rubrik' }, a.rubrik),
            el('p', { class: 'kontakt-text' }, a.text),
            el('p', { class: 'kontakt-signatur' }, `— ${a.signatur}`),
            el('div', { class: 'kontakt-knappar' },
              button('Svara', () => this.svaraKontakt(a), { class: 'btn btn-primary btn-small' }),
              button('Bläddra förbi', () => this.ignoreraKontakt(a.id), { class: 'btn btn-ghost btn-small' })
            )
          )
        );
      }
      blad.append(sida);
    }

    wrap.append(blad);
    return wrap;
  }

  /** Svarar på en kontaktannons: en dag går, och något händer. */
  private svaraKontakt(a: Kontaktannons): void {
    const s = this.state!;
    const city = this.city;
    const p = getProgress(s, city.id);
    p.spent ??= [];
    if (p.spent.includes(`kontakt:${a.id}`)) return;
    p.spent.push(`kontakt:${a.id}`);
    this.spendDays(1, city);
    const summa = a.utfall.reduce((n, u) => n + (u.vikt ?? 1), 0);
    let lott = Math.random() * summa;
    let utfall = a.utfall[a.utfall.length - 1]!;
    for (const u of a.utfall) {
      lott -= u.vikt ?? 1;
      if (lott <= 0) {
        utfall = u;
        break;
      }
    }
    const rader = applyEffect(
      s,
      utfall.effekt,
      city,
      dailyCost(city, s.difficulty),
      (n) => this.money(n)
    );
    const bra = rader.some((r) => r.tone === 'bra');
    const daligt = rader.some((r) => r.tone === 'daligt');
    playSound(bra && !daligt ? 'kassa' : daligt ? 'fel' : 'sida');
    this.kontaktSvar = { id: a.id, text: utfall.text, rader };
    this.commit();
    if (this.checkBroke()) return;
    this.scrollToTopNext = false;
    this.render();
  }

  /** Bläddrar förbi en annons. Den kommer inte tillbaka i den här staden. */
  private ignoreraKontakt(id: string): void {
    const s = this.state!;
    const p = getProgress(s, s.currentCityId);
    p.spent ??= [];
    if (!p.spent.includes(`bort:${id}`)) p.spent.push(`bort:${id}`);
    playSound('sida');
    this.commit();
    this.scrollToTopNext = false;
    this.render();
  }

  private startJob(job: Job): void {
    const s = this.state!;
    const questions = jobQuestions(job, s.difficulty);
    if (questions.length === 0) {
      this.notify('Ingen arbetsledare på plats i dag.');
      return;
    }
    // Felsviten från turistbyrån följer inte med in på jobbet.
    s.wrongStreak = 0;
    this.quiz = {
      kind: 'jobb',
      questions,
      index: 0,
      correct: 0,
      earnings: 0,
      job,
      dayResults: [],
      phase: 'fragor',
      askedAt: performance.now(),
      streak: 0,
      bestStreak: 0,
    };
    this.go('jobb');
  }

  // ------------------------------------------------------------------ quiz

  private renderQuiz(heading: string): HTMLElement {
    const s = this.state!;
    const q = this.quiz;
    const wrap = el('div', { class: 'stack' });

    if (!q) {
      wrap.append(
        el('section', { class: 'panel' }, el('p', {}, 'Inget pågående prov.'))
      );
      wrap.append(this.backRow('Till staden', () => this.go('stad')));
      return wrap;
    }

    const total = q.questions.length;
    const isJob = q.kind === 'jobb';

    // Arkadmomentet tar över skärmen när arbetsdagarna är avklarade.
    if (isJob && q.job && q.phase !== 'fragor') {
      return this.renderShiftFinale(q, q.job);
    }

    const current = q.questions[q.index]!;
    /** Själva frågan, med bild, bildalternativ eller reglage. */
    const q0 = current.question;

    // Arbetsplatsen får en egen rubrik med miljöbild, stämpelkort och
    // lönemätare, så att ett skift känns som en arbetsdag och inte som ett prov.
    if (isJob && q.job) {
      const job = q.job;
      const wage = wagePerCorrect(job, this.city, s.difficulty);
      // Stadens foto ligger bakom arbetsplatsen. Ett skift i Bangkok ska se
      // annorlunda ut än ett i Reykjavík, också när frågorna är desamma.
      const site = el('section', {
        class: 'panel worksite',
        style: `--foto:url("./cities/${this.city.id}.jpg")`,
      });
      site.append(
        el('div', { class: 'worksite-head' },
          el('div', {},
            el('p', { class: 'kicker' }, employerFor(this.city, job)),
            el('h1', { class: 'worksite-title' }, job.title)
          ),
          el('span', { class: `tag tag-w${job.wageClass}` }, `Löneklass ${job.wageClass}`)
        ),
        el('p', { class: 'worksite-scene' }, job.scene)
      );

      // Stämpelkort: en ruta per arbetsdag, ifylld när dagen är avklarad.
      const card = el('div', { class: 'timecard', 'aria-label': 'Stämpelkort' });
      for (let i = 0; i < total; i++) {
        const state =
          i < q.index ? (q.dayResults[i] ? 'day-ok' : 'day-fail') : i === q.index ? 'day-now' : 'day-todo';
        card.append(
          el('span', { class: `day ${state}` },
            el('span', { class: 'day-num' }, String(i + 1))
          )
        );
      }
      site.append(
        el('div', { class: 'timecard-row' },
          el('span', { class: 'timecard-label' }, 'Stämpelkort'),
          card
        )
      );

      site.append(
        el('div', { class: 'wage-row' },
          stat('Dagslön', this.money(wage)),
          stat('Intjänat', this.money(q.earnings)),
          stat('Rätt', `${q.correct}/${q.index + (q.answered ? 1 : 0)}`)
        )
      );

      // Sviten visas som en mätare med lönemultiplikatorn intill, så att det
      // syns direkt vad en obruten rad rätta svar är värd.
      const mult = comboMultiplier(q.streak);
      const combo = el('div', {
        class: `combo ${q.streak >= 2 ? 'combo-on' : ''}`,
        'aria-label': `Svarsserie ${q.streak}`,
      });
      const pips = el('div', { class: 'combo-pips' });
      for (let i = 0; i < COMBO_STEPS; i++) {
        pips.append(
          el('span', { class: `combo-pip ${i < q.streak ? 'combo-pip-on' : ''}` })
        );
      }
      combo.append(
        el('span', { class: 'combo-label' }, q.streak >= 2 ? `${q.streak} i rad` : 'Svarsserie'),
        pips,
        el(
          'span',
          { class: 'combo-mult' },
          `×${mult.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
        )
      );
      site.append(combo);
      wrap.append(site);
    }

    const panel = el('section', { class: `panel quiz ${isJob ? 'quiz-job' : ''}` });
    /**
     * Turistbyrån ligger i staden, och det ska synas. En remsa av stadens foto
     * över frågorna ger provet en plats - som i förlagan, där man aldrig
     * svarade på en fråga utan att se var man stod.
     */
    if (q.kind === 'turistbyra') {
      panel.append(
        el('figure', { class: 'quiz-plats' },
          el('img', {
            src: `./cities/${this.city.id}.jpg`,
            alt: '',
            loading: 'eager',
            decoding: 'async',
          }),
          el('figcaption', {},
            el('span', { class: 'quiz-plats-kicker' }, 'Turistbyrån'),
            el('strong', {}, this.city.name)
          )
        )
      );
    }
    panel.append(
      el('p', { class: 'kicker' },
        isJob
          ? `Arbetsdag ${q.index + 1} av ${total}`
          : `${heading} · fråga ${q.index + 1} av ${total}`
      ),
      el('div', { class: 'progress' },
        el('span', {
          class: 'progress-bar',
          /**
           * Den besvarade frågan räknas som avklarad, annars stannar mätaren
           * på fyra femtedelar när sista frågan är besvarad och når aldrig
           * hela vägen fram.
           */
          style: `width:${Math.round(((q.index + (q.answered ? 1 : 0)) / total) * 100)}%`,
        })
      ),
      el('h1', { class: 'question' }, current.question.q)
    );

    const answered = q.answered;
    /**
     * Bilden till frågan. Den ligger ovanför frågetexten, som ett fotografi i
     * en uppslagsbok - det är den som ska hinna sjunka in innan man läser vad
     * som efterfrågas.
     */
    // Remsan visar redan stadens foto; samma bild en gång till under
    // frågan vore bara upprepning.
    const bildRedanIRemsan =
      q.kind === 'turistbyra' && q0.bild === `stad:${this.city.id}`;
    if (q0.bild && !bildRedanIRemsan) {
      const bildruta = el('figure', { class: 'quiz-bild' });
      const img = el('img', {
        src: quizImageUrl(q0.bild),
        alt: quizImageAlt(q0.bild, this.city.name),
        loading: 'eager',
        decoding: 'async',
      }) as HTMLImageElement;
      img.addEventListener('error', () => bildruta.remove());
      bildruta.append(img);
      if (answered) {
        const ratt = q0.reglage
          ? Math.abs((answered.reglage ?? Number.NaN) - q0.reglage.svar) <= q0.reglage.tolerans
          : answered.picked === current.correctIndex;
        bildruta.classList.add(ratt ? 'quiz-bild-ratt' : 'quiz-bild-fel');
        bildruta.append(reaktionsLager(q0.bild, ratt));
      }
      panel.append(bildruta);
    }

    /**
     * Reglagefrågan. Inget att peka på, bara en skala att dra sig fram på och
     * en knapp att stå för svaret med. Stående för höjd och djup, liggande för
     * årtal och avstånd - riktningen ska betyda vad den brukar betyda.
     */
    if (q0.reglage) {
      const r = q0.reglage;
      const skala = el('div', {
        class: `reglage ${r.liggande ? 'reglage-liggande' : 'reglage-staende'}`,
      });
      const startvarde = answered?.reglage ?? Math.round((r.min + r.max) / 2 / r.steg) * r.steg;
      /**
       * Ett årtal skrivs utan tusentalsavgränsare. "1 989" är en summa,
       * "1989" är ett år, och skillnaden syns direkt.
       */
      const skriv = (v: number) =>
        `${r.artal ? String(v) : v.toLocaleString('sv-SE')}${
          r.enhet ? ` ${r.enhet}` : ''
        }`;
      const visning = el('div', { class: 'reglage-varde' }, skriv(startvarde));
      const input = el('input', {
        class: 'reglage-input',
        type: 'range',
        min: String(r.min),
        max: String(r.max),
        step: String(r.steg),
        value: String(startvarde),
        'aria-label': q0.q,
        disabled: answered ? true : undefined,
        ...(r.liggande ? {} : { orient: 'vertical' }),
      }) as HTMLInputElement;
      let varde = startvarde;
      input.addEventListener('input', () => {
        varde = Number(input.value);
        visning.textContent = skriv(varde);
      });
      const spann = el('div', { class: 'reglage-spann' },
        el('span', {}, r.hogst ?? skriv(r.max)),
        el('span', {}, r.lagst ?? skriv(r.min))
      );
      skala.append(visning, el('div', { class: 'reglage-bana' }, input, spann));
      panel.append(skala);
      if (!answered) {
        panel.append(
          button('OK', () => {
            if (this.quiz?.answered) return;
            this.answerQuestion(0, varde);
          }, { class: 'btn btn-primary reglage-ok' })
        );
      }
    } else {
      const bildfraga = Boolean(current.images);
      const options = el('div', {
        class: `options ${bildfraga ? 'options-bilder' : ''}`,
      });
      current.options.forEach((text, i) => {
        const classes = ['option'];
        if (bildfraga) classes.push('option-bild');
        if (answered) {
          if (i === current.correctIndex) classes.push('option-right');
          else if (i === answered.picked) classes.push('option-wrong');
          else classes.push('option-dim');
        }
        const bildId = current.images?.[i];
        const innehall = bildId
          ? el('span', { class: 'option-body option-body-bild' },
              el('span', { class: 'option-key' }, String.fromCharCode(65 + i)),
              el('img', {
                class: 'option-foto',
                src: quizImageUrl(bildId),
                // Alt-texten får inte avslöja svaret: hela uppgiften är att
                // känna igen motivet. Skärmläsare får bokstaven i stället.
                alt: `Alternativ ${String.fromCharCode(65 + i)}`,
                loading: 'eager',
                decoding: 'async',
              }),
              answered ? el('span', { class: 'option-facit' }, text) : '',
              // Rätt bild jublar; en felvald bild grimaserar och får foten.
              answered && (i === current.correctIndex || i === answered.picked)
                ? reaktionsLager(bildId, i === current.correctIndex)
                : ''
            )
          : el('span', { class: 'option-body' },
              el('span', { class: 'option-key' }, String.fromCharCode(65 + i)),
              el('span', {}, text)
            );
        const b = button(
          innehall,
          () => {
            if (this.quiz?.answered) return;
            this.answerQuestion(i);
          },
          {
            class: classes.join(' '),
            disabled: answered ? true : undefined,
            title: `Tangent ${i + 1} eller ${String.fromCharCode(65 + i)}`,
          }
        );
        options.append(b);
      });
      panel.append(options);
    }

    if (answered) {
      const right = q0.reglage
        ? Math.abs((answered.reglage ?? Number.NaN) - q0.reglage.svar) <=
          q0.reglage.tolerans
        : answered.picked === current.correctIndex;
      /**
       * Vad som var rätt. En reglagefråga har inget alternativ att peka på, så
       * där står svaret skrivet i `a[0]` - "1989", "8 849 m".
       */
      const facit = q0.reglage
        ? (q0.a[0] ??
          `${q0.reglage.svar}${q0.reglage.enhet ? ` ${q0.reglage.enhet}` : ''}`)
        : (current.options[current.correctIndex] ?? '');
      const feedback = el('div', {
        class: `feedback ${right ? 'feedback-right' : 'feedback-wrong'}`,
      });
      const headline = right
        ? q.streak >= 4
          ? `Rätt igen! ${q.streak} i rad.`
          : 'Rätt svar!'
        : 'Fel svar.';
      feedback.append(
        el('strong', {}, headline),
        el(
          'span',
          {},
          right
            ? isJob
              ? ` Dagen är avklarad och du tjänade ${this.money(answered.payout)}.`
              : ' Ett steg närmare ett bra stadsbetyg.'
            : isJob
              ? ` Rätt var: ${facit}. Dagen gav ingen lön.`
              : ` Rätt var: ${facit}.`
        )
      );
      // Bonusarna redovisas var för sig, annars ser lönen bara ut att hoppa.
      if (right && isJob && (answered.combo > 0 || answered.speed > 0)) {
        const bits: string[] = [];
        if (answered.combo > 0)
          bits.push(`svarsserie +${this.money(answered.combo)}`);
        if (answered.speed > 0)
          bits.push(`snabbt svar +${this.money(answered.speed)}`);
        feedback.append(el('p', { class: 'feedback-bonus' }, bits.join(' · ')));
      }
      if (current.question.info) {
        feedback.append(el('p', { class: 'info' }, current.question.info));
      }
      panel.append(feedback);
      const last = q.index + 1 >= total;
      const next = button(
        last
          ? isJob
            ? `Avsluta dagen och gå till ${q.job?.minigame.title.toLowerCase() ?? 'sista uppgiften'}`
            : 'Se resultatet'
          : isJob
            ? 'Nästa arbetsdag'
            : 'Nästa fråga',
        () => this.advanceQuiz(),
        { class: 'btn btn-primary btn-big' }
      );
      panel.append(next);
      panel.append(
        el('p', { class: 'keyhint' }, 'Tryck Enter för att gå vidare.')
      );
      // Fokus följer med till knappen som ska tryckas, så att svaret kan
      // kvitteras med tangentbordet utan att leta sig tillbaka dit.
      this.focusAfterRender = next;
    }

    if (!isJob) {
      panel.append(
        el('p', { class: 'muted' },
          `Rätt så här långt: ${q.correct} av ${q.index + (answered ? 1 : 0)}` +
            (q.streak >= 2 ? ` · ${q.streak} i rad` : '')
        )
      );
    }
    if (!answered) {
      panel.append(
        el(
          'p',
          { class: 'keyhint' },
          q0.reglage
            ? 'Dra reglaget till rätt tal och tryck OK. Piltangenterna finjusterar, Enter svarar.'
            : current.images
              ? 'Tryck på rätt bild, eller svara med 1-4 eller A-D.'
              : 'Svara med 1-4 eller A-D, eller tryck på alternativet.'
        )
      );
    }
    wrap.append(panel);

    if (isJob && !answered) {
      wrap.append(
        this.backRow('Sjukanmäl dig och gå (ingen lön)', () => {
          stopAllMinigames();
          this.quiz = null;
          this.go('stad');
        })
      );
    }
    void s;
    return wrap;
  }

  /**
   * Skiftets avslutande arkadmoment: först en genomgång, sedan spelet och
   * till sist resultatet med bonus.
   */
  private renderShiftFinale(q: QuizSession, job: Job): HTMLElement {
    const wrap = el('div', { class: 'stack' });
    const game = job.minigame;

    const head = el('section', { class: 'panel worksite' });
    head.append(
      el('div', { class: 'worksite-head' },
        el('div', {},
          el('p', { class: 'kicker' }, employerFor(this.city, job)),
          el('h1', { class: 'worksite-title' }, game.title)
        ),
        el('span', { class: 'tag tag-mg' }, 'Sista passet')
      )
    );
    wrap.append(head);

    if (q.phase === 'brief') {
      const panel = el('section', { class: 'panel' });
      panel.append(
        el('p', { class: 'lede' }, game.brief),
        el(
          'p',
          { class: 'muted' },
          'Går det bra får du en bonus på upp till tre dagslöner. Momentet går ' +
            'lika bra att styra med finger som med mus.'
        ),
        button('Sätt igång', () => this.startMinigame(), {
          class: 'btn btn-primary btn-big',
        })
      );
      wrap.append(panel);
      return wrap;
    }

    if (q.phase === 'spelar') {
      const panel = el('section', { class: 'panel' });
      panel.append(
        renderMinigame(
          game,
          {
            money: (amount) => this.money(amount),
            slack: arcadeSlack(this.state!.difficulty),
          },
          (result) => this.finishMinigame(result)
        )
      );
      wrap.append(panel);
      return wrap;
    }

    // Klart: visa resultatet och låt spelaren kvittera ut lönen.
    const result = q.minigameResult;
    const panel = el('section', { class: 'panel' });
    const grade = result?.perfect
      ? 'Felfritt!'
      : (result?.score ?? 0) >= 0.8
        ? 'Snyggt jobbat!'
        : (result?.score ?? 0) >= 0.5
          ? 'Godkänt.'
          : 'Det där gick trögt.';
    panel.append(
      el('h2', {}, grade),
      el('p', { class: 'lede' }, result?.summary ?? ''),
      el('div', { class: 'stat-grid' },
        stat('Frågor rätt', `${q.correct}/${q.questions.length}`),
        stat('Bonus', this.money(q.bonus ?? 0)),
        stat('Total lön', this.money(q.earnings))
      ),
      button('Kvittera ut lönen', () => this.finishQuiz(), {
        class: 'btn btn-primary btn-big',
      })
    );
    wrap.append(panel);
    return wrap;
  }

  /**
   * Ett svar lämnas in. `picked` är alternativets index; för en reglagefråga
   * skickas i stället talet spelaren dragit fram, och rättningen sker mot
   * frågans tolerans i stället för mot ett index.
   */
  private answerQuestion(picked: number, reglageVarde?: number): void {
    const s = this.state!;
    const q = this.quiz!;
    const current = q.questions[q.index]!;
    const reglage = current.question.reglage;
    const right = reglage
      ? Math.abs((reglageVarde ?? Number.NaN) - reglage.svar) <= reglage.tolerans
      : picked === current.correctIndex;
    const elapsed = performance.now() - q.askedAt;
    let payout = 0;
    let comboPart = 0;
    let speedPart = 0;

    // Frågan räknas till staden man står i, oavsett om den kom från
    // turistbyrån eller från ett jobb.
    const cityStats = getCityStats(s, s.currentCityId);
    if (right) cityStats.correct += 1;
    else cityStats.wrong += 1;

    if (right) {
      q.correct += 1;
      s.correct += 1;
      q.streak += 1;
      q.bestStreak = Math.max(q.bestStreak, q.streak);
      s.bestStreak = Math.max(s.bestStreak, q.streak);
      if (q.kind === 'jobb' && q.job) {
        const wage = wagePerCorrect(q.job, this.city, s.difficulty);
        const base = wage + pityBonus(s.wrongStreak, wage);
        // Sviten multiplicerar grundlönen, snabbheten läggs på ovanpå.
        const withCombo = Math.round(base * comboMultiplier(q.streak));
        comboPart = withCombo - base;
        speedPart = speedBonus(elapsed, wage);
        payout = withCombo + speedPart;
        q.earnings += payout;
      }
      s.wrongStreak = 0;
    } else {
      s.wrong += 1;
      s.wrongStreak += 1;
      q.streak = 0;
    }

    if (right && q.streak >= 3) playCombo(q.streak);
    else playSound(right ? 'ratt' : 'fel');
    // Bilden reagerar: jubel, eller prutt och den stora foten.
    if (current.question.bild || current.images) {
      if (right) window.setTimeout(() => playSound('jubel'), 220);
      else {
        window.setTimeout(() => playSound('prutt'), 150);
        window.setTimeout(() => playSound('fotdunk'), 620);
      }
    }
    q.dayResults[q.index] = right;
    q.answered = {
      picked,
      payout,
      combo: comboPart,
      speed: speedPart,
      reglage: reglageVarde,
    };
    this.commit();
    this.render();
  }

  private advanceQuiz(): void {
    const q = this.quiz!;
    q.answered = undefined;
    if (q.index + 1 < q.questions.length) {
      q.index += 1;
      q.askedAt = performance.now();
      this.render();
      return;
    }
    // Arbetsdagarna är slut. Jobb avslutas med ett arkadmoment.
    if (q.kind === 'jobb' && q.job) {
      q.phase = 'brief';
      this.render();
      return;
    }
    this.finishQuiz();
  }

  /** Startar skiftets arkadmoment. */
  private startMinigame(): void {
    const q = this.quiz!;
    q.phase = 'spelar';
    this.render();
  }

  /** Tar emot resultatet från arkadmomentet och räknar ut bonusen. */
  private finishMinigame(result: MinigameResult): void {
    const s = this.state!;
    const q = this.quiz!;
    if (q.phase === 'klart') return;
    const job = q.job!;
    // Bonusen motsvarar upp till tre dagslöner, efter hur bra momentet gick,
    // och ett felfritt moment ger ett halvt extra dagsverke ovanpå.
    const wage = wagePerCorrect(job, this.city, s.difficulty);
    let bonus = Math.round(wage * 3 * result.score);
    if (result.perfect) {
      bonus += Math.round(wage * 0.5);
      s.perfectMinigames += 1;
    }
    q.minigameResult = result;
    q.bonus = bonus;
    q.earnings += bonus;
    q.phase = 'klart';
    this.commit();
    this.render();
  }

  private finishQuiz(): void {
    const s = this.state!;
    const q = this.quiz!;
    const city = this.city;
    const p = getProgress(s, city.id);
    const total = q.questions.length;
    const score = Math.round((q.correct / total) * 100);

    /**
     * En frågebricka är en fråga och ingenting mer. Ingen dag går åt, inget
     * skift avslutas: rätt svar ger ett bättre stadsbetyg och en slant, fel
     * svar ger svaret.
     */
    if (q.kind === 'mynt') {
      const ratt = q.correct > 0;
      if (ratt) {
        p.rating = Math.min(100, p.rating + 10);
        s.money += 250;
        s.earned += 250;
        s.peakMoney = Math.max(s.peakMoney, s.money);
      }
      this.quiz = null;
      this.commit();
      playSound(ratt ? 'fanfar' : 'fel');
      this.notify(
        ratt
          ? `Rätt! Stadsbetyget i ${city.name} steg till ${p.rating}, och du hittade ${this.money(250)} i fickan.`
          : `Fel den här gången. Stadsbetyget i ${city.name} står kvar på ${p.rating}.`
      );
      this.go('stad');
      return;
    }

    if (q.kind === 'turistbyra') {
      p.visits += 1;
      p.rating = Math.max(p.rating, score);
      // Ett provbesök kostar en dag.
      this.spendDays(1, city);
      this.quiz = null;
      this.commit();
      if (this.checkBroke()) return;
      playSound(score >= 85 ? 'fanfar' : 'stampla');
      this.notify(
        `Turistbyrån: ${q.correct}/${total} rätt, betyg ${score}. Bästa betyg i ${city.name}: ${p.rating}.`
      );
      // Dagen slutar på vandrarhemmet, och där kan något hända.
      this.fireEvent('boende');
      this.go('stad');
      return;
    }

    const job = q.job!;
    p.workedJobs.push(job.id);
    s.money += q.earnings;
    s.earned += q.earnings;
    s.shiftsWorked += 1;
    if (q.correct === total) s.perfectShifts += 1;
    // Ett genomfört skift är en poäng i huvudkategorin, oavsett hur det gick.
    s.points ??= {};
    s.points[job.huvud] = (s.points[job.huvud] ?? 0) + 1;
    this.spendDays(job.shiftLength, city);

    // Certifikat om du klarar tillräckligt av skiftet (se difficulty.ts). Arkadmomentet
    // väger in, så ett svagt frågeresultat kan räddas av gott handlag.
    const mgScore = q.minigameResult?.score ?? 0;
    const shiftScore = Math.round(score * 0.75 + mgScore * 100 * 0.25);
    const threshold = certificateThreshold(s.difficulty);
    let gotCert = false;
    if (shiftScore >= threshold) {
      const prev = s.certificates[job.category] ?? 0;
      s.certificates[job.category] = prev + 1;
      gotCert = true;
    }
    const bestStreak = q.bestStreak;
    this.quiz = null;
    this.commit();
    if (this.checkBroke()) return;

    playSound(gotCert ? 'fanfar' : 'kassa');
    if (gotCert) window.setTimeout(() => playSound('applad'), 700);
    const parts = [
      `${job.title}: ${q.correct}/${total} rätt.`,
      `Lön ${this.money(q.earnings)}.`,
      `${job.shiftLength} dagar gick åt.`,
      `+1 poäng i ${HUVUD_LABELS[job.huvud]} (nu ${s.points[job.huvud]}).`,
    ];
    if (bestStreak >= 4) parts.push(`Bästa svit: ${bestStreak} i rad.`);
    if ((q.bonus ?? 0) > 0)
      parts.push(`${job.minigame.title} gav ${this.money(q.bonus ?? 0)} i bonus.`);
    if (gotCert)
      parts.push(
        `Certifikat i ${CATEGORY_LABELS[job.category] ?? job.category}!`
      );
    this.notify(parts.join(' '));
    /**
     * Skiftet är över. Något kan ha hänt på jobbet; annars kan något ha hänt
     * på vandrarhemmet under de nätter skiftet varade. Bara ett av dem, så att
     * ett skift aldrig slutar med två kort på rad.
     */
    this.fireEvent('arbete');
    this.fireEvent('boende');
    this.go('stad');
  }

  // ------------------------------------------------------------------ karta

  /**
   * Stationen som plats: hall, avgångstavla, ljud och biljettlucka. Skärmen
   * lever vidare av sig själv medan den ligger uppe, så handtaget sparas för
   * att kunna stängas av när spelaren går vidare.
   */
  private renderStationScreen(mode: TransportMode): HTMLElement {
    const s = this.state!;
    // Samma station som förra gången ritas inte om, den hängs bara tillbaka.
    if (this.station) return this.station.handle.node;
    const handle = renderStation({
      city: this.city,
      mode,
      difficulty: s.difficulty,
      money: (n) => this.money(n),
      cash: () => this.state?.money ?? 0,
      onBuy: (target, route) => this.doTravel(target, route),
    });
    this.station = { handle, mode, cityId: s.currentCityId };
    return handle.node;
  }

  /**
   * Atlasen. Ingen resebyrå och ingen biljettlucka - biljetterna köps på
   * stationerna nu. Det här är kartan som karta: var i världen du står, hur
   * långt du rest, och vad som är värt att veta om staden och landet.
   */
  private renderAtlas(): HTMLElement {
    const s = this.state!;
    return renderAtlasScreen({
      city: this.city,
      homeCityId: s.homeCityId,
      visited: s.visited,
      money: (n) => this.money(n),
      dailyCost: dailyCost(this.city, s.difficulty),
      rating: getProgress(s, this.city.id).rating,
      distance: s.distance,
    });
  }

  /**
   * Filmen mellan två städer. Kartan zoomar in på sträckan och fordonet rör
   * sig längs rutten. Ett tryck hoppar över resten.
   */
  private renderTravelFilm(scene: {
    from: City;
    to: City;
    mode: TransportMode;
    km: number;
    days: number;
  }): HTMLElement {
    const wrap = el('div', { class: 'stack' });
    const panel = el('section', { class: `panel travel-panel travel-${scene.mode}` });
    const FARDSATT_VERB: Record<TransportMode, string> = {
      flyg: 'I luften',
      tag: 'På rälsen',
      buss: 'På vägen',
      farja: 'Till sjöss',
    };
    panel.append(
      el('div', { class: 'travel-head' },
        el('div', {},
          el(
            'p',
            { class: 'kicker' },
            `${MODE_LABELS[scene.mode]} · ${scene.from.name} → ${scene.to.name}`
          ),
          el('h1', { class: 'travel-title' }, FARDSATT_VERB[scene.mode])
        ),
        el('span', { class: 'travel-ikon' }, icon(scene.mode))
      )
    );
    // Mätaren och kilometerräknaren följer filmens förlopp.
    const kvar = el('span', { class: 'travel-km' }, `${scene.km.toLocaleString('sv-SE')} km kvar`);
    const bar = el('span', { class: 'travel-bar' });
    panel.append(
      renderTravelScene({
        from: scene.from,
        to: scene.to,
        // En människa står upprätt oavsett kurs; hon speglas bara västerut.
        rotate: false,
        // Resenären själv, inte fordonet: en figur som går över kartan.
        vehicle: (size) => iconGroup('ryggsackare', size),
        onFrame: (t) => {
          bar.style.width = `${Math.round(t * 100)}%`;
          const rest = Math.max(0, Math.round(scene.km * (1 - t)));
          kvar.textContent = t >= 1 ? 'Framme' : `${rest.toLocaleString('sv-SE')} km kvar`;
        },
        onDone: () => {
          this.travelScene = null;
          this.filmNode = null;
          this.scrollToTopNext = true;
          this.render();
        },
      })
    );
    panel.append(
      el('div', { class: 'travel-remsa' },
        el('span', { class: 'travel-stad' }, scene.from.name),
        el('span', { class: 'travel-spar' }, bar),
        el('span', { class: 'travel-stad travel-stad-mal' }, scene.to.name)
      ),
      el('div', { class: 'travel-fakta' },
        kvar,
        el('span', {}, `${scene.days} ${scene.days === 1 ? 'dags' : 'dagars'} restid`),
        el('span', { class: 'travel-skip' }, 'Tryck för att hoppa över')
      )
    );
    wrap.append(panel);
    return wrap;
  }

  private doTravel(target: City, option: Route): void {
    const s = this.state!;
    if (s.money < option.price) {
      this.notify('Du har inte råd med den biljetten.');
      return;
    }
    const from = this.city;
    s.money -= option.price;
    s.spent += option.price;
    const stracka = distanceKm(from, target);
    s.distance += stracka;
    // Färdsättet räknas, så att passet kan belöna den som håller sig på marken.
    s.tripsByMode[option.mode] = (s.tripsByMode[option.mode] ?? 0) + 1;
    s.kmByMode[option.mode] = (s.kmByMode[option.mode] ?? 0) + stracka;
    s.timezonesCrossed += Math.abs(target.utc - from.utc);
    // Restiden kostar boende i genomsnitt av de två städerna.
    const avgCity: City =
      from.costIndex >= target.costIndex ? target : from;
    this.spendDays(option.days, avgCity);

    /**
     * Ungefär var tredje resa händer något. Händelsen läggs i tillståndet i
     * stället för att visas direkt, så att den överlever en omladdning.
     */
    // Jobben i staden du lämnar återställs inte här: annonserna byts ut var
    // sjunde dag (se renderNewspaper), och den som pendlar fram och tillbaka
    // över en dag ska inte hitta samma annonser igen på andra sidan.
    s.currentCityId = target.id;
    s.visited.push(target.id);
    // Första dagen i staden sparas för raden om återbesök.
    const pt = getProgress(s, target.id);
    pt.firstDay ??= s.days;
    this.travelFilter = null;
    this.commit();
    if (this.checkBroke()) return;
    // Varje färdsätt låter som sig självt när det lämnar staden.
    const avgangsljud = {
      flyg: 'resa',
      tag: 'tagvissla',
      buss: 'bussmotor',
      farja: 'skeppstuta',
    } as const;
    playSound(avgangsljud[option.mode]);
    // Något kan ha hänt på vägen. Kortet ligger kvar tills det kvitterats, och
    // syns först när resefilmen spelat klart.
    this.fireEvent('resa');
    // Filmen visar sträckan; ankomstsignalen kommer när den spelat klart.
    this.filmNode = null;
    this.travelScene = {
      from,
      to: target,
      mode: option.mode,
      km: stracka,
      days: option.days,
    };
    this.notify(
      `${option.label} till ${target.name}. Framme efter ${option.days} ${
        option.days === 1 ? 'dag' : 'dagar'
      }, klockan står på ${utcLabel(target.utc)}.`
    );
    this.go('stad');
    window.setTimeout(() => playSound('ankomst'), 1200);
  }

  // -------------------------------------------------------------- souvenirer

  private renderShop(): HTMLElement {
    const s = this.state!;
    const city = this.city;
    const wrap = el('div', { class: 'stack' });

    const head = el('section', { class: 'panel' });
    head.append(
      el('h1', { class: 'title' }, 'Souvenirbutiken'),
      el(
        'p',
        { class: 'muted' },
        'Köp där varan tillverkas och sälj där den är exotisk. Butiken tar mellanskillnad vid försäljning.'
      )
    );
    wrap.append(head);

    const buy = el('section', { class: 'panel' });
    buy.append(el('h2', {}, `Till försäljning i ${city.name}`));
    for (const souvenir of citySouvenirs(city)) {
      const price = souvenirPrice(souvenir, city, s.days, false);
      const cheap = souvenir.cheapIn.includes(city.region);
      const hot = souvenir.hotIn.includes(city.region);
      // Prislappen jämförs med varans grundvärde, så att det syns på en gång
      // om det här är ett fynd eller ett turistpris.
      const ratio = price / souvenir.basePrice;
      const trend =
        ratio <= 0.8
          ? { cls: 'trend-low', text: '▼ Fyndpris här' }
          : ratio >= 1.25
            ? { cls: 'trend-high', text: '▲ Dyrt här' }
            : { cls: 'trend-mid', text: '● Normalpris' };
      const card = el('article', { class: 'item' });
      card.append(
        el('div', { class: 'item-head' },
          el('h3', {}, souvenir.name),
          el('span', { class: 'item-price' }, this.money(price))
        ),
        el('p', { class: `trend ${trend.cls}` }, trend.text),
        el('p', {}, souvenir.desc),
        el(
          'p',
          { class: 'muted' },
          cheap
            ? 'Tillverkas här – lägsta priset du kommer att se.'
            : hot
              ? 'Eftertraktad här – dyr att köpa, men lönsam att sälja.'
              : 'Normalt pris i den här delen av världen.'
        ),
        el(
          'p',
          { class: 'muted' },
          `Säljs bäst i: ${souvenir.hotIn
            .map((r) => REGION_LABELS[r] ?? r)
            .join(', ')}.`
        )
      );
      const affordable = s.money >= price;
      card.append(
        button(
          affordable ? 'Köp' : 'Har inte råd',
          () => this.buySouvenir(souvenir, price),
          {
            class: `btn ${affordable ? 'btn-primary' : 'btn-ghost'}`,
            disabled: affordable ? undefined : true,
          }
        )
      );
      buy.append(card);
    }
    wrap.append(buy);

    const sell = el('section', { class: 'panel' });
    sell.append(el('h2', {}, 'Sälj ur ryggsäcken'));
    if (s.backpack.length === 0) {
      sell.append(el('p', { class: 'muted' }, 'Ryggsäcken är tom.'));
    } else {
      s.backpack.forEach((item, index) => {
        const souvenir = SOUVENIR_BY_ID[item.souvenirId];
        if (!souvenir) return;
        const price = souvenirPrice(souvenir, city, s.days, true);
        const profit = price - item.paid;
        const row = el('article', { class: 'item' });
        row.append(
          el('div', { class: 'item-head' },
            el('h3', {}, souvenir.name),
            el('span', { class: 'item-price' }, this.money(price))
          ),
          el(
            'p',
            { class: 'muted' },
            `Köpt i ${CITY_BY_ID[item.boughtIn]?.name ?? 'okänd stad'} för ${this.money(
              item.paid
            )} · ${profit >= 0 ? 'vinst' : 'förlust'} ${this.money(Math.abs(profit))}`
          )
        );
        row.append(
          button('Sälj', () => this.sellSouvenir(index, price), {
            class: `btn ${profit >= 0 ? 'btn-primary' : 'btn-ghost'}`,
          })
        );
        sell.append(row);
      });
    }
    wrap.append(sell);
    return wrap;
  }

  private buySouvenir(souvenir: Souvenir, price: number): void {
    const s = this.state!;
    if (s.money < price) {
      this.notify('Kassan räcker inte.');
      return;
    }
    if (s.backpack.length >= 12) {
      this.notify('Ryggsäcken är full. Sälj något först.');
      return;
    }
    s.money -= price;
    s.spent += price;
    s.backpack.push({
      souvenirId: souvenir.id,
      paid: price,
      boughtIn: s.currentCityId,
    });
    this.commit();
    playSound('mynt');
    this.notify(`${souvenir.name} ligger i ryggsäcken.`);
    // I butiken pruttas det, växlas fel och viskas om tullen.
    this.fireEvent('handel');
    this.render();
  }

  private sellSouvenir(index: number, price: number): void {
    const s = this.state!;
    const item = s.backpack[index];
    if (!item) return;
    s.backpack.splice(index, 1);
    s.money += price;
    s.earned += price;
    const name = SOUVENIR_BY_ID[item.souvenirId]?.name ?? 'Souveniren';
    const profit = price - item.paid;
    s.bestTrade = Math.max(s.bestTrade, profit);
    this.commit();
    playSound(profit > 0 ? 'kassa' : 'mynt');
    this.notify(
      `${name} såld för ${this.money(price)} (${
        profit >= 0 ? '+' : '-'
      }${this.money(Math.abs(profit))}).`
    );
    this.fireEvent('handel');
    this.render();
  }

  // --------------------------------------------------------------- ryggsäck

  private renderBackpack(): HTMLElement {
    const s = this.state!;
    const wrap = el('div', { class: 'stack' });

    const head = el('section', { class: 'panel' });
    const answered = s.correct + s.wrong;
    const accuracy = answered ? Math.round((s.correct / answered) * 100) : 0;
    head.append(
      el('h1', { class: 'title' }, 'Ryggsäck och pass'),
      el('div', { class: 'stat-grid' },
        stat('Souvenirer', `${s.backpack.length}/12`),
        stat('Värde hemma', this.money(backpackHomeValue(s))),
        stat('Rätta svar', `${s.correct}`),
        stat('Felsvar', `${s.wrong}`),
        stat('Träffsäkerhet', `${accuracy}%`),
        stat('Längsta svit', `${s.bestStreak}`),
        stat('Arbetsskift', `${s.shiftsWorked}`),
        stat('Resta km', s.distance.toLocaleString('sv-SE')),
        stat('Varav på marken', markKm(s).toLocaleString('sv-SE')),
        stat('Tågresor', `${s.tripsByMode.tag ?? 0}`),
        stat('Tidszoner', `${Math.round(s.timezonesCrossed)}`),
        stat('Samtal hem', `${s.callsHome}`)
      )
    );
    wrap.append(head);
    const knowledge = this.renderCityKnowledge();
    if (knowledge) wrap.append(knowledge);
    wrap.append(this.renderStampPanel());

    // Poängen per huvudkategori: stegen man klättrar på.
    const erf = el('section', { class: 'panel' });
    erf.append(
      el('h2', {}, 'Erfarenhet'),
      el('p', { class: 'muted' },
        'Ett genomfört skift ger en poäng i sin huvudkategori. En poäng öppnar löneklass 2, tre poäng löneklass 3.'
      )
    );
    const erfList = el('div', { class: 'cert-grid' });
    for (const h of HUVUDKATEGORIER) {
      const n = s.points?.[h] ?? 0;
      erfList.append(
        el('div', { class: `cert ${n === 0 ? 'cert-tom' : ''}` },
          el('span', { class: 'cert-name' }, HUVUD_LABELS[h]),
          el('span', { class: 'cert-count' }, n >= 3 ? `${n} p · klass 3` : n >= 1 ? `${n} p · klass 2` : '0 p')
        )
      );
    }
    erf.append(erfList);
    wrap.append(erf);

    const certs = el('section', { class: 'panel' });
    certs.append(el('h2', {}, 'Certifikat'));
    const entries = Object.entries(s.certificates).filter(
      ([, n]) => (n ?? 0) > 0
    );
    if (entries.length === 0) {
      certs.append(
        el(
          'p',
          { class: 'muted' },
          `Inga än. Klara minst ${certificateThreshold(s.difficulty)} procent av ett arbetsskift för att få ett certifikat. De ger poäng på slutet och en stämpel i passet.`
        )
      );
    } else {
      const list = el('div', { class: 'cert-grid' });
      for (const [cat, n] of entries) {
        list.append(
          el('div', { class: 'cert' },
            el('span', { class: 'cert-name' }, CATEGORY_LABELS[cat] ?? cat),
            el('span', { class: 'cert-count' }, `${n} st`)
          )
        );
      }
      certs.append(list);
    }
    wrap.append(certs);

    const bag = el('section', { class: 'panel' });
    bag.append(el('h2', {}, 'Innehåll'));
    if (s.backpack.length === 0) {
      bag.append(el('p', { class: 'muted' }, 'Tom. Köp något att komma hem med.'));
    } else {
      const list = el('div', { class: 'bag-list' });
      for (const item of s.backpack) {
        const souvenir = SOUVENIR_BY_ID[item.souvenirId];
        if (!souvenir) continue;
        list.append(
          el('div', { class: 'bag-item' },
            el('span', {}, souvenir.name),
            el(
              'span',
              { class: 'muted' },
              `${CITY_BY_ID[item.boughtIn]?.name ?? '?'} · ${this.money(item.paid)}`
            )
          )
        );
      }
      bag.append(list);
    }
    wrap.append(bag);

    const route = el('section', { class: 'panel' });
    route.append(
      el('h2', {}, 'Reseväg'),
      el(
        'p',
        {},
        s.visited
          .map((id) => CITY_BY_ID[id]?.name ?? id)
          .join(' → ')
      )
    );
    wrap.append(route);
    return wrap;
  }

  /**
   * Passet: alla stämplar i spelet, de tagna först och de återstående kvar
   * som synliga mål. Att visa även dem som inte tagits är själva poängen -
   * de fungerar som en resplan man kan välja att följa.
   */
  /**
   * Passet, ritat som ett pass: ett uppslag med två sidor där stämplarna
   * sitter i bläck, snett och lite överlappande, med resdagen tryckt i
   * kanten. Varje stämpel får sin rotation, sitt bläck och sin form ur ett
   * stabilt hasch på sitt id, så att uppslaget ser likadant ut varje gång
   * det ritas om - annars skulle stämplarna hoppa runt vid varje omritning.
   *
   * De stämplar som inte tagits ligger inte i passet. De står i en kort lista
   * under, som en resplan, så att sidorna inte förvandlas till en checklista.
   */
  private renderStampPanel(): HTMLElement {
    const s = this.state!;
    const panel = el('section', { class: 'panel' });
    panel.append(
      el('div', { class: 'panel-head' },
        el('h2', {}, 'Passet'),
        el('span', { class: 'tag' }, `${s.stamps.length} av ${STAMPS.length} stämplar`)
      )
    );

    const regions = new Set(
      s.visited.map((id) => CITY_BY_ID[id]?.region).filter(Boolean)
    );
    panel.append(
      el(
        'p',
        { class: 'muted' },
        regions.size > 0
          ? `Besökta regioner: ${[...regions]
              .map((r) => REGION_LABELS[r as string] ?? r)
              .join(', ')}.`
          : 'Inga regioner besökta än.'
      )
    );

    const taken = s.stamps
      .map((id) => STAMP_BY_ID[id])
      .filter((x): x is Stamp => Boolean(x));

    const book = el('div', { class: 'passport' });
    const spread = el('div', { class: 'passport-spread' });

    /**
     * Stämplarna fördelas jämnt över två sidor, i den ordning de togs. Ett
     * tomt pass får bara ett uppslag - två tomma sidor ser ut som ett fel.
     */
    const pages: Stamp[][] = taken.length === 0 ? [[]] : [[], []];
    taken.forEach((stamp, i) => pages[i % 2]!.push(stamp));

    spread.append(this.renderPassportDataPage());

    pages.forEach((sida, index) => {
      const page = el('div', { class: 'passport-page' });
      page.append(
        el('div', { class: 'passport-head' },
          el('span', {}, 'Gränskontroll'),
          el('span', {}, `Sid. ${index + 2}`)
        )
      );
      const yta = el('div', { class: 'passport-stamps' });
      for (const stamp of sida) yta.append(this.renderStamp(stamp));
      if (sida.length === 0 && index === 0) {
        yta.append(
          el(
            'p',
            { class: 'passport-empty' },
            'Passet är tomt än. Första stämpeln kommer när du gjort ditt första arbetsskift.'
          )
        );
      }
      page.append(yta);
      spread.append(page);
    });

    book.append(spread);
    panel.append(book);

    /**
     * Stämplarna som återstår, som små brickor med bara namnet. Nitton rutor
     * med beskrivning var gjorde passet dubbelt så långt som själva passet.
     * Beskrivningarna fälls ut av den som vill veta vad som krävs.
     */
    const rest = STAMPS.filter((x) => !s.stamps.includes(x.id));
    if (rest.length > 0) {
      const todo = el('div', {
        class: `stamp-todo ${this.showStampDetails ? 'stamp-todo-open' : ''}`,
      });
      const toggle = button(
        this.showStampDetails ? 'Dölj kraven' : 'Vad krävs?',
        () => {
          this.showStampDetails = !this.showStampDetails;
          todo.classList.toggle('stamp-todo-open', this.showStampDetails);
          toggle.textContent = this.showStampDetails ? 'Dölj kraven' : 'Vad krävs?';
          toggle.setAttribute('aria-expanded', this.showStampDetails ? 'true' : 'false');
        },
        {
          class: 'btn btn-ghost btn-small',
          'aria-expanded': this.showStampDetails ? 'true' : 'false',
        }
      );
      todo.append(
        el('div', { class: 'stamp-todo-headrow' },
          el('h3', { class: 'stamp-todo-head' }, `Kvar att stämpla (${rest.length})`),
          toggle
        )
      );
      const list = el('ul', { class: 'stamp-todo-list' });
      for (const stamp of rest) {
        list.append(
          el('li', { title: stamp.desc },
            el('span', { class: 'stamp-todo-glyph', 'aria-hidden': 'true' }, stamp.glyph),
            el('strong', {}, stamp.name),
            el('span', { class: 'stamp-todo-desc' }, stamp.desc)
          )
        );
      }
      todo.append(list);
      panel.append(todo);
    }
    return panel;
  }

  /**
   * Passets första sida: personuppgifterna, som i ett riktigt pass. Här står
   * vem du är på den här resan och vad ditt personbästa är, så att passet går
   * att räcka över till någon och säga "titta här".
   *
   * Nederst ligger en maskinläsbar rad i samma form som på ett verkligt pass.
   * Den fyller ingen funktion i spelet - den finns för att den är rolig.
   */
  private renderPassportDataPage(): HTMLElement {
    const s = this.state!;
    const home = CITY_BY_ID[s.homeCityId];
    const best = loadHighscores()[0];
    const page = el('div', { class: 'passport-page passport-data' });

    page.append(
      el('div', { class: 'passport-head' },
        el('span', {}, 'Ryggsäckarpass'),
        el('span', {}, 'Sid. 1')
      )
    );

    const rad = (etikett: string, varde: string) =>
      el('div', { class: 'pdata-row' },
        el('span', { class: 'pdata-label' }, etikett),
        el('span', { class: 'pdata-value' }, varde)
      );

    const emblem = el('div', { class: 'pdata-emblem' },
      el('span', { class: 'pdata-emblem-mark' }, '⊕'),
      el('span', { class: 'pdata-emblem-text' },
        el('strong', {}, 'Ryggsäckaren'),
        el('span', {}, 'Utfärdat för världens skull')
      )
    );
    page.append(emblem);

    // Innehavaren, i passets största text.
    page.append(
      el('div', { class: 'pdata-holder' },
        el('span', { class: 'pdata-label' }, 'Innehavare'),
        el('span', { class: 'pdata-name' }, s.playerName)
      )
    );

    const grid = el('div', { class: 'pdata-grid' });
    grid.append(
      rad('Född i', home ? `${home.name}, ${home.country}` : '—'),
      rad('Resenärstyp', DIFFICULTY_INFO[s.difficulty].name),
      rad('Dag på resan', String(s.days)),
      rad('Städer', `${new Set(s.visited).size} av ${CITIES.length}`),
      rad('Stämplar', `${s.stamps.length} av ${STAMPS.length}`),
      rad('Anseende', ryktesord(s.rykte)),
      rad('Flugna km', s.distance.toLocaleString('sv-SE'))
    );
    page.append(grid);

    if (best) {
      page.append(
        el('div', { class: 'pdata-record' },
          el('span', { class: 'pdata-record-label' }, 'Personbästa'),
          el('span', { class: 'pdata-record-score' }, best.score.toLocaleString('sv-SE')),
          el('span', { class: 'pdata-record-title' }, best.title),
          el(
            'span',
            { class: 'pdata-record-meta' },
            `${DIFFICULTY_INFO[best.difficulty].name} · ${best.cities} städer på ${best.days} dagar` +
              (best.bestCity ? ` · bäst koll på ${best.bestCity.name}` : '')
          )
        )
      );
    } else {
      page.append(
        el(
          'p',
          { class: 'pdata-record-empty' },
          'Inget personbästa än. Kom hem från en resa så skrivs det in här.'
        )
      );
    }

    /**
     * Första raden beskriver innehavaren av det här passet, andra raden det
     * inskrivna rekordet. Att blanda nuvarande resa och personbästa på samma
     * rad blev motsägelsefullt: poängen kom från en Globetrotterresa medan
     * läget stod som Turist.
     */
    page.append(
      el('div', { class: 'pdata-mrz' },
        el('span', {}, mrzLine1(s.playerName, home?.name ?? '')),
        el(
          'span',
          {},
          mrzLine2(
            best?.score ?? 0,
            best?.difficulty ?? s.difficulty,
            best?.homeCityName ?? home?.name ?? ''
          )
        )
      )
    );
    return page;
  }

  /** En enskild stämpel, tryckt i passet. */
  private renderStamp(stamp: Stamp): HTMLElement {
    const s = this.state!;
    // Stabilt utseende per stämpel: samma rotation och bläck varje omritning.
    const seed = pseudoRandom(`stampel|${stamp.id}`);
    const seed2 = pseudoRandom(`bläck|${stamp.id}`);
    const rotation = Math.round((seed - 0.5) * 22);
    // Ett litet lodrätt hopp per stämpel, så att de ser spridda ut över
    // sidan i stället för att stå uppradade på en linje.
    const lyft = Math.round((pseudoRandom(`lyft|${stamp.id}`) - 0.5) * 26);
    const ink = ['ink-rod', 'ink-bla', 'ink-gron', 'ink-lila'][
      Math.floor(seed2 * 4)
    ]!;
    const form = seed2 > 0.62 ? 'form-kantig' : 'form-rund';
    const dag = s.stampDays[stamp.id];
    /**
     * Mästarstämplarna är större, trycks i guld och får tränga sig på de
     * andra - som en riktig stämpel som slås över det som redan står där.
     * Sigillet är rött lack och rundt, alltid.
     */
    const special =
      stamp.tier === 'guld' ? 'pstamp-guld form-rund' : stamp.tier === 'sigill' ? 'pstamp-sigill form-rund' : '';

    const node = el(
      'div',
      {
        class: `pstamp ${special ? special : `${ink} ${form}`}`,
        style: `--vrid:${rotation}deg; --lyft:${lyft}px`,
        // Skärmläsare får hela innebörden; det visuella är dekor.
        role: 'img',
        'aria-label': `${stamp.name}. ${stamp.desc}${
          dag !== undefined ? ` Stämplad dag ${dag}.` : ''
        }`,
        title: stamp.desc,
      },
      el('span', { class: 'pstamp-ring' },
        stamp.tier ? el('span', { class: 'pstamp-krans', 'aria-hidden': 'true' }, '❧') : '',
        stamp.tier === 'guld' ? el('span', { class: 'pstamp-over' }, 'MÄSTARE') : '',
        el('span', { class: 'pstamp-glyph' }, stamp.glyph),
        el('span', { class: 'pstamp-name' }, stamp.tier === 'guld' ? stamp.name.replace('Mästare: ', '') : stamp.name),
        el(
          'span',
          { class: 'pstamp-day' },
          dag !== undefined ? `DAG ${dag}` : '— — —'
        )
      )
    );
    return node;
  }

  // -------------------------------------------------------------- telefonen

  /** Lägger på: stoppar väntande signaler och glömmer samtalet. */
  private laggPa(): void {
    if (this.phoneTimer !== null) {
      window.clearTimeout(this.phoneTimer);
      this.phoneTimer = null;
    }
    this.phoneCall = null;
  }

  /**
   * Slår numret hem. Det ringer några signaler, och sedan svarar mamma,
   * pappa, någon helt annan - eller ingen alls. Första gången svarar alltid
   * mamma: hon har väntat vid telefonen sedan du åkte.
   */
  private ringHem(): void {
    const s = this.state!;
    if (this.phoneCall?.phase === 'ringer') return;
    playSound('myntinkast');
    this.phoneCall = { phase: 'ringer', svarare: 'ingen', rad: '' };
    this.render();

    const lott = Math.random();
    const svarare: Svarare =
      s.callsHome === 0
        ? 'mamma'
        : lott < 0.38
          ? 'mamma'
          : lott < 0.68
            ? 'pappa'
            : lott < 0.8
              ? 'ingen'
              : lott < 0.88
                ? 'upptaget'
                : 'fel';
    /**
     * Det ringer i tre sekunder, oavsett vem som svarar: två signaler med
     * en sekunds mellanrum. Upptagettonen går i stället direkt, för då
     * ringer det ju inte.
     */
    const RINGTID = 3000;
    if (svarare === 'upptaget') playSound('upptaget');
    else {
      [300, 1600].forEach((d) =>
        window.setTimeout(() => {
          if (this.phoneCall?.phase === 'ringer') playSound('telefonsignal');
        }, d)
      );
    }
    const vantan = svarare === 'upptaget' ? 2200 : RINGTID;
    this.phoneTimer = window.setTimeout(() => {
      this.phoneTimer = null;
      if (!this.state || this.phoneCall?.phase !== 'ringer') return;
      const stad = this.city.name;
      const lista =
        svarare === 'mamma'
          ? MAMMA_SVARAR
          : svarare === 'pappa'
            ? PAPPA_SVARAR
            : svarare === 'ingen'
              ? INGEN_SVARAR
              : svarare === 'upptaget'
                ? UPPTAGET
                : FEL_NUMMER;
      const rad = slumpa(lista).split('{stad}').join(stad);
      if (svarare === 'mamma') playSound('rostmamma');
      else if (svarare === 'pappa') playSound('rostpappa');
      else if (svarare === 'fel') playSound('rostframmande');
      this.phoneCall = { phase: 'svar', svarare, rad };
      this.scrollToTopNext = false;
      this.render();
    }, vantan);
  }

  private renderPhone(): HTMLElement {
    const s = this.state!;
    const wrap = el('div', { class: 'stack' });
    const amount = loanAmount(s);
    const samtal = this.phoneCall;

    const panel = el('section', { class: 'panel phone' });
    panel.append(el('h1', { class: 'title' }, 'Telefonkiosken'));

    /** Luren: hänger stilla, skakar när det ringer, lyfts när någon svarat. */
    const lur = el('div', {
      class: `phone-lur ${samtal?.phase === 'ringer' ? 'phone-lur-ringer' : ''} ${
        samtal?.phase === 'svar' ? 'phone-lur-upp' : ''
      }`,
      'aria-hidden': 'true',
    }, icon('skylt-telefon'));
    panel.append(lur);

    if (!samtal) {
      panel.append(
        el(
          'p',
          { class: 'lede' },
          s.callsHome === 0
            ? 'En gammal myntautomat. Det luktar tuggummi och hemlängtan. Du kan ringa hem och låna pengar - om någon svarar.'
            : `Du har ringt hem ${s.callsHome} gånger. Numret sitter i fingrarna.`
        ),
        el(
          'p',
          { class: 'muted' },
          `Nästa lån ger ${this.money(amount)} och läggs på skulden. Nuvarande skuld: ${this.money(
            s.debt
          )}. Skulden dras av från slutpoängen.`
        ),
        button('Ring hem', () => this.ringHem(), { class: 'btn btn-primary btn-big' })
      );
    } else if (samtal.phase === 'ringer') {
      panel.append(
        el('p', { class: 'lede phone-ringer' },
          'Det ringer',
          el('span', { class: 'phone-prickar', 'aria-hidden': 'true' },
            el('i', {}, '.'), el('i', {}, '.'), el('i', {}, '.')
          )
        ),
        el('p', { class: 'muted' }, 'Du står och trummar med fingrarna på automaten.')
      );
    } else {
      const foralder = samtal.svarare === 'mamma' || samtal.svarare === 'pappa';
      const vem =
        samtal.svarare === 'mamma'
          ? 'Mamma svarar'
          : samtal.svarare === 'pappa'
            ? 'Pappa svarar'
            : samtal.svarare === 'ingen'
              ? 'Ingen svarar'
              : samtal.svarare === 'upptaget'
                ? 'Upptaget'
                : 'Fel nummer';
      panel.append(
        el('p', { class: `phone-vem phone-vem-${samtal.svarare}` }, vem),
        el('p', { class: `lede ${foralder ? 'phone-replik' : ''}` }, samtal.rad)
      );
      if (foralder) {
        const pappa = samtal.svarare === 'pappa';
        panel.append(
          el('p', { class: 'muted' },
            `Ett lån ger ${this.money(amount)}, men skulden växer med ${this.money(loanDebt(amount))} - föräldrarna tar ränta (nu ${this.money(s.debt)}).`
          ),
          button(
            pappa ? `Be pappa om ${this.money(amount)}` : `Be mamma om ${this.money(amount)}`,
            () => {
              s.money += amount;
              s.debt += loanDebt(amount);
              s.callsHome += 1;
              this.commit();
              playSound(pappa ? 'rostpappa' : 'rostmamma');
              window.setTimeout(() => playSound('kassa'), 2400);
              this.notify(
                `${this.money(amount)} insatt. ${slumpa(pappa ? PAPPA_LANAR : MAMMA_LANAR)}`
              );
              this.laggPa();
              this.go('stad');
            },
            { class: 'btn btn-primary btn-big' }
          )
        );
        if (s.debt > 0 && s.money >= 500) {
          const payment = Math.min(s.debt, Math.floor(s.money / 2));
          panel.append(
            button(
              `Betala tillbaka ${this.money(payment)}`,
              () => {
                s.money -= payment;
                s.debt -= payment;
                this.commit();
                this.notify(
                  (s.debt === 0 ? 'Skulden är betald. ' : 'Skulden minskad. ') +
                    slumpa(pappa ? PAPPA_BETALAR : MAMMA_BETALAR)
                );
                this.laggPa();
                this.go('stad');
              },
              { class: 'btn btn-ghost' }
            )
          );
        }
      } else {
        panel.append(
          button('Ring igen', () => this.ringHem(), { class: 'btn btn-primary btn-big' })
        );
      }
    }
    wrap.append(panel);
    wrap.append(
      this.backRow('Lägg på', () => {
        this.laggPa();
        this.go('stad');
      })
    );
    return wrap;
  }

  // ------------------------------------------------------------------- slut

  /**
   * Skriver den avslutade resan till resedagboken. Anropas exakt en gång per
   * resa, från de två ställen där en resa kan ta slut, och skyddar sig mot
   * att köras om ifall spelaren laddar om på slutskärmen.
   */
  private recordJourney(): void {
    const s = this.state!;
    if (this.journeySaved) return;
    this.journeySaved = true;
    const answered = s.correct + s.wrong;
    const score = s.finalScore ?? finalScore(s);
    const knowledge = cityKnowledge(s, (id) => CITY_BY_ID[id]?.name);
    const at = Date.now();
    this.lastJourneyAt = at;
    this.latestHighscores = saveHighscore({
      at,
      score,
      title: rankTitle(score).title,
      difficulty: s.difficulty,
      outcome: s.outcome ?? 'pank',
      days: s.days,
      cities: new Set(s.visited).size,
      stamps: s.stamps.length,
      accuracy: answered ? Math.round((s.correct / answered) * 100) : 0,
      homeCityName: CITY_BY_ID[s.homeCityId]?.name ?? '?',
      playerName: s.playerName,
      bestCity: knowledge.best,
      worstCity: knowledge.worst,
    });
  }

  private renderEnd(): HTMLElement {
    const s = this.state!;
    const wrap = el('div', { class: 'stack' });
    const won = s.outcome === 'vinst';
    const bag = backpackHomeValue(s);
    const answered = s.correct + s.wrong;
    const accuracy = answered ? Math.round((s.correct / answered) * 100) : 0;

    const score = s.finalScore ?? finalScore(s);
    const rank = rankTitle(score);
    // Poängen byggs som ett eget element så att siffran kan räknas upp när
    // skärmen väl sitter i dokumentet.
    const scoreStat = stat('Poäng', '0', 'big');
    const scoreValue = scoreStat.querySelector('.stat-value') as HTMLElement;
    window.setTimeout(() => {
      if (scoreValue.isConnected) countUp(scoreValue, score);
    }, 260);
    const panel = el('section', { class: 'panel hero' });
    panel.append(
      el('p', { class: 'kicker' }, won ? 'Resan är fullbordad' : 'Resan tog slut'),
      el('h1', { class: 'title' }, won ? 'Välkommen hem!' : 'Pank i främmande land'),
      el(
        'p',
        { class: 'lede' },
        won
          ? `Du kom tillbaka till ${
              CITY_BY_ID[s.homeCityId]!.name
            } efter ${s.days} dagar och ${new Set(s.visited).size} besökta städer.`
          : `Pengarna tog slut i ${this.city.name} efter ${s.days} dagar. Ambassaden skickar hem dig med nästa plan.`
      )
    );
    if (won) {
      panel.append(
        el('div', { class: 'rank' },
          el('span', { class: 'rank-kicker' }, 'Din titel'),
          el('span', { class: 'rank-title' }, rank.title),
          el('span', { class: 'rank-desc' }, rank.desc)
        )
      );
    }
    wrap.append(panel);

    const scores = el('section', { class: 'panel' });
    scores.append(
      el('h2', {}, 'Slutresultat'),
      el('div', { class: 'stat-grid' },
        scoreStat,
        stat('Kassa', this.money(s.money)),
        stat('Skuld', this.money(s.debt)),
        stat('Ryggsäckens värde', this.money(bag)),
        stat('Städer', `${new Set(s.visited).size}`),
        stat('Dagar', `${s.days}`),
        stat('Träffsäkerhet', `${accuracy}%`),
        stat('Flugna km', s.distance.toLocaleString('sv-SE')),
        stat(
          'Certifikat',
          `${Object.values(s.certificates).reduce((a, b) => a + (b ?? 0), 0)}`
        ),
        stat('Stämplar', `${s.stamps.length}/${STAMPS.length}`),
        stat('Anseende', ryktesord(s.rykte)),
        stat('Längsta svit', `${s.bestStreak}`),
        stat('Tidszoner', `${Math.round(s.timezonesCrossed)}`)
      ),
      el(
        'p',
        { class: 'muted' },
        `Reseväg: ${s.visited.map((id) => CITY_BY_ID[id]?.name ?? id).join(' → ')}`
      )
    );
    wrap.append(scores);
    const knowledge = this.renderCityKnowledge();
    if (knowledge) wrap.append(knowledge);
    wrap.append(this.renderStampPanel());
    const journal = this.renderJournal(this.lastJourneyAt);
    if (journal) wrap.append(journal);

    const actions = el('section', { class: 'panel actions-panel' });
    actions.append(
      button('Börja om med ny resa', () => this.resetToStart(), {
        class: 'btn btn-primary btn-big',
      })
    );
    wrap.append(actions);
    return wrap;
  }

  // ---------------------------------------------------------------- delar

  private backRow(label: string, onClick: () => void): HTMLElement {
    return el(
      'div',
      { class: 'panel actions-panel' },
      button(label, onClick, { class: 'btn btn-ghost' })
    );
  }
}

/**
 * Tidszoner som inte är hela timmar, som Nepals UTC+5:45, ska inte skrivas ut
 * som decimaltal. Halva och kvartstimmar räknas därför om till minuter.
 */
function utcLabel(utc: number): string {
  const sign = utc < 0 ? '−' : '+';
  const abs = Math.abs(utc);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return minutes === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Maskinläsbar rad i passets nederkant, i samma form som på ett verkligt
 * pass: versaler, siffror och fyllnadstecken. Svenska bokstäver skrivs om
 * som de görs i verkligheten, där Å och Ä blir A och Ö blir O.
 */
function mrzText(input: string, length: number): string {
  const ascii = input
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '<');
  return ascii.slice(0, length).padEnd(length, '<');
}

/** Rad 1: vem passet tillhör och varifrån hen kommer. */
function mrzLine1(name: string, homeCity: string): string {
  return `P<SWE${mrzText(name, 20)}<<${mrzText(homeCity, 14)}`;
}

/** Rad 2: det inskrivna rekordet - poäng, läge och varifrån resan gick. */
function mrzLine2(
  score: number,
  difficulty: Difficulty,
  homeCity: string
): string {
  const poang = String(Math.min(999999, Math.round(score))).padStart(6, '0');
  return `${poang}SWE<<${mrzText(difficulty, 14)}${mrzText(homeCity, 14)}`;
}

/** Respekterar systeminställningen för mindre rörelse. */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Räknar upp ett tal i ett element. Slutpoängen betyder mer när den tickar
 * fram än när den bara står där. Utfallet är snabbt i början och bromsar in,
 * och den som bett om mindre rörelse får talet direkt.
 */
function countUp(node: HTMLElement, to: number, ms = 1100): void {
  if (prefersReducedMotion() || to <= 0) {
    node.textContent = to.toLocaleString('sv-SE');
    return;
  }
  const started = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - started) / ms);
    // Kvadratisk inbromsning: snabbt i början, mjukt i mål.
    const eased = 1 - (1 - t) * (1 - t);
    node.textContent = Math.round(to * eased).toLocaleString('sv-SE');
    if (t < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

/** Sträcka tillryggalagd på marken: tåg, buss och färja. */
function markKm(s: GameState): number {
  return (
    (s.kmByMode.tag ?? 0) + (s.kmByMode.buss ?? 0) + (s.kmByMode.farja ?? 0)
  );
}

/** Prisnivån i klartext, i stället för ett indextal ingen kan tolka. */
/**
 * Anseendet i ord i stället för i siffror. Ett tal utan skala säger ingenting
 * om det är bra eller dåligt, och det här är inte en poäng man samlar - det är
 * ett rykte som går före en.
 */
function ryktesord(rykte: number): string {
  if (rykte >= 8) return 'Omtalat gott';
  if (rykte >= 4) return 'Gott';
  if (rykte >= 1) return 'Hyggligt';
  if (rykte === 0) return 'Oskrivet blad';
  if (rykte >= -3) return 'Skamfilat';
  return 'Ökänd';
}

function prisniva(costIndex: number): string {
  if (costIndex >= 1.25) return 'dyr';
  if (costIndex >= 1.0) return 'ganska dyr';
  if (costIndex >= 0.8) return 'lagom';
  return 'billig';
}

function stat(label: string, value: string, tone?: string): HTMLElement {
  return el('div', { class: `stat ${tone ? `stat-${tone}` : ''}` },
    el('span', { class: 'stat-label' }, label),
    el('span', { class: 'stat-value' }, value)
  );
}


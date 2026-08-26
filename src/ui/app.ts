import { CITIES, CITY_BY_ID } from '../data/cities';
import { CURRENCIES, formatMoney } from '../data/currencies';
import { pickTravelEvent, type TravelEvent } from '../data/events';
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
  jobRequirementText,
  arcadeSlack,
  certificateThreshold,
  comboMultiplier,
  loanAmount,
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
import { cycleVolume, playCombo, playSound, volumeLabel, volumeLevel } from './audio';
import { button, clear, el } from './dom';
import { icon, iconGroup, type IconName } from './icons';
import {
  renderMinigame,
  stopAllMinigames,
  type MinigameResult,
} from './minigames';
import type { Stamp } from '../data/stamps';
import { renderTravelScene } from './map';
import { renderGlobePicker } from './globepicker';
import { renderStation, type StationHandle } from './station';
import { renderAtlasScreen } from './atlas';

interface QuizSession {
  kind: 'turistbyra' | 'jobb';
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
const HJALP_NYCKEL = 'ryggsackaren.hjalp-visad';

function harSettHjalpen(): boolean {
  try {
    return localStorage.getItem(HJALP_NYCKEL) === 'ja';
  } catch {
    // Privat läge: visa hellre förklaringen en gång för mycket.
    return false;
  }
}

function markeraHjalpSedd(): void {
  try {
    localStorage.setItem(HJALP_NYCKEL, 'ja');
  } catch {
    // ignoreras
  }
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
  private showHelp = !harSettHjalpen();
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
  private travelScene: { from: City; to: City; mode: TransportMode } | null = null;
  /**
   * Vilken station man gått in i. Resebyrån är uppdelad i busstation,
   * tågstation, flygplats och hamn, som i förlagan, och listan visar då bara
   * de destinationer det färdsättet faktiskt når.
   */
  private travelFilter: TransportMode | null = null;

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
    cash: number;
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

      const quiz = this.quiz;
      const inQuestions =
        quiz && quiz.phase === 'fragor' &&
        (s.screen === 'jobb' || s.screen === 'turistbyra');

      if (inQuestions && !quiz.answered) {
        const current = quiz.questions[quiz.index];
        if (!current) return;
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
      s0.money === this.station.cash &&
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
      film.append(this.renderTravelFilm(scene));
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
      case 'turistbyra':
        main.append(this.renderQuiz('Turistbyrån'));
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
          'Jobba dig fram från stad till stad, svara rätt för att få lön, fyll ' +
          'ryggsäcken med souvenirer och ta dig hem igen innan kassan tar slut.'
      ),
    );

    /**
     * Spelförklaringen tar en halv skärm och behövs bara en gång. Den står
     * öppen första gången någon öppnar spelet och ligger därefter bakom
     * hjälpknappen. Utfällningen sker på plats, utan att sidan byggs om, så
     * att ett halvskrivet namn inte tappar fokus.
     */
    const loop = el('ol', { class: 'loop' });
    const steg: Array<[string, string]> = [
      ['Lär dig staden', 'Provet på turistbyrån ger ett betyg som öppnar bättre jobb.'],
      ['Ta ett jobb', 'Varje rätt svar är en dagslön. Skiftet slutar med ett arkadmoment.'],
      ['Gör en affär', 'Köp souvenirer där de tillverkas, sälj dem långt hemifrån.'],
      [
        'Res vidare',
        `Minst ${MIN_CITIES_TO_FINISH} städer, sedan hem igen. Boendet kostar varje dag.`,
      ],
    ];
    steg.forEach(([rubrik, text], i) => {
      loop.append(
        el('li', {},
          el('span', { class: 'loop-num' }, String(i + 1)),
          el('span', { class: 'loop-text' },
            el('strong', {}, rubrik),
            el('span', {}, text)
          )
        )
      );
    });

    const hjalpKnapp = button(
      '',
      () => {
        this.showHelp = !this.showHelp;
        malaHjalp();
      },
      { class: 'btn btn-ghost help-toggle', 'data-sound': 'av' }
    );
    const malaHjalp = () => {
      loop.hidden = !this.showHelp;
      hjalpKnapp.textContent = this.showHelp
        ? 'Dölj förklaringen'
        : 'Hur spelar man?';
      hjalpKnapp.setAttribute('aria-expanded', this.showHelp ? 'true' : 'false');
    };
    malaHjalp();
    hero.append(el('div', { class: 'row help-row' }, hjalpKnapp), loop);

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
    const diffPanel = el('section', { class: 'panel' });
    diffPanel.append(
      el('h2', {}, 'Hur van resenär är du?'),
      el(
        'p',
        { class: 'muted' },
        'Samma spel och samma regler i båda lägena – det är kraven som skiljer. ' +
          'Valet gäller hela resan.'
      )
    );
    const diffRow = el('div', { class: 'mode-grid' });
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
    wrap.append(diffPanel);

    // Namnet trycks i passet och följer med i resedagboken.
    const namePanel = el('section', { class: 'panel' });
    namePanel.append(
      el('h2', {}, 'Vem är du?'),
      el(
        'p',
        { class: 'muted' },
        'Namnet trycks i ditt pass och följer med i resedagboken.'
      )
    );
    // Startknappen speglar om namnet är ifyllt. Den byggs längre ned, så
    // callbackerna går via en indirektion i stället för att fånga den direkt.
    let uppdateraStart: () => void = () => {};
    const nameInput = el('input', {
      class: 'field name-input',
      type: 'text',
      maxlength: '24',
      placeholder: 'Ditt namn',
      'aria-label': 'Ditt namn',
      value: this.startPick.name,
      autocomplete: 'off',
    }) as HTMLInputElement;
    nameInput.addEventListener('input', () => {
      this.startPick.name = nameInput.value;
      uppdateraStart();
    });
    namePanel.append(el('div', { class: 'row' }, nameInput));
    wrap.append(namePanel);

    /**
     * Födelsestaden. Globen, ett kort om den valda staden och en rullbar
     * lista står bredvid varandra, så att man ser vilken stad man pekat ut
     * utan att behöva scrolla tillbaka upp.
     */
    const cityPanel = el('section', { class: 'panel' });
    cityPanel.append(
      el('h2', {}, 'Var är du född?'),
      el(
        'p',
        { class: 'muted' },
        'Din födelsestad står i passet, är där resan börjar och dit du ska ta dig ' +
          'tillbaka. Dess valuta blir den du räknar i.'
      )
    );

    // Kortet om den valda staden byggs om på plats när valet ändras.
    const cityCard = el('div', { class: 'city-card' });
    const paintCityCard = () => {
      clear(cityCard);
      const c = CITY_BY_ID[this.startPick.cityId]!;
      const foto = photoImg(c, 'city-card-photo', cityCard);
      cityCard.append(
        foto,
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

    const globe = renderGlobePicker({
      selectedId: this.startPick.cityId,
      onSelect: (c) => {
        this.startPick.cityId = c.id;
        playSound('valj');
        globe.select(c);
        paintCityCard();
        paintList();
        uppdateraStart();
      },
    });

    const search = el('input', {
      class: 'field search',
      type: 'search',
      placeholder: 'Sök stad eller land',
      'aria-label': 'Sök födelsestad',
      value: this.cityFilter,
    }) as HTMLInputElement;
    const list = el('div', { class: 'city-list' });

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
      // Svenska städer först: nästan alla som spelar är födda i någon av dem.
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
              () => {
                this.startPick.cityId = c.id;
                playSound('valj');
                globe.select(c);
                paintCityCard();
                paintList();
                uppdateraStart();
              },
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

    paintCityCard();
    paintList();

    cityPanel.append(
      el('div', { class: 'birth-grid' },
        el('div', { class: 'birth-globe' },
          globe.node,
          el(
            'p',
            { class: 'map-hint' },
            'Dra för att snurra jorden, zooma med knapparna, tryck på en prick.'
          )
        ),
        el('div', { class: 'birth-list' },
          el('div', { class: 'row' }, search),
          list
        )
      ),
      cityCard
    );
    wrap.append(cityPanel);

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

    // Ljudknappen ligger alltid synlig i statusraden, som i förlagan.
    actions.append(audioButton('hud-icon-btn'), restart);

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
        el('h1', { class: 'city-hero-title' }, city.name)
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
    const signs = el('div', { class: 'signs' });
    const addSign = (
      ikon: IconName,
      namn: string,
      beskrivning: string,
      onClick: () => void
    ) => {
      const b = button(
        el('span', { class: 'sign-body' },
          el('span', { class: 'sign-badge' }, icon(ikon)),
          el('span', { class: 'sign-name' }, namn)
        ),
        onClick,
        { class: 'sign', title: beskrivning, 'aria-label': `${namn}. ${beskrivning}` }
      );
      const visa = () => {
        hint.textContent = beskrivning;
      };
      const doljs = () => {
        hint.textContent = 'Tryck på en skylt för att gå dit.';
      };
      b.addEventListener('pointerenter', visa);
      b.addEventListener('focus', visa);
      b.addEventListener('pointerleave', doljs);
      b.addEventListener('blur', doljs);
      signs.append(b);
    };

    addSign(
      'skylt-info',
      'Turistbyrån',
      p.visits === 0
        ? 'Svara på frågor om staden för att få ett betyg som öppnar bättre jobb.'
        : `Gör om provet för att höja ditt betyg (nu ${p.rating}/100).`,
      () => this.startCityQuiz()
    );
    addSign('skylt-tidning', 'Tidningen', 'Läs platsannonserna och ta ett arbetsskift.', () => {
      playSound('sida');
      this.go('tidning');
    });
    addSign(
      'skylt-souvenir',
      'Souvenirer',
      'Köp lokalt och sälj där varan är eftertraktad.',
      () => {
        playSound('marknad');
        this.go('souvenir');
      }
    );
    addSign(
      'skylt-ryggsack',
      'Ryggsäck',
      `${s.backpack.length} souvenirer, ${s.stamps.length} stämplar och all statistik.`,
      () => this.go('ryggsack')
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
      addSign(
        ikon,
        namn,
        `${beskrivning} ${antal} ${antal === 1 ? 'destination' : 'destinationer'} härifrån.`,
        () => {
          this.travelFilter = mode;
          playSound('valj');
          this.go('station');
        }
      );
    }
    addSign(
      'skylt-karta',
      'Kartan',
      'Se var i världen du står, och läs på om staden och landet.',
      () => {
        playSound('sida');
        this.go('varldskarta');
      }
    );
    addSign('skylt-telefon', 'Telefonen', 'Ring hem och låna pengar om kassan är tom.', () => {
      playSound('telefonbabbel');
      this.go('telefon');
    });
    hero.append(signs);
    // Krediten låg tidigare i bilden och krockade omväxlande med stadsnamnet
    // och med skyltraden. Under bilden stör den ingenting.
    wrap.append(
      hero,
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

    // Resehändelsen från senaste sträckan visas överst, en gång, och
    // kvitteras bort så att den inte ligger kvar när man kommer tillbaka.
    if (s.lastEvent) {
      const event = s.lastEvent;
      const card = el('section', { class: `panel event event-${event.tone}` });
      const parts: string[] = [];
      if (event.money !== 0)
        parts.push(
          `${event.money > 0 ? '+' : '−'}${this.money(Math.abs(event.money))}`
        );
      if (event.days !== 0)
        parts.push(`${event.days} ${event.days === 1 ? 'extra dag' : 'extra dagar'}`);
      card.append(
        el('p', { class: 'kicker' }, 'På vägen hit'),
        el('h2', {}, event.title),
        el('p', { class: 'lede' }, event.text),
        parts.length > 0
          ? el('p', { class: 'event-effect' }, parts.join(' · '))
          : el('p', { class: 'muted' }, 'Ingen skada skedd.'),
        button(
          'Okej',
          () => {
            s.lastEvent = undefined;
            this.commit();
            this.render();
          },
          { class: 'btn btn-ghost' }
        )
      );
      wrap.append(card);
    }

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

    const info = el('section', { class: 'panel city-panel' });
    info.append(
      el('p', { class: 'lede' }, city.blurb),
      el(
        'p',
        { class: 'muted' },
        `Sevärdhet: ${city.landmark}. Vandrarhem och mat kostar ${this.money(
          dailyCost(city, s.difficulty)
        )} per dag. Stadsbetyg: ${p.rating}/100.`
      )
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

    const head = el('section', { class: 'panel paper' });
    head.append(
      el('p', { class: 'kicker' }, `${city.name} Daily · dag ${s.days}`),
      el('h1', { class: 'title' }, 'Platsannonser'),
      el(
        'p',
        { class: 'muted' },
        p.visits === 0
          ? 'Du har inte varit på turistbyrån än. Utan stadsbetyg får du bara de enklaste jobben.'
          : `Ditt stadsbetyg är ${p.rating}/100.`
      )
    );
    wrap.append(head);

    const list = el('section', { class: 'panel' });
    for (const job of cityJobs(city)) {
      const allowed = canTakeJob(s, job);
      const worked = p.workedJobs.includes(job.id);
      const wage = wagePerCorrect(job, city, s.difficulty);
      const card = el('article', {
        class: `job ${allowed && !worked ? '' : 'job-locked'}`,
      });
      card.append(
        el('div', { class: 'job-head' },
          el('h3', {}, job.title),
          el('span', { class: `tag tag-w${job.wageClass}` }, `Löneklass ${job.wageClass}`)
        ),
        el('p', { class: 'job-employer' }, employerFor(city, job)),
        el('p', {}, job.ad),
        el(
          'p',
          { class: 'muted' },
          `Ämne: ${CATEGORY_LABELS[job.category] ?? job.category} · ${
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
        card.append(el('p', { class: 'note' }, jobRequirementText(job)));
      } else {
        card.append(
          button('Sök jobbet', () => this.startJob(job), {
            class: 'btn btn-primary',
          })
        );
      }
      list.append(card);
    }
    wrap.append(list);
    return wrap;
  }

  private startJob(job: Job): void {
    const s = this.state!;
    const questions = jobQuestions(job, s.difficulty);
    if (questions.length === 0) {
      this.notify('Ingen arbetsledare på plats i dag.');
      return;
    }
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

    // Arbetsplatsen får en egen rubrik med miljöbild, stämpelkort och
    // lönemätare, så att ett skift känns som en arbetsdag och inte som ett prov.
    if (isJob && q.job) {
      const job = q.job;
      const wage = wagePerCorrect(job, this.city, s.difficulty);
      const site = el('section', { class: 'panel worksite' });
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
    const options = el('div', { class: 'options' });
    current.options.forEach((text, i) => {
      const classes = ['option'];
      if (answered) {
        if (i === current.correctIndex) classes.push('option-right');
        else if (i === answered.picked) classes.push('option-wrong');
        else classes.push('option-dim');
      }
      const b = button(
        el('span', { class: 'option-body' },
          el('span', { class: 'option-key' }, String.fromCharCode(65 + i)),
          el('span', {}, text)
        ),
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

    if (answered) {
      const right = answered.picked === current.correctIndex;
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
              ? ` Rätt var: ${current.options[current.correctIndex]}. Dagen gav ingen lön.`
              : ` Rätt var: ${current.options[current.correctIndex]}.`
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
        el('p', { class: 'keyhint' }, 'Svara med 1-4 eller A-D, eller tryck på alternativet.')
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

  private answerQuestion(picked: number): void {
    const s = this.state!;
    const q = this.quiz!;
    const current = q.questions[q.index]!;
    const right = picked === current.correctIndex;
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
    q.dayResults[q.index] = right;
    q.answered = { picked, payout, combo: comboPart, speed: speedPart };
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
      this.go('stad');
      return;
    }

    const job = q.job!;
    p.workedJobs.push(job.id);
    s.money += q.earnings;
    s.earned += q.earnings;
    s.shiftsWorked += 1;
    if (q.correct === total) s.perfectShifts += 1;
    this.spendDays(job.shiftLength, city);

    // Certifikat om du klarar minst 70 procent av skiftet. Arkadmomentet
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
    ];
    if (bestStreak >= 4) parts.push(`Bästa svit: ${bestStreak} i rad.`);
    if ((q.bonus ?? 0) > 0)
      parts.push(`${job.minigame.title} gav ${this.money(q.bonus ?? 0)} i bonus.`);
    if (gotCert)
      parts.push(
        `Certifikat i ${CATEGORY_LABELS[job.category] ?? job.category}!`
      );
    this.notify(parts.join(' '));
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
      cash: s.money,
      onBuy: (target, route) => this.doTravel(target, route),
    });
    this.station = {
      handle,
      mode,
      cityId: s.currentCityId,
      cash: s.money,
    };
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
  }): HTMLElement {
    const wrap = el('div', { class: 'stack' });
    const panel = el('section', { class: 'panel travel-panel' });
    panel.append(
      el(
        'p',
        { class: 'kicker' },
        `${MODE_LABELS[scene.mode]} · ${scene.from.name} → ${scene.to.name}`
      ),
      el('h1', { class: 'travel-title' }, 'På väg')
    );
    panel.append(
      renderTravelScene({
        from: scene.from,
        to: scene.to,
        vehicle: (size) => iconGroup(`${scene.mode}-profil` as IconName, size),
        onDone: () => {
          this.travelScene = null;
          this.scrollToTopNext = true;
          this.render();
        },
      })
    );
    panel.append(
      el('p', { class: 'muted travel-skip' }, 'Tryck för att hoppa över.')
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
     * stället för att visas direkt, så att den överlever en omladdning och
     * alltid kvitteras på stadsskärmen.
     */
    let event: TravelEvent | undefined;
    if (Math.random() < 0.35) {
      event = pickTravelEvent();
      s.money += event.money;
      if (event.money > 0) s.earned += event.money;
      else s.spent += -event.money;
      if (event.days > 0) this.spendDays(event.days, avgCity);
    }
    s.lastEvent = event;
    // Jobben i staden du lämnar blir sökbara igen nästa gång du kommer hit,
    // annars kan en återvändande resenär inte tjäna något alls.
    getProgress(s, from.id).workedJobs = [];
    s.currentCityId = target.id;
    s.visited.push(target.id);
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
    // Filmen visar sträckan; ankomstsignalen kommer när den spelat klart.
    this.travelScene = { from, to: target, mode: option.mode };
    this.notify(
      `${option.label} till ${target.name}. Framme efter ${
        option.days + (event?.days ?? 0)
      } dagar, klockan står på ${utcLabel(target.utc)}.`
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
          `Inga än. Klara minst ${certificateThreshold(s.difficulty)} procent av ett arbetsskift för att få ett certifikat, som i sin tur öppnar bättre betalda jobb i samma ämne.`
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

    const rest = STAMPS.filter((x) => !s.stamps.includes(x.id));
    if (rest.length > 0) {
      const todo = el('div', { class: 'stamp-todo' });
      todo.append(
        el('h3', { class: 'stamp-todo-head' }, `Kvar att stämpla (${rest.length})`)
      );
      const list = el('ul', { class: 'stamp-todo-list' });
      for (const stamp of rest) {
        list.append(
          el('li', {},
            el('strong', {}, stamp.name),
            el('span', {}, stamp.desc)
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

    const node = el(
      'div',
      {
        class: `pstamp ${ink} ${form}`,
        style: `--vrid:${rotation}deg; --lyft:${lyft}px`,
        // Skärmläsare får hela innebörden; det visuella är dekor.
        role: 'img',
        'aria-label': `${stamp.name}. ${stamp.desc}${
          dag !== undefined ? ` Stämplad dag ${dag}.` : ''
        }`,
        title: stamp.desc,
      },
      el('span', { class: 'pstamp-ring' },
        el('span', { class: 'pstamp-glyph' }, stamp.glyph),
        el('span', { class: 'pstamp-name' }, stamp.name),
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

  private renderPhone(): HTMLElement {
    const s = this.state!;
    const wrap = el('div', { class: 'stack' });
    const amount = loanAmount(s);

    const panel = el('section', { class: 'panel' });
    panel.append(
      el('h1', { class: 'title' }, 'Telefonkiosken'),
      el(
        'p',
        { class: 'lede' },
        s.callsHome === 0
          ? 'Mamma svarar efter andra signalen. Hon har väntat på att du skulle ringa.'
          : `Du har ringt hem ${s.callsHome} gånger. Pappa suckar när han hör din röst.`
      ),
      el(
        'p',
        { class: 'muted' },
        `Nästa lån ger ${this.money(amount)} och läggs på skulden. Nuvarande skuld: ${this.money(
          s.debt
        )}. Skulden dras av från slutpoängen.`
      )
    );
    panel.append(
      button(
        `Låna ${this.money(amount)}`,
        () => {
          s.money += amount;
          s.debt += amount;
          s.callsHome += 1;
          this.commit();
          // Myntet ner i automaten, sedan haranger innan pengarna kommer.
          playSound('myntinkast');
          window.setTimeout(() => playSound('telefonrost'), 320);
          window.setTimeout(() => playSound('kassa'), 2600);
          this.notify(
            `${this.money(amount)} insatt. "Och glöm inte att skicka vykort!"`
          );
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
              s.debt === 0
                ? 'Skulden är betald. Pappa blir tyst en lång stund.'
                : 'Skulden minskad. Pappa blir imponerad.'
            );
            this.go('stad');
          },
          { class: 'btn btn-ghost' }
        )
      );
    }
    wrap.append(panel);
    wrap.append(this.backRow('Lägg på', () => this.go('stad')));
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


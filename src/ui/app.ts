import { CITIES, CITY_BY_ID } from '../data/cities';
import { CURRENCIES, formatMoney } from '../data/currencies';
import { SOUVENIR_BY_ID } from '../data/souvenirs';
import type { City, Job, Souvenir } from '../data/types';
import {
  MIN_CITIES_TO_FINISH,
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
  loanAmount,
  pityBonus,
  souvenirPrice,
  travelOptions,
  wagePerCorrect,
  type PreparedQuestion,
  type TravelOption,
} from '../game/rules';
import {
  clearSave,
  createGame,
  getProgress,
  loadGame,
  saveGame,
  type Difficulty,
  type GameState,
} from '../game/state';
import { button, clear, el } from './dom';
import {
  renderMinigame,
  stopAllMinigames,
  type MinigameResult,
} from './minigames';
import { renderMapFrame } from './map';

interface QuizSession {
  kind: 'turistbyra' | 'jobb';
  questions: PreparedQuestion[];
  index: number;
  correct: number;
  /** Pengar tjänade under skiftet */
  earnings: number;
  job?: Job;
  /** Svar som väntar på att bekräftas */
  answered?: { picked: number; wasCorrect: number };
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
};

export class App {
  private root: HTMLElement;
  private state: GameState | null = null;
  private quiz: QuizSession | null = null;
  private travelTarget: City | null = null;
  private mapHighlight: string | null = null;
  private toast: string | null = null;
  private toastTimer: number | null = null;
  private startPick: { cityId: string; difficulty: Difficulty } = {
    cityId: 'goteborg',
    difficulty: 'turist',
  };

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
    this.render();
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
    this.state.screen = screen;
    saveGame(this.state);
    this.render();
  }

  private notify(message: string): void {
    this.toast = message;
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast = null;
      this.render();
    }, 3200);
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
    s.outcome = 'pank';
    s.finalScore = finalScore(s);
    s.screen = 'slut';
    saveGame(s);
    this.render();
    return true;
  }

  // ------------------------------------------------------------------ render

  private render(): void {
    clear(this.root);
    const s = this.state;

    if (!s) {
      this.root.append(this.renderStart());
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
      case 'karta':
        main.append(this.renderMapScreen());
        break;
      case 'resa':
        main.append(this.renderTravel());
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
    this.root.append(shell);
  }

  // ------------------------------------------------------------- startskärm

  private renderStart(): HTMLElement {
    const wrap = el('div', { class: 'shell start-shell' });
    const hero = el('section', { class: 'panel hero' });
    hero.append(
      el('p', { class: 'kicker' }, 'Jorden runt på frågor och jobb'),
      el('h1', { class: 'title' }, 'Ryggsäckaren'),
      el(
        'p',
        { class: 'lede' },
        'Välj en startstad, jobba dig fram över kontinenterna och handla souvenirer. ' +
          'Kom hem igen med full ryggsäck och pengar kvar på fickan.'
      )
    );

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

    // Svårighetsgrad
    const diffPanel = el('section', { class: 'panel' });
    diffPanel.append(el('h2', {}, 'Svårighetsgrad'));
    const diffRow = el('div', { class: 'choice-grid' });
    const diffs: Array<{ id: Difficulty; name: string; desc: string }> = [
      {
        id: 'turist',
        name: 'Turist',
        desc: 'Lättare frågor, tre svarsalternativ, billigare boende och mer startkapital.',
      },
      {
        id: 'globetrotter',
        name: 'Globetrotter',
        desc: 'Svårare frågor, fyra svarsalternativ, högre löner men tuffare ekonomi.',
      },
    ];
    for (const d of diffs) {
      const selected = this.startPick.difficulty === d.id;
      diffRow.append(
        button(
          el('span', { class: 'choice-body' },
            el('span', { class: 'choice-name' }, d.name),
            el('span', { class: 'choice-desc' }, d.desc)
          ),
          () => {
            this.startPick.difficulty = d.id;
            this.render();
          },
          { class: `choice ${selected ? 'choice-on' : ''}` }
        )
      );
    }
    diffPanel.append(diffRow);
    wrap.append(diffPanel);

    // Startstad
    const cityPanel = el('section', { class: 'panel' });
    const chosen = CITY_BY_ID[this.startPick.cityId]!;
    cityPanel.append(
      el('h2', {}, 'Startstad'),
      el(
        'p',
        { class: 'muted' },
        'Staden du väljer blir också ditt slutmål, och dess valuta blir den du räknar i. ' +
          `Just nu: ${chosen.name}, ${chosen.country} (${
            CURRENCIES[chosen.currency]?.name ?? chosen.currency
          }).`
      )
    );
    cityPanel.append(
      renderMapFrame({
        currentCityId: '',
        homeCityId: this.startPick.cityId,
        visited: [],
        highlightId: this.startPick.cityId,
        onSelect: (city) => {
          this.startPick.cityId = city.id;
          this.render();
        },
      })
    );
    cityPanel.append(
      el('p', { class: 'map-hint' }, 'Svep i sidled för att se hela kartan.')
    );

    const select = el('select', { class: 'select', 'aria-label': 'Välj startstad' });
    for (const c of [...CITIES].sort((a, b) => a.name.localeCompare(b.name, 'sv'))) {
      const opt = el('option', { value: c.id }, `${c.name}, ${c.country}`);
      if (c.id === this.startPick.cityId) opt.selected = true;
      select.append(opt);
    }
    select.addEventListener('change', () => {
      this.startPick.cityId = select.value;
      this.render();
    });
    cityPanel.append(el('div', { class: 'row' }, select));
    wrap.append(cityPanel);

    const actions = el('div', { class: 'panel actions-panel' });
    actions.append(
      button(
        `Res iväg från ${chosen.name}`,
        () => {
          const city = CITY_BY_ID[this.startPick.cityId]!;
          this.state = createGame(
            city.id,
            city.currency,
            this.startPick.difficulty
          );
          saveGame(this.state);
          this.notify(
            `Resan börjar i ${city.name}. Besök minst ${MIN_CITIES_TO_FINISH} städer innan du kommer hem.`
          );
          this.render();
        },
        { class: 'btn btn-primary btn-big' }
      )
    );
    wrap.append(actions);

    wrap.append(
      el(
        'p',
        { class: 'footnote' },
        'Ett hyllningsspel till Backpacker 2. Frågor och innehåll är nyskrivna.'
      )
    );
    return wrap;
  }

  // -------------------------------------------------------------------- HUD

  private renderHud(): HTMLElement {
    const s = this.state!;
    const city = this.city;
    const hud = el('header', { class: 'hud' });

    const left = el('div', { class: 'hud-place' });
    left.append(
      el('span', { class: 'hud-city' }, city.name),
      el('span', { class: 'hud-country' }, city.country)
    );

    const stats = el('div', { class: 'hud-stats' });
    stats.append(
      stat('Kassa', this.money(s.money), s.money < 0 ? 'bad' : undefined),
      stat('Dag', String(s.days)),
      stat('Städer', `${new Set(s.visited).size}`),
      stat('Skuld', this.money(s.debt), s.debt > 0 ? 'warn' : undefined)
    );

    hud.append(left, stats);
    return hud;
  }

  // ------------------------------------------------------------------- stad

  private renderCity(): HTMLElement {
    const s = this.state!;
    const city = this.city;
    const p = getProgress(s, city.id);
    const wrap = el('div', { class: 'stack' });

    const info = el('section', { class: 'panel city-panel' });
    info.append(
      el('p', { class: 'kicker' }, `${city.country} · ${CURRENCIES[city.currency]?.name ?? city.currency}`),
      el('h1', { class: 'title' }, city.name),
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

    const menu = el('section', { class: 'panel' });
    menu.append(el('h2', {}, 'Vad gör du i dag?'));
    const grid = el('div', { class: 'menu-grid' });

    grid.append(
      menuButton(
        'Turistbyrån',
        p.visits === 0
          ? 'Svara på frågor om staden för att få ett betyg som öppnar bättre jobb.'
          : `Gör om provet för att höja ditt betyg (nu ${p.rating}/100).`,
        () => this.startCityQuiz()
      ),
      menuButton(
        'Tidningen',
        'Läs platsannonserna och ta ett arbetsskift.',
        () => this.go('tidning')
      ),
      menuButton(
        'Souvenirbutiken',
        'Köp lokalt och sälj där varan är eftertraktad.',
        () => this.go('souvenir')
      ),
      menuButton(
        'Ryggsäcken',
        `${s.backpack.length} souvenirer, certifikat och statistik.`,
        () => this.go('ryggsack')
      ),
      menuButton(
        'Resebyrån',
        'Välj nästa destination på kartan.',
        () => this.go('karta')
      ),
      menuButton(
        'Telefonkiosken',
        'Ring hem och låna pengar om kassan är tom.',
        () => this.go('telefon')
      )
    );
    menu.append(grid);
    wrap.append(menu);

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
              s.outcome = 'vinst';
              s.finalScore = finalScore(s);
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
        el('p', { class: 'job-employer' }, job.employer),
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
    wrap.append(this.backRow('Tillbaka till staden', () => this.go('stad')));
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
            el('p', { class: 'kicker' }, job.employer),
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
          style: `width:${Math.round((q.index / total) * 100)}%`,
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
        { class: classes.join(' '), disabled: answered ? true : undefined }
      );
      options.append(b);
    });
    panel.append(options);

    if (answered) {
      const right = answered.picked === current.correctIndex;
      const feedback = el('div', {
        class: `feedback ${right ? 'feedback-right' : 'feedback-wrong'}`,
      });
      feedback.append(
        el('strong', {}, right ? 'Rätt svar!' : 'Fel svar.'),
        el(
          'span',
          {},
          right
            ? isJob
              ? ` Dagen är avklarad och du tjänade ${this.money(answered.wasCorrect)}.`
              : ' Ett steg närmare ett bra stadsbetyg.'
            : isJob
              ? ` Rätt var: ${current.options[current.correctIndex]}. Dagen gav ingen lön.`
              : ` Rätt var: ${current.options[current.correctIndex]}.`
        )
      );
      if (current.question.info) {
        feedback.append(el('p', { class: 'info' }, current.question.info));
      }
      panel.append(feedback);
      const last = q.index + 1 >= total;
      panel.append(
        button(
          last
            ? isJob
              ? `Avsluta dagen och gå till ${q.job?.minigame.title.toLowerCase() ?? 'sista uppgiften'}`
              : 'Se resultatet'
            : isJob
              ? 'Nästa arbetsdag'
              : 'Nästa fråga',
          () => this.advanceQuiz(),
          { class: 'btn btn-primary btn-big' }
        )
      );
    }

    if (!isJob) {
      panel.append(
        el('p', { class: 'muted' },
          `Rätt så här långt: ${q.correct} av ${q.index + (answered ? 1 : 0)}`
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
          el('p', { class: 'kicker' }, job.employer),
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
        renderMinigame(game, (result) => this.finishMinigame(result))
      );
      wrap.append(panel);
      return wrap;
    }

    // Klart: visa resultatet och låt spelaren kvittera ut lönen.
    const result = q.minigameResult;
    const panel = el('section', { class: 'panel' });
    const grade =
      (result?.score ?? 0) >= 0.8
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
    let payout = 0;

    if (right) {
      q.correct += 1;
      s.correct += 1;
      if (q.kind === 'jobb' && q.job) {
        const wage = wagePerCorrect(q.job, this.city, s.difficulty);
        payout = wage + pityBonus(s.wrongStreak, wage);
        q.earnings += payout;
      }
      s.wrongStreak = 0;
    } else {
      s.wrong += 1;
      s.wrongStreak += 1;
    }

    q.dayResults[q.index] = right;
    q.answered = { picked, wasCorrect: payout };
    saveGame(s);
    this.render();
  }

  private advanceQuiz(): void {
    const q = this.quiz!;
    q.answered = undefined;
    if (q.index + 1 < q.questions.length) {
      q.index += 1;
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
    // Bonusen motsvarar upp till tre dagslöner, efter hur bra momentet gick.
    const wage = wagePerCorrect(job, this.city, s.difficulty);
    const bonus = Math.round(wage * 3 * result.score);
    q.minigameResult = result;
    q.bonus = bonus;
    q.earnings += bonus;
    q.phase = 'klart';
    saveGame(s);
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
      saveGame(s);
      if (this.checkBroke()) return;
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
    this.spendDays(job.shiftLength, city);

    // Certifikat om du klarar minst 70 procent av skiftet. Arkadmomentet
    // väger in, så ett svagt frågeresultat kan räddas av gott handlag.
    const mgScore = q.minigameResult?.score ?? 0;
    const shiftScore = Math.round(score * 0.75 + mgScore * 100 * 0.25);
    let gotCert = false;
    if (shiftScore >= 70) {
      const prev = s.certificates[job.category] ?? 0;
      s.certificates[job.category] = prev + 1;
      gotCert = true;
    }
    this.quiz = null;
    saveGame(s);
    if (this.checkBroke()) return;

    const parts = [
      `${job.title}: ${q.correct}/${total} rätt.`,
      `Lön ${this.money(q.earnings)}.`,
      `${job.shiftLength} dagar gick åt.`,
    ];
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

  private renderMapScreen(): HTMLElement {
    const s = this.state!;
    const wrap = el('div', { class: 'stack' });

    const panel = el('section', { class: 'panel' });
    panel.append(
      el('h1', { class: 'title' }, 'Resebyrån'),
      el(
        'p',
        { class: 'muted' },
        `Du står i ${this.city.name}. Tryck på en stad för att se biljettpriser. ` +
          `Hemstaden ${CITY_BY_ID[s.homeCityId]!.name} är markerad med ring.`
      )
    );
    panel.append(
      renderMapFrame({
        currentCityId: s.currentCityId,
        homeCityId: s.homeCityId,
        visited: s.visited,
        highlightId: this.mapHighlight ?? undefined,
        onSelect: (city) => {
          this.travelTarget = city;
          this.mapHighlight = city.id;
          this.go('resa');
        },
      })
    );
    panel.append(
      el(
        'p',
        { class: 'map-hint' },
        'Svep i sidled för att se hela kartan, eller använd listan nedan.'
      )
    );
    wrap.append(panel);

    const list = el('section', { class: 'panel' });
    list.append(el('h2', {}, 'Destinationer'));
    const sorted = CITIES.filter((c) => c.id !== s.currentCityId).sort(
      (a, b) => distanceKm(this.city, a) - distanceKm(this.city, b)
    );
    const table = el('div', { class: 'dest-list' });
    for (const c of sorted) {
      const km = distanceKm(this.city, c);
      const cheapest = travelOptions(this.city, c)[0]!;
      const row = button(
        el('span', { class: 'dest-row' },
          el('span', { class: 'dest-name' }, `${c.name}`),
          el('span', { class: 'dest-country' }, c.country),
          el('span', { class: 'dest-km' }, `${km.toLocaleString('sv-SE')} km`),
          el('span', { class: 'dest-price' }, `från ${this.money(cheapest.price)}`)
        ),
        () => {
          this.travelTarget = c;
          this.mapHighlight = c.id;
          this.go('resa');
        },
        { class: `dest ${s.visited.includes(c.id) ? 'dest-visited' : ''}` }
      );
      table.append(row);
    }
    list.append(table);
    wrap.append(list);
    wrap.append(this.backRow('Tillbaka till staden', () => this.go('stad')));
    return wrap;
  }

  private renderTravel(): HTMLElement {
    const s = this.state!;
    const target = this.travelTarget;
    const wrap = el('div', { class: 'stack' });
    if (!target) {
      wrap.append(this.backRow('Till kartan', () => this.go('karta')));
      return wrap;
    }

    const from = this.city;
    const km = distanceKm(from, target);
    const tz = Math.abs(target.utc - from.utc);

    const panel = el('section', { class: 'panel' });
    panel.append(
      el('p', { class: 'kicker' }, `${from.name} → ${target.name}`),
      el('h1', { class: 'title' }, target.name),
      el('p', { class: 'lede' }, target.blurb),
      el(
        'p',
        { class: 'muted' },
        `${km.toLocaleString('sv-SE')} km · ${tz} tidszoner · boende där ${this.money(
          dailyCost(target, s.difficulty)
        )} per dag`
      )
    );
    wrap.append(panel);

    const opts = el('section', { class: 'panel' });
    opts.append(el('h2', {}, 'Välj biljett'));
    const tickets = travelOptions(from, target);
    const anyAffordable = tickets.some((t) => s.money >= t.price);
    for (const option of tickets) {
      const affordable = s.money >= option.price;
      const card = el('article', { class: 'ticket' });
      card.append(
        el('div', { class: 'ticket-head' },
          el('h3', {}, option.label),
          el('span', { class: 'ticket-price' }, this.money(option.price))
        ),
        el('p', {}, option.desc),
        el('p', { class: 'muted' }, `${option.days} dagars restid`)
      );
      card.append(
        button(
          affordable ? 'Boka' : 'För dyrt just nu',
          () => this.doTravel(target, option),
          {
            class: `btn ${affordable ? 'btn-primary' : 'btn-ghost'}`,
            disabled: affordable ? undefined : true,
          }
        )
      );
      opts.append(card);
    }
    wrap.append(opts);

    if (!anyAffordable) {
      const help = el('section', { class: 'panel' });
      help.append(
        el('h2', {}, 'Kassan räcker inte'),
        el(
          'p',
          { class: 'muted' },
          'Du kan jobba ihop mer i staden du står i, välja en närmare destination, sälja souvenirer eller ringa hem efter pengar.'
        ),
        el('div', { class: 'row' },
          button('Ring hem och låna', () => this.go('telefon'), {
            class: 'btn btn-primary',
          }),
          button('Sälj souvenirer', () => this.go('souvenir'), {
            class: 'btn btn-ghost',
          }),
          button('Sök jobb', () => this.go('tidning'), {
            class: 'btn btn-ghost',
          })
        )
      );
      wrap.append(help);
    }

    wrap.append(this.backRow('Välj annan stad', () => this.go('karta')));
    return wrap;
  }

  private doTravel(target: City, option: TravelOption): void {
    const s = this.state!;
    if (s.money < option.price) {
      this.notify('Du har inte råd med den biljetten.');
      return;
    }
    const from = this.city;
    s.money -= option.price;
    s.spent += option.price;
    s.distance += distanceKm(from, target);
    s.timezonesCrossed += Math.abs(target.utc - from.utc);
    // Restiden kostar boende i genomsnitt av de två städerna.
    const avgCity: City =
      from.costIndex >= target.costIndex ? target : from;
    this.spendDays(option.days, avgCity);
    // Jobben i staden du lämnar blir sökbara igen nästa gång du kommer hit,
    // annars kan en återvändande resenär inte tjäna något alls.
    getProgress(s, from.id).workedJobs = [];
    s.currentCityId = target.id;
    s.visited.push(target.id);
    this.travelTarget = null;
    this.mapHighlight = null;
    saveGame(s);
    if (this.checkBroke()) return;
    this.notify(
      `Framme i ${target.name} efter ${option.days} dagar. Klockan står på UTC${
        target.utc >= 0 ? '+' : ''
      }${target.utc}.`
    );
    this.go('stad');
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
      const card = el('article', { class: 'item' });
      card.append(
        el('div', { class: 'item-head' },
          el('h3', {}, souvenir.name),
          el('span', { class: 'item-price' }, this.money(price))
        ),
        el('p', {}, souvenir.desc),
        el(
          'p',
          { class: 'muted' },
          cheap
            ? 'Tillverkas här - lågt pris.'
            : hot
              ? 'Eftertraktad här - dyrt att köpa, bra att sälja.'
              : 'Normalt pris i den här delen av världen.'
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
    wrap.append(this.backRow('Tillbaka till staden', () => this.go('stad')));
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
    saveGame(s);
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
    saveGame(s);
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
      el('h1', { class: 'title' }, 'Ryggsäcken'),
      el('div', { class: 'stat-grid' },
        stat('Souvenirer', `${s.backpack.length}/12`),
        stat('Värde hemma', this.money(backpackHomeValue(s))),
        stat('Rätta svar', `${s.correct}`),
        stat('Felsvar', `${s.wrong}`),
        stat('Träffsäkerhet', `${accuracy}%`),
        stat('Flugna km', s.distance.toLocaleString('sv-SE')),
        stat('Tidszoner', `${s.timezonesCrossed}`),
        stat('Samtal hem', `${s.callsHome}`)
      )
    );
    wrap.append(head);

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
          'Inga än. Klara minst 70 procent av ett arbetsskift för att få ett certifikat, som i sin tur öppnar bättre betalda jobb i samma ämne.'
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
    wrap.append(this.backRow('Tillbaka till staden', () => this.go('stad')));
    return wrap;
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
          saveGame(s);
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
            saveGame(s);
            this.notify('Skulden minskad. Pappa blir imponerad.');
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

  private renderEnd(): HTMLElement {
    const s = this.state!;
    const wrap = el('div', { class: 'stack' });
    const won = s.outcome === 'vinst';
    const bag = backpackHomeValue(s);
    const answered = s.correct + s.wrong;
    const accuracy = answered ? Math.round((s.correct / answered) * 100) : 0;

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
    wrap.append(panel);

    const scores = el('section', { class: 'panel' });
    scores.append(
      el('h2', {}, 'Slutresultat'),
      el('div', { class: 'stat-grid' },
        stat('Poäng', (s.finalScore ?? finalScore(s)).toLocaleString('sv-SE')),
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
        stat('Tidszoner', `${s.timezonesCrossed}`)
      ),
      el(
        'p',
        { class: 'muted' },
        `Reseväg: ${s.visited.map((id) => CITY_BY_ID[id]?.name ?? id).join(' → ')}`
      )
    );
    wrap.append(scores);

    const actions = el('section', { class: 'panel actions-panel' });
    actions.append(
      button(
        'Ny resa',
        () => {
          clearSave();
          this.state = null;
          this.quiz = null;
          this.render();
        },
        { class: 'btn btn-primary btn-big' }
      )
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

function stat(label: string, value: string, tone?: string): HTMLElement {
  return el('div', { class: `stat ${tone ? `stat-${tone}` : ''}` },
    el('span', { class: 'stat-label' }, label),
    el('span', { class: 'stat-value' }, value)
  );
}

function menuButton(
  title: string,
  desc: string,
  onClick: () => void
): HTMLElement {
  return button(
    el('span', { class: 'choice-body' },
      el('span', { class: 'choice-name' }, title),
      el('span', { class: 'choice-desc' }, desc)
    ),
    onClick,
    { class: 'choice menu-item' }
  );
}

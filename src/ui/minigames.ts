import type { Minigame } from '../data/types';
import { playCombo, playSound } from './audio';
import { button, clear, el } from './dom';
import { quizImageUrl } from '../data/quizImages';

/**
 * Arkadmomenten som avslutar ett arbetsskift. Alla åtta är byggda för att
 * fungera lika bra med finger som med mus, och kan avslutas utan att spelet
 * hänger sig. Varje spel rapporterar ett resultat mellan 0 och 1 som styr
 * bonusen på lönen.
 *
 * De två äldsta momenten hade samma grundfel: det som skulle hanteras var
 * bokstavligen namnet på knappen man skulle trycka på, så det gick att klara
 * utan att veta något alls. Sorteringen får nu konkreta föremål ur jobbets
 * `pool` och panelen ger flera order i rad som ska utföras i ordning.
 */

export interface MinigameResult {
  /** Andel rätt, 0 till 1 */
  score: number;
  /** Kort sammanfattning som visas efteråt */
  summary: string;
  /** Sattes om spelaren klarade allt utan miss */
  perfect?: boolean;
}

/** Sådant momenten behöver veta om resan de spelas på. */
export interface MinigameContext {
  money: (baseAmount: number) => string;
  /**
   * Marginalen svårighetsgraden ger. Över 1 betyder mer tid och bredare
   * zoner (Turist), under 1 snävare (Globetrotter). Momenten är desamma i
   * båda lägena; det är kraven som skiljer.
   */
  slack: number;
  /** Hur många svarsalternativ läget visar: tre i Turist, fyra annars. */
  alternativ: number;
}

type Done = (result: MinigameResult) => void;

/**
 * Touchskärmar levererar `click` först när fingret lyfts, ofta 50-100 ms
 * efter att det satts ner. I de moment där tiden bedöms i tiondelar är det
 * hela skillnaden mellan rent och nästan. Knapparna som ska vara snabba
 * lyssnar därför på pointerdown, och klicket som följer ignoreras.
 */
function snabbKnapp(label: string, onPress: () => void, attrs: Record<string, string>): HTMLElement {
  const b = button(label, () => {}, attrs);
  b.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    onPress();
  });
  return b;
}

/**
 * Ungefärlig fördröjning från finger till händelse, i millisekunder, som
 * taktmomentet räknar bort. Ett rent slag på skärmen ska räknas som rent.
 */
const INPUT_LAG_MS = 45;

/** Startar rätt spel och lämnar tillbaka elementet det spelas i. */
export function renderMinigame(
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): HTMLElement {
  const host = el('div', { class: `minigame minigame-${game.kind}` });
  // Varje spel anropar onDone exakt en gång, även om spelaren hinner trycka
  // flera gånger på slutet.
  let finished = false;
  const done: Done = (result) => {
    if (finished) return;
    finished = true;
    playSound(result.perfect ? 'perfekt' : result.score >= 0.5 ? 'niva' : 'varning');
    onDone(result);
  };

  switch (game.kind) {
    case 'precision':
      startPrecision(host, game, ctx, done);
      break;
    case 'balans':
      startBalance(host, game, ctx, done);
      break;
    case 'takt':
      startRhythm(host, game, ctx, done);
      break;
    case 'trick':
      startTrick(host, game, ctx, done);
      break;
    case 'tidslinje':
      startTimeline(host, game, done);
      break;
    case 'bildval':
      startPictureChoice(host, game, done);
      break;
    case 'peka':
      startPointAt(host, game, done);
      break;
    case 'avgor':
      startDecide(host, game, done);
      break;
    case 'quiz':
      startQuiz(host, game, ctx, done);
      break;
    case 'lagval':
      startTeamPick(host, game, done);
      break;
  }
  return host;
}

// ------------------------------------------------------------- tidshantering

/**
 * Städar upp timers om spelaren lämnar skärmen mitt i ett spel. Både
 * intervall, timeouts och animationsbildrutor måste med, annars fortsätter
 * ett moment att ticka i bakgrunden efter ett skärmbyte.
 */
const timers = new Set<number>();
const frames = new Set<number>();
/**
 * Moment som lyssnar på tangentbordet måste också få städa efter sig. Utan
 * det låg lyssnarna kvar när spelaren lämnade skärmen mitt i, och ett
 * mellanslag långt senare kunde slå an en trumma som inte fanns.
 */
const cleanups = new Set<() => void>();

function onTeardown(fn: () => void): () => void {
  cleanups.add(fn);
  return () => {
    cleanups.delete(fn);
    fn();
  };
}

export function stopAllMinigames(): void {
  for (const id of timers) {
    window.clearInterval(id);
    window.clearTimeout(id);
  }
  timers.clear();
  for (const id of frames) window.cancelAnimationFrame(id);
  frames.clear();
  for (const fn of cleanups) fn();
  cleanups.clear();
}


function after(ms: number, fn: () => void): number {
  const id = window.setTimeout(fn, ms);
  timers.add(id);
  return id;
}

function stop(id: number): void {
  window.clearInterval(id);
  window.clearTimeout(id);
  timers.delete(id);
}

/**
 * Animationsslinga som stannar av sig själv när callbacken returnerar false,
 * och som alltid går att avbryta med stopAllMinigames.
 */
function loop(fn: (dt: number, elapsed: number) => boolean): () => void {
  let last = performance.now();
  const startedAt = last;
  let id = 0;
  let alive = true;
  const step = (now: number) => {
    frames.delete(id);
    if (!alive) return;
    const dt = Math.min(100, now - last);
    last = now;
    if (fn(dt, now - startedAt)) {
      id = window.requestAnimationFrame(step);
      frames.add(id);
    }
  };
  id = window.requestAnimationFrame(step);
  frames.add(id);
  return () => {
    alive = false;
    window.cancelAnimationFrame(id);
    frames.delete(id);
  };
}

// ------------------------------------------------------------- gemensamt

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function shuffled<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/**
 * Räknaren högst upp i varje moment. Den visar hur långt spelaren kommit och
 * hur det gått, i samma form överallt, så att man känner igen sig direkt.
 */
function makeStatus(): {
  node: HTMLElement;
  set: (step: string, tally: string) => void;
} {
  const stepEl = el('span', { class: 'mg-step' });
  const tallyEl = el('span', { class: 'mg-tally' });
  const node = el('p', { class: 'mg-status' }, stepEl, tallyEl);
  return {
    node,
    set: (step, tally) => {
      stepEl.textContent = step;
      tallyEl.textContent = tally;
    },
  };
}

/** Tidsmätare som färgar sig röd på slutet och piper en gång som varning. */
function makeTimer(): {
  node: HTMLElement;
  run: (ms: number, onOut: () => void) => void;
  halt: () => void;
} {
  const bar = el('span', { class: 'mg-timebar' });
  const node = el('div', { class: 'mg-timer' }, bar);
  let ticker = 0;
  let cancel: (() => void) | null = null;
  const halt = () => {
    if (ticker) stop(ticker);
    ticker = 0;
    if (cancel) cancel();
    cancel = null;
    bar.classList.remove('mg-timebar-low');
  };
  const run = (ms: number, onOut: () => void) => {
    halt();
    let warned = false;
    const startedAt = performance.now();
    bar.style.width = '100%';
    cancel = loop((_, elapsed) => {
      void elapsed;
      const left = 1 - (performance.now() - startedAt) / ms;
      bar.style.width = `${Math.max(0, left * 100)}%`;
      if (left <= 0.28 && !warned) {
        warned = true;
        bar.classList.add('mg-timebar-low');
        playSound('varning');
      }
      if (left <= 0) {
        onOut();
        return false;
      }
      return true;
    });
  };
  return { node, run, halt };
}

/** Kort kvittens mitt i spelet: rätt, fel eller något däremellan. */
function makeFeedback(): {
  node: HTMLElement;
  say: (text: string, tone: 'ok' | 'fel' | 'topp' | 'neutral') => void;
} {
  const node = el('p', { class: 'mg-feedback' });
  return {
    node,
    say: (text, tone) => {
      node.textContent = text;
      node.className = `mg-feedback mg-feedback-${tone}`;
    },
  };
}

// --------------------------------------------------------------- precision

/**
 * En markör svänger fram och tillbaka över en skala och spelaren stoppar den
 * i den gröna zonen. Mitten av zonen ger full poäng, kanterna halv - det
 * lönar sig alltså att sikta, inte bara att hamna innanför.
 */
/** Prickens läge och bredd som andel av zonen. */
const BULL_FROM = 0.25;
const BULL_SHARE = 0.5;

function startPrecision(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const TRIES = 5;
  const label = game.items[0] ?? 'Mätvärde';
  let attempt = 0;
  let points = 0;
  let bulls = 0;
  let pos = 0;
  let dir = 1;
  let cancel: (() => void) | null = null;
  let running = false;

  const status = makeStatus();
  const zone = el('span', { class: 'mg-zone' });
  const bull = el('span', { class: 'mg-bull' });
  const needle = el('span', { class: 'mg-needle' });
  const gauge = el('div', { class: 'mg-gauge' }, zone, bull, needle);
  const feedback = makeFeedback();
  const actions = el('div', { class: 'mg-buttons' });
  host.append(status.node, gauge, feedback.node, actions);

  let zoneStart = 0;
  let zoneWidth = 0;

  const newAttempt = () => {
    if (attempt >= TRIES) {
      onDone({
        score: points / TRIES,
        summary:
          bulls > 0
            ? `Du träffade zonen ${Math.round(points * 10) / 10} gånger av ${TRIES}, varav ${bulls} mitt i prick.`
            : `Du träffade zonen ${Math.round(points * 10) / 10} gånger av ${TRIES}.`,
        perfect: bulls === TRIES,
      });
      return;
    }
    // Zonen krymper men hålls rimlig, och placeras aldrig helt ute i kanten.
    zoneWidth = Math.max(18, 30 - attempt * 2.5) * ctx.slack;
    zoneStart = 8 + Math.random() * (100 - 16 - zoneWidth);
    zone.style.left = `${zoneStart}%`;
    zone.style.width = `${zoneWidth}%`;
    /**
     * Pricken är halva zonen. Med en smalare prick och den fart markören
     * har mot slutet blev "mitt i" ett fönster på fyrtio millisekunder -
     * ett lotteri på en touchskärm, som dessutom levererar trycket sent.
     */
    bull.style.left = `${zoneStart + zoneWidth * BULL_FROM}%`;
    bull.style.width = `${zoneWidth * BULL_SHARE}%`;
    status.set(`Försök ${attempt + 1}/${TRIES}`, `${bulls} mitt i prick`);
    feedback.say(`${label}: stoppa markören i det gröna fältet.`, 'neutral');
    gauge.classList.remove('mg-gauge-right', 'mg-gauge-wrong');

    pos = 0;
    dir = 1;
    const speed = (0.05 + attempt * 0.008) / ctx.slack;
    running = true;
    cancel = loop((dt) => {
      pos += dir * speed * dt;
      if (pos >= 100) {
        pos = 100;
        dir = -1;
      }
      if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      needle.style.left = `${pos}%`;
      return running;
    });

    clear(actions);
    actions.append(
      snabbKnapp('Stoppa', judge, {
        class: 'btn btn-primary mg-stop',
        'data-sound': 'av',
      })
    );
  };

  const judge = () => {
    if (!running) return;
    running = false;
    if (cancel) cancel();
    cancel = null;

    const inZone = pos >= zoneStart && pos <= zoneStart + zoneWidth;
    const bullStart = zoneStart + zoneWidth * BULL_FROM;
    const inBull = pos >= bullStart && pos <= bullStart + zoneWidth * BULL_SHARE;
    const unit = game.unit ? ` ${game.unit}` : '';

    if (inBull) {
      points += 1;
      bulls += 1;
      playSound('perfekt');
      feedback.say(`Mitt i prick på ${Math.round(pos)}${unit}!`, 'topp');
    } else if (inZone) {
      points += 0.6;
      playSound('ratt');
      feedback.say(`Innanför, men lite snett: ${Math.round(pos)}${unit}.`, 'ok');
    } else {
      playSound('fel');
      feedback.say(`${Math.round(pos)}${unit} hamnade utanför zonen.`, 'fel');
    }
    gauge.classList.add(inZone ? 'mg-gauge-right' : 'mg-gauge-wrong');
    attempt += 1;
    clear(actions);
    after(inZone ? 700 : 900, newAttempt);
  };

  newAttempt();
}

// ------------------------------------------------------------------ balans

/**
 * Något tungt lutar åt sidan och driver undan av sig självt. Spelaren håller
 * inne vänster eller höger för att styra tillbaka. Poängen är andelen av
 * tiden som lutningen hållits inom det gröna fältet, så en enstaka vurpa
 * sänker resultatet utan att avsluta momentet.
 */
function startBalance(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const DURATION = 22000;
  const SAFE = 26 * ctx.slack; // halva bredden på det gröna fältet
  const label = game.items[0] ?? 'Lasten';

  /** -100 till 100, noll är rakt. */
  let tilt = 0;
  let drift = 0;
  let push = 0;
  let insideMs = 0;
  let totalMs = 0;
  let wobbles = 0;
  /**
   * Hur länge lasten legat utanför fältet i sträck. En kort överskjutning är
   * en normal korrigering och ska varken låta eller räknas; först när den
   * håller i sig en stund är det en riktig vurpa.
   */
  let outsideMs = 0;
  let countedThisSlip = false;
  let running = true;

  const status = makeStatus();
  const feedback = makeFeedback();
  const safeZone = el('span', { class: 'mg-balance-safe' });
  /**
   * Det gröna fältet måste ritas ur samma tal som poängen räknas ur, annars
   * visar spelet en zon och bedömer en annan. Markören ligger på
   * 50 + tilt / 2 procent, så fältet blir SAFE procent brett kring mitten.
   */
  safeZone.style.left = `${50 - SAFE / 2}%`;
  safeZone.style.width = `${SAFE}%`;
  const marker = el('span', { class: 'mg-balance-marker' });
  const track = el('div', { class: 'mg-balance-track' }, safeZone, marker);
  const carried = el('p', { class: 'mg-balance-label' }, label);
  const timer = makeTimer();

  const leftBtn = button('◀ Styr vänster', () => {}, {
    class: 'btn mg-hold',
    'data-sound': 'av',
  });
  const rightBtn = button('Styr höger ▶', () => {}, {
    class: 'btn mg-hold',
    'data-sound': 'av',
  });
  const controls = el('div', { class: 'mg-buttons mg-hold-row' }, leftBtn, rightBtn);

  host.append(status.node, carried, track, timer.node, feedback.node, controls);

  /**
   * Knapparna ska verka så länge de hålls inne. pointerdown/-up täcker mus,
   * penna och finger i samma händelseström, och pointercancel behövs för att
   * ett finger som glider av knappen inte ska fastna i intryckt läge.
   */
  const hold = (node: HTMLElement, direction: number) => {
    const down = (event: Event) => {
      event.preventDefault();
      push = direction;
      node.classList.add('mg-hold-on');
    };
    const up = () => {
      if (push === direction) push = 0;
      node.classList.remove('mg-hold-on');
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointerleave', up);
    node.addEventListener('pointercancel', up);
  };
  hold(leftBtn, -1);
  hold(rightBtn, 1);

  // Tangentbord: pilarna gör samma sak som knapparna.
  const onKey = (event: KeyboardEvent) => {
    if (!running) return;
    if (event.key === 'ArrowLeft') push = event.type === 'keydown' ? -1 : 0;
    if (event.key === 'ArrowRight') push = event.type === 'keydown' ? 1 : 0;
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  const unbind = onTeardown(() => {
    running = false;
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
  });

  const finish = () => {
    if (!running) return;
    running = false;
    unbind();
    timer.halt();
    const share = totalMs > 0 ? insideMs / totalMs : 0;
    onDone({
      score: Math.max(0, Math.min(1, (share - 0.25) / 0.7)),
      summary:
        wobbles === 0
          ? `Du höll balansen ${Math.round(share * 100)} procent av tiden, utan en enda vurpa.`
          : `Du höll balansen ${Math.round(share * 100)} procent av tiden, med ${wobbles} ${
              wobbles === 1 ? 'vurpa' : 'vurpor'
            }.`,
      perfect: wobbles === 0 && share >= 0.9,
    });
  };

  timer.run(DURATION, finish);

  loop((dt) => {
    if (!running) return false;
    totalMs += dt;

    /**
     * Driften byter riktning då och då och blir starkare mot slutet. Var
     * åttonde omkastning är en kraftigare vindstöt, så att momentet aldrig
     * går på ren rutin ens för den som håller ögonen på markören.
     */
    if (Math.random() < dt / 620) {
      const gust = Math.random() < 0.12 ? 1.8 : 1;
      drift =
        (Math.random() * 2 - 1) * (0.03 + (totalMs / DURATION) * 0.045) * gust;
      // Vinden får aldrig vara starkare än styrningen (0,19 nedan), annars
      // står man och håller emot utan att det hjälper.
      drift = Math.max(-0.13, Math.min(0.13, drift));
    }
    /**
     * Lutningen förstärker sig själv: ju snedare, desto snabbare tippar det.
     * Styrningen måste därför vara starkare än tyngdkraften även vid full
     * lutning, annars går det inte att ta sig tillbaka från kanten.
     * Markören följer knappen man håller inne, så höger flyttar åt höger.
     */
    const gravity = tilt * 0.0006;
    tilt += (drift + gravity + push * 0.19) * dt;
    tilt = Math.max(-100, Math.min(100, tilt));

    const inside = Math.abs(tilt) <= SAFE;
    if (inside) {
      insideMs += dt;
      if (outsideMs > 0 && countedThisSlip) feedback.say('Bra, rakt igen.', 'ok');
      outsideMs = 0;
      countedThisSlip = false;
    } else {
      outsideMs += dt;
      if (outsideMs > 400 && !countedThisSlip) {
        countedThisSlip = true;
        wobbles += 1;
        playSound('varning');
        feedback.say('Håll emot! Lasten glider.', 'fel');
      }
    }

    marker.style.left = `${50 + tilt / 2}%`;
    marker.classList.toggle('mg-balance-marker-bad', !inside);
    track.classList.toggle('mg-balance-track-bad', !inside);
    status.set(
      `Balans ${Math.round(Math.max(0, 100 - Math.abs(tilt)))}%`,
      `${wobbles} vurpor`
    );
    return true;
  });

  feedback.say('Håll inne knapparna för att styra emot.', 'neutral');
}

// -------------------------------------------------------------------- takt

/**
 * En metronom går och en markör sveper över ett fält. Spelaren slår an när
 * markören är mitt i fältet. Mitten ger full poäng, kanterna halv och utanför
 * ingenting - och slaget som missas helt räknas som ett tapp.
 */
function startRhythm(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const BEATS = 12;
  const items = game.items;

  let beat = 0;
  let scored = 0;
  let perfects = 0;
  let judgedThisBeat = true;
  let running = true;
  /** Millisekunder per slag, tempot stiger något genom momentet. */
  let period = 1100;
  let phase = 0;

  const status = makeStatus();
  const feedback = makeFeedback();
  const nextLabel = el('p', { class: 'mg-beat-label' });
  const hitZone = el('span', { class: 'mg-beat-zone' });
  const perfectZone = el('span', { class: 'mg-beat-perfect' });
  /**
   * Fälten ritas ur samma marginaler som bedömningen använder nedan, så att
   * det man ser är det man bedöms mot även när svårighetsgraden ändrar dem.
   */
  const hitHalf = 22 * ctx.slack;
  const perfectHalf = 11 * ctx.slack;
  hitZone.style.left = `${50 - hitHalf}%`;
  hitZone.style.width = `${hitHalf * 2}%`;
  perfectZone.style.left = `${50 - perfectHalf}%`;
  perfectZone.style.width = `${perfectHalf * 2}%`;
  const runner = el('span', { class: 'mg-beat-runner' });
  const lane = el('div', { class: 'mg-beat-lane' }, hitZone, perfectZone, runner);
  const dots = el('div', { class: 'mg-beat-dots' });
  const hitBtn = snabbKnapp('Slå an', () => strike(), {
    class: 'btn btn-primary mg-strike',
    'data-sound': 'av',
  });
  host.append(
    status.node,
    nextLabel,
    lane,
    dots,
    feedback.node,
    el('div', { class: 'mg-buttons' }, hitBtn)
  );

  const dotEls: HTMLElement[] = [];
  for (let i = 0; i < BEATS; i++) {
    const dot = el('span', { class: 'mg-beat-dot' });
    dotEls.push(dot);
    dots.append(dot);
  }

  const show = () =>
    status.set(`Slag ${Math.min(beat + 1, BEATS)}/${BEATS}`, `${perfects} rena träffar`);

  const mark = (i: number, cls: string) => {
    const dot = dotEls[i];
    if (dot) dot.className = `mg-beat-dot ${cls}`;
  };

  const finish = () => {
    if (!running) return;
    running = false;
    unbind();
    onDone({
      score: scored / BEATS,
      summary: `Du träffade ${perfects} slag rent, ${Math.round(
        (scored - perfects) / 0.5
      )} nästan och missade ${BEATS - perfects - Math.round((scored - perfects) / 0.5)}.`,
      perfect: perfects === BEATS,
    });
  };

  const strike = () => {
    if (!running || judgedThisBeat) return;
    judgedThisBeat = true;
    // Avstånd från slaget, 0 = exakt på, 0.5 = längst ifrån. Fördröjningen
    // från finger till händelse räknas bort, så ett slag som var rent på
    // skärmen räknas som rent även om det kom fram sent.
    const lag = INPUT_LAG_MS / period;
    const off = Math.abs(phase - lag - 0.5);
    if (off <= 0.11 * ctx.slack) {
      scored += 1;
      perfects += 1;
      playSound('trumma');
      feedback.say(`Rent på slaget! ${items[beat % items.length]}`, 'topp');
      mark(beat, 'mg-beat-dot-perfect');
    } else if (off <= 0.22 * ctx.slack) {
      scored += 0.5;
      playSound('blipp');
      feedback.say(phase < 0.5 ? 'Något tidigt.' : 'Något sent.', 'ok');
      mark(beat, 'mg-beat-dot-ok');
    } else {
      playSound('fel');
      feedback.say(phase < 0.5 ? 'Alldeles för tidigt.' : 'Alldeles för sent.', 'fel');
      mark(beat, 'mg-beat-dot-miss');
    }
    show();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    strike();
  };
  window.addEventListener('keydown', onKey);
  const unbind = onTeardown(() => {
    running = false;
    window.removeEventListener('keydown', onKey);
  });

  feedback.say('Slå an när markören är mitt i fältet. Mellanslag fungerar också.', 'neutral');
  nextLabel.textContent = items[0] ?? '';
  show();

  // Ett uppräkningsslag innan det första riktiga, så pulsen hinner sätta sig.
  let leadIn = 2;
  judgedThisBeat = true;

  loop((dt) => {
    if (!running) return false;
    phase += dt / period;
    while (phase >= 1) {
      phase -= 1;
      if (leadIn > 0) {
        leadIn -= 1;
        playSound('tick');
        continue;
      }
      // Slaget som just passerade utan att någon slog an räknas som tappat.
      if (!judgedThisBeat) {
        playSound('varning');
        feedback.say('Du missade slaget helt.', 'fel');
        mark(beat, 'mg-beat-dot-miss');
      }
      beat += 1;
      if (beat >= BEATS) {
        finish();
        return false;
      }
      judgedThisBeat = false;
      period = Math.max(800, period - 18);
      nextLabel.textContent = items[beat % items.length] ?? '';
      playSound(beat % 4 === 0 ? 'tock' : 'tick');
      show();
    }
    runner.style.left = `${phase * 100}%`;
    lane.classList.toggle(
      'mg-beat-lane-hot',
      Math.abs(phase - 0.5) <= 0.22 * ctx.slack
    );
    return true;
  });
}

// --------------------------------------------------------------- tidslinje

/**
 * Häng salen i tidsordning.
 *
 * Fyra verk ur samlingen ligger på bordet och ska upp på väggen med det
 * äldsta först. Titlarna står framme - det är inte igenkänningen som prövas
 * här utan dateringen, och att veta att Nattvakten kom före Skriet men efter
 * Caravaggio är en annan sorts kunskap än att veta vilken tavla som är
 * vilken.
 *
 * Rundorna väljs med ett minsta avstånd i år mellan verken, och avståndet
 * krymper: första salen spänner över sekler, sista över ett par decennier.
 * Utan det kunde en runda ge Stjärnenatt, Skriet, Julaftonen och Näckrosor
 * på nitton år, vilket ingen kan datera utan att slå upp det.
 *
 * Ingen klocka. Momentet är att tänka efter, och en klocka gör det bara till
 * en gissning under tidspress.
 */
interface TidslinjeVerk {
  bild: string;
  namn: string;
  ar: number;
  artext?: string;
}

function startTimeline(host: HTMLElement, game: Minigame, onDone: Done): void {
  const bank = game.tidslinje ?? [];
  const ROUNDS = 5;
  /** Minsta antal år mellan två verk i samma runda, per runda. */
  const MINSTA_GAP = [70, 45, 30, 18, 10];

  let round = 0;
  /** Summan av andelen rätt ordnade par, en runda i taget. */
  let poang = 0;
  let helaRatt = 0;
  let valda: TidslinjeVerk[] = [];
  let ordning: TidslinjeVerk[] = [];
  let facit = false;

  const status = makeStatus();
  const uppgift = el('p', { class: 'mg-tid-uppgift' });
  const grid = el('div', { class: 'mg-tid-grid' });
  const feedback = makeFeedback();
  const vidare = button('Nästa sal', () => nextRound(), {
    class: 'btn btn-primary mg-peka-vidare',
  });
  vidare.hidden = true;
  host.append(status.node, uppgift, grid, feedback.node, vidare);

  /**
   * Fyra verk med minst `gap` år mellan varandra i tidsordning. Hittas ingen
   * sådan uppsättning på hundra försök krymper kravet - banken avgör hur
   * spretig den kan vara, och spelet ska aldrig fastna.
   */
  const lotta = (gap: number): TidslinjeVerk[] => {
    for (let försök = 0; försök < 100; försök++) {
      const kandidater = shuffled(bank).slice(0, 4).sort((a, b) => a.ar - b.ar);
      if (kandidater.length < 4) return kandidater;
      let ok = true;
      for (let i = 1; i < kandidater.length; i++) {
        if (kandidater[i]!.ar - kandidater[i - 1]!.ar < gap) ok = false;
      }
      if (ok) return kandidater;
    }
    return gap > 5 ? lotta(Math.floor(gap / 2)) : shuffled(bank).slice(0, 4);
  };

  const visa = () =>
    status.set(`Sal ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`, `${helaRatt} rätt hängda`);

  /** Korten i den ordning de ligger på skärmen, för uppdatering på plats. */
  let kortEls: HTMLElement[] = [];

  /**
   * Numren och markeringen ändras vid varje tryck, men fotona ska inte laddas
   * om. Att rita om hela rutnätet fick bilderna att blinka till på en långsam
   * telefon, så bara siffran och ramen rörs.
   */
  const uppdatera = () => {
    valda.forEach((verk, i) => {
      const kort = kortEls[i];
      if (!kort) return;
      const plats = ordning.indexOf(verk);
      kort.classList.toggle('mg-tid-kort-vald', plats >= 0);
      const nummer = kort.querySelector('.mg-tid-nummer');
      if (nummer) nummer.textContent = plats >= 0 ? String(plats + 1) : '\u00a0';
    });
  };

  /** Ritar korten. Efter svaret står årtalen framme och ordningen bedöms. */
  const rita = () => {
    clear(grid);
    kortEls = [];
    const ratt = [...valda].sort((a, b) => a.ar - b.ar);
    for (const verk of valda) {
      const plats = ordning.indexOf(verk);
      const kort = button(
        '',
        () => valj(verk),
        {
          class: `mg-tid-kort ${plats >= 0 ? 'mg-tid-kort-vald' : ''} ${
            facit ? (ratt[plats] === verk ? 'mg-tid-ratt' : 'mg-tid-fel') : ''
          }`,
          'data-sound': 'av',
        }
      );
      kort.append(
        el(
          'span',
          { class: 'mg-tid-nummer' },
          plats >= 0 ? String(plats + 1) : '\u00a0'
        ),
        el('img', {
          class: 'mg-tid-foto',
          src: quizImageUrl(verk.bild),
          alt: '',
          draggable: 'false',
        }),
        el('span', { class: 'mg-tid-namn' }, verk.namn),
        el('span', { class: 'mg-tid-ar' }, facit ? (verk.artext ?? String(verk.ar)) : '\u00a0')
      );
      kortEls.push(kort);
      grid.append(kort);
    }
  };

  const valj = (verk: TidslinjeVerk) => {
    if (facit) return;
    if (ordning.includes(verk)) {
      // Ett tryck till ångrar valet, och numren efter flyttas upp.
      ordning = ordning.filter((v) => v !== verk);
      playSound('valj');
      uppdatera();
      return;
    }
    ordning.push(verk);
    playSound('valj');
    if (ordning.length < valda.length) {
      uppdatera();
      return;
    }
    doma();
  };

  /** Bedömer hängningen på hur många par som står i rätt inbördes ordning. */
  const doma = () => {
    facit = true;
    let ratt = 0;
    let par = 0;
    for (let i = 0; i < ordning.length; i++) {
      for (let j = i + 1; j < ordning.length; j++) {
        par += 1;
        if (ordning[i]!.ar <= ordning[j]!.ar) ratt += 1;
      }
    }
    const andel = par > 0 ? ratt / par : 0;
    poang += andel;
    const allt = ratt === par;
    if (allt) helaRatt += 1;
    playSound(allt ? 'perfekt' : andel >= 0.5 ? 'ratt' : 'fel');
    const iOrdning = [...valda].sort((a, b) => a.ar - b.ar);
    const aldst = iOrdning[0]!;
    // Marginalen mellan de två första avgör om salen var svårdaterad.
    const marginal = (iOrdning[1]?.ar ?? aldst.ar) - aldst.ar;
    feedback.say(
      allt
        ? marginal <= 20
          ? `Hela salen rätt hängd, och det skilde bara ${marginal} år mellan de två första.`
          : `Hela salen rätt hängd. Först ${aldst.namn}, ${aldst.artext ?? aldst.ar}.`
        : `${ratt} av ${par} par står rätt. Äldst är ${aldst.namn}, ${aldst.artext ?? aldst.ar}.`,
      allt ? 'topp' : andel >= 0.5 ? 'ok' : 'fel'
    );
    visa();
    rita();
    vidare.textContent = round + 1 >= ROUNDS ? 'Klart' : 'Nästa sal';
    vidare.hidden = false;
  };

  const nextRound = () => {
    vidare.hidden = true;
    round += 1;
    if (round >= ROUNDS) {
      onDone({
        score: poang / ROUNDS,
        summary:
          helaRatt === ROUNDS
            ? `Du hängde alla ${ROUNDS} salarna i rätt ordning.`
            : `Du hängde ${helaRatt} av ${ROUNDS} salar helt rätt.`,
        perfect: helaRatt === ROUNDS,
      });
      return;
    }
    starta();
  };

  const starta = () => {
    facit = false;
    ordning = [];
    valda = shuffled(lotta(MINSTA_GAP[round] ?? 10));
    uppgift.textContent = 'Tryck på verken i tidsordning, det äldsta först.';
    feedback.say('Titlarna står framme. Årtalen får du veta efteråt.', 'neutral');
    visa();
    rita();
  };

  starta();
}

// ------------------------------------------------------------------- trick

/**
 * Sätt tricket.
 *
 * Ett trick på en bräda består av två ögonblick som ligger strax efter
 * varandra: poppen, när svansen slår i marken och brädan far upp, och
 * draget, när framfoten stryker framåt och planar ut den i luften. Missar
 * man det ena spelar det ingen roll hur bra det andra satt.
 *
 * Brädan rullar över banan en gång per trick, och spelaren trycker två
 * gånger - första trycket bedöms mot poppfönstret, andra mot dragfönstret.
 * Fönstren blir smalare och rullningen snabbare för varje trick, så en
 * ollie är beskedlig och en 360 flip är det inte. Domen sägs på åkarnas
 * eget språk: den som planar ut för sent landar i primo.
 *
 * Momentet ersatte ett balansspel som var samma spel för vilket yrke som
 * helst - en markör som drev åt sidan i tjugotvå sekunder.
 */
function startTrick(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const namn = game.items;
  const cues = game.trickCue ?? [];
  const ANTAL = namn.length;
  /** Var på banan de två ögonblicken ligger, som andel av rullningen. */
  const POPP_MITT = 0.34;
  const DRAG_MITT = 0.66;

  let index = 0;
  /** 0 till 1 genom rullningen. */
  let phase = 0;
  let poppVid: number | null = null;
  let dragVid: number | null = null;
  let landade = 0;
  let rena = 0;
  let poang = 0;
  let running = true;
  /** Sant medan brädan rullar; mellan tricken står domen kvar en stund. */
  let rullar = false;
  let stoppaRull: (() => void) | null = null;

  /**
   * Var på banan ett läge i rullningen ritas, i procent. Brädan är fyrtiosex
   * bildpunkter bred och sitter centrerad kring sitt läge, så ett spann från
   * kant till kant skulle klippa av den i båda ändarna. Samma funktion ritar
   * både brädan och fönstren - ritas de ur olika tal visar spelet en zon och
   * bedömer en annan.
   */
  const spar = (t: number) => 3 + t * 94;

  /** Rullningens längd för ett givet trick. Det går fortare ju svårare. */
  const svep = (i: number) => Math.max(1400, 2400 - i * 190);
  /**
   * Halva fönstret, som andel av rullningen, och svårighetsgraden vidgar
   * det. Ollien är generös - en van spelare ska aldrig missa den - medan
   * 360 flip har omkring nittio millisekunders marginal på Turist och sjuttio
   * på Globetrotter. Rent kräver hälften av det, och det är meningen att
   * sex rena trick ska vara ovanligt.
   */
  const poppHalv = (i: number) => Math.max(0.045, 0.105 - i * 0.011) * ctx.slack;
  const dragHalv = (i: number) => Math.max(0.04, 0.095 - i * 0.011) * ctx.slack;

  const status = makeStatus();
  const feedback = makeFeedback();
  const rubrik = el('h3', { class: 'mg-trick-namn' });
  const cue = el('p', { class: 'mg-trick-cue' });
  const poppZon = el('span', { class: 'mg-trick-zon mg-trick-zon-popp' }, el('span', { class: 'mg-trick-zonnamn' }, 'popp'));
  const dragZon = el('span', { class: 'mg-trick-zon mg-trick-zon-drag' }, el('span', { class: 'mg-trick-zonnamn' }, 'drag'));
  // Brädan sedd från sidan: en däcka och två hjul.
  const brada = el(
    'span',
    { class: 'mg-trick-brada' },
    el('span', { class: 'mg-trick-dacka' }),
    el('span', { class: 'mg-trick-hjul mg-trick-hjul-bak' }),
    el('span', { class: 'mg-trick-hjul mg-trick-hjul-fram' })
  );
  const mark = el('span', { class: 'mg-trick-mark' });
  const bana = el('div', { class: 'mg-trick-bana' }, mark, poppZon, dragZon, brada);
  const prickar = el('div', { class: 'mg-trick-prickar' });
  const knapp = snabbKnapp('Tryck', () => tryck(), {
    class: 'btn btn-primary mg-strike',
    'data-sound': 'av',
  });

  host.append(
    status.node,
    rubrik,
    cue,
    bana,
    prickar,
    feedback.node,
    el('div', { class: 'mg-buttons' }, knapp)
  );

  const prickEls: HTMLElement[] = [];
  for (let i = 0; i < ANTAL; i++) {
    const p = el('span', { class: 'mg-trick-prick' });
    prickEls.push(p);
    prickar.append(p);
  }

  const visa = () =>
    status.set(
      `Trick ${Math.min(index + 1, ANTAL)}/${ANTAL}`,
      `${landade} landade · ${rena} rena`
    );

  /** Ritar fönstren för tricket som står på tur. */
  const ritaZoner = (i: number) => {
    const p = poppHalv(i);
    const d = dragHalv(i);
    poppZon.style.left = `${spar(POPP_MITT - p)}%`;
    poppZon.style.width = `${spar(POPP_MITT + p) - spar(POPP_MITT - p)}%`;
    dragZon.style.left = `${spar(DRAG_MITT - d)}%`;
    dragZon.style.width = `${spar(DRAG_MITT + d) - spar(DRAG_MITT - d)}%`;
  };

  const finish = () => {
    if (!running) return;
    running = false;
    stoppaRull?.();
    unbind();
    const missade = ANTAL - landade;
    onDone({
      score: poang / ANTAL,
      summary:
        landade === ANTAL
          ? `Du satte alla ${ANTAL} tricken, ${rena} av dem rent.`
          : `Du satte ${landade} av ${ANTAL} trick och bommade ${missade}.`,
      perfect: rena === ANTAL,
    });
  };

  const tryck = () => {
    if (!running || !rullar) return;
    // Fördröjningen från finger till händelse räknas bort, så ett tryck som
    // såg rätt ut på skärmen bedöms som rätt.
    const lag = INPUT_LAG_MS / svep(index);
    const nu = Math.max(0, phase - lag);
    if (poppVid === null) {
      poppVid = nu;
      brada.classList.add('mg-trick-brada-popp');
      playSound('fotdunk');
    } else if (dragVid === null) {
      dragVid = nu;
      brada.classList.add('mg-trick-brada-drag');
      playSound('svisch');
    }
  };

  /** Bedömer rullningen som just tog slut och säger vad som gick fel. */
  const doma = () => {
    rullar = false;
    const p = poppHalv(index);
    const d = dragHalv(index);
    const poppAvst = poppVid === null ? Infinity : Math.abs(poppVid - POPP_MITT);
    const dragAvst = dragVid === null ? Infinity : Math.abs(dragVid - DRAG_MITT);
    const poppOk = poppAvst <= p;
    const dragOk = dragAvst <= d;
    const rent = poppAvst <= p / 2 && dragAvst <= d / 2;
    const trick = namn[index] ?? 'Tricket';
    /*
     * Brädan stannar i det läge domen beskriver: platt under fötterna när
     * tricket sitter, på kant när det inte gjorde det. Det säger samma sak
     * som texten, fast utan att man behöver läsa den.
     */
    brada.classList.remove('mg-trick-brada-popp', 'mg-trick-brada-drag');
    brada.classList.add(poppOk && dragOk ? 'mg-trick-brada-landad' : 'mg-trick-brada-primo');

    if (poppOk && dragOk) {
      landade += 1;
      poang += rent ? 1 : 0.8;
      if (rent) rena += 1;
      prickEls[index]!.className = `mg-trick-prick ${rent ? 'mg-trick-prick-ren' : 'mg-trick-prick-ok'}`;
      playSound(rent ? 'perfekt' : 'ratt');
      feedback.say(
        rent
          ? `Ren ${trick.toLowerCase()}. Brädan landar rakt under fötterna.`
          : `${trick} landad, men skakigt. Klassen såg det.`,
        rent ? 'topp' : 'ok'
      );
    } else {
      poang += poppOk || dragOk ? 0.3 : 0;
      prickEls[index]!.className = 'mg-trick-prick mg-trick-prick-miss';
      playSound('fel');
      /*
       * Domen ska säga vad som gick fel, inte att det gick fel. Poppen
       * bedöms först: utan den händer ingenting alls, och då är draget
       * ointressant.
       */
      let text: string;
      if (poppVid === null) text = 'Du stod bara kvar på brädan. Ingen popp, inget trick.';
      else if (!poppOk && poppVid < POPP_MITT) text = 'Du poppade innan svansen var nere. Brädan gick ingenstans.';
      else if (!poppOk) text = 'Poppen kom för sent. Hindret var redan passerat.';
      else if (dragVid === null) text = 'Fin popp, men du glömde draget. Brädan flög iväg utan dig.';
      else if (dragVid < DRAG_MITT) text = 'Du drog upp framfoten innan brädan hunnit vända. Halvvägs runt.';
      else text = 'Du planade ut för sent och landade i primo, på kant.';
      feedback.say(text, 'fel');
    }
    visa();

    after(1400, () => {
      if (!running) return;
      index += 1;
      if (index >= ANTAL) {
        finish();
        return;
      }
      nastaTrick();
    });
  };

  /** Ställer upp nästa trick och rullar i gång brädan efter en förberedelse. */
  const nastaTrick = () => {
    poppVid = null;
    dragVid = null;
    phase = 0;
    brada.classList.remove(
      'mg-trick-brada-popp',
      'mg-trick-brada-drag',
      'mg-trick-brada-landad',
      'mg-trick-brada-primo'
    );
    brada.style.left = `${spar(0)}%`;
    ritaZoner(index);
    rubrik.textContent = namn[index] ?? '';
    cue.textContent = cues[index] ?? '';
    visa();
    feedback.say('Gör dig redo.', 'neutral');
    bana.classList.add('mg-trick-bana-vantar');
    after(900, () => {
      if (!running) return;
      bana.classList.remove('mg-trick-bana-vantar');
      feedback.say('Poppa, sedan dra.', 'neutral');
      playSound('tick');
      rullar = true;
      const langd = svep(index);
      stoppaRull = loop((dt) => {
        if (!running || !rullar) return false;
        phase += dt / langd;
        if (phase >= 1) {
          brada.style.left = `${spar(1)}%`;
          doma();
          return false;
        }
        brada.style.left = `${spar(phase)}%`;
        return true;
      });
    });
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    tryck();
  };
  window.addEventListener('keydown', onKey);
  const unbind = onTeardown(() => {
    running = false;
    window.removeEventListener('keydown', onKey);
  });

  nastaTrick();
}

// ----------------------------------------------------------------- bildval

/**
 * Kunden i shopen säger vad hen behöver, men inte vad det heter, och man
 * pekar ut rätt foto av fyra. Lockbetena väljs ur kundens `nastan` först,
 * så att puttern får sällskap av en wedge och inte av en golfbil. Namnen
 * skrivs ut först när man pekat - att veta vilket foto som är vilket är
 * hela uppgiften.
 *
 * Ingen klocka. Momentet hade en på fjorton sekunder per kund, men det är
 * fel sorts svårighet här: uppgiften är att känna igen fyra foton, och den
 * som inte känner igen dem hinner inte lära sig det på fjorton sekunder
 * heller. Klockan straffade bara den som tittade noga.
 */
function startPictureChoice(host: HTMLElement, game: Minigame, onDone: Done): void {
  const ROUNDS = 8;
  const katalog = game.bildval ?? [];
  const namn = new Map(katalog.map((b) => [b.bild, b.namn]));
  const kunder = shuffled(game.kunder ?? []).slice(0, ROUNDS);
  const roll = game.roll ?? { en: 'Kund', flera: 'kunder', klara: 'nöjda' };
  let round = 0;
  let right = 0;
  let running = false;

  const status = makeStatus();
  const bubble = el('p', { class: 'mg-kund' });
  const grid = el('div', { class: 'options-bilder mg-bildval' });
  const feedback = makeFeedback();
  /*
   * Vid rätt svar går spelet vidare av sig självt - man vet redan att man
   * kunde det. Vid fel stannar det tills man trycker: facit står på skärmen,
   * det rätta fotot lyser grönt och kunden säger vad hen egentligen ville ha,
   * och det hann ingen läsa på en och en halv sekund.
   */
  const vidare = button('Nästa kund', () => {
    vidare.hidden = true;
    next();
  }, { class: 'btn btn-primary mg-peka-vidare' });
  vidare.hidden = true;
  host.append(status.node, bubble, grid, feedback.node, vidare);

  const finish = () => {
    onDone({
      score: right / kunder.length,
      summary: `Du hittade rätt åt ${right} av ${kunder.length} ${roll.flera}.`,
      perfect: right === kunder.length,
    });
  };

  const next = () => {
    vidare.hidden = true;
    if (round >= kunder.length) {
      finish();
      return;
    }
    const kund = kunder[round]!;
    const lockbeten = shuffled(kund.nastan ?? []).filter((id) => namn.has(id) && id !== kund.svar);
    const ovriga = shuffled(katalog.map((b) => b.bild)).filter(
      (id) => id !== kund.svar && !lockbeten.includes(id)
    );
    const val = shuffled([kund.svar, ...[...lockbeten, ...ovriga].slice(0, 3)]);

    status.set(`${roll.en} ${round + 1}/${kunder.length}`, `${right} ${roll.klara}`);
    bubble.textContent = `”${kund.text}”`;
    feedback.say('Peka på rätt foto.', 'neutral');
    clear(grid);
    val.forEach((id, i) => {
      // pointerdown, inte click: på en telefon kommer klicket först när
      // fingret lyfts, och det hann bli "för sent" fast man tryckt i tid.
      const b = snabbKnapp('', () => pick(id, b), { class: 'option option-bild mg-bildval-knapp', 'data-sound': 'av', 'data-bild': id });
      b.append(
        el('span', { class: 'option-body option-body-bild' },
          el('span', { class: 'option-key' }, String.fromCharCode(65 + i)),
          el('img', { class: 'option-foto', src: quizImageUrl(id), alt: `Alternativ ${String.fromCharCode(65 + i)}`, draggable: 'false' })
        ),
        el('span', { class: 'option-facit' }, '\u00a0')
      );
      grid.append(b);
    });
    running = true;
  };

  const pick = (id: string, knapp: HTMLElement) => {
    if (!running) return;
    running = false;
    const kund = kunder[round]!;
    const ok = id === kund.svar;
    // Visa namnen nu, och markera rätt och fel.
    for (const b of Array.from(grid.children) as HTMLElement[]) {
      // Bild-id:t sitter på knappen; att gissa det ur bildens sökväg gick
      // sönder när fotona blev webp och facit slutade visas.
      const bid = b.dataset.bild ?? '';
      const facit = b.querySelector('.option-facit');
      if (facit) facit.textContent = namn.get(bid) ?? '';
      if (bid === kund.svar) b.classList.add('option-right');
      else if (b === knapp) b.classList.add('option-wrong');
      else b.classList.add('option-dim');
    }
    if (ok) {
      right += 1;
      playCombo(right);
      // Vanliga ord gemenas mitt i meningen; egennamn (Djurgårdens IF, HV71)
      // behåller sina versaler.
      const n = namn.get(kund.svar) ?? '';
      const egennamn = /[A-ZÅÄÖ0-9]/.test(n.slice(1)) || /\s[A-ZÅÄÖ]/.test(n);
      feedback.say(`Just det, ${egennamn ? n : n.toLowerCase()}. Kunden nickar.`, 'topp');
    } else {
      playSound('fel');
      feedback.say(kund.fel ?? `Nej - kunden ville ha ${namn.get(kund.svar)?.toLowerCase()}.`, 'fel');
    }
    status.set(`${roll.en} ${round + 1}/${kunder.length}`, `${right} ${roll.klara}`);
    round += 1;
    if (ok) {
      after(1000, next);
    } else {
      vidare.textContent = round >= kunder.length ? 'Klart' : 'Nästa kund';
      vidare.hidden = false;
    }
  };

  next();
}


// ------------------------------------------------------------------- peka

/**
 * Ett foto och en fråga i taget: "Var är bromsen?" Spelaren pekar på fotot,
 * och närmaste träffyta inom sin radie räknas - marginalen är medveten, det
 * är kunskapen som prövas, inte fingerfärdigheten. Ingen klocka. Efter varje
 * svar sägs rätt eller fel och vad det rätta är; efter sista frågan visas
 * facitbilden med allt utmärkt.
 */
function startPointAt(host: HTMLElement, game: Minigame, onDone: Done): void {
  const spec = game.peka!;
  const fragor = spec.fragor;
  let index = 0;
  let right = 0;
  let vantar = false;

  const status = makeStatus();
  const fraga = el('p', { class: 'mg-kund mg-peka-fraga' });
  const bild = el('img', { class: 'mg-peka-bild', src: quizImageUrl(spec.bild), alt: 'Foto att peka på', draggable: 'false', width: '1400', height: '1000' });
  const laddar = el('p', { class: 'mg-peka-laddar' }, 'Fotot laddas …');
  const yta = el('div', { class: 'mg-peka-yta mg-peka-vantar' }, bild, laddar);
  // Ytan är reserverad tills fotot kommit; fallerar hämtningen (dålig
  // täckning, gammal cache) går det att försöka igen utan att lämna passet.
  bild.addEventListener('load', () => {
    yta.classList.remove('mg-peka-vantar');
    laddar.remove();
  });
  bild.addEventListener('error', () => {
    laddar.textContent = 'Fotot kunde inte hämtas. Tryck här för att försöka igen.';
    laddar.classList.add('mg-peka-fel-laddning');
    laddar.onclick = () => {
      laddar.textContent = 'Fotot laddas …';
      bild.src = `${quizImageUrl(spec.bild)}?igen=${Date.now()}`;
    };
  });
  const feedback = makeFeedback();
  const forklaring = el('p', { class: 'mg-peka-forklaring' });
  const vidare = button('Nästa fråga', () => nasta(), { class: 'btn btn-primary mg-peka-vidare' });
  vidare.hidden = true;
  host.append(status.node, fraga, yta, feedback.node, forklaring, vidare);

  const punkt = (id: string) => spec.punkter.find((p) => p.id === id)!;

  const markera = (x: number, y: number, klass: string, text?: string) => {
    const m = el('span', { class: `mg-peka-mark ${klass}`, style: `left:${x}%; top:${y}%` }, text ?? '');
    yta.append(m);
    return m;
  };

  const visa = () => {
    const f = fragor[index]!;
    status.set(`Fråga ${index + 1}/${fragor.length}`, `${right} rätt`);
    fraga.textContent = f.text;
    feedback.say('Peka på fotot.', 'neutral');
    forklaring.textContent = '';
    for (const m of Array.from(yta.querySelectorAll('.mg-peka-mark'))) m.remove();
    vidare.hidden = true;
    vantar = false;
  };

  const nasta = () => {
    index += 1;
    if (index >= fragor.length) {
      slut();
      return;
    }
    visa();
  };

  const slut = () => {
    fraga.textContent = 'Så här sitter det. Titta en stund innan du kvitterar.';
    status.set('Klart', `${right} av ${fragor.length} rätt`);
    for (const m of Array.from(yta.querySelectorAll('.mg-peka-mark'))) m.remove();
    // Facit ska gå att läsa på en telefon: bilden blir dubbelt så bred som
    // rutan och rullas i sidled, som kartan.
    yta.classList.add('mg-peka-facit');
    bild.src = quizImageUrl(spec.facitBild);
    bild.alt = 'Samma foto med alla reglage utmärkta och förklarade';
    // "Du kan hytten" skrevs för lokföraren och följde med till lotsen,
    // piloten och formsprutaren. Texten säger nu samma sak utan att påstå
    // vad man står i.
    feedback.say(
      right === fragor.length
        ? 'Alla rätt. Du kan din maskin.'
        : `${right} av ${fragor.length}. Facit på bilden.`,
      right === fragor.length ? 'topp' : 'neutral'
    );
    forklaring.textContent = '';
    // Texten på facitbilden är liten på en telefon: en länk till fullstorlek.
    forklaring.append(
      el('a', { href: quizImageUrl(spec.facitBild), target: '_blank', rel: 'noopener', class: 'mg-peka-lank' }, 'Öppna facit i full storlek')
    );
    vidare.hidden = true;
    const klar = button('Tillbaka till skiftet', () => {
      onDone({
        score: right / fragor.length,
        summary: `Du pekade rätt på ${right} av ${fragor.length} reglage.`,
        perfect: right === fragor.length,
      });
    }, { class: 'btn btn-primary mg-peka-vidare' });
    host.append(klar);
  };

  const tryck = (event: PointerEvent) => {
    if (vantar) return;
    const rect = bild.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    vantar = true;
    const f = fragor[index]!;
    const ratt = punkt(f.svar);
    // Närmaste träffyta som fingret hamnat inom; radien mäts i bildbredd,
    // så avståndet i höjdled räknas om till samma skala.
    const kvot = rect.width / rect.height;
    /*
     * Minsta träffyta i pixlar. Radien anges i procent av bildens bredd, och
     * på en telefon är bilden 366 pixlar bred - ett nödstopp med radien 3,2
     * blir då tolv pixlar, mindre än ett finger. Ytan får aldrig vara mindre
     * än 22 pixlar i radie, oavsett vad datan säger, och punkterna ligger
     * ändå så pass isär att närmaste-träffen avgör rätt.
     */
    const minRadie = (22 / rect.width) * 100;
    let traff: (typeof spec.punkter)[number] | null = null;
    let basta = Infinity;
    for (const p of spec.punkter) {
      const dx = x - p.x;
      const dy = (y - p.y) / kvot;
      const d = Math.hypot(dx, dy);
      if (d <= Math.max(p.r, minRadie) && d < basta) {
        basta = d;
        traff = p;
      }
    }
    const ok = traff?.id === ratt.id;
    if (ok) {
      right += 1;
      playSound('ratt');
      markera(ratt.x, ratt.y, 'mg-peka-ratt', '✓');
      feedback.say(`Rätt. ${ratt.namn}.`, 'ok');
      forklaring.textContent = ratt.forklaring;
    } else {
      playSound('fel');
      markera(x, y, 'mg-peka-fel', '✕');
      markera(ratt.x, ratt.y, 'mg-peka-ratt', '✓');
      feedback.say(traff ? `Fel. Det där är ${traff.namn.toLowerCase()}.` : 'Fel. Där sitter inget av det vi letar efter.', 'fel');
      forklaring.textContent = `${ratt.namn}: ${ratt.forklaring}`;
    }
    status.set(`Fråga ${index + 1}/${fragor.length}`, `${right} rätt`);
    vidare.textContent = index + 1 < fragor.length ? 'Nästa fråga' : 'Visa facit';
    vidare.hidden = false;
  };
  yta.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    tryck(e);
  });

  visa();
}


// ------------------------------------------------------------------ avgör

/**
 * En post i taget - ett svampfoto - och två knappar: ätlig eller giftig.
 * Ingen klocka. Efter svaret sägs rätt eller fel, och sedan faktaraden om
 * just den svampen, som ska läsas i lugn och ro innan man går vidare.
 */
function startDecide(host: HTMLElement, game: Minigame, onDone: Done): void {
  const spec = game.avgor!;
  const poster = shuffled(spec.poster).slice(0, spec.antal ?? spec.poster.length);
  let index = 0;
  let right = 0;
  let vantar = false;

  const status = makeStatus();
  const fraga = el('p', { class: 'mg-kund mg-avgor-fraga' });
  const bild = el('img', { class: 'mg-avgor-bild', alt: '', draggable: 'false' });
  const yta = el('div', { class: 'mg-avgor-yta' }, bild);
  const namnRad = el('p', { class: 'mg-avgor-namn' });
  const val = el('div', { class: 'mg-avgor-val' });
  const feedback = makeFeedback();
  const info = el('p', { class: 'mg-peka-forklaring' });
  const vidare = button('Nästa svamp', () => nasta(), { class: 'btn btn-primary mg-peka-vidare' });
  vidare.hidden = true;
  host.append(status.node, fraga, yta, namnRad, val, feedback.node, info, vidare);

  const knappar = spec.val.map((v) => {
    const b = snabbKnapp(v.namn, () => svara(v.id), { class: `btn btn-big mg-avgor-knapp mg-avgor-${v.id}`, 'data-sound': 'av' });
    val.append(b);
    return b;
  });

  const visa = () => {
    const post = poster[index]!;
    status.set(`Svamp ${index + 1}/${poster.length}`, `${right} rätt`);
    fraga.textContent = `Ätlig eller giftig?`;
    bild.src = quizImageUrl(post.bild);
    bild.alt = 'En svamp i sin miljö';
    namnRad.textContent = '';
    feedback.say('Titta noga. Ingen brådska.', 'neutral');
    info.textContent = '';
    for (const b of knappar) {
      b.classList.remove('mg-avgor-ratt', 'mg-avgor-fel');
      (b as HTMLButtonElement).disabled = false;
    }
    vidare.hidden = true;
    vantar = false;
  };

  const svara = (id: string) => {
    if (vantar) return;
    vantar = true;
    const post = poster[index]!;
    const ok = id === post.svar;
    if (ok) right += 1;
    playSound(ok ? 'ratt' : 'fel');
    for (const [i, b] of knappar.entries()) {
      (b as HTMLButtonElement).disabled = true;
      const v = spec.val[i]!;
      if (v.id === post.svar) b.classList.add('mg-avgor-ratt');
      else if (v.id === id) b.classList.add('mg-avgor-fel');
    }
    const rattNamn = spec.val.find((v) => v.id === post.svar)?.namn ?? post.svar;
    namnRad.textContent = post.namn;
    feedback.say(ok ? `Rätt. ${post.namn} är ${rattNamn.toLowerCase()}.` : `Fel. ${post.namn} är ${rattNamn.toLowerCase()}.`, ok ? 'ok' : 'fel');
    info.textContent = post.info;
    status.set(`Svamp ${index + 1}/${poster.length}`, `${right} rätt`);
    vidare.textContent = index + 1 < poster.length ? 'Nästa svamp' : 'Klart';
    vidare.hidden = false;
  };

  const nasta = () => {
    index += 1;
    if (index >= poster.length) {
      onDone({
        score: right / poster.length,
        summary: `Du avgjorde rätt om ${right} av ${poster.length} svampar.`,
        perfect: right === poster.length,
      });
      return;
    }
    visa();
  };

  visa();
}


// ------------------------------------------------------------------- quiz

/**
 * Ett prov i yrkets kärnkunskap: svårare frågor än skiftets, en i taget,
 * ingen klocka. Efter varje svar visas facit och förklaringen - det är
 * förklaringen som är poängen. Alternativen blandas per fråga.
 */
function startQuiz(host: HTMLElement, game: Minigame, ctx: MinigameContext, onDone: Done): void {
  const spec = game.quiz!;
  const fragor = shuffled(spec.fragor).slice(0, spec.antal);
  let index = 0;
  let right = 0;
  let vantar = false;

  const status = makeStatus();
  const fraga = el('p', { class: 'mg-kund mg-quiz-fraga' });
  const bildYta = el('div', { class: 'mg-quiz-bild' });
  const val = el('div', { class: 'mg-quiz-val' });
  const feedback = makeFeedback();
  const info = el('p', { class: 'mg-peka-forklaring' });
  const vidare = button('Nästa fråga', () => nasta(), { class: 'btn btn-primary mg-peka-vidare' });
  vidare.hidden = true;
  host.append(status.node, fraga, bildYta, val, feedback.node, info, vidare);

  const visa = () => {
    const f = fragor[index]!;
    status.set(`Fråga ${index + 1}/${fragor.length}`, `${right} rätt`);
    fraga.textContent = f.q;
    clear(bildYta);
    if (f.bild) bildYta.append(el('img', { src: quizImageUrl(f.bild), alt: '', draggable: 'false', loading: 'lazy' }));
    clear(val);
    feedback.say('', 'neutral');
    info.textContent = '';
    vidare.hidden = true;
    vantar = false;
    const ratt = f.a[0]!;
    // Turistläget visar tre alternativ, precis som på frågeskärmen: rätt svar
    // plus de första lockbetena, sedan blandat.
    const antalAlt = Math.max(2, Math.min(ctx.alternativ, f.a.length));
    const alternativ = shuffled([ratt, ...f.a.slice(1, antalAlt)]);
    alternativ.forEach((text, i) => {
      const b = snabbKnapp('', () => svara(text === ratt, b), { class: 'option mg-quiz-knapp', 'data-sound': 'av' });
      b.append(
        el('span', { class: 'option-body' },
          el('span', { class: 'option-key' }, String.fromCharCode(65 + i)),
          el('span', { class: 'option-text' }, text)
        )
      );
      b.dataset.ratt = text === ratt ? '1' : '0';
      val.append(b);
    });
  };

  const svara = (ok: boolean, knapp: HTMLElement) => {
    if (vantar) return;
    vantar = true;
    const f = fragor[index]!;
    if (ok) right += 1;
    playSound(ok ? 'ratt' : 'fel');
    for (const b of Array.from(val.children) as HTMLElement[]) {
      (b as HTMLButtonElement).disabled = true;
      if (b.dataset.ratt === '1') b.classList.add('option-right');
      else if (b === knapp) b.classList.add('option-wrong');
      else b.classList.add('option-dim');
    }
    feedback.say(ok ? 'Rätt.' : `Fel. Rätt svar: ${f.a[0]}.`, ok ? 'ok' : 'fel');
    info.textContent = f.info ?? '';
    status.set(`Fråga ${index + 1}/${fragor.length}`, `${right} rätt`);
    vidare.textContent = index + 1 < fragor.length ? 'Nästa fråga' : 'Klart';
    vidare.hidden = false;
  };

  const nasta = () => {
    index += 1;
    if (index >= fragor.length) {
      onDone({
        score: right / fragor.length,
        summary: `Du klarade ${right} av ${fragor.length} frågor i provet.`,
        perfect: right === fragor.length,
      });
      return;
    }
    visa();
  };

  visa();
}


// ----------------------------------------------------------------- lagval

/**
 * Lagmärket står stort i mitten. Ovanför: fyra spelare med ansikte och namn.
 * Vem av dem hör hemma i laget? Ingen klocka, ett lag i taget, och efter
 * svaret får den rätta spelaren sin ram och laget sitt namn.
 */
function startTeamPick(host: HTMLElement, game: Minigame, onDone: Done): void {
  const spec = game.lagval!;
  const lagNamn = new Map(spec.lag.map((l) => [l.id, l.namn]));
  const lagBild = new Map(spec.lag.map((l) => [l.id, l.bild]));
  const spelare = new Map(spec.spelare.map((p) => [p.bild, p]));
  // Rundorna: angivna, annars lottade ur spelarlistan.
  let rundor = spec.rundor ? shuffled(spec.rundor) : [];
  if (rundor.length === 0) {
    for (const p of shuffled(spec.spelare)) {
      const fel = shuffled(spec.spelare.filter((x) => x.lag !== p.lag)).slice(0, 3).map((x) => x.bild);
      if (fel.length === 3) rundor.push({ lag: p.lag, ratt: p.bild, fel });
    }
  }
  rundor = rundor.slice(0, spec.antal ?? 8);
  let index = 0;
  let right = 0;
  let vantar = false;

  const status = makeStatus();
  const fraga = el('p', { class: 'mg-kund mg-lagval-fraga' });
  const rad = el('div', { class: 'mg-lagval-spelare' });
  const marke = el('div', { class: 'mg-lagval-marke' });
  const feedback = makeFeedback();
  const vidare = button('Nästa lag', () => nasta(), { class: 'btn btn-primary mg-peka-vidare' });
  vidare.hidden = true;
  host.append(status.node, fraga, rad, marke, feedback.node, vidare);

  const visa = () => {
    const r = rundor[index]!;
    status.set(`Lag ${index + 1}/${rundor.length}`, `${right} rätt`);
    const lagetsNamn = lagNamn.get(r.lag) ?? '';
    // Står namnet på skylten behöver frågan inte upprepa det.
    fraga.textContent = 'Vem av de fyra hör hemma i laget?';
    clear(rad);
    clear(marke);
    /*
     * Har laget ett märke visas det stort; annars står lagets namn på en
     * skylt i samma format. Klubbarna har inga märken i spelet - namnet
     * räcker, och då slipper vi använda någon annans varumärke.
     */
    const bild = lagBild.get(r.lag);
    /*
     * Har laget ett märke avslöjas namnet först när man svarat, på raden
     * under. Står namnet redan på skylten vore raden en upprepning, så då
     * utelämnas den.
     */
    marke.append(
      bild
        ? el('img', { class: 'mg-lagval-logo', src: quizImageUrl(bild), alt: 'Lagmärke', draggable: 'false' })
        : el('p', { class: 'mg-lagval-skylt' }, lagetsNamn)
    );
    if (bild) marke.append(el('p', { class: 'mg-lagval-lagnamn' }, '\u00a0'));
    feedback.say('', 'neutral');
    vidare.hidden = true;
    vantar = false;
    for (const id of shuffled([r.ratt, ...r.fel])) {
      const p = spelare.get(id);
      if (!p) continue;
      const kort = snabbKnapp('', () => svara(id, kort), { class: 'mg-lagval-kort', 'data-sound': 'av', 'data-spelare': id });
      kort.append(
        el('img', { class: 'mg-lagval-foto', src: quizImageUrl(p.bild), alt: '', draggable: 'false' }),
        el('span', { class: 'mg-lagval-namn' }, p.namn)
      );
      rad.append(kort);
    }
  };

  const svara = (id: string, kort: HTMLElement) => {
    if (vantar) return;
    vantar = true;
    const r = rundor[index]!;
    const ok = id === r.ratt;
    if (ok) right += 1;
    playSound(ok ? 'ratt' : 'fel');
    for (const k of Array.from(rad.children) as HTMLElement[]) {
      (k as HTMLButtonElement).disabled = true;
      if (k.dataset.spelare === r.ratt) k.classList.add('mg-lagval-ratt');
      else if (k === kort) k.classList.add('mg-lagval-fel');
      else k.classList.add('mg-lagval-dim');
    }
    const lag = lagNamn.get(r.lag) ?? '';
    const rattNamn = spelare.get(r.ratt)?.namn ?? '';
    const valdLag = lagNamn.get(spelare.get(id)?.lag ?? '') ?? '';
    const namnrad = marke.querySelector('.mg-lagval-lagnamn');
    if (namnrad) namnrad.textContent = lag;
    feedback.say(ok ? `Rätt. ${rattNamn} – ${lag}.` : `Fel. ${spelare.get(id)?.namn ?? ''} hör till ${valdLag}. ${lag}: ${rattNamn}.`, ok ? 'ok' : 'fel');
    status.set(`Lag ${index + 1}/${rundor.length}`, `${right} rätt`);
    vidare.textContent = index + 1 < rundor.length ? 'Nästa lag' : 'Klart';
    vidare.hidden = false;
  };

  const nasta = () => {
    index += 1;
    if (index >= rundor.length) {
      onDone({
        score: right / rundor.length,
        summary: `Du placerade rätt spelare i ${right} av ${rundor.length} lag.`,
        perfect: right === rundor.length,
      });
      return;
    }
    visa();
  };

  visa();
}

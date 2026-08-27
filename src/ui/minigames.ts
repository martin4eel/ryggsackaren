import type { Minigame } from '../data/types';
import { playCombo, playPad, playSound } from './audio';
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
    case 'sortering':
      startSorting(host, game, ctx, done);
      break;
    case 'instrument':
      startInstruments(host, game, ctx, done);
      break;
    case 'sekvens':
      startSequence(host, game, ctx, done);
      break;
    case 'precision':
      startPrecision(host, game, ctx, done);
      break;
    case 'vaxel':
      startChange(host, game, ctx, done);
      break;
    case 'traffa':
      startCatch(host, game, ctx, done);
      break;
    case 'balans':
      startBalance(host, game, ctx, done);
      break;
    case 'takt':
      startRhythm(host, game, ctx, done);
      break;
    case 'bildval':
      startPictureChoice(host, game, ctx, done);
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

function every(ms: number, fn: () => void): number {
  const id = window.setInterval(fn, ms);
  timers.add(id);
  return id;
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

// --------------------------------------------------------------- sortering

/**
 * Föremål glider fram på ett band och spelaren trycker på korgen de hör
 * hemma i innan de hunnit ut på andra sidan. Föremålen kommer ur jobbets
 * `pool`, så det krävs att man vet vad sakerna är: en tigerräka ska till
 * räkorna, inte till nudlarna.
 */
function startSorting(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const ROUNDS = 9;
  const buckets = game.items;
  /** Reserv om ett jobb saknar pool: korgens eget namn, som förr. */
  const pool = game.pool ?? buckets.map((b) => [b]);
  /** Varje korg får sin egen blandade kö, så inget föremål upprepas i onödan. */
  const queues = pool.map((group) => shuffled(group));
  const cursors = pool.map(() => 0);

  let round = 0;
  let correct = 0;
  let streak = 0;
  let best = 0;
  let answered = false;

  const status = makeStatus();
  const feedback = makeFeedback();
  const timer = makeTimer();
  const item = el('div', { class: 'mg-item' });
  const beltWrap = el('div', { class: 'mg-belt' }, item);
  const controls = el('div', { class: 'mg-buttons' });

  host.append(status.node, beltWrap, timer.node, feedback.node, controls);

  const drawItem = (bucket: number): string => {
    const q = queues[bucket]!;
    const i = cursors[bucket]!;
    cursors[bucket] = (i + 1) % q.length;
    return q[i]!;
  };

  const nextRound = () => {
    if (round >= ROUNDS) {
      onDone({
        score: correct / ROUNDS,
        summary: `Du sorterade ${correct} av ${ROUNDS} rätt. Längsta svit: ${best}.`,
        perfect: correct === ROUNDS,
      });
      return;
    }
    answered = false;
    const wanted = randInt(buckets.length);
    item.textContent = drawItem(wanted);
    status.set(`Föremål ${round + 1}/${ROUNDS}`, `${correct} rätt · svit ${streak}`);

    // Tiden krymper med tempot, men aldrig under vad som går att hinna läsa.
    const total = Math.max(1600, 3000 - round * 140) * ctx.slack;

    /**
     * Föremålet ska glida över bandet på exakt den tid rundan varar, annars
     * ligger det kvar efter att tiden gått ut eller försvinner medan det
     * fortfarande går att svara. Klassen tas bort och sätts tillbaka efter en
     * påtvingad omritning, så att animationen startar om från början.
     */
    item.className = 'mg-item';
    item.style.setProperty('--belt-time', `${total}ms`);
    void item.offsetWidth;
    item.className = 'mg-item mg-item-moving';

    timer.run(total, () => {
      if (!answered) judge(-1, wanted);
    });

    clear(controls);
    buckets.forEach((name, i) => {
      controls.append(
        button(name, () => judge(i, wanted), {
          class: 'btn mg-btn',
          'data-sound': 'av',
        })
      );
    });
  };

  const judge = (picked: number, wanted: number) => {
    if (answered) return;
    answered = true;
    timer.halt();
    const right = picked === wanted;
    if (right) {
      correct += 1;
      streak += 1;
      best = Math.max(best, streak);
      if (streak >= 3) playCombo(streak);
      else playSound('blipp');
      feedback.say(
        streak >= 3 ? `Rätt korg! ${streak} i rad.` : 'Rätt korg!',
        streak >= 3 ? 'topp' : 'ok'
      );
    } else {
      streak = 0;
      playSound('fel');
      feedback.say(
        picked < 0
          ? `För sent. Den skulle till ${buckets[wanted]}.`
          : `Fel korg. Den skulle till ${buckets[wanted]}.`,
        'fel'
      );
    }
    item.className = `mg-item ${right ? 'mg-item-right' : 'mg-item-wrong'}`;
    round += 1;
    after(right ? 460 : 820, nextRound);
  };

  nextRound();
}

// -------------------------------------------------------------- instrument

/**
 * Arbetsledaren ropar ut flera moment på en gång och spelaren utför dem i
 * ordning innan tiden går ut. Kön växer allteftersom, så det räcker inte att
 * reagera - man måste hålla ordningen i huvudet.
 */
function startInstruments(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const ROUNDS = 6;
  const items = game.items;
  let round = 0;
  let cleared = 0;
  /** Utförda respektive begärda moment, för delpoängen. */
  let stepsDone = 0;
  let stepsTotal = 0;
  let queue: number[] = [];
  let at = 0;
  let running = false;

  const status = makeStatus();
  const order = el('div', { class: 'mg-order' });
  const feedback = makeFeedback();
  const timer = makeTimer();
  const panel = el('div', { class: 'mg-panel' });
  host.append(status.node, order, timer.node, feedback.node, panel);

  /** Om ordern visas i klartext (under genomgången) eller är dold. */
  let visible = true;

  /**
   * Ordern visas bara under genomgången. Sedan döljs den, och man utför den
   * ur minnet - annars är momentet att läsa en lista och trycka på knappar.
   * De utförda stegen bockas av så att man ser var man är.
   */
  const drawOrder = () => {
    clear(order);
    queue.forEach((idx, i) => {
      const done = i < at;
      const now = i === at;
      const chip = el(
        'span',
        {
          class: `mg-chip ${done ? 'mg-chip-done' : now ? 'mg-chip-now' : ''} ${
            visible ? '' : 'mg-chip-dold'
          }`,
        },
        visible || done ? `${i + 1}. ${items[idx]}` : `${i + 1}. ?`
      );
      order.append(chip);
    });
  };

  const nextRound = () => {
    if (round >= ROUNDS) {
      // Delpoäng: varje utfört moment räknas, även i en följd som bröts.
      // Hela följder väger tyngre, så det lönar sig fortfarande att gå i mål.
      const partial = stepsTotal > 0 ? stepsDone / stepsTotal : 0;
      const whole = cleared / ROUNDS;
      onDone({
        score: whole * 0.6 + partial * 0.4,
        summary: `Du klarade ${cleared} av ${ROUNDS} orderföljder och ${stepsDone} av ${stepsTotal} enskilda moment.`,
        perfect: cleared === ROUNDS,
      });
      return;
    }
    // Två moment i början, upp till fyra på slutet.
    // Två moment i början, upp till fem på slutet.
    const length = Math.min(5, 2 + Math.floor(round / 2));
    queue = Array.from({ length }, () => randInt(items.length));
    stepsTotal += length;
    at = 0;
    running = false;
    visible = true;
    status.set(`Order ${round + 1}/${ROUNDS}`, `${cleared} klarade`);
    feedback.say('Memorera ordern.', 'neutral');
    drawOrder();
    clear(panel);

    // Genomgången: en stund per steg, sedan försvinner texten.
    const study = (900 + length * 650) * ctx.slack;
    after(study, () => {
      if (round >= ROUNDS) return;
      visible = false;
      running = true;
      drawOrder();
      feedback.say('Utför momenten ur minnet, uppifrån och ner.', 'neutral');
      const total = (1500 + length * 1100 - round * 120) * ctx.slack;
      timer.run(total, () => fail('Tiden gick ut.'));
      items.forEach((name, i) => {
        panel.append(
          button(name, () => press(i), {
            class: 'mg-knob',
            'data-sound': 'av',
          })
        );
      });
    });
  };

  const fail = (why: string) => {
    if (!running) return;
    running = false;
    timer.halt();
    playSound('fel');
    feedback.say(`${why} Rätt var ${items[queue[at]!]}.`, 'fel');
    visible = true;
    drawOrder();
    round += 1;
    after(1300, nextRound);
  };

  const press = (i: number) => {
    if (!running) return;
    if (i !== queue[at]) {
      fail('Fel reglage.');
      return;
    }
    playSound('blipp');
    at += 1;
    stepsDone += 1;
    drawOrder();
    if (at < queue.length) return;
    running = false;
    timer.halt();
    cleared += 1;
    playCombo(cleared);
    feedback.say('Hela följden rätt!', 'topp');
    round += 1;
    after(650, nextRound);
  };

  nextRound();
}

// ----------------------------------------------------------------- sekvens

/**
 * En sekvens blinkar fram och spelaren upprepar den. Varje platta har en egen
 * ton ur en pentatonisk skala, så sekvensen går att minnas med örat lika
 * gärna som med ögat. Ett feltryck kostar ett försök, inte hela nivån.
 */
function startSequence(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const items = game.items;
  const LEVELS = 5;
  let level = 0;
  let cleared = 0;
  let lives = 0;
  let sequence: number[] = [];
  let inputIndex = 0;
  let accepting = false;

  const status = makeStatus();
  const feedback = makeFeedback();
  const pads = el('div', { class: 'mg-pads' });
  host.append(status.node, feedback.node, pads);

  const padEls: HTMLElement[] = [];
  items.forEach((name, i) => {
    const pad = button(name, () => press(i), {
      class: 'mg-pad',
      'data-sound': 'av',
    });
    padEls.push(pad);
    pads.append(pad);
  });

  const flash = (i: number, cls: string, ms: number) =>
    new Promise<void>((resolve) => {
      const pad = padEls[i]!;
      pad.classList.add(cls);
      after(ms, () => {
        pad.classList.remove(cls);
        after(140, resolve);
      });
    });

  const showLives = () =>
    status.set(
      `Sekvens ${Math.min(level + 1, LEVELS)}/${LEVELS}`,
      `${cleared} klarade · ${lives} försök kvar`
    );

  const playSequence = async () => {
    accepting = false;
    feedback.say('Titta och lyssna noga ...', 'neutral');
    for (const i of sequence) {
      playPad(i);
      await flash(i, 'mg-pad-on', Math.max(300, 540 - level * 40) * ctx.slack);
    }
    feedback.say('Din tur. Upprepa ordningen.', 'neutral');
    accepting = true;
    inputIndex = 0;
  };

  const nextLevel = () => {
    if (level >= LEVELS) {
      onDone({
        score: cleared / LEVELS,
        summary: `Du klarade ${cleared} av ${LEVELS} sekvenser.`,
        perfect: cleared === LEVELS,
      });
      return;
    }
    // Längden växer: 2, 3, 4 ... och varje nivå ger ett extra försök.
    sequence = Array.from({ length: level + 2 }, () => randInt(items.length));
    lives = 1;
    showLives();
    void playSequence();
  };

  const press = (i: number) => {
    if (!accepting) return;
    if (i === sequence[inputIndex]) {
      playPad(i);
      void flash(i, 'mg-pad-right', 180);
      inputIndex += 1;
      if (inputIndex >= sequence.length) {
        accepting = false;
        cleared += 1;
        level += 1;
        feedback.say('Rätt hela vägen!', 'topp');
        playCombo(cleared);
        after(760, nextLevel);
      }
      return;
    }

    accepting = false;
    playPad(i, true);
    void flash(i, 'mg-pad-wrong', 320);
    if (lives > 0) {
      lives -= 1;
      showLives();
      feedback.say('Fel platta. Sekvensen spelas en gång till.', 'fel');
      after(900, () => void playSequence());
      return;
    }
    feedback.say('Fel igen. Nästa sekvens kommer.', 'fel');
    level += 1;
    after(950, nextLevel);
  };

  nextLevel();
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

// ------------------------------------------------------------------ växel

/**
 * Kassaspelet: kunden köper ett par saker, betalar med en sedel och ska ha
 * rätt växel tillbaka. Ren huvudräkning under tidspress, och det enda momentet
 * där svaret går att räkna ut i förväg om man är snabb.
 */
function startChange(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const ROUNDS = 6;
  let round = 0;
  let correct = 0;
  let answered = false;
  let change = 0;

  const status = makeStatus();
  const till = el('div', { class: 'mg-till' });
  const feedback = makeFeedback();
  const timer = makeTimer();
  const options = el('div', { class: 'mg-buttons mg-change-options' });
  host.append(status.node, till, timer.node, feedback.node, options);

  /** Priser i basenheter, alltid jämna tiotal så att huvudräkning går. */
  const priceFor = (): number => 20 + randInt(18) * 10;

  const nextRound = () => {
    if (round >= ROUNDS) {
      onDone({
        score: correct / ROUNDS,
        summary: `Du räknade rätt växel ${correct} gånger av ${ROUNDS}.`,
        perfect: correct === ROUNDS,
      });
      return;
    }
    answered = false;
    const count = round < 2 ? 2 : 3;
    const goods = shuffled(game.items).slice(0, count);
    const prices = goods.map(priceFor);
    const total = prices.reduce((a, b) => a + b, 0);
    // Sedeln avrundas uppåt till närmaste hundralapp, minst hundra över noll.
    const bill = Math.max(100, Math.ceil((total + 1) / 100) * 100);
    change = bill - total;

    status.set(`Kund ${round + 1}/${ROUNDS}`, `${correct} rätt`);
    feedback.say('Hur mycket ska kunden ha tillbaka?', 'neutral');

    clear(till);
    goods.forEach((name, i) => {
      till.append(
        el(
          'div',
          { class: 'mg-till-row' },
          el('span', {}, name),
          el('span', { class: 'mg-till-price' }, ctx.money(prices[i]!))
        )
      );
    });
    till.append(
      el(
        'div',
        { class: 'mg-till-row mg-till-sum' },
        el('span', {}, 'Att betala'),
        el('span', { class: 'mg-till-price' }, ctx.money(total))
      ),
      el(
        'div',
        { class: 'mg-till-row mg-till-paid' },
        el('span', {}, 'Kunden lägger fram'),
        el('span', { class: 'mg-till-price' }, ctx.money(bill))
      )
    );

    // Distraktorerna ligger nära rätt svar, så det inte går att gissa på syn.
    const wrongs = new Set<number>();
    const offsets = [10, 20, 30, 40, 50, 100];
    while (wrongs.size < 3) {
      const off = offsets[randInt(offsets.length)]!;
      const value = change + (Math.random() < 0.5 ? -off : off);
      if (value > 0 && value !== change) wrongs.add(value);
    }
    const alternatives = shuffled([change, ...wrongs]);

    clear(options);
    for (const value of alternatives) {
      options.append(
        button(ctx.money(value), () => judge(value), {
          class: 'btn mg-btn mg-change-btn',
          'data-sound': 'av',
        })
      );
    }

    timer.run(Math.max(5000, 9000 - round * 600), () => judge(null));
  };

  const judge = (picked: number | null) => {
    if (answered) return;
    answered = true;
    timer.halt();
    if (picked === change) {
      correct += 1;
      playSound('kassa');
      feedback.say('Rätt växel. Nästa kund!', 'ok');
    } else {
      playSound('fel');
      feedback.say(
        picked === null
          ? `För sent. Rätt växel var ${ctx.money(change)}.`
          : `Fel. Rätt växel var ${ctx.money(change)}.`,
        'fel'
      );
    }
    for (const b of Array.from(options.children)) {
      (b as HTMLButtonElement).disabled = true;
      if (b.textContent === ctx.money(change)) b.classList.add('mg-change-right');
      else if (picked !== null && b.textContent === ctx.money(picked))
        b.classList.add('mg-change-wrong');
    }
    round += 1;
    after(picked === change ? 700 : 1100, nextRound);
  };

  nextRound();
}

// ------------------------------------------------------------------ träffa

/**
 * Föremål dyker upp i ett rutnät och försvinner igen. Det som står i `items`
 * ska plockas, det som står i `avoid` ska lämnas i fred - ett feltryck kostar
 * lika mycket som en träff ger, så det lönar sig att läsa innan man trycker.
 */
function startCatch(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const SLOTS = 6;
  const DURATION = 22000;
  const TARGET = 14;

  let hits = 0;
  let misses = 0;
  let streak = 0;
  let running = true;

  const status = makeStatus();
  const feedback = makeFeedback();
  const grid = el('div', { class: 'mg-grid' });
  const timer = makeTimer();
  host.append(status.node, timer.node, feedback.node, grid);

  interface Slot {
    node: HTMLButtonElement;
    label: string | null;
    good: boolean;
    until: number;
  }

  const slots: Slot[] = [];
  for (let i = 0; i < SLOTS; i++) {
    const node = button('', () => tap(i), {
      class: 'mg-slot',
      'data-sound': 'av',
    });
    slots.push({ node, label: null, good: false, until: 0 });
    grid.append(node);
  }

  const show = () =>
    status.set(`Plockat ${hits} (mål ${TARGET})`, `${misses} felgrepp · svit ${streak}`);
  show();
  feedback.say('Tryck på det som ska plockas. Låt resten vara.', 'neutral');

  const fill = (slot: Slot) => {
    const good = Math.random() < 0.62;
    const list = good ? game.items : (game.avoid ?? game.items);
    slot.label = list[randInt(list.length)] ?? '';
    slot.good = good;
    slot.node.textContent = slot.label;
    slot.node.className = `mg-slot mg-slot-up ${good ? 'mg-slot-good' : 'mg-slot-bad'}`;
    slot.until = performance.now() + (1500 + Math.random() * 900) * ctx.slack;
  };

  const clearSlot = (slot: Slot) => {
    slot.label = null;
    slot.node.textContent = '';
    slot.node.className = 'mg-slot';
    slot.until = 0;
  };

  const tap = (i: number) => {
    const slot = slots[i]!;
    if (!running || !slot.label) return;
    if (slot.good) {
      hits += 1;
      streak += 1;
      if (streak >= 3) playCombo(streak);
      else playSound('blipp');
      slot.node.classList.add('mg-slot-taken');
      feedback.say(`${slot.label} – bra plockat.`, streak >= 3 ? 'topp' : 'ok');
    } else {
      misses += 1;
      streak = 0;
      playSound('fel');
      slot.node.classList.add('mg-slot-oops');
      feedback.say(`${slot.label} skulle ligga kvar.`, 'fel');
    }
    show();
    const captured = slot;
    after(220, () => clearSlot(captured));
  };

  timer.run(DURATION, () => {
    running = false;
    // Ett felgrepp kostar mer än en träff ger. Annars lönar det sig att
    // trycka på allt som dyker upp, och då finns ingen uppgift kvar.
    const score = Math.max(0, Math.min(1, (hits - misses * 1.5) / TARGET));
    onDone({
      score,
      summary:
        misses === 0
          ? `Du plockade ${hits} rätt utan ett enda felgrepp.`
          : `Du plockade ${hits} rätt, men grep fel ${misses} gånger.`,
      perfect: hits >= TARGET && misses === 0,
    });
  });

  every(420, () => {
    if (!running) return;
    const now = performance.now();
    for (const slot of slots) {
      if (slot.label && slot.until && now > slot.until) clearSlot(slot);
    }
    const empty = slots.filter((s) => !s.label);
    if (empty.length === 0) return;
    // Håll tre till fyra rutor upplysta samtidigt.
    if (SLOTS - empty.length >= 4) return;
    fill(empty[randInt(empty.length)]!);
  });
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

// ----------------------------------------------------------------- bildval

/**
 * Kunden i shopen säger vad hen behöver, men inte vad det heter, och man
 * pekar ut rätt foto av fyra. Lockbetena väljs ur kundens `nastan` först,
 * så att puttern får sällskap av en wedge och inte av en golfbil. Namnen
 * skrivs ut först när man pekat - att veta vilket foto som är vilket är
 * hela uppgiften.
 */
function startPictureChoice(
  host: HTMLElement,
  game: Minigame,
  ctx: MinigameContext,
  onDone: Done
): void {
  const ROUNDS = 8;
  const katalog = game.bildval ?? [];
  const namn = new Map(katalog.map((b) => [b.bild, b.namn]));
  const kunder = shuffled(game.kunder ?? []).slice(0, ROUNDS);
  let round = 0;
  let right = 0;
  let running = false;

  const status = makeStatus();
  const bubble = el('p', { class: 'mg-kund' });
  const grid = el('div', { class: 'options-bilder mg-bildval' });
  const timer = makeTimer();
  const feedback = makeFeedback();
  host.append(status.node, bubble, grid, timer.node, feedback.node);

  const finish = () => {
    onDone({
      score: right / kunder.length,
      summary: `Du hittade rätt åt ${right} av ${kunder.length} kunder.`,
      perfect: right === kunder.length,
    });
  };

  const next = () => {
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

    status.set(`Kund ${round + 1}/${kunder.length}`, `${right} nöjda`);
    bubble.textContent = `”${kund.text}”`;
    feedback.say('Peka på rätt foto.', 'neutral');
    clear(grid);
    val.forEach((id, i) => {
      const b = button('', () => pick(id, b), { class: 'option option-bild mg-bildval-knapp', 'data-sound': 'av' });
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
    timer.run((6500 - round * 250) * ctx.slack, () => pick(null, null));
  };

  const pick = (id: string | null, knapp: HTMLElement | null) => {
    if (!running) return;
    running = false;
    timer.halt();
    const kund = kunder[round]!;
    const ok = id === kund.svar;
    // Visa namnen nu, och markera rätt och fel.
    for (const b of Array.from(grid.children) as HTMLElement[]) {
      const src = b.querySelector('img')?.getAttribute('src') ?? '';
      const bid = katalog.find((k) => src.endsWith(`/${k.bild}.jpg`))?.bild ?? '';
      const facit = b.querySelector('.option-facit');
      if (facit) facit.textContent = namn.get(bid) ?? '';
      if (bid === kund.svar) b.classList.add('option-right');
      else if (b === knapp) b.classList.add('option-wrong');
      else b.classList.add('option-dim');
    }
    if (ok) {
      right += 1;
      playCombo(right);
      feedback.say(`Just det, ${namn.get(kund.svar)?.toLowerCase()}. Kunden nickar.`, 'topp');
    } else {
      playSound('fel');
      feedback.say(
        id === null
          ? `Kunden tröttnade och gick. Det var ${namn.get(kund.svar)?.toLowerCase()}.`
          : kund.fel ?? `Nej – kunden ville ha ${namn.get(kund.svar)?.toLowerCase()}.`,
        'fel'
      );
    }
    status.set(`Kund ${round + 1}/${kunder.length}`, `${right} nöjda`);
    round += 1;
    after(ok ? 900 : 1500, next);
  };

  next();
}

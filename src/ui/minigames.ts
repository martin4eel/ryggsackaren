import type { Minigame } from '../data/types';
import { button, clear, el } from './dom';

/**
 * Arkadmomenten som avslutar ett arbetsskift. Alla fyra är byggda för att
 * fungera lika bra med finger som med mus, och kan avslutas utan att spelet
 * hänger sig. Varje spel rapporterar ett resultat mellan 0 och 1 som styr
 * bonusen på lönen.
 */

export interface MinigameResult {
  /** Andel rätt, 0 till 1 */
  score: number;
  /** Kort sammanfattning som visas efteråt */
  summary: string;
}

type Done = (result: MinigameResult) => void;

/** Startar rätt spel och lämnar tillbaka elementet det spelas i. */
export function renderMinigame(game: Minigame, onDone: Done): HTMLElement {
  const host = el('div', { class: 'minigame' });
  switch (game.kind) {
    case 'sortering':
      startSorting(host, game, onDone);
      break;
    case 'instrument':
      startInstruments(host, game, onDone);
      break;
    case 'sekvens':
      startSequence(host, game, onDone);
      break;
    case 'precision':
      startPrecision(host, game, onDone);
      break;
  }
  return host;
}

/** Städar upp timers om spelaren lämnar skärmen mitt i ett spel. */
const timers = new Set<number>();

export function stopAllMinigames(): void {
  for (const id of timers) {
    window.clearInterval(id);
    window.clearTimeout(id);
  }
  timers.clear();
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

// --------------------------------------------------------------- sortering

/**
 * Föremål glider fram på ett band. Spelaren trycker på rätt korg innan
 * föremålet hunnit ut på andra sidan. Motsvarar originalets fiskband.
 */
function startSorting(host: HTMLElement, game: Minigame, onDone: Done): void {
  const ROUNDS = 8;
  const buckets = game.items;
  let round = 0;
  let correct = 0;
  let answered = false;
  let ticker = 0;

  const status = el('p', { class: 'mg-status' });
  const beltWrap = el('div', { class: 'mg-belt' });
  const item = el('div', { class: 'mg-item' });
  beltWrap.append(item);
  const bar = el('span', { class: 'mg-timebar' });
  const barWrap = el('div', { class: 'mg-timer' }, bar);
  const controls = el('div', { class: 'mg-buttons' });

  host.append(status, beltWrap, barWrap, controls);

  const nextRound = () => {
    if (round >= ROUNDS) {
      finishSorting();
      return;
    }
    answered = false;
    const wanted = Math.floor(Math.random() * buckets.length);
    const label = buckets[wanted]!;
    item.textContent = label;
    status.textContent = `Föremål ${round + 1} av ${ROUNDS} · rätt: ${correct}`;

    // Tiden krymper något per omgång så tempot stiger.
    const total = Math.max(1400, 2600 - round * 130);

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

    const startedAt = Date.now();
    bar.style.width = '100%';
    ticker = every(50, () => {
      const left = 1 - (Date.now() - startedAt) / total;
      bar.style.width = `${Math.max(0, left * 100)}%`;
      if (left <= 0) {
        stop(ticker);
        if (!answered) judge(-1, wanted);
      }
    });

    clear(controls);
    buckets.forEach((name, i) => {
      controls.append(
        button(name, () => judge(i, wanted), { class: 'btn mg-btn' })
      );
    });
  };

  const judge = (picked: number, wanted: number) => {
    if (answered) return;
    answered = true;
    stop(ticker);
    const right = picked === wanted;
    if (right) correct += 1;
    item.className = `mg-item ${right ? 'mg-item-right' : 'mg-item-wrong'}`;
    item.textContent = right
      ? `${buckets[wanted]} ✓`
      : `Skulle till ${buckets[wanted]}`;
    round += 1;
    after(right ? 420 : 720, nextRound);
  };

  const finishSorting = () => {
    const score = correct / ROUNDS;
    onDone({
      score,
      summary: `Du sorterade ${correct} av ${ROUNDS} rätt.`,
    });
  };

  nextRound();
}

// -------------------------------------------------------------- instrument

/**
 * Arbetsledaren ropar ut ett reglage och spelaren trycker på det innan tiden
 * går ut. Motsvarar originalets cockpit-moment.
 */
function startInstruments(host: HTMLElement, game: Minigame, onDone: Done): void {
  const ROUNDS = 8;
  const items = game.items;
  let round = 0;
  let correct = 0;
  let answered = false;
  let ticker = 0;

  const status = el('p', { class: 'mg-status' });
  const order = el('div', { class: 'mg-order' });
  const bar = el('span', { class: 'mg-timebar' });
  const barWrap = el('div', { class: 'mg-timer' }, bar);
  const panel = el('div', { class: 'mg-panel' });
  host.append(status, order, barWrap, panel);

  const nextRound = () => {
    if (round >= ROUNDS) {
      onDone({
        score: correct / ROUNDS,
        summary: `Du hann med ${correct} av ${ROUNDS} moment.`,
      });
      return;
    }
    answered = false;
    const wanted = Math.floor(Math.random() * items.length);
    order.textContent = items[wanted]!;
    order.className = 'mg-order';
    status.textContent = `Moment ${round + 1} av ${ROUNDS} · rätt: ${correct}`;

    const total = Math.max(1200, 2400 - round * 140);
    const startedAt = Date.now();
    bar.style.width = '100%';
    ticker = every(50, () => {
      const left = 1 - (Date.now() - startedAt) / total;
      bar.style.width = `${Math.max(0, left * 100)}%`;
      if (left <= 0) {
        stop(ticker);
        if (!answered) judge(-1, wanted);
      }
    });

    clear(panel);
    items.forEach((name, i) => {
      panel.append(
        button(name, () => judge(i, wanted), { class: 'mg-knob' })
      );
    });
  };

  const judge = (picked: number, wanted: number) => {
    if (answered) return;
    answered = true;
    stop(ticker);
    const right = picked === wanted;
    if (right) correct += 1;
    order.className = `mg-order ${right ? 'mg-order-right' : 'mg-order-wrong'}`;
    order.textContent = right ? 'Rätt reglage!' : `Det var ${items[wanted]}`;
    round += 1;
    after(right ? 400 : 700, nextRound);
  };

  nextRound();
}

// ----------------------------------------------------------------- sekvens

/**
 * En sekvens blinkar fram och spelaren upprepar den. Längden växer för varje
 * klarad omgång, som i ett klassiskt minnesspel.
 */
function startSequence(host: HTMLElement, game: Minigame, onDone: Done): void {
  const items = game.items;
  const LEVELS = 5;
  let level = 0;
  let cleared = 0;
  let sequence: number[] = [];
  let inputIndex = 0;
  let accepting = false;

  const status = el('p', { class: 'mg-status' });
  const hint = el('p', { class: 'mg-hint' });
  const pads = el('div', { class: 'mg-pads' });
  host.append(status, hint, pads);

  const padEls: HTMLElement[] = [];
  clear(pads);
  items.forEach((name, i) => {
    const pad = button(name, () => press(i), { class: 'mg-pad' });
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

  const playSequence = async () => {
    accepting = false;
    hint.textContent = 'Titta noga ...';
    for (const i of sequence) {
      await flash(i, 'mg-pad-on', Math.max(280, 520 - level * 40));
    }
    hint.textContent = 'Din tur! Upprepa ordningen.';
    accepting = true;
    inputIndex = 0;
  };

  const nextLevel = () => {
    if (level >= LEVELS) {
      onDone({
        score: cleared / LEVELS,
        summary: `Du klarade ${cleared} av ${LEVELS} sekvenser.`,
      });
      return;
    }
    // Längden växer: 2, 3, 4 ...
    sequence = Array.from(
      { length: level + 2 },
      () => Math.floor(Math.random() * items.length)
    );
    status.textContent = `Sekvens ${level + 1} av ${LEVELS} · klarade: ${cleared}`;
    void playSequence();
  };

  const press = (i: number) => {
    if (!accepting) return;
    if (i === sequence[inputIndex]) {
      void flash(i, 'mg-pad-right', 180);
      inputIndex += 1;
      if (inputIndex >= sequence.length) {
        accepting = false;
        cleared += 1;
        level += 1;
        hint.textContent = 'Rätt hela vägen!';
        after(700, nextLevel);
      }
      return;
    }
    accepting = false;
    void flash(i, 'mg-pad-wrong', 320);
    hint.textContent = 'Fel ordning. Nästa sekvens kommer.';
    level += 1;
    after(900, nextLevel);
  };

  nextLevel();
}

// --------------------------------------------------------------- precision

/**
 * En markör svänger fram och tillbaka över en skala och spelaren stoppar den
 * i den gröna zonen. Zonen krymper för varje försök.
 */
function startPrecision(host: HTMLElement, game: Minigame, onDone: Done): void {
  const TRIES = 5;
  const label = game.items[0] ?? 'Mätvärde';
  let attempt = 0;
  let hits = 0;
  let pos = 0;
  let dir = 1;
  let ticker = 0;
  let running = false;

  const status = el('p', { class: 'mg-status' });
  const readout = el('p', { class: 'mg-readout' });
  const zone = el('span', { class: 'mg-zone' });
  const needle = el('span', { class: 'mg-needle' });
  const gauge = el('div', { class: 'mg-gauge' }, zone, needle);
  const actions = el('div', { class: 'mg-buttons' });
  host.append(status, gauge, readout, actions);

  let zoneStart = 0;
  let zoneWidth = 0;

  const newAttempt = () => {
    if (attempt >= TRIES) {
      onDone({
        score: hits / TRIES,
        summary: `Du träffade rätt ${hits} av ${TRIES} gånger.`,
      });
      return;
    }
    // Zonen krymper men hålls rimlig, och placeras aldrig helt ute i kanten.
    zoneWidth = Math.max(12, 26 - attempt * 3);
    zoneStart = 8 + Math.random() * (100 - 16 - zoneWidth);
    zone.style.left = `${zoneStart}%`;
    zone.style.width = `${zoneWidth}%`;
    status.textContent = `Försök ${attempt + 1} av ${TRIES} · träffar: ${hits}`;
    readout.textContent = `${label}: sikta in den gröna zonen`;
    gauge.classList.remove('mg-gauge-right', 'mg-gauge-wrong');

    pos = 0;
    dir = 1;
    const speed = 1.1 + attempt * 0.25;
    running = true;
    ticker = every(16, () => {
      pos += dir * speed;
      if (pos >= 100) {
        pos = 100;
        dir = -1;
      }
      if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      needle.style.left = `${pos}%`;
    });

    clear(actions);
    actions.append(
      button('Stoppa', judge, { class: 'btn btn-primary mg-stop' })
    );
  };

  const judge = () => {
    if (!running) return;
    running = false;
    stop(ticker);
    const inside = pos >= zoneStart && pos <= zoneStart + zoneWidth;
    if (inside) hits += 1;
    gauge.classList.add(inside ? 'mg-gauge-right' : 'mg-gauge-wrong');
    const unit = game.unit ? ` ${game.unit}` : '';
    readout.textContent = inside
      ? `Perfekt! ${Math.round(pos)}${unit} ligger i zonen.`
      : `${Math.round(pos)}${unit} hamnade utanför zonen.`;
    attempt += 1;
    clear(actions);
    after(inside ? 600 : 850, newAttempt);
  };

  newAttempt();
}

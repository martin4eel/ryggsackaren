/**
 * Ljudeffekter syntetiseras med WebAudio – inga ljudfiler behövs, så spelet
 * förblir lika litet och fungerar offline. Ljudstyrningen följer
 * webbläsarnas regler: ljudkontexten skapas först vid en användargest
 * (första playSound-anropet sker alltid i en klick-hanterare).
 *
 * Volymläget sparas i localStorage och speglas av högtalarikonen i HUD:en.
 * Knappen stegar mellan tre lägen (av, halv, full) i stället för bara på och
 * av, så att spelet går att ha igång utan att störa omgivningen.
 */

export type Sound =
  /** Kort knappklick */
  | 'klick'
  /** Markering i en lista eller på kartan */
  | 'valj'
  /** Rätt svar – liten klang */
  | 'ratt'
  /** Fel svar – dämpad bas */
  | 'fel'
  /** Lön eller försäljning – kassaapparat */
  | 'kassa'
  /** Ett enskilt mynt, t.ex. bonus */
  | 'mynt'
  /** Avresa – svep */
  | 'resa'
  /** Framme i ny stad */
  | 'ankomst'
  /** Stämpel i kortet – dunk */
  | 'stampla'
  /** Certifikat och vinst – kort fanfar */
  | 'fanfar'
  /** Arkadmomentens plupp */
  | 'blipp'
  /** Perfekt träff – gnistrande */
  | 'perfekt'
  /** Metronomens obetonade slag */
  | 'tick'
  /** Metronomens betonade slag */
  | 'tock'
  /** Trumslag i taktmomentet */
  | 'trumma'
  /** Plask, t.ex. vid havsarbete */
  | 'plask'
  /** Tiden håller på att ta slut */
  | 'varning'
  /** Sidbläddring i tidningen */
  | 'sida'
  /** Ny nivå, ny stämpel i passet */
  | 'niva'
  /** Svisch när något glider förbi */
  | 'svisch'
  /** Resan slutade lyckligt */
  | 'seger'
  /** Resan tog slut i förtid */
  | 'forlust';

const STORAGE_KEY = 'ryggsackaren-ljud';

/** Tre lägen i tur och ordning när högtalarknappen trycks. */
export type VolumeLevel = 0 | 1 | 2;
const LEVEL_GAIN: Record<VolumeLevel, number> = { 0: 0, 1: 0.28, 2: 0.6 };
const LEVEL_LABEL: Record<VolumeLevel, string> = {
  0: 'Ljud av',
  1: 'Ljud på, dämpat',
  2: 'Ljud på, fullt',
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let level: VolumeLevel = readLevel();

function readLevel(): VolumeLevel {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Äldre sparfiler lagrade 'av' respektive 'på'.
    if (raw === 'av') return 0;
    if (raw === 'på') return 2;
    const n = Number(raw);
    if (n === 0 || n === 1 || n === 2) return n;
  } catch {
    // Privat surfning kan neka localStorage – då gäller minnesläget.
  }
  return 2;
}

export function volumeLevel(): VolumeLevel {
  return level;
}

export function isMuted(): boolean {
  return level === 0;
}

export function volumeLabel(): string {
  return LEVEL_LABEL[level];
}

/** Stegar till nästa volymläge och returnerar det. */
export function cycleVolume(): VolumeLevel {
  level = (((level + 1) % 3) as VolumeLevel);
  try {
    localStorage.setItem(STORAGE_KEY, String(level));
  } catch {
    // ignoreras
  }
  const c = ensureCtx();
  if (c && master) master.gain.setValueAtTime(LEVEL_GAIN[level], c.currentTime);
  return level;
}

/**
 * Hämtar (eller skapar) ljudkontexten. Returnerar null när ljudet är av
 * eller när webbläsaren saknar WebAudio.
 */
function ensureCtx(): AudioContext | null {
  if (level === 0) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = LEVEL_GAIN[level];
    master.connect(ctx.destination);
  }
  // iOS/Android pausar kontexten tills en gest återupptar den.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  /** Frekvens att glida till under tonens längd */
  slide?: number;
  /** Attacktid i sekunder, längre ger mjukare anslag */
  attack?: number;
}

/** En ton med mjuk attack och exponentiellt utfall. */
function tone(freq: number, t0: number, dur: number, opts: ToneOpts = {}): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slide !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slide), t0 + dur);
  }
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.12, t0 + (opts.attack ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

interface NoiseOpts {
  gain?: number;
  from?: number;
  to?: number;
  /** Bandbredd: högre Q ger smalare, mer tonalt brus */
  q?: number;
  type?: BiquadFilterType;
}

/** Filtrerat vitt brus, t.ex. svepet vid avresa eller ett trumskinn. */
function noise(dur: number, t0: number, opts: NoiseOpts = {}): void {
  if (!ctx || !master) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type ?? 'bandpass';
  filter.Q.value = opts.q ?? 1.1;
  filter.frequency.setValueAtTime(opts.from ?? 300, t0);
  filter.frequency.exponentialRampToValueAtTime(opts.to ?? 1600, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.1, t0 + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

/** Spelar en följd av toner som en liten melodi. */
function melody(
  notes: Array<[freq: number, atMs: number, durMs: number]>,
  t0: number,
  opts: ToneOpts = {}
): void {
  for (const [freq, at, dur] of notes) {
    tone(freq, t0 + at / 1000, dur / 1000, opts);
  }
}

/**
 * Stigande klang som blir ljusare ju längre svarsserien är. Används när
 * spelaren svarat rätt flera gånger i rad, så att serien hörs och inte bara
 * syns.
 */
export function playCombo(streak: number): void {
  const c = ensureCtx();
  if (!c) return;
  const step = Math.min(7, Math.max(0, streak - 1));
  const base = 523.25 * Math.pow(2, step / 12);
  tone(base, c.currentTime, 0.1, { type: 'triangle', gain: 0.1 });
  tone(base * 1.5, c.currentTime + 0.07, 0.16, { type: 'triangle', gain: 0.09 });
}

/**
 * En ton per platta i minnesspelet. Plattorna ligger på en pentatonisk skala,
 * så att vilken sekvens som helst låter som musik i stället för som larm.
 */
const PAD_SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export function playPad(index: number, wrong = false): void {
  const c = ensureCtx();
  if (!c) return;
  if (wrong) {
    tone(196, c.currentTime, 0.28, { type: 'sawtooth', gain: 0.09, slide: 130 });
    return;
  }
  const freq = PAD_SCALE[index % PAD_SCALE.length]!;
  tone(freq, c.currentTime, 0.26, { type: 'triangle', gain: 0.1, attack: 0.012 });
  tone(freq * 2, c.currentTime, 0.12, { type: 'sine', gain: 0.03 });
}

/** Spelar en effekt. Gör ingenting om ljudet är avstängt. */
export function playSound(name: Sound): void {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case 'klick':
      tone(1800, t, 0.05, { type: 'square', gain: 0.022 });
      break;
    case 'valj':
      tone(1200, t, 0.05, { type: 'triangle', gain: 0.05 });
      tone(1800, t + 0.04, 0.05, { type: 'triangle', gain: 0.035 });
      break;
    case 'blipp':
      tone(660, t, 0.08, { type: 'triangle', gain: 0.08 });
      break;
    case 'ratt':
      tone(659, t, 0.09, { gain: 0.12 });
      tone(880, t + 0.09, 0.16, { gain: 0.12 });
      break;
    case 'fel':
      tone(160, t, 0.22, { type: 'sawtooth', gain: 0.08, slide: 110 });
      break;
    case 'kassa':
      [880, 1175, 1568].forEach((f, i) =>
        tone(f, t + i * 0.06, 0.12, { type: 'triangle', gain: 0.09 })
      );
      break;
    case 'mynt':
      tone(1568, t, 0.07, { type: 'triangle', gain: 0.08 });
      tone(2093, t + 0.05, 0.12, { type: 'triangle', gain: 0.06 });
      break;
    case 'stampla':
      tone(120, t, 0.12, { gain: 0.2, slide: 60 });
      noise(0.08, t, { gain: 0.06, from: 900, to: 200 });
      break;
    case 'resa':
      noise(0.6, t, { gain: 0.1 });
      break;
    case 'ankomst':
      // Fyra toner uppåt, som en liten flygplatssignal.
      melody(
        [
          [784, 0, 160],
          [1047, 120, 160],
          [1319, 240, 320],
        ],
        t,
        { type: 'triangle', gain: 0.1 }
      );
      break;
    case 'fanfar':
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, t + i * 0.1, 0.22, { type: 'triangle', gain: 0.11 })
      );
      break;
    case 'perfekt':
      [1047, 1319, 1568, 2093].forEach((f, i) =>
        tone(f, t + i * 0.045, 0.2, { type: 'sine', gain: 0.075 })
      );
      break;
    case 'tick':
      noise(0.04, t, { gain: 0.05, from: 2200, to: 1400, q: 5 });
      break;
    case 'tock':
      noise(0.05, t, { gain: 0.09, from: 3200, to: 1800, q: 6 });
      tone(1400, t, 0.04, { type: 'square', gain: 0.03 });
      break;
    case 'trumma':
      tone(150, t, 0.22, { gain: 0.22, slide: 55 });
      noise(0.09, t, { gain: 0.07, from: 1400, to: 240 });
      break;
    case 'plask':
      noise(0.32, t, { gain: 0.11, from: 2400, to: 320, q: 0.8 });
      break;
    case 'varning':
      tone(880, t, 0.07, { type: 'square', gain: 0.05 });
      tone(880, t + 0.13, 0.07, { type: 'square', gain: 0.05 });
      break;
    case 'sida':
      noise(0.22, t, { gain: 0.06, from: 700, to: 3400, q: 0.6 });
      break;
    case 'niva':
      melody(
        [
          [659, 0, 120],
          [880, 90, 120],
          [1109, 180, 120],
          [1319, 270, 300],
        ],
        t,
        { type: 'triangle', gain: 0.1 }
      );
      break;
    case 'svisch':
      noise(0.18, t, { gain: 0.05, from: 400, to: 3000, q: 0.7 });
      break;
    case 'seger':
      // Liten resefanfar: tonika, kvint, oktav och ett avslut.
      melody(
        [
          [523, 0, 200],
          [659, 160, 200],
          [784, 320, 200],
          [1047, 480, 420],
          [784, 480, 420],
          [1319, 900, 620],
        ],
        t,
        { type: 'triangle', gain: 0.1 }
      );
      break;
    case 'forlust':
      melody(
        [
          [440, 0, 260],
          [415, 220, 260],
          [392, 440, 260],
          [311, 660, 700],
        ],
        t,
        { type: 'sawtooth', gain: 0.07 }
      );
      break;
  }
}

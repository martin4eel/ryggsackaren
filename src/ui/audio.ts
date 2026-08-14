/**
 * Ljudeffekter syntetiseras med WebAudio – inga ljudfiler behövs, så spelet
 * förblir lika litet och fungerar offline. Ljudstyrningen följer
 * webbläsarnas regler: ljudkontexten skapas först vid en användargest
 * (första playSound-anropet sker alltid i en klick-hanterare).
 *
 * Avstängning sparas i localStorage och spegelas av högtalarikonen i HUD:en.
 */

export type Sound =
  /** Kort knappklick */
  | 'klick'
  /** Rätt svar – liten klang */
  | 'ratt'
  /** Fel svar – dämpad bas */
  | 'fel'
  /** Lön eller försäljning – kassaapparat */
  | 'kassa'
  /** Avresa – svep */
  | 'resa'
  /** Stämpel i kortet – dunk */
  | 'stampla'
  /** Certifikat och vinst – kort fanfar */
  | 'fanfar'
  /** Arkadmomentens plupp */
  | 'blipp';

const STORAGE_KEY = 'ryggsackaren-ljud';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'av';
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

/** Växlar ljudläge. Returnerar det nya läget (true = avstängt). */
export function toggleMuted(): boolean {
  muted = !muted;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? 'av' : 'på');
  } catch {
    // Privat surfning kan neka localStorage – då räcker minnesläget.
  }
  if (!muted) ensureCtx();
  return muted;
}

/**
 * Hämtar (eller skapar) ljudkontexten. Returnerar null när ljudet är av
 * eller när webbläsaren saknar WebAudio.
 */
function ensureCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
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
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.12, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

interface NoiseOpts {
  gain?: number;
  from?: number;
  to?: number;
}

/** Filtrerat vitt brus, t.ex. svepet vid avresa. */
function noise(dur: number, t0: number, opts: NoiseOpts = {}): void {
  if (!ctx || !master) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.1;
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

/** Spelar en effekt. Gör ingenting om ljudet är avstängt. */
export function playSound(name: Sound): void {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case 'klick':
      tone(1800, t, 0.05, { type: 'square', gain: 0.022 });
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
    case 'stampla':
      tone(120, t, 0.12, { gain: 0.2, slide: 60 });
      break;
    case 'resa':
      noise(0.6, t, { gain: 0.1 });
      break;
    case 'fanfar':
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, t + i * 0.1, 0.22, { type: 'triangle', gain: 0.11 })
      );
      break;
  }
}

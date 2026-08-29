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
  | 'forlust'
  /** Babbel ur luren när man kliver in i kiosken */
  | 'telefonbabbel'
  /** Mynt som ramlar ner i telefonautomaten */
  | 'myntinkast'
  /** Mamma eller pappa som tjatar i luren */
  | 'telefonrost'
  /** Ringsignalen i luren medan man väntar på svar */
  | 'telefonsignal'
  /** Upptagetton */
  | 'upptaget'
  /** Mamma svarar: ljus, snabb, orolig */
  | 'rostmamma'
  /** Pappa svarar: mörk, långsam, suckande */
  | 'rostpappa'
  /** Någon annan svarar, på ett språk du inte kan */
  | 'rostframmande'
  /** Den stora foten: dunsen när den landar */
  | 'fotdunk'
  /** Pruttljudet som hör till foten */
  | 'prutt'
  /** Motivet på bilden jublar */
  | 'jubel'
  /** Tågvissla vid avgång */
  | 'tagvissla'
  /** Bussmotor som drar igång */
  | 'bussmotor'
  /** Fartygstuta när färjan lägger ut */
  | 'skeppstuta'
  /** Sorl och prat på en marknad */
  | 'marknad'
  /** Applåder, vid certifikat */
  | 'applad';

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
    /**
     * Inget sparat val betyder fullt ljud. Kontrollen måste stå först:
     * Number(null) är 0, så utan den föll varje ny spelare rakt ner i
     * "ljud av" och fick ett helt tyst spel utan att ha valt det.
     */
    if (raw === null) return 2;
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
  /**
   * Huvudvolymen sätts på kontexten som redan finns, inte via ensureCtx():
   * den returnerar null när ljudet är av, och då nollades aldrig volymen.
   * Mattor som redan gick - stationen, regnet - fortsatte i gamla nivån.
   */
  if (ctx && master) master.gain.setValueAtTime(LEVEL_GAIN[level], ctx.currentTime);
  if (level === 0) {
    stopStation(true);
  } else {
    /**
     * Slog spelaren på ljudet medan hen stod på en station fanns ingen
     * ljudkontext att bygga mattan i när stationen öppnades. Den startas
     * därför om här, annars förblir stationen tyst tills man gått ut och in.
     */
    if (onskadStation && !aktivStation) startStation(onskadStation);
  }
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

/**
 * Butiksrösten. Handlaren i souvenirbutiken är den enda i spelet som talar
 * med en inspelad röst i stället för oscillatorer: tre repliker, inspelade
 * och sedan körda genom telefonlinjen i `scripts/rosteffekt.py`, så att de
 * hörs som prat utan att gå att uppfatta. Det som sägs står ändå i texten.
 *
 * Filerna hämtas först när någon går in i en butik, och en gång per sida -
 * spelet ska fortfarande starta utan att ladda ljud.
 */
const ROSTER: Record<1 | 2, string[]> = {
  1: ['./ljud/handlare-a-1.m4a', './ljud/handlare-a-2.m4a', './ljud/handlare-a-3.m4a'],
  2: ['./ljud/handlare-b-1.m4a', './ljud/handlare-b-2.m4a', './ljud/handlare-b-3.m4a'],
};
const rostbuffert = new Map<string, AudioBuffer>();
let rostSpelas: AudioBufferSourceNode | null = null;

async function hamtaRost(c: AudioContext, url: string): Promise<AudioBuffer | null> {
  const redan = rostbuffert.get(url);
  if (redan) return redan;
  try {
    const svar = await fetch(url);
    if (!svar.ok) return null;
    const buf = await c.decodeAudioData(await svar.arrayBuffer());
    rostbuffert.set(url, buf);
    return buf;
  } catch {
    // Utan nät och utan cache står handlaren bara och ler.
    return null;
  }
}

/**
 * Låter handlaren säga något. `nyckel` avgör vilken av rösterna det blir, så
 * att samma vara låter likadant medan man står i butiken, `uppsattning`
 * vilken av de två handlarna som talar - de har olika röster, och den andra
 * låter som en gammal telefonlur - och `plats` ser till att tre varor på
 * hyllan får tre olika repliker.
 */
export function playHandlare(nyckel: string, uppsattning: 1 | 2 = 1, plats = 0): void {
  const c = ensureCtx();
  if (!c || !master) return;
  let summa = 0;
  for (let i = 0; i < nyckel.length; i++) summa = (summa * 31 + nyckel.charCodeAt(i)) >>> 0;
  const lista = ROSTER[uppsattning];
  /*
   * `plats` är varans hyllplats. Med tre repliker och tre varor ger stegen
   * ett garanterat unikt ljud per vara - hashen ensam kunde ge samma replik
   * åt två föremål i samma butik, vilket lät som ett fel.
   */
  const url = lista[(summa + plats) % lista.length]!;
  void hamtaRost(c, url).then((buf) => {
    if (!buf || !ctx || !master) return;
    // En replik i taget: två handlare som pratar i mun på varandra är en av
    // få saker som är värre än ingen handlare alls.
    rostSpelas?.stop();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    // Liten variation i tempo, så att det inte blir samma inspelning varje gång.
    src.playbackRate.value = 0.96 + ((summa >>> 8) % 9) * 0.02;
    const g = ctx.createGain();
    /*
     * Handlaren ska höras genom rummet, inte i örat. Spelets syntetiska ljud
     * ligger på 0,02-0,10 och varar tiondelar av en sekund; en normaliserad
     * röst som pratar i tre sekunder upplevs mycket starkare vid samma
     * siffra. Den andra uppsättningen är dessutom bandpassad och överstyrd,
     * vilket lyfter den ytterligare - därför något lägre.
     */
    g.gain.value = uppsattning === 2 ? 0.1 : 0.12;
    src.connect(g);
    g.connect(master);
    src.start();
    rostSpelas = src;
    src.onended = () => {
      if (rostSpelas === src) rostSpelas = null;
    };
  });
}

/** Tystar handlaren, till exempel när man lämnar butiken. */
export function stopHandlare(): void {
  rostSpelas?.stop();
  rostSpelas = null;
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

/**
 * En stavelse ur en syntetisk röst.
 *
 * Rösten byggs av en sågtandston genom två bandpassfilter som sitter på
 * vokalernas formantfrekvenser. Det är samma knep som gav Animal Crossing och
 * Banjo-Kazooie sitt pladder: örat hör en röst utan att ett enda ord uttalas.
 * Hela härligheten går sedan genom ett smalt bandpass kring 1 700 Hz, vilket
 * är telefonlinjens frekvensomfång och det som gör att det låter som en lur.
 */
interface Formant {
  f1: number;
  f2: number;
}

/** Ungefärliga formantpar för några vokaler. */
const VOKALER: Formant[] = [
  { f1: 700, f2: 1200 }, // a
  { f1: 400, f2: 2000 }, // e
  { f1: 300, f2: 2300 }, // i
  { f1: 500, f2: 900 }, // o
  { f1: 350, f2: 800 }, // u
];

function stavelse(
  t0: number,
  dur: number,
  pitch: number,
  vokal: Formant,
  gain: number,
  /** Vart rösten ska - luren, högtalaren eller rakt ut. */
  dest?: AudioNode
): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(pitch, t0);
  // Liten tonhöjdsrörelse inom stavelsen gör den levande i stället för platt.
  osc.frequency.linearRampToValueAtTime(pitch * 1.06, t0 + dur * 0.4);
  osc.frequency.linearRampToValueAtTime(pitch * 0.94, t0 + dur);

  const bygg = (freq: number, q: number) => {
    const f = ctx!.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t0);
    f.Q.value = q;
    return f;
  };
  /**
   * Formanterna måste ligga PARALLELLT, inte i serie. Två smala bandpass
   * efter varandra på 300 och 2 300 Hz släpper igenom snittet av sina band,
   * vilket är så gott som ingenting - rösten hördes bara tack vare läckage
   * genom filtrens flanker. Parallellt summeras i stället två resonanser,
   * vilket är hur en vokal faktiskt låter.
   */
  const f1 = bygg(vokal.f1, 6);
  const f2 = bygg(vokal.f2, 8);
  const summa = ctx.createGain();
  summa.gain.value = 1;
  osc.connect(f1).connect(summa);
  // Den andra formanten är svagare än den första, som i en riktig röst.
  const f2niva = ctx.createGain();
  f2niva.gain.value = 0.6;
  osc.connect(f2).connect(f2niva).connect(summa);

  // Telefonlurens smala band: allt under 300 och över 3 400 Hz försvinner.
  const lur = bygg(1700, 0.9);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.setValueAtTime(gain, t0 + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  summa.connect(lur).connect(g).connect(dest ?? master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/**
 * En replik i luren. Antalet stavelser och tonfallet avgör om det låter som
 * en fråga eller som en utskällning.
 */
function replik(
  t0: number,
  stavelser: number,
  bas: number,
  gain = 0.09,
  /** Över 1 ger längre, mer mumlande stavelser. */
  tempo = 1,
  dest?: AudioNode
): void {
  let t = t0;
  for (let i = 0; i < stavelser; i++) {
    const dur = (0.1 + Math.random() * 0.07) * tempo;
    // Tonfallet sjunker mot slutet, som i ett påstående på svenska.
    const lage = bas * (1 - (i / stavelser) * 0.18 + (Math.random() - 0.5) * 0.06);
    const vokal = VOKALER[Math.floor(Math.random() * VOKALER.length)]!;
    stavelse(t, dur, lage, vokal, gain, dest);
    t += dur + (0.02 + Math.random() * 0.03) * tempo;
  }
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
      // En varm liten klocka: två toner uppåt, mjuk attack, kort efterklang.
      tone(784, t, 0.14, { type: 'triangle', gain: 0.1, attack: 0.01 });
      tone(1175, t + 0.1, 0.26, { type: 'triangle', gain: 0.1, attack: 0.01 });
      tone(2350, t + 0.1, 0.18, { type: 'sine', gain: 0.03 });
      break;
    case 'fel':
      // Ett dovt "bonk": två toner nedåt, rundat, inte surrande.
      tone(233, t, 0.16, { type: 'triangle', gain: 0.1, attack: 0.005 });
      tone(165, t + 0.13, 0.28, { type: 'triangle', gain: 0.09, slide: 140 });
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
    case 'telefonbabbel':
      /**
       * Någon babblar redan i luren när man kliver in. Tre röster i olika
       * tonlägen som överlappar varandra, långsammare och tystare än
       * tjatrösten, så att det låter som ett samtal man kommit in mitt i i
       * stället för att någon talar till en.
       */
      replik(t, 6, 210, 0.075, 1.5);
      replik(t + 0.35, 5, 300, 0.055, 1.7);
      replik(t + 0.8, 5, 175, 0.065, 1.4);
      replik(t + 1.5, 4, 240, 0.06, 1.6);
      break;
    case 'myntinkast':
      // Myntet studsar ner genom automaten.
      [0, 0.07, 0.13, 0.2].forEach((d, i) =>
        tone(2600 - i * 300, t + d, 0.06, {
          type: 'triangle',
          gain: 0.06 - i * 0.012,
        })
      );
      break;
    case 'telefonrost':
      // Mamma hinner med en hel harang innan du får ett ord med i laget.
      replik(t, 7, 260);
      replik(t + 1.15, 5, 240);
      break;
    case 'telefonsignal':
      // Svensk ringsignal i luren: 425 Hz, en sekund på, en tystnad.
      tone(425, t, 0.9, { type: 'sine', gain: 0.07, attack: 0.02 });
      tone(425 * 1.004, t, 0.9, { type: 'sine', gain: 0.03, attack: 0.02 });
      break;
    case 'upptaget':
      // Upptagetton: korta 425 Hz-pip i jämn takt.
      [0, 0.5, 1.0, 1.5].forEach((d) =>
        tone(425, t + d, 0.25, { type: 'sine', gain: 0.07, attack: 0.01 })
      );
      break;
    case 'rostmamma':
      /**
       * Mamma: ljust läge, snabb takt och lång harang - orolig och glad på
       * samma gång. Andra repliken går upp på slutet, som en fråga.
       */
      replik(t, 9, 290, 0.09, 0.85);
      replik(t + 1.25, 6, 310, 0.09, 0.9);
      replik(t + 2.2, 4, 330, 0.085, 0.95);
      break;
    case 'rostpappa':
      /**
       * Pappa: djupt läge, långsamma stavelser, en suck emellan. Tempot över
       * ett gör stavelserna längre och mer mumlande.
       */
      replik(t, 3, 118, 0.1, 1.6);
      noise(0.45, t + 0.9, { gain: 0.03, from: 700, to: 300, q: 0.8 });
      replik(t + 1.5, 6, 112, 0.1, 1.5);
      break;
    case 'rostframmande':
      // Någon annan, snabbt och ivrigt. Alldeles för många stavelser.
      replik(t, 12, 230, 0.085, 0.7);
      replik(t + 1.4, 8, 250, 0.08, 0.65);
      break;
    case 'fotdunk':
      // Den stora foten landar: en dov duns med stenar som rasslar.
      tone(70, t, 0.3, { type: 'sine', gain: 0.22, slide: 30, attack: 0.005 });
      noise(0.2, t, { gain: 0.09, from: 900, to: 150, q: 0.7 });
      break;
    case 'prutt':
      // Det klassiska pruttljudet: en sågtand som flaxar nedåt i tonhöjd.
      tone(150, t, 0.42, { type: 'sawtooth', gain: 0.09, slide: 55, attack: 0.01 });
      tone(76, t, 0.42, { type: 'square', gain: 0.04, slide: 28, attack: 0.01 });
      noise(0.4, t, { gain: 0.03, from: 500, to: 200, q: 0.5 });
      break;
    case 'jubel':
      // Ett litet hurra ur motivets mun: två glada stavelser som går uppåt.
      stavelse(t, 0.14, 330, VOKALER[3]!, 0.09);
      stavelse(t + 0.16, 0.22, 420, VOKALER[0]!, 0.1);
      break;
    case 'tagvissla':
      // Två toner i kvint, som ett riktigt tåghorn.
      tone(660, t, 0.7, { type: 'sawtooth', gain: 0.05, attack: 0.08 });
      tone(990, t, 0.7, { type: 'sawtooth', gain: 0.04, attack: 0.08 });
      noise(0.5, t + 0.5, { gain: 0.04, from: 800, to: 200, q: 0.6 });
      break;
    case 'bussmotor':
      // Dieselmotorn drar igång och går upp i varv.
      tone(58, t, 1.1, { type: 'sawtooth', gain: 0.08, slide: 96, attack: 0.15 });
      tone(116, t, 1.1, { type: 'square', gain: 0.03, slide: 192, attack: 0.2 });
      noise(1.0, t, { gain: 0.03, from: 200, to: 500, q: 0.8 });
      break;
    case 'skeppstuta':
      // Djup fartygstuta som ekar ut över hamnen.
      tone(110, t, 1.4, { type: 'sawtooth', gain: 0.09, attack: 0.2 });
      tone(165, t, 1.4, { type: 'sawtooth', gain: 0.05, attack: 0.25 });
      break;
    case 'marknad':
      // Sorl: flera röster i olika tonlägen, dämpade och överlappande.
      replik(t, 5, 200, 0.05, 1.3);
      replik(t + 0.25, 5, 320, 0.038, 1.4);
      replik(t + 0.5, 4, 150, 0.045, 1.2);
      replik(t + 0.95, 4, 260, 0.04, 1.3);
      break;
    case 'applad':
      // Klapper av filtrerat brus i avtagande täthet.
      for (let i = 0; i < 26; i++) {
        noise(0.05, t + Math.random() * 1.1, {
          gain: 0.035,
          from: 1200 + Math.random() * 1800,
          to: 600,
          q: 1.4,
        });
      }
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

// ------------------------------------------------------------- stationsljud

/**
 * Stationernas ljudbild.
 *
 * En avgångstavla som är tyst är en tabell. Det som gör skillnaden mellan en
 * meny och en flygplats är att det låter runtomkring: sorl, rullväskor, ett
 * utrop i högtalaren som ingen hör orden i.
 *
 * Ljudet byggs i två lager. Underst en matta som ligger och går så länge man
 * står kvar - sorlet, motorljudet, vågorna. Ovanpå den enstaka händelser som
 * slår till med några sekunders mellanrum och aldrig låter exakt likadant två
 * gånger, eftersom både tidpunkt, tonhöjd och längd lottas.
 *
 * Ingen musik. Det är miljön som ska höras.
 */

export type StationKind = 'flyg' | 'tag' | 'buss' | 'farja';

/** Ett enda brusbuffert-objekt som alla loopar delar på. */
let brusbuffert: AudioBuffer | null = null;

function loopbuffert(c: AudioContext): AudioBuffer {
  if (brusbuffert) return brusbuffert;
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  // Brunt brus: integrerat vitt brus, mjukare och mer likt rumston.
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  brusbuffert = buf;
  return buf;
}

/**
 * En efterklang som räcker för en stationshall. Ingen faltning, bara en kort
 * återkopplad fördröjning - det är billigt och örat hör ändå ett rum.
 */
function hall(c: AudioContext, dest: AudioNode, tid = 0.19, aterkoppling = 0.3) {
  const delay = c.createDelay(1);
  delay.delayTime.value = tid;
  const fb = c.createGain();
  fb.gain.value = aterkoppling;
  const dampning = c.createBiquadFilter();
  dampning.type = 'lowpass';
  dampning.frequency.value = 2200;
  delay.connect(dampning).connect(fb).connect(delay);
  delay.connect(dest);
  return delay;
}

interface Lager {
  noder: AudioNode[];
  kallor: AudioBufferSourceNode[];
  oscar: OscillatorNode[];
}

/** Loopande, filtrerat brus - grunden i varje stationsmatta. */
function matta(
  c: AudioContext,
  ut: AudioNode,
  lager: Lager,
  opts: {
    typ?: BiquadFilterType;
    frekvens: number;
    q?: number;
    gain: number;
    /** Långsam vaggning av filtret, i hertz. Ger vågor och vindbyar. */
    svaj?: { hz: number; djup: number };
  }
): void {
  const src = c.createBufferSource();
  src.buffer = loopbuffert(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = opts.typ ?? 'lowpass';
  filter.frequency.value = opts.frekvens;
  filter.Q.value = opts.q ?? 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(opts.gain, c.currentTime + 1.2);
  src.connect(filter).connect(g).connect(ut);
  src.start();
  lager.kallor.push(src);
  lager.noder.push(filter, g);

  if (opts.svaj) {
    const lfo = c.createOscillator();
    lfo.frequency.value = opts.svaj.hz;
    const lfoGain = c.createGain();
    lfoGain.gain.value = opts.svaj.djup;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    lager.oscar.push(lfo);
    lager.noder.push(lfoGain);
  }
}

/** Låg, brummande motor: dieselbuss, fartygsmaskin, avlägsen jetmotor. */
function motor(
  c: AudioContext,
  ut: AudioNode,
  lager: Lager,
  grundton: number,
  gain: number,
  svaj = 0.6
): void {
  for (const [mult, niva] of [
    [1, 1],
    [2.01, 0.5],
    [3.02, 0.22],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = grundton * mult;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(gain * niva, c.currentTime + 1.5);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    osc.connect(lp).connect(g).connect(ut);
    osc.start();
    lager.oscar.push(osc);
    lager.noder.push(g, lp);
  }
  // Varvtalet vandrar långsamt, annars låter motorn som en synt.
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoGain = c.createGain();
  lfoGain.gain.value = svaj;
  lfo.connect(lfoGain);
  for (const osc of lager.oscar) lfoGain.connect(osc.frequency);
  lfo.start();
  lager.oscar.push(lfo);
  lager.noder.push(lfoGain);
}

let aktivStation: {
  kind: StationKind;
  lager: Lager;
  ut: GainNode;
  timer: number;
} | null = null;

/** Vilken station spelaren står på, även när ljudet råkar vara avstängt. */
let onskadStation: StationKind | null = null;

/** Högtalarutrop: pling-plong och sedan ett obegripligt meddelande. */
function utrop(kind: StationKind): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + 0.05;
  const rum = hall(c, master, kind === 'flyg' ? 0.24 : 0.3, 0.34);
  const buss = c.createGain();
  buss.gain.value = 0.9;
  buss.connect(master);
  buss.connect(rum);

  // Signalen före utropet. Flyget har sitt bing-bong, tåget en tretonsslinga.
  const signal: Array<[number, number]> =
    kind === 'flyg'
      ? [[987.77, 0], [739.99, 0.28]]
      : kind === 'tag'
        ? [[659.25, 0], [880, 0.16], [1174.66, 0.32]]
        : [[880, 0], [659.25, 0.22]];
  for (const [f, at] of signal) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0 + at);
    g.gain.linearRampToValueAtTime(0.09, t0 + at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.55);
    osc.connect(g).connect(buss);
    osc.start(t0 + at);
    osc.stop(t0 + at + 0.6);
  }

  /**
   * Själva meddelandet går genom ett smalt band kring 1 400 Hz, vilket är vad
   * en takhögtalare släpper igenom. Man ska höra att någon säger något, och
   * inte en stavelse av vad.
   */
  const horn = c.createBiquadFilter();
  horn.type = 'bandpass';
  horn.frequency.value = 1400;
  horn.Q.value = 1.4;
  const rost = c.createGain();
  rost.gain.value = 0.75;
  horn.connect(rost).connect(buss);
  const bas = 150 + Math.random() * 70;
  const stavelser = 9 + Math.floor(Math.random() * 9);
  replik(t0 + 0.9, stavelser, bas, 0.075, 1.15, horn);
}

/** En enskild stationshändelse. Vilken lottas ur stationens egen lista. */
function stationsHandelse(kind: StationKind): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t = c.currentTime + 0.02;
  const r = Math.random();

  if (kind === 'flyg') {
    if (r < 0.28) return utrop('flyg');
    if (r < 0.5) {
      // Rullväska: ett dovt muller med hjulskarvar i.
      const dur = 1.4 + Math.random() * 1.4;
      noise(dur, t, { gain: 0.05, from: 260, to: 150, q: 0.8, type: 'lowpass' });
      for (let i = 0; i < 7; i++) {
        noise(0.03, t + i * (dur / 7) + Math.random() * 0.05, {
          gain: 0.025,
          from: 1800,
          to: 900,
          q: 2,
        });
      }
      return;
    }
    if (r < 0.68) {
      // Boardingpiper vid gaten.
      for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
        tone(2093, t + i * 0.22, 0.09, { type: 'square', gain: 0.035 });
      }
      return;
    }
    // Ett plan som drar förbi längre bort.
    noise(3.4, t, { gain: 0.055, from: 420, to: 1100, q: 0.6, type: 'bandpass' });
    tone(96, t, 3.4, { type: 'sawtooth', gain: 0.02, slide: 128 });
    return;
  }

  if (kind === 'tag') {
    if (r < 0.24) return utrop('tag');
    if (r < 0.45) {
      // Bromsar: metallisk gnissling som klingar av.
      const bas = 1500 + Math.random() * 900;
      tone(bas, t, 1.9, { type: 'sine', gain: 0.035, slide: bas * 0.45 });
      tone(bas * 1.5, t + 0.1, 1.5, { type: 'sine', gain: 0.018, slide: bas * 0.6 });
      noise(2.1, t, { gain: 0.035, from: 900, to: 260, q: 1.2 });
      return;
    }
    if (r < 0.66) {
      // Dörrsignalen: tre pip och ett dovt slag när dörren går igen.
      for (let i = 0; i < 3; i++) {
        tone(1046, t + i * 0.24, 0.11, { type: 'square', gain: 0.04 });
      }
      noise(0.18, t + 0.85, { gain: 0.06, from: 320, to: 120, q: 0.9, type: 'lowpass' });
      return;
    }
    if (r < 0.85) {
      // Hjul över skarvarna, allt glesare när tåget rullar iväg.
      let dt = 0;
      for (let i = 0; i < 14; i++) {
        noise(0.05, t + dt, { gain: 0.045, from: 420, to: 180, q: 1.4 });
        dt += 0.12 + i * 0.012;
      }
      return;
    }
    tone(880, t, 0.7, { type: 'sawtooth', gain: 0.045, slide: 1320 });
    return;
  }

  if (kind === 'buss') {
    if (r < 0.22) return utrop('buss');
    if (r < 0.48) {
      // Tryckluftsbroms.
      noise(0.9, t, { gain: 0.08, from: 3200, to: 900, q: 0.8, type: 'highpass' });
      return;
    }
    if (r < 0.7) {
      // Dörren viker upp sig och slår igen.
      noise(0.55, t, { gain: 0.05, from: 2400, to: 1200, q: 1 });
      noise(0.14, t + 0.75, { gain: 0.07, from: 300, to: 110, q: 0.9, type: 'lowpass' });
      return;
    }
    if (r < 0.88) {
      // Någon gasar ut från läget.
      tone(58, t, 2.2, { type: 'sawtooth', gain: 0.05, slide: 104 });
      noise(2.2, t, { gain: 0.03, from: 260, to: 520, q: 0.7, type: 'lowpass' });
      return;
    }
    tone(392, t, 0.3, { type: 'square', gain: 0.03 });
    return;
  }

  // Hamnen
  if (r < 0.2) return utrop('farja');
  if (r < 0.4) {
    // Mistlur: två toner i kvint, långa och dova.
    tone(104, t, 2.6, { type: 'sawtooth', gain: 0.07 });
    tone(156, t + 0.06, 2.4, { type: 'sawtooth', gain: 0.045 });
    noise(2.6, t, { gain: 0.02, from: 180, to: 90, q: 0.6, type: 'lowpass' });
    return;
  }
  if (r < 0.62) {
    // Trut. Tonhöjden vaggar, annars låter det som en visselpipa.
    const bas = 1400 + Math.random() * 500;
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      tone(bas, t + i * 0.34, 0.26, { type: 'sawtooth', gain: 0.028, slide: bas * 1.5 });
    }
    return;
  }
  if (r < 0.84) {
    // En våg som slår i kajen.
    noise(1.5, t, { gain: 0.06, from: 900, to: 260, q: 0.6, type: 'lowpass' });
    return;
  }
  // Kätting och landgång.
  for (let i = 0; i < 5; i++) {
    noise(0.06, t + i * 0.13, { gain: 0.03, from: 2600, to: 1400, q: 2.5 });
  }
}

/**
 * Startar stationens ljudmatta. Anropas när en station öppnas och byts ut om
 * spelaren går direkt från en station till en annan.
 */
export function startStation(kind: StationKind): void {
  onskadStation = kind;
  if (aktivStation?.kind === kind) return;
  stopStation(true);
  const c = ensureCtx();
  if (!c || !master) return;

  const ut = c.createGain();
  ut.gain.value = 1;
  ut.connect(master);
  const lager: Lager = { noder: [ut], kallor: [], oscar: [] };
  const rum = hall(c, ut, kind === 'farja' ? 0.14 : 0.26, kind === 'farja' ? 0.16 : 0.32);
  const hallbuss = c.createGain();
  hallbuss.gain.value = 0.5;
  hallbuss.connect(rum);
  lager.noder.push(hallbuss);

  if (kind === 'flyg') {
    // Sorl i en hög hall, plus ventilation och en avlägsen jetmotor.
    matta(c, hallbuss, lager, { frekvens: 620, gain: 0.075, svaj: { hz: 0.07, djup: 180 } });
    matta(c, ut, lager, { frekvens: 180, gain: 0.05 });
    matta(c, ut, lager, { typ: 'bandpass', frekvens: 2400, q: 0.9, gain: 0.012 });
    motor(c, ut, lager, 41, 0.012, 0.4);
  } else if (kind === 'tag') {
    // Lägre tak, hårdare ytor: mer eko och ett svagt rälsbrum.
    matta(c, hallbuss, lager, { frekvens: 720, gain: 0.07, svaj: { hz: 0.05, djup: 220 } });
    matta(c, ut, lager, { frekvens: 140, gain: 0.055 });
    motor(c, ut, lager, 33, 0.01, 0.3);
  } else if (kind === 'buss') {
    // Utomhus: trafik, tomgång och betydligt mindre eko.
    matta(c, ut, lager, { frekvens: 480, gain: 0.055, svaj: { hz: 0.11, djup: 150 } });
    matta(c, ut, lager, { frekvens: 220, gain: 0.05 });
    motor(c, ut, lager, 47, 0.026, 1.1);
  } else {
    // Vatten och vind, och en fartygsmaskin som går på tomgång vid kaj.
    matta(c, ut, lager, {
      typ: 'lowpass',
      frekvens: 700,
      gain: 0.085,
      svaj: { hz: 0.13, djup: 380 },
    });
    matta(c, ut, lager, {
      typ: 'bandpass',
      frekvens: 900,
      q: 0.5,
      gain: 0.035,
      svaj: { hz: 0.06, djup: 500 },
    });
    motor(c, ut, lager, 28, 0.02, 0.5);
  }

  /**
   * Händelserna kommer oregelbundet. Ett fast intervall hörs som ett mönster
   * efter ett par varv, och då är illusionen borta.
   */
  const schemalagg = (forsta = false): number =>
    window.setTimeout(
      () => {
        if (!aktivStation || aktivStation.kind !== kind) return;
        stationsHandelse(kind);
        aktivStation.timer = schemalagg();
      },
      // Det första ljudet kommer med en gång. Annars står spelaren i tio
      // sekunders tystnad och hinner tro att stationen är stum.
      forsta ? 700 : 2500 + Math.random() * 7000
    );

  aktivStation = { kind, lager, ut, timer: 0 };
  aktivStation.timer = schemalagg(true);
}

/** Tystar stationen. Mattan tonas ut i stället för att klippas. */
export function stopStation(byte = false): void {
  if (!byte) onskadStation = null;
  const s = aktivStation;
  if (!s) return;
  aktivStation = null;
  window.clearTimeout(s.timer);
  const c = ctx;
  if (!c) return;
  const t = c.currentTime;
  s.ut.gain.cancelScheduledValues(t);
  s.ut.gain.setValueAtTime(s.ut.gain.value, t);
  s.ut.gain.linearRampToValueAtTime(0, t + 0.45);
  window.setTimeout(() => {
    for (const osc of s.lager.oscar) {
      try {
        osc.stop();
      } catch {
        // redan stoppad
      }
    }
    for (const k of s.lager.kallor) {
      try {
        k.stop();
      } catch {
        // redan stoppad
      }
    }
    for (const n of s.lager.noder) n.disconnect();
  }, 600);
}

/** Enstaka ljud som hör till tavlan snarare än till hallen. */
export function playStation(kind: StationKind, what: 'tavla' | 'utrop'): void {
  const c = ensureCtx();
  if (!c) return;
  if (what === 'utrop') {
    utrop(kind);
    return;
  }
  // Tavlan som bläddrar: en handfull torra klick, som en fallbladstavla.
  const t = c.currentTime;
  for (let i = 0; i < 5 + Math.floor(Math.random() * 6); i++) {
    noise(0.022, t + i * 0.028 + Math.random() * 0.01, {
      gain: 0.03,
      from: 2600,
      to: 1500,
      q: 3,
    });
  }
}

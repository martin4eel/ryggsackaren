import type { GameState } from '../game/state';

/**
 * Stämplar i passet. De delas ut när något minnesvärt hänt och fungerar som
 * resans egna mål vid sidan av poängen: de flesta går att jaga medvetet, men
 * ingen är nödvändig för att komma hem.
 *
 * Varje stämpel prövas efter varje förändring i spelet. `test` måste därför
 * vara billig att köra och får aldrig ändra på tillståndet.
 */
export interface Stamp {
  id: string;
  name: string;
  /** Vad som krävdes, visas i passet */
  desc: string;
  /** Kort tecken som ritas i stämpeln */
  glyph: string;
  /**
   * Mästarstämplarna för löneklass 3 är större och trycks i guld; sigillet
   * för alla sex är rött lack. Vanliga stämplar saknar fältet.
   */
  tier?: 'guld' | 'sigill';
  test: (state: GameState) => boolean;
}

const MASTARE: Array<{ id: string; huvud: string; name: string; desc: string; glyph: string }> = [
  { id: 'mastare-vetenskap', huvud: 'vetenskap', name: 'Mästare: Vetenskap & historia', desc: 'Nå tre poäng i Vetenskap & historia - löneklass 3 är öppen.', glyph: '⚗' },
  { id: 'mastare-konst', huvud: 'konst', name: 'Mästare: Konst & kultur', desc: 'Nå tre poäng i Konst & kultur - löneklass 3 är öppen.', glyph: '♫' },
  { id: 'mastare-praktiskt', huvud: 'praktiskt', name: 'Mästare: Praktiska yrken', desc: 'Nå tre poäng i Praktiska yrken - löneklass 3 är öppen.', glyph: '⚒' },
  { id: 'mastare-aventyr', huvud: 'aventyr', name: 'Mästare: Äventyr & natur', desc: 'Nå tre poäng i Äventyr & natur - löneklass 3 är öppen.', glyph: '⛰' },
  { id: 'mastare-sport', huvud: 'sport', name: 'Mästare: Sport & fritid', desc: 'Nå tre poäng i Sport & fritid - löneklass 3 är öppen.', glyph: '⚽' },
  { id: 'mastare-mat', huvud: 'mat', name: 'Mästare: Mat & dryck', desc: 'Nå tre poäng i Mat & dryck - löneklass 3 är öppen.', glyph: '♨' },
];

const regionsVisited = (state: GameState, cityRegion: (id: string) => string | undefined) =>
  new Set(state.visited.map(cityRegion).filter(Boolean));

/**
 * Regionuppslaget skickas in i stället för att importeras, så att den här
 * filen inte drar in hela stadslistan och kan användas av valideringen.
 */
export function buildStamps(cityRegion: (id: string) => string | undefined): Stamp[] {
  return [
    {
      id: 'forsta-lonen',
      name: 'Första lönen',
      desc: 'Genomför ett helt arbetsskift.',
      glyph: '✱',
      test: (s) => s.shiftsWorked >= 1,
    },
    {
      id: 'certifierad',
      name: 'Certifierad',
      desc: 'Ta ditt första certifikat.',
      glyph: '✓',
      test: (s) => Object.values(s.certificates).some((n) => (n ?? 0) > 0),
    },
    {
      id: 'toppbetyg',
      name: 'Toppbetyg',
      desc: 'Få 100 på turistbyråns prov.',
      glyph: '100',
      test: (s) => Object.values(s.progress).some((p) => p.rating >= 100),
    },
    {
      id: 'fem-stader',
      name: 'Fem stämplar',
      desc: 'Besök fem olika städer.',
      glyph: '5',
      test: (s) => new Set(s.visited).size >= 5,
    },
    {
      id: 'tio-stader',
      name: 'Tio stämplar',
      desc: 'Besök tio olika städer.',
      glyph: '10',
      test: (s) => new Set(s.visited).size >= 10,
    },
    {
      id: 'fyra-kontinenter',
      name: 'Fyra kontinenter',
      desc: 'Sätt din fot i fyra av världens regioner.',
      glyph: '◴',
      test: (s) => regionsVisited(s, cityRegion).size >= 4,
    },
    {
      id: 'jorden-runt',
      name: 'Jorden runt',
      desc: 'Besök samtliga åtta regioner på en och samma resa.',
      glyph: '⊕',
      test: (s) => regionsVisited(s, cityRegion).size >= 8,
    },
    {
      id: 'klimatbonus',
      name: 'Klimatbonus',
      desc: 'Ta tåget minst fem gånger på samma resa.',
      glyph: '☘',
      test: (s) => (s.tripsByMode.tag ?? 0) >= 5,
    },
    {
      id: 'markresenar',
      name: 'Markresenär',
      desc: 'Res mer än halva sträckan på marken i stället för i luften.',
      glyph: '⇉',
      test: (s) => {
        const mark =
          (s.kmByMode.tag ?? 0) + (s.kmByMode.buss ?? 0) + (s.kmByMode.farja ?? 0);
        const luft = s.kmByMode.flyg ?? 0;
        // Kräver en resa av någon längd, annars räcker en bussresa i Norden.
        return mark + luft >= 8000 && mark > luft;
      },
    },
    {
      id: 'langflygare',
      name: 'Långflygare',
      desc: 'Res 50 000 kilometer.',
      glyph: '✈',
      test: (s) => s.distance >= 50000,
    },
    {
      id: 'handelsresande',
      // Kort namn med flit: stämpeln är 104 px bred, och ett långt
      // sammansatt ord måste avstavas mitt itu för att rymmas.
      name: 'Handelsman',
      desc: 'Gör minst 500 i vinst på en enda souvenir.',
      glyph: '⇄',
      test: (s) => s.bestTrade >= 500,
    },
    {
      id: 'tio-i-rad',
      name: 'Tio i rad',
      desc: 'Svara rätt tio gånger på raken.',
      glyph: '⚡',
      test: (s) => s.bestStreak >= 10,
    },
    {
      id: 'perfekt-skift',
      name: 'Perfekt skift',
      desc: 'Klara ett helt arbetsskift utan ett enda felsvar.',
      glyph: '★',
      test: (s) => s.perfectShifts >= 1,
    },
    {
      id: 'arkadmastare',
      name: 'Arkadmästare',
      desc: 'Klara ett arkadmoment felfritt.',
      glyph: '◆',
      test: (s) => s.perfectMinigames >= 1,
    },
    {
      id: 'valbargad',
      name: 'Välbärgad',
      desc: 'Ha 20 000 i kassan samtidigt.',
      glyph: '$',
      test: (s) => s.peakMoney >= 20000,
    },
    {
      id: 'skuldfri',
      name: 'Skuldfri',
      desc: 'Betala tillbaka allt du lånat hemifrån.',
      glyph: '✂',
      test: (s) => s.callsHome > 0 && s.debt === 0,
    },
    {
      id: 'egen-kraft',
      name: 'Egen kraft',
      desc: 'Besök fem städer utan att ringa hem en enda gång.',
      glyph: '♁',
      test: (s) => s.callsHome === 0 && new Set(s.visited).size >= 5,
    },
    {
      id: 'hederlig',
      name: 'Hederlig',
      desc: 'Bygg upp ett anseende på sex genom att göra rätt när det kostar.',
      glyph: '⚖',
      test: (s) => (s.rykte ?? 0) >= 6,
    },
    {
      id: 'okand',
      name: 'Ökänd',
      desc: 'Sjunk till ett anseende på minus fyra. Någon minns det.',
      glyph: '☠',
      test: (s) => (s.rykte ?? 0) <= -4,
    },
    /**
     * Mästarstämplarna: en per huvudkategori när tre poäng nåtts, i guld.
     * Och sigillet för den som nått dit i alla sex.
     */
    ...MASTARE.map((m) => ({
      id: m.id,
      name: m.name,
      desc: m.desc,
      glyph: m.glyph,
      tier: 'guld' as const,
      test: (s: GameState) => ((s.points as Record<string, number | undefined>)?.[m.huvud] ?? 0) >= 3,
    })),
    {
      id: 'allkonstnar',
      name: 'Allkonstnär',
      desc: 'Nå tre poäng i alla sex huvudkategorierna. Det finns inget jobb du inte får söka.',
      glyph: '★',
      tier: 'sigill',
      test: (s) => MASTARE.every((m) => ((s.points as Record<string, number | undefined>)?.[m.huvud] ?? 0) >= 3),
    },
  ];
}

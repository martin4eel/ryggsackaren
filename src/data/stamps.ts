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
  test: (state: GameState) => boolean;
}

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
  ];
}

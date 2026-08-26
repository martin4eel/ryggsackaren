/**
 * Resehändelser. En slumpad sak händer på ungefär var tredje resa, precis som
 * i förlagan där resan sällan gick helt enligt plan. Händelserna är små nog
 * att inte avgöra spelet men stora nog att märkas.
 *
 * `money` är i basenheter och `days` är extra dagar utöver biljettens restid.
 * Negativa dagar går inte att få: en resa kan inte bli kortare än biljetten.
 */
export interface TravelEvent {
  id: string;
  title: string;
  text: string;
  money: number;
  days: number;
  /** Hur ofta händelsen dyker upp i förhållande till de andra */
  weight: number;
  /** 'bra', 'daligt' eller 'blandat' – styr färgen på kortet */
  tone: 'bra' | 'daligt' | 'blandat';
}

export const TRAVEL_EVENTS: TravelEvent[] = [
  {
    id: 'sedel-i-fickan',
    title: 'Sedel i jackfickan',
    text: 'Du hittar en hopvikt sedel i innerfickan på jackan. Från förra resan, uppenbarligen.',
    money: 400,
    days: 0,
    weight: 3,
    tone: 'bra',
  },
  {
    id: 'overbokat',
    title: 'Överbokat flyg',
    text: 'Planet var överbokat och du tog nästa avgång mot ersättning. En dag senare, men med pengar på fickan.',
    money: 1100,
    days: 1,
    weight: 2,
    tone: 'blandat',
  },
  {
    id: 'ficktjuv',
    title: 'Ficktjuv i trängseln',
    text: 'Någon var snabbare än du på perrongen. Passet finns kvar, men inte allt annat.',
    money: -650,
    days: 0,
    weight: 3,
    tone: 'daligt',
  },
  {
    id: 'bagaget-forsvann',
    title: 'Bagaget kom inte fram',
    text: 'Ryggsäcken åkte vidare till fel världsdel. Du får vänta en dag och köpa det nödvändigaste.',
    money: -300,
    days: 1,
    weight: 2,
    tone: 'daligt',
  },
  {
    id: 'delad-taxi',
    title: 'Delad taxi',
    text: 'En annan ryggsäckare skulle åt samma håll och ni delade på notan från flygplatsen.',
    money: 250,
    days: 0,
    weight: 3,
    tone: 'bra',
  },
  {
    id: 'magsjuka',
    title: 'Något du åt',
    text: 'Gatuköket vid busstationen såg bättre ut än det var. Två dagar går åt i sängen.',
    money: -150,
    days: 2,
    weight: 2,
    tone: 'daligt',
  },
  {
    id: 'strejk',
    title: 'Strejk på flygplatsen',
    text: 'Marktjänsten lade ner arbetet i ett dygn. Ingen kom någonstans.',
    money: 0,
    days: 1,
    weight: 2,
    tone: 'daligt',
  },
  {
    id: 'vandrarhemmet-bjod',
    title: 'Vandrarhemmet bjöd',
    text: 'Du var hundrade gästen den här månaden och fick första natten på huset.',
    money: 300,
    days: 0,
    weight: 2,
    tone: 'bra',
  },
  {
    id: 'uppgraderad',
    title: 'Uppgraderad',
    text: 'Sista raden var full och du blev flyttad längst fram. Bättre mat, samma pris, och du kom fram utvilad.',
    money: 0,
    days: 0,
    weight: 2,
    tone: 'bra',
  },
  {
    id: 'genvag',
    title: 'Snabbare anslutning',
    text: 'Bytet gick fortare än tidtabellen lovade och du hann med ett tidigare tåg.',
    money: 120,
    days: 0,
    weight: 2,
    tone: 'bra',
  },
  {
    id: 'tullen',
    title: 'Tullen ville titta',
    text: 'Hela ryggsäcken plockades isär på ett bord. Inget hittades, men dagen gick.',
    money: 0,
    days: 1,
    weight: 2,
    tone: 'daligt',
  },
  {
    id: 'gatumusikant',
    title: 'Du fyllde i på gatan',
    text: 'En gatumusikant behövde någon som höll takten en kväll. Hatten delades lika.',
    money: 480,
    days: 0,
    weight: 2,
    tone: 'bra',
  },
  {
    id: 'regnperiod',
    title: 'Regnperioden började',
    text: 'Vägen till staden svämmade över och bussen fick vänta ut ovädret.',
    money: -80,
    days: 1,
    weight: 2,
    tone: 'daligt',
  },
  {
    id: 'vaxelkurs',
    title: 'Bra dag på växlingskontoret',
    text: 'Kursen stod ovanligt bra just den morgonen och du växlade allt på en gång.',
    money: 520,
    days: 0,
    weight: 2,
    tone: 'bra',
  },
  {
    id: 'dyrt-rum',
    title: 'Allt var fullbokat',
    text: 'Stan hade festival och det enda lediga rummet kostade tre gånger så mycket.',
    money: -420,
    days: 0,
    weight: 3,
    tone: 'daligt',
  },
];

/** Väljer en händelse slumpmässigt enligt vikterna. */
export function pickTravelEvent(): TravelEvent {
  const total = TRAVEL_EVENTS.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const event of TRAVEL_EVENTS) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return TRAVEL_EVENTS[0]!;
}

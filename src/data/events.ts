import type { Category } from './types';

/**
 * Händelser.
 *
 * Förut hände något bara på resan, det var alltid en siffra som ändrade sig,
 * och spelaren hade inget att säga till om. Nu kan något hända var som helst
 * där en resenär faktiskt råkar ut för saker: på vägen, på vandrarhemmet, på
 * jobbet, vid sevärdheten, ute på stan, i butiken, i mötet med någon, och i
 * väntan på transporten.
 *
 * Tre saker skiljer det nya systemet från det gamla:
 *
 *  1. **Val.** De flesta händelser ställer en fråga. Att lämna in plånboken
 *     och att behålla den är två olika resor.
 *  2. **Lottade utfall.** Ett val betyder inte att man vet hur det går. Att
 *     leta rätt på ägaren kan ge hittelön eller en bortkastad dag.
 *  3. **Mer än pengar.** Ett utfall kan ge en souvenir, ett certifikat, ett
 *     bättre stadsbetyg eller ett bättre anseende - eller ingenting alls
 *     utom en historia att ta med sig.
 */

export type EventTrigger =
  /** På vägen mellan två städer */
  | 'resa'
  /** Natten på vandrarhemmet */
  | 'boende'
  /** Under eller efter ett arbetsskift */
  | 'arbete'
  /** Vid stadens sevärdhet */
  | 'sevardhet'
  /** Ute på stan, utan ärende */
  | 'stad'
  /** I souvenirbutiken */
  | 'handel'
  /** Någon du träffar */
  | 'mote'
  /** Medan du väntar på transporten */
  | 'vantan';

/**
 * Tonen styr kortets färg och ljudet som spelas. `stamning` är händelser utan
 * någon effekt alls - de finns för att världen ska ha väder och folkliv, inte
 * för att flytta pengar.
 */
export type EventTone = 'bra' | 'daligt' | 'blandat' | 'absurd' | 'allvar' | 'stamning';

/** Vad spelet vet om spelaren när en händelse ska väljas ut. */
export interface EventContext {
  money: number;
  days: number;
  /** Anseende. Byggs upp av hederliga val och rivs av oärliga. */
  rykte: number;
  cityId: string;
  cityName: string;
  country: string;
  landmark: string;
  region: string;
  /** Prisnivå i staden, 1.0 = medel */
  costIndex: number;
  /** Antal souvenirer i ryggsäcken */
  backpack: number;
  /** Antal unika städer du hunnit besöka */
  visited: number;
  /** Stadsbetyget här */
  rating: number;
  /** Antal certifikat totalt */
  certificates: number;
  debt: number;
}

export interface EventEffect {
  /** Pengar i basenheter. Negativt kostar. */
  money?: number;
  /** Extra dagar, med boende draget. */
  days?: number;
  /** Stadsbetyget på turistbyrån, plus eller minus. */
  rating?: number;
  /** Anseende, plus eller minus. */
  rykte?: number;
  /** Souvenir-id du får utan att betala. */
  souvenir?: string;
  /** Sant om du blir av med en souvenir ur ryggsäcken. */
  tapparSouvenir?: boolean;
  /** Certifikat i ett ämne, som om du klarat ett skift. */
  certifikat?: Category;
}

export interface EventOutcome {
  /** Vad som faktiskt hände. Visas efter valet. */
  text: string;
  /** Hur ofta det här utfallet blir följden, i förhållande till de andra. */
  weight?: number;
  tone?: EventTone;
  effect?: EventEffect;
}

export interface EventChoice {
  label: string;
  /** Kort förtydligande under knappen, när valet behöver ett. */
  hint?: string;
  /** Krav för att valet ska gå att göra. */
  villkor?: (ctx: EventContext) => boolean;
  /** Varför valet är grått, när villkoret inte är uppfyllt. */
  villkorText?: string;
  outcomes: EventOutcome[];
}

export interface GameEvent {
  id: string;
  triggers: EventTrigger[];
  title: string;
  /**
   * Brödtexten. `{stad}`, `{land}`, `{sevardhet}` och `{valuta}` byts mot
   * stadens egna uppgifter, så att samma händelse låter olika i Katmandu och
   * i Köpenhamn.
   */
  text: string;
  tone: EventTone;
  /**
   * Hur ofta händelsen dyker upp i förhållande till de andra. Alla händelser
   * inträffar högst en gång per resa, så vikten avgör bara i vilken ordning
   * banken töms.
   */
  weight: number;
  /** Villkor för att händelsen alls ska kunna slå till. */
  villkor?: (ctx: EventContext) => boolean;
  /** Valen. Saknas de är händelsen något som bara händer. */
  choices?: EventChoice[];
  /** Effekt för en händelse utan val. */
  effect?: EventEffect;
}

/** Kortare skrivsätt för ett enda säkert utfall. */
const ett = (text: string, effect?: EventEffect, tone?: EventTone): EventOutcome[] => [
  { text, effect, tone },
];

export const EVENTS: GameEvent[] = [
  // ------------------------------------------------------------------ resa

  {
    id: 'sedel-i-fickan',
    triggers: ['resa'],
    title: 'Sedel i jackfickan',
    text: 'Du hittar en hopvikt sedel i innerfickan på jackan. Från förra resan, uppenbarligen.',
    tone: 'bra',
    weight: 3,
    effect: { money: 400 },
  },
  {
    id: 'overbokat',
    triggers: ['resa'],
    title: 'Överbokat',
    text: 'Avgången är överbokad. Personalen söker frivilliga som kan ta nästa tur mot ersättning.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Ta ersättningen och vänta',
        outcomes: ett(
          'Du sitter kvar på flygplatsen ett dygn med en kupong i handen, och lämnar den med mer pengar än du kom.',
          { money: 1400, days: 1 }
        ),
      },
      {
        label: 'Res enligt plan',
        outcomes: ett(
          'Du behåller din plats. Någon annan tog kupongen och vinkade från kön.',
          undefined,
          'stamning'
        ),
      },
    ],
  },
  {
    id: 'ficktjuv',
    triggers: ['resa', 'vantan'],
    title: 'Ficktjuv i trängseln',
    text: 'Någon var snabbare än du på perrongen. Passet finns kvar, men inte allt annat.',
    tone: 'daligt',
    weight: 3,
    effect: { money: -650 },
  },
  {
    id: 'bagaget-forsvann',
    triggers: ['resa'],
    title: 'Bagaget kom inte fram',
    text: 'Ryggsäcken åkte vidare till fel världsdel. Bakom disken finns ett formulär och en trött blick.',
    tone: 'daligt',
    weight: 2,
    choices: [
      {
        label: 'Vänta ut bagaget',
        outcomes: [
          {
            text: 'Det kommer nästa dag, med allt kvar. En dag förlorad, ingenting annat.',
            weight: 3,
            effect: { days: 1 },
          },
          {
            text: 'Det kommer aldrig fram. Något ur ryggsäcken är borta för gott.',
            weight: 1,
            tone: 'daligt',
            effect: { days: 1, tapparSouvenir: true },
          },
        ],
      },
      {
        label: 'Köp det nödvändigaste och res vidare',
        outcomes: ett('En tandborste, en tröja och ett par strumpor. Dyrare än det borde vara.', {
          money: -450,
        }),
      },
    ],
  },
  {
    id: 'delad-taxi',
    triggers: ['resa'],
    title: 'Delad taxi',
    text: 'En annan upptäckare ska åt samma håll och föreslår att ni delar på notan från stationen.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Dela taxin',
        outcomes: [
          {
            text: 'Ni delar på notan och byter reseråd hela vägen in till stan.',
            weight: 3,
            effect: { money: 250, rykte: 1 },
          },
          {
            text: 'Sällskapet visar sig känna staden utan och innan, och du lär dig mer på tjugo minuter än på en guidad tur.',
            weight: 1,
            effect: { money: 250, rating: 6 },
          },
        ],
      },
      {
        label: 'Ta bussen in själv',
        outcomes: ett('Billigare, långsammare, och du ser förorten på vägen.', {
          money: 60,
        }),
      },
    ],
  },
  {
    id: 'magsjuka',
    triggers: ['resa', 'stad'],
    title: 'Något du åt',
    text: 'Gatuköket vid stationen såg bättre ut än det var. Magen är av en annan åsikt än du.',
    tone: 'daligt',
    weight: 2,
    effect: { money: -150, days: 2 },
  },
  {
    id: 'strejk',
    triggers: ['resa', 'vantan'],
    title: 'Strejk',
    text: 'Personalen lade ner arbetet i ett dygn. Ingen kommer någonstans, och hallen fylls av folk som sitter på sina väskor.',
    tone: 'daligt',
    weight: 2,
    effect: { days: 1 },
  },
  {
    id: 'uppgraderad',
    triggers: ['resa'],
    title: 'Uppgraderad',
    text: 'Sista raden var full och du blev flyttad längst fram. Bättre mat, samma pris, och du kom fram utvilad.',
    tone: 'bra',
    weight: 2,
    effect: {},
  },
  {
    id: 'tullen',
    triggers: ['resa'],
    title: 'Tullen vill titta',
    text: 'En tulltjänsteman pekar på ryggsäcken och sedan på ett långt bord.',
    tone: 'blandat',
    weight: 2,
    choices: [
      {
        label: 'Packa upp allt lugnt',
        outcomes: ett(
          'Ni går igenom varenda ficka tillsammans. Inget hittas, dagen är borta, och ni skiljs som bekanta.',
          { days: 1 }
        ),
      },
      {
        label: 'Fråga vad det gäller',
        outcomes: [
          {
            text: 'Frågan uppfattas som samarbetsvilja. Du vinkas igenom efter tio minuter.',
            weight: 2,
          },
          {
            text: 'Frågan uppfattas inte som samarbetsvilja. Nu packas allt upp två gånger.',
            weight: 3,
            tone: 'daligt',
            effect: { days: 1, money: -200 },
          },
        ],
      },
    ],
  },
  {
    id: 'regnperiod',
    triggers: ['resa'],
    title: 'Regnperioden började',
    text: 'Vägen svämmade över och fordonet fick vänta ut ovädret under ett vägskyltstak.',
    tone: 'daligt',
    weight: 2,
    effect: { money: -80, days: 1 },
  },
  {
    id: 'vaxelkurs',
    triggers: ['resa', 'stad'],
    title: 'Bra dag på växlingskontoret',
    text: 'Kursen står ovanligt bra just den här morgonen. Skylten blinkar som om den vet om det.',
    tone: 'bra',
    weight: 2,
    choices: [
      {
        label: 'Växla allt på en gång',
        outcomes: [
          { text: 'Kursen höll i sig hela dagen. Bra gjort.', weight: 2, effect: { money: 620 } },
          {
            text: 'Kursen vände en timme senare, åt andra hållet. Du hann precis.',
            weight: 2,
            effect: { money: 380 },
          },
        ],
      },
      {
        label: 'Växla lite och avvakta',
        outcomes: ett('Försiktigt, och alldeles lagom lönsamt.', { money: 180 }),
      },
    ],
  },
  {
    id: 'gransen-stangd',
    triggers: ['resa'],
    title: 'Gränsen stängde tidigt',
    text: 'Bommen gick ner en timme före utsatt tid. Ingen kan förklara varför, och alla verkar ha räknat med det.',
    tone: 'daligt',
    weight: 2,
    effect: { days: 1 },
  },
  {
    id: 'utsikten',
    triggers: ['resa'],
    title: 'Fönsterplats',
    text: 'Sträckan går längs kusten precis när solen går ner, och hela vagnen tystnar av sig själv.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'nattbussens-hund',
    triggers: ['resa'],
    title: 'Hunden på nattbussen',
    text: 'Någon har tagit med sig en hund som är för stor för sätet och för trött för att bry sig. Den somnar med huvudet på ditt knä och sover hela vägen.',
    tone: 'stamning',
    weight: 2,
    effect: {},
  },

  // ---------------------------------------------------------------- boende

  {
    id: 'vandrarhemmet-bjod',
    triggers: ['boende'],
    title: 'Vandrarhemmet bjöd',
    text: 'Du var hundrade gästen den här månaden och får natten på huset.',
    tone: 'bra',
    weight: 2,
    effect: { money: 300 },
  },
  {
    id: 'dyrt-rum',
    triggers: ['boende'],
    title: 'Allt är fullbokat',
    text: 'Stan har festival och det enda lediga rummet kostar tre gånger så mycket.',
    tone: 'daligt',
    weight: 3,
    choices: [
      {
        label: 'Ta rummet',
        outcomes: ett('Dyrt, men du sover som en stock och vaknar utvilad.', { money: -520 }),
      },
      {
        label: 'Sov på stationen',
        outcomes: [
          {
            text: 'Bänken är hård och vaktmästaren väcker dig två gånger. Gratis blev det i alla fall.',
            weight: 3,
            tone: 'blandat',
          },
          {
            text: 'Någon rör vid ryggsäcken i mörkret. Du vaknar i tid, men inte tillräckligt i tid.',
            weight: 1,
            tone: 'daligt',
            effect: { money: -300 },
          },
        ],
      },
      {
        label: 'Fråga om festivalen har frivilliga',
        outcomes: [
          {
            text: 'De behövde folk i baren. Du får en säng, en måltid och en armbandsklocka i plast.',
            weight: 2,
            tone: 'bra',
            effect: { money: 260, rykte: 1 },
          },
          {
            text: 'Alla platser var tagna sedan i våras. Du får en gratis öl för besväret.',
            weight: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'snarkaren',
    triggers: ['boende'],
    title: 'Snarkaren i överslafen',
    text: 'Rummet har åtta bäddar och en av dem låter som ett ombyggt sågverk.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'vandrarhemskocken',
    triggers: ['boende'],
    title: 'Någon lagar mat åt alla',
    text: 'En gäst har köpt in för mycket och lagar en gryta åt hela köket. Ingen frågar vad som är i den.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Ät och bidra med något',
        outcomes: ett(
          'Du köper bröd och sitter kvar till midnatt. Billigaste middagen på hela resan, och den bästa.',
          { money: -40, rykte: 1 }
        ),
      },
      {
        label: 'Ät och håll dig i bakgrunden',
        outcomes: ett('Mätt och gratis. Ingen sa något, men någon la märke till det.', {
          money: 90,
          rykte: -1,
        }),
      },
    ],
  },
  {
    id: 'vattnet-borta',
    triggers: ['boende'],
    title: 'Vattnet är avstängt',
    text: 'En lapp i trappen meddelar att stammen byts. Duschen är en hink i tvättstugan.',
    tone: 'daligt',
    weight: 2,
    effect: { money: -60 },
  },
  {
    id: 'takterrassen',
    triggers: ['boende'],
    title: 'Nyckeln till takterrassen',
    text: 'Receptionisten lutar sig fram och säger att nyckeln till taket ligger under krukan. Uppe finns hela {stad} och ingen annan.',
    tone: 'stamning',
    weight: 2,
    effect: { rating: 3 },
  },
  {
    id: 'rummet-dubbelbokat',
    triggers: ['boende'],
    title: 'Rummet är dubbelbokat',
    text: 'Någon annan har redan lagt sina saker på din säng och sover under din filt.',
    tone: 'blandat',
    weight: 2,
    choices: [
      {
        label: 'Väck och res frågan i receptionen',
        outcomes: ett(
          'Receptionen beklagar högljutt och ger dig ett eget rum utan extra kostnad.',
          { money: 200 },
          'bra'
        ),
      },
      {
        label: 'Låt personen sova, ta soffan',
        outcomes: ett(
          'Personen visar sig heta något du inte kan uttala och bjuder på frukost nästa morgon.',
          { money: 80, rykte: 2 },
          'bra'
        ),
      },
    ],
  },
  {
    id: 'katten-pa-vandrarhemmet',
    triggers: ['boende'],
    title: 'Husets katt',
    text: 'Vandrarhemmet har en katt som väljer ut en gäst per natt. I natt är det du, och katten bryr sig inte om att du behöver vända dig.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'brandlarm',
    triggers: ['boende'],
    title: 'Brandlarm klockan tre',
    text: 'Hela huset står på gatan i lånade filtar. Det var någon som rostade bröd.',
    tone: 'absurd',
    weight: 2,
    effect: {},
  },

  // ---------------------------------------------------------------- arbete

  {
    id: 'chefen-bjuder',
    triggers: ['arbete'],
    title: 'Chefen bjuder laget',
    text: 'Skiftet gick bra och arbetsledaren tar med hela laget ut efteråt.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Följ med',
        outcomes: [
          {
            text: 'Kvällen blir lång och du får erbjudande om ett skift till, när du än kommer tillbaka.',
            weight: 2,
            effect: { rykte: 2 },
          },
          {
            text: 'Kvällen blir längre än så. Nästa dag går åt till att ångra sig.',
            weight: 1,
            tone: 'blandat',
            effect: { days: 1 },
          },
        ],
      },
      {
        label: 'Tacka nej och sov',
        outcomes: ett('Utvilad, och en aning utanför gemenskapen.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'dricks',
    triggers: ['arbete'],
    title: 'Dricksburken delas',
    text: 'Personalen delar dricksen jämnt vid skiftets slut, och du räknas in trots att du bara var där en vecka.',
    tone: 'bra',
    weight: 3,
    effect: { money: 520, rykte: 1 },
  },
  {
    id: 'sonderslaget',
    triggers: ['arbete'],
    title: 'Något gick sönder',
    text: 'Det stod på fel ställe, du gick förbi, och nu ligger det i bitar på golvet. Ingen såg det.',
    tone: 'allvar',
    weight: 3,
    choices: [
      {
        label: 'Säg som det är',
        outcomes: [
          {
            text: 'Du får betala halva, och ett handslag på att du är välkommen tillbaka.',
            weight: 3,
            effect: { money: -350, rykte: 2 },
          },
          {
            text: 'Det visade sig vara trasigt sedan i förrgår. Ingen skada skedd, och ärligheten noterades.',
            weight: 2,
            tone: 'bra',
            effect: { rykte: 2 },
          },
        ],
      },
      {
        label: 'Ställ tillbaka bitarna och gå',
        outcomes: [
          { text: 'Ingen märkte något. Du märkte det.', weight: 3, effect: { rykte: -2 } },
          {
            text: 'Övervakningskameran märkte något. Hela dagslönen går åt.',
            weight: 2,
            tone: 'daligt',
            effect: { money: -900, rykte: -3 },
          },
        ],
      },
    ],
  },
  {
    id: 'larlingen',
    triggers: ['arbete'],
    title: 'Någon vill lära sig',
    text: 'En nyanställd fattar ingenting och vågar inte fråga arbetsledaren.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Ta en stund och visa',
        outcomes: ett(
          'Ni går igenom det två gånger. Arbetsledaren ser på, säger ingenting, och skriver något i ett block.',
          { rykte: 2, rating: 4 }
        ),
      },
      {
        label: 'Sköt ditt eget',
        outcomes: ett('Du blir klar tidigare och tjänar en slant på ackordet.', { money: 220 }),
      },
    ],
  },
  {
    id: 'extraskift',
    triggers: ['arbete'],
    title: 'Extraskift i natt',
    text: 'Någon har sjukanmält sig och arbetsledaren frågar rakt ut om du kan ta natten.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Ta natten',
        outcomes: ett('Trött men rikare, och en dag har gått.', { money: 900, days: 1 }),
      },
      {
        label: 'Tacka nej',
        outcomes: ett('Arbetsledaren nickar. Det märks inte i lönen men det märks.', {
          rykte: -1,
        }),
      },
    ],
  },
  {
    id: 'facket',
    triggers: ['arbete'],
    title: 'Lönen stämmer inte',
    text: 'Kuvertet är tunnare än det borde vara. Ingen på kontoret vill kännas vid summan.',
    tone: 'allvar',
    weight: 2,
    choices: [
      {
        label: 'Kräv resten',
        outcomes: [
          {
            text: 'Efter en halvtimmes tjat räknas det om, och du får rätt.',
            weight: 3,
            effect: { money: 600, rykte: 1 },
          },
          {
            text: 'Kontoret hänvisar till en blankett som ska skickas någon annanstans. Dagen är borta.',
            weight: 2,
            tone: 'daligt',
            effect: { days: 1 },
          },
        ],
      },
      {
        label: 'Låt det vara',
        outcomes: ett('Inte värt bråket, tänker du, hela vägen hem till vandrarhemmet.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'certifikatet',
    triggers: ['arbete'],
    title: 'Arbetsledaren skriver ett intyg',
    text: 'Utan att du bett om det sätter arbetsledaren sig och skriver ner vad du kan, på papper med stämpel.',
    tone: 'bra',
    weight: 1,
    villkor: (c) => c.rykte >= 3,
    effect: {},
  },
  {
    id: 'blastes-pa-lonen',
    triggers: ['arbete'],
    title: 'Arbetsgivaren har stängt',
    text: 'Du kommer för att hämta sista dagslönen och hittar en nedrullad jalusi och en lapp.',
    tone: 'daligt',
    weight: 2,
    effect: { money: -400 },
  },

  // ------------------------------------------------------------- sevärdhet

  {
    id: 'guiden-tar-med',
    triggers: ['sevardhet'],
    title: 'Guiden räknar fel',
    text: 'En guide räknar sin grupp vid ingången till {sevardhet}, kommer till fel antal, och vinkar in dig i sällskapet.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Följ med gruppen',
        outcomes: [
          {
            text: 'Du får hela turen gratis och lär dig mer om {stad} än guideboken kunde berätta.',
            weight: 3,
            effect: { rating: 10, money: 120 },
          },
          {
            text: 'Räkningen görs om vid utgången. Guiden är artig men bestämd, och du betalar.',
            weight: 2,
            tone: 'daligt',
            effect: { money: -260, rykte: -1 },
          },
        ],
      },
      {
        label: 'Peka på felet',
        outcomes: ett(
          'Guiden blir tacksam, räknar om, och ger dig turen till halva priset ändå.',
          { money: -110, rating: 8, rykte: 2 },
          'bra'
        ),
      },
    ],
  },
  {
    id: 'stangt-for-renovering',
    triggers: ['sevardhet'],
    // Rubriken undviker adjektiv om sevärdheten: den kan vara både en och ett,
    // och "Vasamuseet är inbyggd" är fel på ett sätt som syns direkt.
    title: 'Ställningar runt {sevardhet}',
    text: 'Hela fasaden är täckt av presenning. På presenningen sitter ett fotografi av det du kom för att se.',
    tone: 'absurd',
    weight: 3,
    effect: {},
  },
  {
    id: 'ko-till-sevardheten',
    triggers: ['sevardhet'],
    title: 'Kön går runt kvarteret',
    text: 'Det tar tre timmar att komma in i {sevardhet}. En kille säljer förköpta biljetter vid sidan av kön.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Ställ dig i kön',
        outcomes: ett('Tre timmar senare är du inne, och det var värt det.', {
          rating: 8,
          money: -140,
        }),
      },
      {
        label: 'Köp av killen vid sidan',
        outcomes: [
          { text: 'Biljetten funkar. Du är inne på tio minuter.', weight: 2, effect: { money: -260, rating: 8 } },
          {
            text: 'Biljetten är från förra säsongen. Killen är borta. Du också, till slut.',
            weight: 2,
            tone: 'daligt',
            effect: { money: -260 },
          },
        ],
      },
      {
        label: 'Titta utifrån och gå vidare',
        outcomes: ett('Man ser den ju härifrån också. Nästan.', { rating: 2 }, 'stamning'),
      },
    ],
  },
  {
    id: 'vakten-och-vaskan',
    triggers: ['sevardhet'],
    title: 'Ryggsäcken får inte följa med in',
    text: 'Vakten pekar på skylten. Inga stora väskor. Förvaringsboxarna kostar mer än inträdet.',
    tone: 'blandat',
    weight: 2,
    choices: [
      {
        label: 'Betala för förvaringen',
        outcomes: ett('Dyrt men enkelt. Allt finns kvar efteråt.', { money: -180, rating: 6 }),
      },
      {
        label: 'Lämna den hos en kioskägare',
        outcomes: [
          {
            text: 'Kioskägaren ställer den bakom disken, vägrar ta betalt och vinkar när du kommer tillbaka.',
            weight: 3,
            effect: { rating: 6, rykte: 1 },
          },
          {
            text: 'Kiosken har stängt när du kommer tillbaka. Ryggsäcken står utanför, en souvenir lättare.',
            weight: 1,
            tone: 'daligt',
            effect: { rating: 6, tapparSouvenir: true },
          },
        ],
      },
    ],
  },
  {
    id: 'solnedgangen',
    triggers: ['sevardhet'],
    title: 'Rätt tid på dygnet',
    text: 'Du råkar komma till {sevardhet} i den timme när ljuset gör allt rätt. Ingen bild blir lika bra som minnet.',
    tone: 'stamning',
    weight: 3,
    effect: { rating: 4 },
  },
  {
    id: 'gratis-onsdag',
    triggers: ['sevardhet'],
    title: 'Fri entré idag',
    text: 'Det är den där onsdagen i månaden. Halva {stad} verkar veta om det, men du hann före dem.',
    tone: 'bra',
    weight: 2,
    effect: { money: 200, rating: 8 },
  },
  {
    id: 'gamle-mannen',
    triggers: ['sevardhet', 'mote'],
    title: 'Han var med när den byggdes',
    text: 'En äldre man sätter sig på bänken bredvid dig och börjar berätta om {sevardhet} som om han hade varit där hela tiden. Han hade det.',
    tone: 'stamning',
    weight: 2,
    effect: { rating: 12 },
  },
  {
    id: 'fotoforbud',
    triggers: ['sevardhet'],
    title: 'Fotoförbud',
    text: 'En vakt tar tag i din arm när kameran åker upp och pekar på en skylt som är skriven på fyra språk, inget av dem ditt.',
    tone: 'blandat',
    weight: 2,
    choices: [
      {
        label: 'Be om ursäkt och lägg undan den',
        outcomes: ett('Vakten slappnar av och visar dig var man faktiskt får fotografera.', {
          rating: 4,
          rykte: 1,
        }),
      },
      {
        label: 'Ta bilden i smyg ändå',
        outcomes: [
          { text: 'Bilden blev suddig. Så gick det med det.', weight: 2, effect: { rykte: -1 } },
          {
            text: 'Vakten såg. Kortet raderas framför dig och du får en bot i handen.',
            weight: 2,
            tone: 'daligt',
            effect: { money: -400, rykte: -2 },
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ stad

  {
    id: 'planbok',
    triggers: ['stad'],
    title: 'En plånbok på trottoaren',
    text: 'Den ligger mitt på gången, tjock av sedlar, med ett körkort instucket i fickan. Ingen omkring dig verkar leta efter någonting.',
    tone: 'allvar',
    weight: 4,
    choices: [
      {
        label: 'Lämna in den till polisen',
        outcomes: [
          {
            text: 'Konstapeln antecknar ditt namn och adressen till vandrarhemmet. Två dagar senare ligger ett kuvert med hittelön i receptionen.',
            weight: 3,
            effect: { money: 900, rykte: 3 },
          },
          {
            text: 'Konstapeln tar emot den utan att titta upp. Ingen hittelön, ingen kvittens, men du vet vad du gjorde.',
            weight: 2,
            effect: { rykte: 3 },
          },
        ],
      },
      {
        label: 'Behåll pengarna',
        outcomes: [
          {
            text: 'Du tar sedlarna och lägger tillbaka plånboken där den låg. Ingen såg något.',
            weight: 3,
            effect: { money: 1600, rykte: -3 },
          },
          {
            text: 'Ägaren kommer springande runt hörnet just som du stoppar undan sedlarna. Det blir högljutt, och dyrt.',
            weight: 2,
            tone: 'daligt',
            effect: { money: -700, rykte: -4 },
          },
        ],
      },
      {
        label: 'Leta upp ägaren själv',
        outcomes: [
          {
            text: 'Adressen på körkortet leder till en lägenhet tre kvarter bort. Du får kaffe, hittelön och en inbjudan till middag.',
            weight: 3,
            effect: { money: 700, rykte: 4, days: 1 },
          },
          {
            text: 'Du letar hela dagen. Adressen finns inte längre. Till slut lämnar du in den i en kiosk och hoppas på det bästa.',
            weight: 2,
            effect: { days: 1, rykte: 2 },
          },
        ],
      },
    ],
  },
  {
    id: 'gatumusikant',
    triggers: ['stad'],
    title: 'Gatumusikanten behöver en till',
    text: 'Han spelar ensam på torget och pekar på en tom trumma. Hatten ligger framför.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Håll takten en kväll',
        outcomes: [
          { text: 'Hatten delas lika och kvällen blir minnesvärd.', weight: 3, effect: { money: 480 } },
          {
            text: 'Det regnade efter tjugo minuter. Ni delade på fyrtio kronor och ett paraply.',
            weight: 2,
            effect: { money: 40 },
          },
        ],
      },
      {
        label: 'Lägg en slant och gå vidare',
        outcomes: ett('Han nickar tack utan att sluta spela.', { money: -30, rykte: 1 }, 'stamning'),
      },
    ],
  },
  {
    id: 'demonstration',
    triggers: ['stad'],
    title: 'Ett tåg fyller gatan',
    text: 'Tusentals människor går förbi med plakat på ett språk du inte läser. Stämningen är allvarlig men lugn.',
    tone: 'allvar',
    weight: 2,
    choices: [
      {
        label: 'Fråga någon vad det gäller',
        outcomes: ett(
          'En student förklarar på engelska i tio minuter. Du förstår {land} betydligt bättre efteråt.',
          { rating: 12 }
        ),
      },
      {
        label: 'Ta en annan gata',
        outcomes: ett('Klokt, kanske. Du hör dem i en timme till.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'hunden-foljer-efter',
    triggers: ['stad'],
    title: 'En hund har bestämt sig',
    text: 'Den följde efter dig från marknaden och tänker uppenbarligen inte sluta.',
    tone: 'absurd',
    weight: 3,
    choices: [
      {
        label: 'Köp något åt den',
        outcomes: ett(
          'Den äter, ser på dig, och följer med hela vägen till vandrarhemmet där den sätter sig utanför dörren.',
          { money: -60, rykte: 1 },
          'stamning'
        ),
      },
      {
        label: 'Fortsätt gå',
        outcomes: ett('Den ger upp vid tredje korsningen. Du tänker på den i tre dagar.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'vilse',
    triggers: ['stad'],
    title: 'Du är inte där du tror',
    text: 'Kartan och gatan är oense. Kvarteren ser likadana ut åt alla håll.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Fråga i en butik',
        outcomes: ett(
          'Butiksägaren ritar en karta på ett kvitto och lägger till tre ställen du borde se.',
          { rating: 8 }
        ),
      },
      {
        label: 'Gå tills det känns rätt',
        outcomes: [
          {
            text: 'Du hamnar i en stadsdel ingen guidebok nämner, och den var värd omvägen.',
            weight: 2,
            effect: { rating: 6 },
          },
          {
            text: 'Två timmar senare står du där du började. Fötterna vet det.',
            weight: 3,
            effect: { days: 1 },
          },
        ],
      },
    ],
  },
  {
    id: 'lotteri',
    triggers: ['stad'],
    title: 'En lott i handen',
    text: 'En kvinna trycker en lott i din hand innan du hinner säga nej och pekar på en skylt med dagens dragning.',
    tone: 'absurd',
    weight: 2,
    choices: [
      {
        label: 'Betala för lotten',
        outcomes: [
          { text: 'Fel nummer. Alla nummer var fel nummer.', weight: 5, effect: { money: -80 } },
          {
            text: 'Tredjepris: en presentkorg och kontanter. Ingen är mer förvånad än du.',
            weight: 1,
            tone: 'bra',
            effect: { money: 2400 },
          },
        ],
      },
      {
        label: 'Ge tillbaka den',
        outcomes: ett('Hon rycker på axlarna och ger den till nästa förbipasserande.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'fotograf',
    triggers: ['stad'],
    title: 'Någon vill fotografera dig',
    text: 'En fotograf säger något om ett reportage om resande och håller upp kameran frågande.',
    tone: 'blandat',
    weight: 2,
    choices: [
      {
        label: 'Ställ upp',
        outcomes: [
          {
            text: 'Bilden hamnar i en tidning du aldrig får se, och du får betalt kontant på plats.',
            weight: 3,
            effect: { money: 550 },
          },
          {
            text: 'Det var ingen fotograf. Det var någon som ville sälja porträttet till dig efteråt.',
            weight: 2,
            tone: 'daligt',
            effect: { money: -150 },
          },
        ],
      },
      {
        label: 'Vinka nej',
        outcomes: ett('Hen fotograferar en duva i stället.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'gatukatt',
    triggers: ['stad'],
    title: 'Torgets katter',
    text: 'Elva katter håller till kring fontänen i {stad}, och en gammal kvinna kommer varje kväll med mat till dem allihop.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'polisen-vill-se-pass',
    triggers: ['stad'],
    title: 'Legitimering på gatan',
    text: 'Två poliser vill se ditt pass. Den ene bläddrar länge i det.',
    tone: 'allvar',
    weight: 2,
    choices: [
      {
        label: 'Visa passet och vänta lugnt',
        outcomes: [
          { text: 'Allt är i sin ordning. De önskar trevlig resa.', weight: 4 },
          {
            text: 'Det saknas en stämpel som borde ha satts vid gränsen. Det löser sig, men det tar en dag.',
            weight: 2,
            tone: 'daligt',
            effect: { days: 1 },
          },
        ],
      },
      {
        label: 'Fråga varför',
        outcomes: [
          { text: 'Rutinkontroll, säger de. Ni skiljs artigt.', weight: 3 },
          {
            text: 'Frågan gör kontrollen grundligare. Betydligt grundligare.',
            weight: 2,
            tone: 'daligt',
            effect: { days: 1, money: -200 },
          },
        ],
      },
    ],
  },
  {
    id: 'regnskur',
    triggers: ['stad'],
    title: 'Skyfall utan förvarning',
    text: 'Du står under ett portvalv tillsammans med sex främlingar och en cykel, och ingen säger något på en kvart.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },

  // ----------------------------------------------------------------- handel

  {
    id: 'pruta',
    triggers: ['handel'],
    title: 'Priset är en öppningsreplik',
    text: 'Handlaren nämner en summa och ser förväntansfullt på dig. Alla runt omkring prutar.',
    tone: 'blandat',
    weight: 4,
    choices: [
      {
        label: 'Pruta hårt',
        outcomes: [
          {
            text: 'Ni landar på halva. Handlaren skakar hand och verkar nöjd ändå.',
            weight: 3,
            effect: { money: 340 },
          },
          {
            text: 'Handlaren blir stött, vänder ryggen till, och saken är avslutad.',
            weight: 2,
            tone: 'daligt',
            effect: { rykte: -1 },
          },
        ],
      },
      {
        label: 'Pruta lagom',
        outcomes: ett('Ni möts på mitten, som alla visste att ni skulle.', { money: 160, rykte: 1 }),
      },
      {
        label: 'Betala vad hen begär',
        outcomes: ett(
          'Handlaren blir förvirrad och lägger ner en extra sak i påsen av ren förlägenhet.',
          { rykte: 1 },
          'stamning'
        ),
      },
    ],
  },
  {
    id: 'aktan',
    triggers: ['handel'],
    title: 'Är den äkta?',
    text: 'Handlaren håller upp något och säger ett årtal. Du har ingen aning om det stämmer.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Köp den och hoppas',
        outcomes: [
          {
            text: 'Den var äkta. Du inser det först månader senare, men den var det.',
            weight: 2,
            tone: 'bra',
            effect: { money: -400 },
          },
          {
            text: 'Den var tillverkad i förra veckan, tre kvarter bort. Fin är den ändå.',
            weight: 3,
            effect: { money: -400 },
          },
        ],
      },
      {
        label: 'Fråga efter intyg',
        outcomes: ett(
          'Frågan avslutar samtalet. Handlaren ler och ställer tillbaka den i lådan.',
          undefined,
          'stamning'
        ),
      },
    ],
  },
  {
    id: 'vaxel-tillbaka',
    triggers: ['handel'],
    title: 'För mycket växel',
    text: 'Du räknar sedlarna i handen två gånger. Handlaren har gett dig betydligt mer tillbaka än du ska ha.',
    tone: 'allvar',
    weight: 3,
    choices: [
      {
        label: 'Säg till',
        outcomes: ett(
          'Handlaren bleknar, räknar om, och ger dig något ur hyllan som tack.',
          { rykte: 2 },
          'bra'
        ),
      },
      {
        label: 'Stoppa undan dem',
        outcomes: [
          { text: 'Ingen märkte något förrän kassan räknades på kvällen.', weight: 3, effect: { money: 620, rykte: -2 } },
          {
            text: 'Handlarens dotter såg allt från dörren och säger det högt, på två språk.',
            weight: 2,
            tone: 'daligt',
            effect: { rykte: -3 },
          },
        ],
      },
    ],
  },
  {
    id: 'butiken-stanger',
    triggers: ['handel'],
    title: 'Butiken lägger ner',
    text: 'Allt ska bort. Skyltarna är handskrivna och priserna genomstrukna två gånger.',
    tone: 'bra',
    weight: 2,
    effect: { money: 300 },
  },
  {
    id: 'gavan',
    triggers: ['handel'],
    title: 'Handlaren ger dig något',
    text: 'Du har handlat här förut, säger hen, fast det har du inte. En sak läggs i påsen utan att den slås in.',
    tone: 'bra',
    weight: 2,
    villkor: (c) => c.rykte >= 2,
    effect: { rykte: 1 },
  },
  {
    id: 'tull-souvenir',
    triggers: ['handel'],
    title: 'Får den föras ut ur landet?',
    text: 'En annan kund lutar sig fram och viskar att det där brukar tas i tullen.',
    tone: 'allvar',
    weight: 2,
    choices: [
      {
        label: 'Skaffa papper på den',
        outcomes: ett('En blankett, en stämpel och en halv dag. Nu är den din på riktigt.', {
          money: -160,
          days: 1,
        }),
      },
      {
        label: 'Chansa',
        outcomes: [
          { text: 'Ingen frågade. Ingen frågar någonsin.', weight: 3 },
          {
            text: 'Någon frågade. Den ligger nu i en låda på ett tullkontor i {land}.',
            weight: 2,
            tone: 'daligt',
            effect: { tapparSouvenir: true },
          },
        ],
      },
    ],
  },
  {
    id: 'marknadssorl',
    triggers: ['handel'],
    title: 'Marknaden i full gång',
    text: 'Fyra språk hörs samtidigt, någon steker något som luktar starkt, och en radio spelar för högt bakom stånden.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },

  // ------------------------------------------------------------------ möten

  {
    id: 'ryggsackaren',
    triggers: ['mote'],
    title: 'En annan upptäckare',
    text: 'Ni hamnar bredvid varandra och det visar sig att hen kommer från precis dit du ska.',
    tone: 'bra',
    weight: 4,
    choices: [
      {
        label: 'Byt reseråd',
        outcomes: ett(
          'En timme senare har du en lista på ställen som inte står i någon bok.',
          { rating: 8, rykte: 1 }
        ),
      },
      {
        label: 'Fråga om jobb där borta',
        outcomes: [
          {
            text: 'Hen ringer ett samtal åt dig på stående fot. Det kan bli något.',
            weight: 2,
            effect: { rykte: 2, money: 200 },
          },
          {
            text: 'Hen har inte jobbat på hela resan och lever på lån hemifrån. Ni pratar om annat.',
            weight: 3,
          },
        ],
      },
    ],
  },
  {
    id: 'inbjuden-hem',
    triggers: ['mote'],
    title: 'Inbjuden hem till någon',
    text: 'En familj du växlat tio ord med insisterar på att du ska äta middag hos dem i kväll.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Tacka ja',
        outcomes: [
          {
            text: 'Det blir kvällen du minns bäst av hela resan. Du får med dig mat för två dagar.',
            weight: 4,
            tone: 'bra',
            effect: { money: 260, rating: 10, rykte: 2 },
          },
          {
            text: 'Middagen visar sig vara en presentation av svågerns affärsidé. Fyra timmar.',
            weight: 2,
            tone: 'absurd',
            effect: { days: 1 },
          },
        ],
      },
      {
        label: 'Tacka artigt nej',
        outcomes: ett('De blir uppriktigt ledsna, och du tänker på det på vandrarhemmet.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'landsmannen',
    triggers: ['mote'],
    title: 'Någon hemifrån',
    text: 'Du hör ditt eget språk mitt i {stad} och det känns oväntat starkt.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'skrytmansen',
    triggers: ['mote'],
    title: 'Han har varit överallt',
    text: 'Mannen vid bordet har varit i fler länder än du visste fanns, och tänker berätta om vart och ett.',
    tone: 'absurd',
    weight: 3,
    choices: [
      {
        label: 'Lyssna hövligt',
        outcomes: [
          {
            text: 'Efter fyrtio minuter kommer ett verkligt bra tips, och det var värt de fyrtio minuterna.',
            weight: 2,
            effect: { rating: 6 },
          },
          { text: 'Det kom aldrig något bra tips.', weight: 3 },
        ],
      },
      {
        label: 'Byt bord',
        outcomes: ett('Han hittar någon annan inom en minut.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'hjalp-med-vaskor',
    triggers: ['mote', 'vantan'],
    title: 'Någon får inte upp väskan',
    text: 'En äldre kvinna kämpar med en kappsäck som väger mer än hon gör.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Hjälp till',
        outcomes: [
          {
            text: 'Hon tackar i två minuter och trycker något i din hand som du inte kan säga nej till.',
            weight: 3,
            effect: { money: 120, rykte: 2 },
          },
          {
            text: 'Väskan går upp, men något i din rygg går ner. Du tar det lugnt en dag.',
            weight: 1,
            tone: 'blandat',
            effect: { days: 1, rykte: 2 },
          },
        ],
      },
      {
        label: 'Låt någon annan',
        outcomes: ett('Någon annan gjorde det. Du såg på.', { rykte: -1 }, 'stamning'),
      },
    ],
  },
  {
    id: 'tiggaren',
    triggers: ['mote', 'stad'],
    title: 'Någon ber om hjälp',
    text: 'En ung man frågar om pengar till en biljett hem. Historien är detaljerad och kan vara sann.',
    tone: 'allvar',
    weight: 3,
    choices: [
      {
        label: 'Ge honom pengar till biljetten',
        outcomes: [
          {
            text: 'Du ser honom på stationen senare samma dag, med en biljett i handen.',
            weight: 3,
            effect: { money: -350, rykte: 3 },
          },
          {
            text: 'Du ser honom på samma gathörn dagen därpå, med samma historia.',
            weight: 2,
            tone: 'blandat',
            effect: { money: -350, rykte: 1 },
          },
        ],
      },
      {
        label: 'Köp biljetten åt honom i stället',
        outcomes: ett(
          'Ni går till stationen tillsammans. Han blir tyst när biljetten skrivs ut.',
          { money: -420, rykte: 4, days: 1 },
          'bra'
        ),
      },
      {
        label: 'Säg nej',
        outcomes: ett('Han nickar och går vidare till nästa. Du också.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'brollop',
    triggers: ['mote', 'stad'],
    title: 'Du hamnar mitt i ett bröllop',
    text: 'Sällskapet fyller hela gatan, och någon bestämmer sig för att du hör till gästerna.',
    tone: 'absurd',
    weight: 2,
    choices: [
      {
        label: 'Följ med in',
        outcomes: ett(
          'Du äter, dansar och blir fotograferad med brudparet. Ingen frågar vem du är.',
          { money: 180, rating: 8, days: 1 },
          'bra'
        ),
      },
      {
        label: 'Gratulera och gå',
        outcomes: ett('Du får en bit tårta på en servett, mitt på gatan.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'gamla-jobbarkompisen',
    triggers: ['mote'],
    title: 'Någon känner igen dig',
    text: 'En person från ett tidigare skift ser dig på gatan och blir uppriktigt glad.',
    tone: 'bra',
    weight: 2,
    villkor: (c) => c.visited >= 3 && c.rykte >= 2,
    effect: { money: 300, rykte: 1 },
  },
  {
    id: 'sprakforbistring',
    triggers: ['mote'],
    title: 'Ingen av er talar den andres språk',
    text: 'Samtalet förs med händer, en penna och en servett, och tar tjugo minuter för något som borde ta tjugo sekunder. Ni skrattar båda två.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },

  // ---------------------------------------------------------------- väntan

  {
    id: 'forsenat-tag',
    triggers: ['vantan'],
    title: 'Avgången skjuts upp',
    text: 'Tavlan ändrar sig, och sedan ändrar den sig igen. Ingen på perrongen ser förvånad ut.',
    tone: 'daligt',
    weight: 3,
    effect: { days: 1 },
  },
  {
    id: 'schack-i-hallen',
    triggers: ['vantan'],
    title: 'Ett schackparti i väntsalen',
    text: 'Två män spelar på ett bräde med tejp på. Den ene reser sig och pekar på stolen.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Sätt dig och spela',
        outcomes: [
          {
            text: 'Du förlorar på elva drag. Han skrattar och bjuder på kaffe.',
            weight: 3,
            effect: { rykte: 1 },
          },
          {
            text: 'Du vinner. Hela väntsalen tystnar. Någon vill spela nästa parti om pengar.',
            weight: 1,
            tone: 'bra',
            effect: { money: 400 },
          },
        ],
      },
      {
        label: 'Skaka på huvudet',
        outcomes: ett('Han hittar en motståndare inom trettio sekunder.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'hittegods',
    triggers: ['vantan'],
    title: 'En väska ingen hämtar',
    text: 'Den har stått vid samma pelare i två timmar. Ingen i hallen tittar på den utom du.',
    tone: 'allvar',
    weight: 3,
    choices: [
      {
        label: 'Säg till personalen',
        outcomes: [
          {
            text: 'Hallen utryms i fyrtio minuter. Väskan innehöll böcker. Du får en ursäkt och en varm dryck.',
            weight: 3,
            effect: { rykte: 2, days: 1 },
          },
          {
            text: 'Ägaren dyker upp samtidigt, generad och tacksam, och insisterar på att ge dig något.',
            weight: 2,
            tone: 'bra',
            effect: { money: 250, rykte: 2 },
          },
        ],
      },
      {
        label: 'Låt den stå',
        outcomes: ett('Den står kvar när du går. Du tänker på den på hela resan.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'perrongkiosken',
    triggers: ['vantan'],
    title: 'Kiosken tar bara kontanter',
    text: 'Du har inga. Personen bakom dig i kön räcker fram en sedel utan att säga något.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Ta emot och betala tillbaka',
        outcomes: ett(
          'Ni står och pratar tills avgången ropas ut. Hen vill inte ha tillbaka pengarna.',
          { money: 60, rykte: 1 }
        ),
      },
      {
        label: 'Avböja och gå hungrig',
        outcomes: ett('Resan blir lång.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'fel-perrong',
    triggers: ['vantan'],
    title: 'Fel perrong',
    text: 'Du står där du ska enligt tavlan. Tavlan hade ändrat sig medan du hämtade kaffe.',
    tone: 'daligt',
    weight: 3,
    effect: { days: 1, money: -120 },
  },
  {
    id: 'gitarr-i-hallen',
    triggers: ['vantan'],
    title: 'Någon plockar upp en gitarr',
    text: 'Det börjar med en person och slutar med halva väntsalen. Ingen får åka någonstans på en timme, och ingen verkar bry sig.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'uppgradering-erbjuds',
    triggers: ['vantan'],
    title: 'Sista minuten-erbjudande',
    text: 'Vid disken erbjuds en bättre plats på avgången till halva ordinarie påslag.',
    tone: 'blandat',
    weight: 2,
    villkor: (c) => c.money > 1200,
    choices: [
      {
        label: 'Betala för uppgraderingen',
        outcomes: ett(
          'Du sover hela vägen och kliver av som en människa i stället för som en ryggsäck.',
          { money: -450 },
          'bra'
        ),
      },
      {
        label: 'Res som planerat',
        outcomes: ett('Pengarna är kvar. Ryggen är inte.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'stationskatten',
    triggers: ['vantan'],
    title: 'Stationen har en katt',
    text: 'Den bor i biljetthallen, har ett eget namn på en skylt, och sover i en låda som personalen värmer med en lampa.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },

  // ------------------------------------- fler händelser, för längre resor

  {
    id: 'nycklarna-borta',
    triggers: ['stad'],
    title: 'Nyckeln till vandrarhemmet är borta',
    text: 'Fickan är tom. Du har gått samma runda i fyra timmar och kan inte säga var i den nyckeln ligger.',
    tone: 'daligt',
    weight: 3,
    choices: [
      {
        label: 'Gå tillbaka och leta',
        outcomes: [
          { text: 'Den låg på kaféet, i en burk märkt "hittegods". Fyra timmar för en nyckel.', weight: 3, effect: { days: 1 } },
          { text: 'Den låg i den andra fickan hela tiden. Du säger det till ingen.', weight: 2, tone: 'absurd' },
        ],
      },
      {
        label: 'Betala för en ny',
        outcomes: ett('Receptionen tar betalt utan att blinka och ger dig två stycken.', { money: -280 }),
      },
    ],
  },
  {
    id: 'gatuschack',
    triggers: ['stad'],
    title: 'Tre koppar och en boll',
    text: 'Mannen flyttar kopparna långsamt, nästan hjälpsamt, och två i publiken har redan vunnit.',
    tone: 'allvar',
    weight: 3,
    choices: [
      {
        label: 'Satsa en gång',
        outcomes: [
          { text: 'Bollen låg inte under någon av dem. Det gör den aldrig.', weight: 5, effect: { money: -400 } },
          { text: 'Du gissar rätt, tar pengarna och går innan han hinner erbjuda en andra omgång.', weight: 1, tone: 'bra', effect: { money: 700 } },
        ],
      },
      {
        label: 'Gå vidare',
        outcomes: ett('De två som vann följer efter honom till nästa kvarter. De hör till.', { rating: 3 }, 'stamning'),
      },
    ],
  },
  {
    id: 'bibliotekskortet',
    triggers: ['stad'],
    title: 'Stadsbiblioteket har öppet',
    text: 'Det är svalt, tyst och gratis, och hyllan med lokalhistoria är tre meter lång.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Läs en eftermiddag',
        outcomes: ett('Du kan mer om {stad} när du går ut än när du kom in.', { rating: 12 }),
      },
      {
        label: 'Bara sitta ner en stund',
        outcomes: ett('Du somnar i en fåtölj och vaknar av att någon dammsuger.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'tvatten',
    triggers: ['stad'],
    title: 'Tvätten kan inte vänta längre',
    text: 'Det luktar om ryggsäcken på ett sätt som andra resenärer har börjat kommentera artigt.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Lämna in på tvätteriet',
        outcomes: ett('Allt kommer tillbaka vikt, varmt och en aning krympt.', { money: -180, rykte: 1 }),
      },
      {
        label: 'Tvätta i handfatet',
        outcomes: [
          { text: 'Det torkar på en dag i värmen. Gratis och nästan lika bra.', weight: 3 },
          { text: 'Ingenting torkar. Du reser vidare med blöta strumpor i en plastpåse.', weight: 2, tone: 'absurd' },
        ],
      },
    ],
  },
  {
    id: 'demonstrationsgrupp',
    triggers: ['stad'],
    title: 'Någon delar ut mat på torget',
    text: 'Ett bord, en gryta och en kö. Ingen frågar vem du är eller varifrån du kommer.',
    tone: 'stamning',
    weight: 3,
    effect: { money: 60 },
  },
  {
    id: 'skomakaren',
    triggers: ['stad'],
    title: 'Sulan har släppt',
    text: 'Kängan gapar i framkanten och det är fyra kvarter till vandrarhemmet.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Gå in till skomakaren',
        outcomes: ett('Han syr den medan du väntar och tar knappt betalt.', { money: -90, rykte: 1 }),
      },
      {
        label: 'Tejpa och hoppas',
        outcomes: [
          { text: 'Tejpen håller hela resan. Ingen ser det under bordet.', weight: 2, tone: 'absurd' },
          { text: 'Tejpen håller till nästa regn. Sedan får du köpa nya skor.', weight: 3, tone: 'daligt', effect: { money: -520 } },
        ],
      },
    ],
  },
  {
    id: 'gatukonstnaren',
    triggers: ['stad'],
    title: 'Någon ritar av dig',
    text: 'Hon har suttit på samma pall hela eftermiddagen och håller redan upp ett halvfärdigt porträtt.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Köp porträttet',
        outcomes: ett('Det är bättre än du väntat dig, och det rullas ihop i en pappersrulle.', { money: -220, rykte: 1 }),
      },
      {
        label: 'Le och gå',
        outcomes: ett('Hon river inte sönder det. Det hänger kvar bland de andra ansiktena.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'brandkaren',
    triggers: ['stad'],
    title: 'Hela gatan är avspärrad',
    text: 'Tre brandbilar, mycket rök och ingen som verkar särskilt orolig.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'valuta-svartabors',
    triggers: ['stad'],
    title: 'Någon vill växla på gatan',
    text: 'Kursen han viskar är betydligt bättre än bankens. Han har sedelbunten i handen.',
    tone: 'allvar',
    weight: 3,
    choices: [
      {
        label: 'Växla med honom',
        outcomes: [
          { text: 'Kursen höll. Du gick därifrån med mer än banken hade gett dig.', weight: 2, effect: { money: 700, rykte: -1 } },
          { text: 'Bunten var tjock i ändarna och tidningspapper i mitten.', weight: 3, tone: 'daligt', effect: { money: -900 } },
        ],
      },
      {
        label: 'Gå till banken i stället',
        outcomes: ett('Sämre kurs, men du räknar sedlarna själv och det stämmer.', { money: 90 }),
      },
    ],
  },
  {
    id: 'blomsterflickan',
    triggers: ['stad', 'mote'],
    title: 'En ros i handen',
    text: 'Hon trycker den i din hand, säger "present", och håller sedan kvar handen framsträckt.',
    tone: 'absurd',
    weight: 3,
    choices: [
      {
        label: 'Betala för rosen',
        outcomes: ett('Du bär den hela dagen och ger bort den till någon på vandrarhemmet.', { money: -70, rykte: 1 }),
      },
      {
        label: 'Ge tillbaka den',
        outcomes: ett('Hon tar den utan att ändra en min och går till nästa.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'takterrass-inbjudan',
    triggers: ['stad'],
    title: 'Någon vinkar från ett tak',
    text: 'Fyra personer på en takterrass ropar ner något och pekar på en dörr i porten.',
    tone: 'blandat',
    weight: 2,
    choices: [
      {
        label: 'Gå upp',
        outcomes: [
          { text: 'Det blir kvällen då du såg {stad} uppifrån, med folk du aldrig träffar igen.', weight: 3, tone: 'bra', effect: { rating: 10, rykte: 1 } },
          { text: 'Det var en försäljning av tidsandelar. Du tar dig ut efter fyrtio minuter.', weight: 2, tone: 'absurd' },
        ],
      },
      {
        label: 'Vinka tillbaka och gå',
        outcomes: ett('De ropar något till. Du hör inte vad.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'parkbanken',
    triggers: ['stad'],
    title: 'En bänk i solen',
    text: 'Du sätter dig för att vila fötterna en stund och blir sittande i två timmar. Ingenting händer, och det är hela poängen.',
    tone: 'stamning',
    weight: 4,
    effect: {},
  },

  {
    id: 'reskamraten',
    triggers: ['mote'],
    title: 'Någon vill följa med',
    text: 'Ni har rest åt samma håll i tre dagar utan att planera det, och nu frågar hen rakt ut.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Res tillsammans en bit',
        outcomes: [
          { text: 'Ni delar på allt i en vecka och det blir billigare för båda.', weight: 3, effect: { money: 600, rykte: 1 } },
          { text: 'Ni upptäcker på tredje dagen att ni vill helt olika saker. Ni skiljs vänligt.', weight: 2 },
        ],
      },
      {
        label: 'Res ensam',
        outcomes: ett('Det är därför du åkte. Hen förstår.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'gamla-kvinnan-tyget',
    triggers: ['mote'],
    title: 'Hon väver på trottoaren',
    text: 'Väven är halvfärdig och mönstret är sådant du aldrig sett. Hon pekar på en pall.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Sitt ner och lär dig',
        outcomes: ett(
          'Två timmar senare kan du grunderna, och hon skickar med dig en remsa som present.',
          { rating: 8, rykte: 2 },
          'bra'
        ),
      },
      {
        label: 'Köp det färdiga stycket',
        outcomes: ett('Det är för dyrt och det är värt det.', { money: -320 }),
      },
    ],
  },
  {
    id: 'barnen-fotboll',
    triggers: ['mote'],
    title: 'De behöver en till',
    text: 'Bollen rullar fram till dina fötter och sex par ögon väntar på vad du gör med den.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Spela med',
        outcomes: [
          { text: 'Ditt lag förlorar med tolv mot fyra. Du blir kvar i en timme.', weight: 3, effect: { rykte: 2 } },
          { text: 'Du gör mål. Hela gatan skriker. Du minns det längre än de gör.', weight: 2, tone: 'bra', effect: { rykte: 2 } },
        ],
      },
      {
        label: 'Sparka tillbaka bollen',
        outcomes: ett('De ropar tack och glömmer dig inom tio sekunder.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'journalisten',
    triggers: ['mote'],
    title: 'En lokal journalist vill fråga',
    text: 'Hon skriver om vad utlänningar tror om {land} och har en penna redo.',
    tone: 'blandat',
    weight: 2,
    choices: [
      {
        label: 'Svara ärligt',
        outcomes: [
          { text: 'Citatet hamnar i tidningen dagen därpå och vandrarhemmets personal skrattar gott.', weight: 3, effect: { rykte: 1 } },
          { text: 'Citatet blir kortare i tryck än du sa det, och betyder något annat.', weight: 2, tone: 'blandat', effect: { rykte: -1 } },
        ],
      },
      {
        label: 'Be att få slippa',
        outcomes: ett('Hon nickar och letar upp någon annan inom en minut.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'gamle-sjomannen',
    triggers: ['mote'],
    title: 'Han har seglat överallt',
    text: 'Mannen på kajen räknar upp hamnar i en ordning som bara han förstår, och har varit i dem alla.',
    tone: 'stamning',
    weight: 3,
    effect: { rating: 6 },
  },
  {
    id: 'munken',
    triggers: ['mote'],
    title: 'Någon ber om en tjänst',
    text: 'En äldre man frågar om du kan bära hans väska en bit. Han går långsamt och du har tid.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Bär den hela vägen',
        outcomes: ett(
          'Det blir längre än en bit. Han bjuder på te och berättar om staden i en timme.',
          { rating: 8, rykte: 3, days: 1 }
        ),
      },
      {
        label: 'Bär den till hörnet',
        outcomes: ett('Han tackar och klarar resten själv.', { rykte: 1 }),
      },
    ],
  },
  {
    id: 'kortspelet',
    triggers: ['mote'],
    title: 'Fyra vid ett bord vill ha en femte',
    text: 'Reglerna förklaras på trettio sekunder och stämmer inte överens mellan de fyra.',
    tone: 'absurd',
    weight: 3,
    choices: [
      {
        label: 'Sätt dig och spela',
        outcomes: [
          { text: 'Du förlorar allt du satsat och lär dig reglerna precis när ni slutar.', weight: 3, effect: { money: -260 } },
          { text: 'Du vinner utan att veta hur. Ingen ifrågasätter det.', weight: 2, tone: 'bra', effect: { money: 480 } },
        ],
      },
      {
        label: 'Titta på',
        outcomes: ett('Efter en timme förstår du fortfarande ingenting.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'brevet',
    triggers: ['mote'],
    title: 'Kan du posta det här?',
    text: 'En kvinna räcker fram ett brev med frimärke och en adress i ett land du ska till.',
    tone: 'allvar',
    weight: 2,
    choices: [
      {
        label: 'Ta med det',
        outcomes: [
          { text: 'Du postar det tre städer senare. Du får aldrig veta vad som stod i det.', weight: 4, effect: { rykte: 2 } },
          { text: 'Det ligger kvar i sidfickan hela resan. Du hittar det när du packar upp hemma.', weight: 2, tone: 'blandat', effect: { rykte: -1 } },
        ],
      },
      {
        label: 'Säga nej',
        outcomes: ett('Hon förstår, och frågar nästa.', undefined, 'stamning'),
      },
    ],
  },

  {
    id: 'museivakten-somnar',
    triggers: ['sevardhet'],
    title: 'Vakten har somnat',
    text: 'Han sitter på sin stol vid {sevardhet} med hakan i bröstet, och salen är helt tom.',
    tone: 'absurd',
    weight: 3,
    choices: [
      {
        label: 'Väck honom försiktigt',
        outcomes: ett(
          'Han spritter till, blir generad och visar dig en sal som inte står i broschyren.',
          { rating: 10, rykte: 1 },
          'bra'
        ),
      },
      {
        label: 'Låt honom sova',
        outcomes: ett('Du går runt i tystnad och har hela salen för dig själv.', { rating: 5 }, 'stamning'),
      },
    ],
  },
  {
    id: 'regn-vid-sevardheten',
    triggers: ['sevardhet'],
    title: 'Regnet kom precis',
    text: 'Du står under ett tak vid {sevardhet} tillsammans med en busslast pensionärer som sjunger.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'guidebok-fel',
    triggers: ['sevardhet'],
    title: 'Guideboken har fel',
    text: 'Enligt boken öppnar {sevardhet} klockan nio. Enligt skylten på dörren gäller det inte på tisdagar.',
    tone: 'daligt',
    weight: 3,
    choices: [
      {
        label: 'Vänta till i morgon',
        outcomes: ett('Du kommer in först, före alla andra, och det var värt dagen.', { days: 1, rating: 10 }),
      },
      {
        label: 'Strunta i det',
        outcomes: ett('Du ser den utifrån och går vidare. Det får duga.', { rating: 2 }, 'stamning'),
      },
    ],
  },
  {
    id: 'arkeologen',
    triggers: ['sevardhet'],
    title: 'Någon gräver bakom staketet',
    text: 'En arkeolog vid {sevardhet} vinkar in dig och pekar på något i jorden som du inte ser.',
    tone: 'bra',
    weight: 2,
    choices: [
      {
        label: 'Fråga vad det är',
        outcomes: ett(
          'Hon förklarar i tjugo minuter och du ser det till slut. En keramikskärva, tolvhundratalet.',
          { rating: 12 }
        ),
      },
      {
        label: 'Nicka och gå vidare',
        outcomes: ett('Hon böjer sig ner igen utan att se upp.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'souvenirstandet',
    triggers: ['sevardhet'],
    title: 'Stånden utanför',
    text: 'Tjugo bord med samma sak, och en försäljare som säger att just hans är handgjord.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Köp något litet',
        outcomes: [
          { text: 'Den går sönder i ryggsäcken innan nästa stad.', weight: 3, effect: { money: -140 } },
          { text: 'Den håller hela resan och blir den sak du minns platsen genom.', weight: 2, tone: 'bra', effect: { money: -140, rykte: 1 } },
        ],
      },
      {
        label: 'Gå förbi allihop',
        outcomes: ett('Tjugo röster följer dig ut på gatan.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'trappan-upp',
    triggers: ['sevardhet'],
    title: 'Det går att gå upp',
    text: 'En trappa vid {sevardhet} leder till en utsiktsplats. Skylten säger fyrahundra steg.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Gå upp allihop',
        outcomes: ett('Benen värker i två dagar. Utsikten var värd båda.', { rating: 10 }),
      },
      {
        label: 'Stanna nere',
        outcomes: ett('Du hör folk flämta på väg ner och känner dig nöjd med beslutet.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'skolklassen',
    triggers: ['sevardhet'],
    title: 'Fyrtio barn i matchande kepsar',
    text: 'De fyller hela {sevardhet}, och läraren räknar dem två gånger utan att komma till samma tal.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'gratis-guide',
    triggers: ['sevardhet'],
    title: 'En student erbjuder sig',
    text: 'Hon guidar gratis för att öva språket, säger hon, och menar det.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Följ med och ge dricks efteråt',
        outcomes: ett('Turen är bättre än den betalda, och hon blir uppriktigt glad.', { money: -120, rating: 12, rykte: 2 }),
      },
      {
        label: 'Följ med utan att ge något',
        outcomes: ett('Hon säger inget om det. Du tänker på det senare.', { rating: 12, rykte: -1 }),
      },
    ],
  },

  {
    id: 'perrongen-sover',
    triggers: ['vantan'],
    title: 'Någon sover på bänken bredvid',
    text: 'En ryggsäck som kudde, en jacka som filt och en väckarklocka inställd på tre olika tider.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'biljettkontroll-kon',
    triggers: ['vantan'],
    title: 'Kön till luckan står stilla',
    text: 'Framför dig diskuterar någon en ombokning som verkar röra fyra länder och tre datum.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Vänta ut det',
        outcomes: ett('Fyrtio minuter senare är det din tur, och ditt ärende tar nittio sekunder.', undefined, 'stamning'),
      },
      {
        label: 'Prova automaten',
        outcomes: [
          { text: 'Den fungerar. Du står vid perrongen medan kön inte har rört sig.', weight: 3, effect: { money: 40 } },
          { text: 'Den tar ditt kort, tänker i en minut och lämnar tillbaka det utan biljett.', weight: 2, tone: 'daligt' },
        ],
      },
    ],
  },
  {
    id: 'hunden-i-hallen',
    triggers: ['vantan'],
    title: 'En hund i tjänst',
    text: 'Den går igenom hallen med sin förare, nosar på varje väska och bryr sig inte om någon.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'vantsalens-tv',
    triggers: ['vantan'],
    title: 'TV:n i väntsalen',
    text: 'Den visar en match på ett språk ingen förstår, och halva hallen tittar ändå.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },

  {
    id: 'vandrarhemmets-gitarr',
    triggers: ['boende'],
    title: 'Det står en gitarr i hörnet',
    text: 'Den saknar en sträng och alla på våningen har provat den i kväll.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'rumskamraten-reser',
    triggers: ['boende'],
    title: 'Rumskamraten packar klockan fem',
    text: 'Plastpåsar, blixtlås och en pannlampa rakt i ansiktet på var och en i rummet.',
    tone: 'absurd',
    weight: 3,
    effect: {},
  },
  {
    id: 'boka-om-natten',
    triggers: ['boende'],
    title: 'Priset gick upp över natten',
    text: 'Samma säng, samma rum, men receptionen har en ny lapp på disken.',
    tone: 'daligt',
    weight: 3,
    choices: [
      {
        label: 'Betala och stanna',
        outcomes: ett('Dyrare, men du slipper packa ihop igen.', { money: -240 }),
      },
      {
        label: 'Leta upp något annat',
        outcomes: [
          { text: 'Du hittar ett billigare ställe två kvarter bort, med bättre frukost.', weight: 3, effect: { money: 120 } },
          { text: 'Allt är fullt. Du kommer tillbaka och betalar det nya priset ändå.', weight: 2, tone: 'daligt', effect: { money: -240, days: 1 } },
        ],
      },
    ],
  },
  {
    id: 'arbetsintyget',
    triggers: ['arbete'],
    title: 'Någon slutar samma dag',
    text: 'En kollega har jobbat här i elva år och går hem för sista gången utan att någon säger något.',
    tone: 'allvar',
    weight: 3,
    choices: [
      {
        label: 'Säg något innan hen går',
        outcomes: ett('Ni står i porten i tio minuter. Hen tackar och menar det.', { rykte: 2 }),
      },
      {
        label: 'Låt bli, du är ju bara här en vecka',
        outcomes: ett('Dörren går igen och skiftet fortsätter.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'kunden-klagar',
    triggers: ['arbete', 'handel'],
    title: 'En kund är arg på fel person',
    text: 'Något har gått snett tidigare i dag och du står närmast disken.',
    tone: 'blandat',
    weight: 3,
    choices: [
      {
        label: 'Lyssna färdigt',
        outcomes: ett(
          'Efter fem minuter tar ilskan slut av sig själv, och kunden ber om ursäkt.',
          { rykte: 2 }
        ),
      },
      {
        label: 'Hämta arbetsledaren',
        outcomes: ett('Det löser sig, men du fick inte veta vad det handlade om.', undefined, 'stamning'),
      },
    ],
  },
  {
    id: 'aterlamnat',
    triggers: ['handel'],
    title: 'Någon har glömt sin väska',
    text: 'Den står vid disken och ägaren är redan ute på gatan.',
    tone: 'bra',
    weight: 3,
    choices: [
      {
        label: 'Spring efter',
        outcomes: ett('Du hinner ifatt vid hörnet. Tacksamheten är översvallande och kort.', { rykte: 2, money: 100 }),
      },
      {
        label: 'Lämna den till handlaren',
        outcomes: ett('Handlaren ställer den bakom disken och nickar åt dig.', { rykte: 1 }),
      },
    ],
  },
  {
    id: 'medresenaren-somnar',
    triggers: ['resa'],
    title: 'Någon somnar på din axel',
    text: 'Det är fyra timmar kvar och du vågar inte röra dig.',
    tone: 'stamning',
    weight: 3,
    effect: {},
  },
  {
    id: 'fel-vagn',
    triggers: ['resa'],
    title: 'Fel vagn, rätt tåg',
    text: 'Din plats visar sig ligga sex vagnar bort, och gången är full av bagage.',
    tone: 'absurd',
    weight: 3,
    effect: {},
  },
];

export const EVENT_BY_ID: Record<string, GameEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
);

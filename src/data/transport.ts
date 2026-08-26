/**
 * Transportnätverket: vad som går att ta sig fram med, och vart.
 *
 * Modellen är avsiktligt grov. Målet är inte att spegla verkliga tidtabeller
 * utan att en resa som känns rimlig för en vanlig spelare ska vara tillåten,
 * och en som känns uppenbart absurd ska vara det inte. Stockholm–Göteborg med
 * tåg ska fungera; Stockholm–Peking med tåg ska inte dyka upp.
 *
 * Tre saker avgör vad som erbjuds:
 *   1. landregionerna på städerna (data/cities.ts)
 *   2. grannskapet mellan regionerna här nedan
 *   3. avståndstaken per färdsätt
 *
 * Flyget står utanför nätverket och når allt över en viss sträcka. Det är
 * medvetet: en spelare ska aldrig kunna måla in sig i ett hörn utan väg
 * vidare. Det som hindrar långa hopp är priset, inte en spärr.
 */

export type TransportMode = 'buss' | 'tag' | 'farja' | 'flyg';

export const MODE_LABELS: Record<TransportMode, string> = {
  buss: 'Buss',
  tag: 'Tåg',
  farja: 'Färja',
  flyg: 'Flyg',
};

/**
 * Vilka landregioner som hänger ihop på marken. Listan läses åt båda hållen;
 * valideringen kontrollerar att den är symmetrisk.
 *
 * Grannskapen är de sträckor ryggsäckare faktiskt tar över land, inte varje
 * teoretiskt gångbar landmassa. Sahara korsas med buss från Marocko till
 * Senegal, den afrikanska ryggraden går Kairo-Addis, Vänskapsvägen går över
 * Tibet till Katmandu och tåget söderut från Peking når Hanoi.
 *
 * Kvar utanför står bara öarna: Island, Irland, Japan, Kuba, Nya Zeeland,
 * Korea, Australien och Storbritannien - de når man med färja eller flyg.
 */
export const LAND_ADJACENCY: Record<string, string[]> = {
  norden: ['centraleuropa'],
  centraleuropa: ['norden', 'sydeuropa', 'osteuropa', 'brittiska-oarna', 'balkan'],
  sydeuropa: ['centraleuropa'],
  'brittiska-oarna': ['centraleuropa'],
  balkan: ['centraleuropa', 'osteuropa'],
  osteuropa: ['centraleuropa', 'balkan', 'finland', 'mellanostern'],
  finland: ['osteuropa'],
  mellanostern: ['osteuropa', 'nordafrika'],
  nordafrika: ['mellanostern', 'vastafrika', 'ostafrika'],
  vastafrika: ['nordafrika'],
  ostafrika: ['nordafrika', 'sodraafrika'],
  sodraafrika: ['ostafrika'],
  kina: ['sydostasien', 'sydasien'],
  sydostasien: ['kina'],
  sydasien: ['kina'],
};

/**
 * Färjelinjer, angivna en gång per par och lästa åt båda hållen. Bara sträckor
 * där båt är det man faktiskt tar, inte varje teoretiskt segelbar rutt.
 *
 * Varje linje har ett fartyg och ett rederi, så att hamnens avgångstavla kan
 * skylta med `M/S Aurora` i stället för bara ordet "Färja". `avgangar` är de
 * tider linjen brukar gå; en färja går ett par gånger om dygnet, inte var
 * tjugonde minut, och det är just den glesheten som gör hamnen till en hamn.
 */
export interface FerryLink {
  a: string;
  b: string;
  /** Rederiet som trafikerar linjen */
  rederi: string;
  /** Fartygets namn, utan M/S */
  fartyg: string;
  /** Beskrivning på biljetten */
  desc: string;
  /** Ungefärliga avgångstider, minuter efter midnatt */
  avgangar: number[];
}

const kl = (h: number, m = 0) => h * 60 + m;

export const FERRY_LINES: FerryLink[] = [
  {
    a: 'stockholm',
    b: 'helsingfors',
    rederi: 'Ålandslinjen',
    fartyg: 'Aurora',
    desc: 'Kvällsfärjan över Ålands hav, framme till frukost.',
    avgangar: [kl(16, 45), kl(19, 30)],
  },
  {
    a: 'kopenhamn',
    b: 'oslo',
    rederi: 'Fjordlinjen',
    fartyg: 'Skagerrak',
    desc: 'Nattfärjan uppför Oslofjorden.',
    avgangar: [kl(16, 30)],
  },
  {
    a: 'london',
    b: 'dublin',
    rederi: 'Irish Sea Ferries',
    fartyg: 'Saint Brendan',
    desc: 'Tåg till kusten och färja över Irländska sjön.',
    avgangar: [kl(8, 15), kl(14, 40), kl(21, 5)],
  },
  {
    a: 'barcelona',
    b: 'rom',
    rederi: 'Linea Tirreno',
    fartyg: 'Mediterranea',
    desc: 'Medelhavsfärjan till Civitavecchia, en natt ombord.',
    avgangar: [kl(21, 15)],
  },
  {
    a: 'aten',
    b: 'rom',
    rederi: 'Patras Lines',
    fartyg: 'Adriatica',
    desc: 'Färja från Patras till Adriatiska kusten.',
    avgangar: [kl(17, 30)],
  },
  {
    a: 'marrakech',
    b: 'barcelona',
    rederi: 'Détroit Ferries',
    fartyg: 'Tarifa',
    desc: 'Buss till kusten och färja över Gibraltar sund.',
    avgangar: [kl(7, 0), kl(13, 45)],
  },
  {
    a: 'tokyo',
    b: 'seoul',
    rederi: 'Genkai Ferry',
    fartyg: 'Kaiyo',
    desc: 'Färja över Koreasundet, med tåg i båda ändar.',
    avgangar: [kl(12, 30), kl(23, 55)],
  },
];

/**
 * Samma linjer i den korta formen `[a, b, beskrivning]`, som reselogiken och
 * valideringen läser. Härledd, så att ett fartyg aldrig kan finnas på tavlan
 * utan att linjen också går att boka.
 */
export const FERRY_LINKS: Array<[string, string, string]> = FERRY_LINES.map(
  (l) => [l.a, l.b, l.desc]
);

/**
 * Avståndstak per färdsätt, i kilometer. Över taket erbjuds färdsättet inte
 * alls, oavsett hur bra förbindelserna är.
 *
 * Taken satt vid 200 mil gjorde elva av fyrtiosju städer till rena flygplatser
 * - Peking hade ingen tågstation, New York ingen bussterminal. Riktiga
 * ryggsäckare åker betydligt längre än så: bussen Kairo-Addis är tre dygn,
 * tåget Peking-Hanoi två, och Amtraks tvärbana över USA fyra. Taken ligger nu
 * där de sträckorna ryms, och tiden får vara det som avskräcker i stället för
 * en spärr - en buss på 300 mil kostar fem resdagar boende.
 */
export const MODE_RANGE: Record<TransportMode, { min: number; max: number }> = {
  buss: { min: 0, max: 3400 },
  tag: { min: 0, max: 4400 },
  farja: { min: 0, max: 2600 },
  // Under 35 mil tar ingen flyget, och det behövs inte: så korta sträckor
  // ligger alltid inom räckhåll för buss eller tåg.
  flyg: { min: 350, max: Infinity },
};

/** Grundavgift och kilometerpris per färdsätt, i basenheter. */
export const MODE_COST: Record<TransportMode, { base: number; perKm: number }> = {
  buss: { base: 60, perKm: 0.3 },
  tag: { base: 120, perKm: 0.55 },
  farja: { base: 180, perKm: 0.6 },
  flyg: { base: 450, perKm: 0.62 },
};

/**
 * Ungefärlig sträcka per resdag, används för att räkna restid.
 *
 * Fjärrbussar byter förare och rullar en bra bit mer än sex hundra kilometer
 * om dygnet, och ett nattåg gör tolv hundra utan att någon höjer på
 * ögonbrynen. Talen är höjda i takt med avståndstaken, så att en riktigt lång
 * landresa blir dryg men inte orimlig.
 */
export const MODE_KM_PER_DAY: Record<TransportMode, number> = {
  buss: 750,
  tag: 1200,
  farja: 450,
  flyg: 5000,
};

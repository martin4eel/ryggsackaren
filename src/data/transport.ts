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
 * Regioner som saknas här är öar eller landområden utan rimlig landförbindelse
 * till någon annan stad i spelet: Irland, Island, Japan, Kuba, Nya Zeeland,
 * Korea, Kina, Australien och de tre afrikanska hörnen.
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
  nordafrika: ['mellanostern'],
};

/**
 * Färjelinjer, angivna en gång per par och lästa åt båda hållen. Bara sträckor
 * där båt är det man faktiskt tar, inte varje teoretiskt segelbar rutt.
 */
export const FERRY_LINKS: Array<[string, string, string]> = [
  ['stockholm', 'helsingfors', 'Kvällsfärjan över Ålands hav, framme till frukost.'],
  ['kopenhamn', 'oslo', 'Nattfärjan uppför Oslofjorden.'],
  ['london', 'dublin', 'Tåg till kusten och färja över Irländska sjön.'],
  ['barcelona', 'rom', 'Medelhavsfärjan till Civitavecchia, en natt ombord.'],
  ['aten', 'rom', 'Färja från Patras till Adriatiska kusten.'],
  ['marrakech', 'barcelona', 'Buss till kusten och färja över Gibraltar sund.'],
  ['tokyo', 'seoul', 'Färja över Koreasundet, med tåg i båda ändar.'],
];

/**
 * Avståndstak per färdsätt, i kilometer. Över taket erbjuds färdsättet inte
 * alls, oavsett hur bra förbindelserna är.
 *
 * Taken är satta så att de klassiska ryggsäcksrutterna ryms - nattbussen
 * Rio–Buenos Aires, tåget Aten–Prag - men inte det orimliga.
 */
export const MODE_RANGE: Record<TransportMode, { min: number; max: number }> = {
  buss: { min: 0, max: 2000 },
  tag: { min: 0, max: 2200 },
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

/** Ungefärlig sträcka per resdag, används för att räkna restid. */
export const MODE_KM_PER_DAY: Record<TransportMode, number> = {
  buss: 600,
  tag: 1000,
  farja: 450,
  flyg: 5000,
};

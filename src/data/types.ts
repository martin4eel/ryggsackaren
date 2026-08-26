export type Region =
  | 'norden'
  | 'europa'
  | 'nordamerika'
  | 'latinamerika'
  | 'afrika'
  | 'mellanostern'
  | 'asien'
  | 'oceanien';

export interface Currency {
  /** ISO-liknande kod, t.ex. SEK */
  code: string;
  /** Kort symbol som visas efter beloppet, t.ex. "kr" */
  symbol: string;
  /** Namn i plural, t.ex. "svenska kronor" */
  name: string;
  /** Hur många enheter av valutan en basenhet (1 kr) motsvarar */
  perBase: number;
  /** Antal decimaler att visa */
  decimals: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  region: Region;
  currency: string;
  /** Latitud i grader (norr positiv) */
  lat: number;
  /** Longitud i grader (öst positiv) */
  lon: number;
  /** Tidszon som UTC-offset i timmar */
  utc: number;
  /** Prisnivå för boende och mat, 1.0 = medel */
  costIndex: number;
  /** Kort presentationstext på turistbyrån */
  blurb: string;
  /** Sevärdhet som nämns i staden */
  landmark: string;
  /** Jobb-id:n som finns att söka här */
  jobs: string[];
  /** Souvenir-id:n som säljs i stadens souvenirbutik */
  souvenirs: string[];
}

/** Frågekategori. Används både för jobbfrågor och certifikat. */
export type Category =
  | 'geografi'
  | 'natur'
  | 'historia'
  | 'mat'
  | 'sport'
  | 'musik'
  | 'konst'
  | 'film'
  | 'teknik'
  | 'medicin'
  | 'sprak'
  | 'ekonomi'
  | 'hav'
  | 'djur'
  | 'rymden'
  | 'trafik'
  | 'bygg'
  | 'mode';

/** Arkadmoment som bryter av frågorna, precis som i originalet. */
export type MinigameKind =
  /** Sortera föremål som rullar förbi på ett band till rätt korg */
  | 'sortering'
  /** Utför arbetsledarens order i rätt ordning innan tiden går ut */
  | 'instrument'
  /** Upprepa en sekvens ur minnet */
  | 'sekvens'
  /** Stoppa en mätare inom rätt zon */
  | 'precision'
  /** Räkna ihop rätt växel i huvudet */
  | 'vaxel'
  /** Träffa det som ska plockas och låt resten vara */
  | 'traffa'
  /** Håll något i balans medan det driver åt sidan */
  | 'balans'
  /** Träffa slaget i takt med metronomen */
  | 'takt';

export interface Minigame {
  kind: MinigameKind;
  /** Rubrik på uppgiften, t.ex. "Sortera fångsten" */
  title: string;
  /** Instruktion som visas innan man börjar */
  brief: string;
  /**
   * Etiketter för det som ska hanteras. Betydelsen beror på typen:
   *
   * - `sortering`: korgarnas namn, med `pool` som innehåll
   * - `instrument`: reglagen i panelen
   * - `sekvens`: plattorna som blinkar
   * - `precision`: namnet på det som mäts in (första posten)
   * - `vaxel`: varorna i kassan
   * - `traffa`: det som ska plockas, med `avoid` som det som ska undvikas
   * - `balans`: namnet på det som ska hållas i balans (första posten)
   * - `takt`: slagen som ska träffas i tur och ordning
   */
  items: string[];
  /** Enhet eller måttord som visas i precisionsspelet */
  unit?: string;
  /**
   * Bara för `sortering`: konkreta föremål per korg, i samma ordning som
   * `items`. Utan det här blir sorteringen meningslös, eftersom föremålet
   * annars bara är korgens eget namn.
   */
  pool?: string[][];
  /** Bara för `traffa`: sådant som inte får träffas. */
  avoid?: string[];
}

export interface Job {
  id: string;
  /** Yrkestitel, t.ex. "Flygvärdinna" */
  title: string;
  /** Arbetsgivare i annonsen */
  employer: string;
  category: Category;
  /** Löneklass 1-3. Högre klass kräver bättre stadspoäng eller certifikat. */
  wageClass: 1 | 2 | 3;
  /** Antal arbetsdagar (frågor) ett skift innehåller */
  shiftLength: number;
  /** Annonstext i tidningen */
  ad: string;
  /** Arkadmomentet som avslutar skiftet */
  minigame: Minigame;
  /** Kort miljöbeskrivning som visas på arbetsplatsen */
  scene: string;
}

export interface Souvenir {
  id: string;
  name: string;
  /** Basvärde i basenheter */
  basePrice: number;
  /** Regioner där varan är billig (tillverkas) */
  cheapIn: Region[];
  /** Regioner där varan är eftertraktad */
  hotIn: Region[];
  /** Kort beskrivning i butiken */
  desc: string;
}

export interface Question {
  /** Frågetext */
  q: string;
  /** Svarsalternativ. Första alternativet är alltid det rätta. */
  a: string[];
  /** Svårighet: 1 = lätt (Turist), 2 = svår (Globetrotter) */
  d: 1 | 2;
  /** Frivillig kuriosa som visas efter svaret */
  info?: string;
}

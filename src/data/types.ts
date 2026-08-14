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

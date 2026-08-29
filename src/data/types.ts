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
  /**
   * Landområde för resor på marken. Två städer kan nås med buss eller tåg
   * bara om de ligger i samma landregion eller i två som gränsar till
   * varandra enligt LAND_ADJACENCY i data/transport.ts.
   *
   * Regionerna är inte kontinenter utan "vad man rimligen kan bussa mellan".
   * Helsingfors ligger därför i en egen region trots att Stockholm är fyra
   * hundra kilometer bort fågelvägen: landvägen runt Bottenviken är fyra
   * gånger så lång, och den riktiga förbindelsen är en färja.
   */
  landRegion: string;
  /**
   * Har staden användbar fjärrtågtrafik? Styr om tåg alls kan erbjudas.
   * Katmandu och Reykjavík har ingen, Berlin har utmärkt.
   */
  rail: boolean;
  /**
   * Har staden en flygplats med reguljär passagerartrafik? Utan den går
   * inga flyg alls till eller från staden, och man får ta sig till en
   * granne på marken först.
   */
  airport: boolean;
  /**
   * Har staden en flygplats med interkontinental trafik? Från en stad utan
   * hub får långa flyg en mellanlandning: en dag extra och ett påslag på
   * priset. Resan visas fortfarande som en enda biljett - spelet ska inte
   * tvinga någon att planera byten för hand.
   */
  hub: boolean;
  /** Kort presentationstext på turistbyrån */
  blurb: string;
  /** Sevärdhet som nämns i staden */
  landmark: string;
  /** Jobb-id:n som finns att söka här */
  jobs: string[];
  /**
   * Lokala arbetsgivarnamn som ersätter jobbets standardnamn i just den här
   * staden. Yrkena delas mellan städer, men arbetsgivarna borde höra hemma
   * där de ligger: ett museum i Västerås heter inte Nationalmuseet.
   *
   * Nyckeln är ett jobb-id ur `jobs`, värdet namnet som visas i annonsen och
   * på arbetsplatsen.
   */
  employers?: Record<string, string>;
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
  | 'mode'
  | 'samhalle';

/** Arkadmoment som bryter av frågorna, precis som i originalet. */
export type MinigameKind =
  /** Peka ut rätt sak på ett foto, en fråga i taget, i lugn takt */
  | 'peka'
  /** Avgör en sak i taget mellan två alternativ, utan klocka, med fakta efteråt */
  | 'avgor'
  /** Ett kunskapsprov: svårare frågor en i taget, utan klocka, med förklaring */
  | 'quiz'
  /** Ett lagmärke i mitten, fyra spelare ovanför: vem hör hemma i laget? */
  | 'lagval'
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
  /** Kunden säger vad hen behöver; peka ut rätt foto av fyra */
  | 'bildval'
  /** Håll något i balans medan det driver åt sidan */
  | 'balans'
  /** Träffa slaget i takt med metronomen */
  | 'takt';

/**
 * Ett föremål på sorteringsbandet: en text, eller ett foto med namn. Med
 * foton blir sorteringen en bildfråga - man ser fisken och ska veta vilket
 * nät den hör i, i stället för att läsa ordet "torsk".
 */
export type PoolItem = string | { bild: string; namn: string };

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
  pool?: PoolItem[][];
  /** Bara för `traffa`: sådant som inte får träffas. */
  avoid?: string[];
  /**
   * Bara för `bildval`: katalogen av foton (id ur data/quizImages.ts) med
   * namn, och kunderna som kommer in. Varje kund pekar på ett foto som är
   * rätt, och gärna på några som är frestande fel - det är där det blir
   * klurigt.
   */
  /**
   * Bara för `peka`: fotot man pekar på (id i public/quiz/), facitbilden
   * som visas när alla frågor är besvarade, träffytorna i procent av bildens
   * bredd och höjd (radien i procent av bredden) och frågorna i ordning.
   */
  peka?: {
    bild: string;
    facitBild: string;
    punkter: { id: string; namn: string; x: number; y: number; r: number; forklaring: string }[];
    fragor: { text: string; svar: string }[];
  };
  /**
   * Bara för `avgor`: de två alternativen (id och etikett) och posterna som
   * visas en i taget, var och en med rätt alternativ och en faktarad som
   * visas efter svaret - rätt eller fel, man ska lära sig svampen.
   */
  avgor?: {
    val: { id: string; namn: string }[];
    poster: { bild: string; namn: string; svar: string; info: string }[];
    /** Hur många poster som visas per skift (slumpade); alla om utelämnat */
    antal?: number;
  };
  /** Bara för `bildval`: vad "kunden" kallas i statusraden, t.ex. 'Gäst'/'gäster' */
  roll?: { en: string; flera: string; klara: string };
  /**
   * Bara för `quiz`: ett prov i yrkets kärnkunskap. `antal` frågor lottas ur
   * banken per skift; formatet är samma som jobbfrågornas.
   */
  quiz?: { antal: number; fragor: Question[] };
  /**
   * Bara för `lagval`: lagmärken och spelare (porträtt, namn, lag). Rundorna
   * kan anges - lag, rätt spelare, tre fel - annars lottas de.
   */
  lagval?: {
    /**
     * Laget som ska matchas. `bild` är valfri: saknas den skrivs lagets namn
     * ut i stället för ett märke. Landslagen visas med flagga, klubbarna med
     * namn - ett klubbmärke är någon annans varumärke, och behövs inte för
     * att frågan ska gå att svara på.
     */
    lag: { id: string; bild?: string; namn: string }[];
    spelare: { bild: string; namn: string; lag: string }[];
    rundor?: { lag: string; ratt: string; fel: string[] }[];
    antal?: number;
  };
  bildval?: { bild: string; namn: string }[];
  /** Sekunder per kund i bildvalet; utelämnas för standardtempot (14 s) */
  tid?: number;
  kunder?: {
    /** Vad kunden säger */
    text: string;
    /** Bild-id som är rätt */
    svar: string;
    /** Bild-id som ska vara med som lockbeten, om de finns i katalogen */
    nastan?: string[];
    /** Vad kunden säger när man pekar fel */
    fel?: string;
  }[];
}

/**
 * De sex huvudkategorierna. Löneklass 1 är öppen för alla; varje genomfört
 * skift ger en poäng i jobbets huvudkategori, och poängen är det som öppnar
 * löneklass 2 och 3 i samma kategori. Man börjar längst ner och jobbar sig
 * uppåt, ett område i taget.
 */
export type Huvudkategori =
  | 'vetenskap'
  | 'konst'
  | 'praktiskt'
  | 'aventyr'
  | 'sport'
  | 'mat';

export interface Job {
  id: string;
  /** Yrkestitel, t.ex. "Flygvärdinna" */
  title: string;
  /** Arbetsgivare i annonsen */
  employer: string;
  category: Category;
  /** Huvudkategorin som poängen räknas i. */
  huvud: Huvudkategori;
  /** Löneklass 1-3. Högre klass kräver poäng i huvudkategorin. */
  wageClass: 1 | 2 | 3;
  /** Antal arbetsdagar (frågor) ett skift innehåller */
  shiftLength: number;
  /** Annonstext i tidningen */
  ad: string;
  /**
   * Arkadmomentet som avslutar skiftet. Löneklass 1 har inget: ett
   * ingångsjobb ska vara fem frågor och lön, inte en obligatorisk lek.
   */
  minigame?: Minigame;
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

/**
 * Reglagefråga: svaret är ett tal man drar sig fram till, inte ett alternativ
 * man pekar på. "Vilket år föll Berlinmuren?" har inga fyra svar att välja
 * mellan - man vet ungefär, och drar reglaget dit.
 *
 * `tolerans` är hur nära man måste komma. Ett årtal kräver ofta exakthet,
 * medan höjden på ett berg får slinka igenom på hundra meter.
 */
export interface Reglage {
  min: number;
  max: number;
  /** Steglängd: 1 för årtal, 10 för meter, 0.5 för grader. */
  steg: number;
  /** Rätt tal. */
  svar: number;
  /** Hur långt fel man får ligga och ändå ha rätt. */
  tolerans: number;
  /** Enhet efter talet, t.ex. "m" eller "°C". */
  enhet?: string;
  /**
   * Talet är ett årtal. Då skrivs det utan tusentalsavgränsare - "1989", inte
   * "1 989" - vilket är skillnaden mellan ett årtal och en summa.
   */
  artal?: boolean;
  /**
   * Liggande reglage i stället för stående. Stående passar höjd och djup,
   * liggande passar årtal och avstånd - riktningen ska betyda något.
   */
  liggande?: boolean;
  /** Etiketter i ändarna, när skalan behöver förklaras. */
  lagst?: string;
  hogst?: string;
}

export interface Question {
  /** Frågetext */
  q: string;
  /**
   * Svarsalternativ. Första alternativet är alltid det rätta.
   *
   * En reglagefråga har bara ett: det rätta svaret skrivet som det ska läsas,
   * eftersom det inte finns några alternativ att välja bland.
   */
  a: string[];
  /** Svårighet: 1 = lätt (Turist), 2 = svår (Globetrotter) */
  d: 1 | 2;
  /** Frivillig kuriosa som visas efter svaret */
  /** Frågan tas alltid med i skiftet i stället för att lottas */
  alltid?: boolean;
  /** Egen rubrik vid rätt svar, i stället för "Rätt svar!" */
  ratt?: string;
  info?: string;
  /**
   * Bild som visas ovanför frågan. Id ur data/quizImages.ts, eller
   * `stad:<stads-id>` för att återanvända ett stadsfoto som redan finns.
   */
  bild?: string;
  /**
   * Bildfråga: svaren är bilderna. Lika många som `a` och i samma ordning, så
   * att blandningen håller ihop bild och rätt svar. Etiketterna i `a` används
   * inte som knappar utan bara för att kunna säga vad det var efteråt.
   */
  bilder?: string[];
  /** Reglagefråga i stället för svarsalternativ. */
  reglage?: Reglage;
}

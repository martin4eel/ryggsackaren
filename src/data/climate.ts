/**
 * Klimat per stad, i grova drag. Inget väderarkiv - bara det som avgör hur
 * en dag brukar se ut: vilken sorts himmel, hur varmt, och om det finns en
 * regntid. Vädret på stadsskärmen räknas ur det här plus årstid och höjd.
 */

export type Climate =
  /** Fyra årstider, snö om vintern: Norden, Moskva */
  | 'nordiskt'
  /** Milt, regnigt året runt: London, Dublin, Amsterdam, Berlin, Paris */
  | 'tempererat'
  /** Torra, heta somrar och milda vintrar: Rom, Aten, Barcelona */
  | 'medelhav'
  /** Torrt och hett, kalla nätter: Kairo, Dubai, Marrakech, Amman */
  | 'oken'
  /** Varmt och fuktigt året runt: Singapore, Rio, Havanna */
  | 'tropiskt'
  /** Tropiskt med utpräglad regntid juni-september: Mumbai, Bangkok, Hanoi */
  | 'monsun'
  /** Högland: mild dag, kall natt, regntid: Katmandu, Cusco, Addis, Nairobi */
  | 'hogland'
  /** Subtropiskt med varma fuktiga somrar: Tokyo, Seoul, Sydney */
  | 'subtropiskt';

export const CITY_CLIMATE: Record<string, Climate> = {
  stockholm: 'nordiskt',
  goteborg: 'nordiskt',
  malmo: 'nordiskt',
  vasteras: 'nordiskt',
  koping: 'nordiskt',
  hudiksvall: 'nordiskt',
  oslo: 'nordiskt',
  helsingfors: 'nordiskt',
  kopenhamn: 'nordiskt',
  reykjavik: 'nordiskt',
  moskva: 'nordiskt',
  london: 'tempererat',
  dublin: 'tempererat',
  amsterdam: 'tempererat',
  berlin: 'tempererat',
  paris: 'tempererat',
  prag: 'tempererat',
  newyork: 'tempererat',
  sanfrancisco: 'tempererat',
  rom: 'medelhav',
  aten: 'medelhav',
  barcelona: 'medelhav',
  lissabon: 'medelhav',
  istanbul: 'medelhav',
  kapstaden: 'medelhav',
  kairo: 'oken',
  dubai: 'oken',
  marrakech: 'oken',
  amman: 'oken',
  singapore: 'tropiskt',
  rio: 'tropiskt',
  havanna: 'tropiskt',
  dakar: 'tropiskt',
  mumbai: 'monsun',
  bangkok: 'monsun',
  hanoi: 'monsun',
  kathmandu: 'hogland',
  cusco: 'hogland',
  addisabeba: 'hogland',
  nairobi: 'hogland',
  mexikocity: 'hogland',
  tokyo: 'subtropiskt',
  seoul: 'subtropiskt',
  peking: 'subtropiskt',
  sydney: 'subtropiskt',
  melbourne: 'subtropiskt',
  auckland: 'subtropiskt',
  buenosaires: 'subtropiskt',
  belgrad: 'tempererat',
  brescia: 'tempererat',
  sansebastian: 'tempererat',
  oaxaca: 'hogland',
};

/** Höjd över havet i meter, för städer där det märks i temperaturen. */
export const CITY_ALTITUDE: Record<string, number> = {
  kathmandu: 1400,
  cusco: 3400,
  addisabeba: 2355,
  nairobi: 1795,
  mexikocity: 2240,
  oaxaca: 1550,
};

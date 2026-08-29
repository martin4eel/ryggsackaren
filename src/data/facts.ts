/**
 * Fakta att läsa på med i atlasen.
 *
 * Spelet frågar redan ut spelaren om städerna. Det här är motsatsen: en sida
 * att slå upp innan provet, så att en resa också går att lära sig något av.
 *
 * Siffrorna är avrundade och ungefärliga. Ett folkmängdstal på tusenet exakt
 * skulle vara falsk precision - befolkningen i Istanbul ändrar sig mer mellan
 * två folkräkningar än vad avrundningen döljer. Städernas tal avser tätorten
 * eller storstadsområdet, det som en resenär skulle kalla "staden".
 */

export interface CountryFacts {
  /** Landets huvudstad, som inte alltid är den stad man står i */
  capital: string;
  /** Officiella eller allmänt talade språk */
  language: string;
  /** Dominerande trosuppfattningar, kort sammanfattat */
  religion: string;
  /** Folkmängd, skriven som den läses ut */
  population: string;
}

export const COUNTRY_FACTS: Record<string, CountryFacts> = {
  Sverige: {
    capital: 'Stockholm',
    language: 'Svenska',
    religion: 'Sekulärt, med luthersk tradition',
    population: '10,6 miljoner',
  },
  Norge: {
    capital: 'Oslo',
    language: 'Norska',
    religion: 'Sekulärt, med luthersk tradition',
    population: '5,5 miljoner',
  },
  Danmark: {
    capital: 'Köpenhamn',
    language: 'Danska',
    religion: 'Sekulärt, med luthersk tradition',
    population: '5,9 miljoner',
  },
  Finland: {
    capital: 'Helsingfors',
    language: 'Finska och svenska',
    religion: 'Sekulärt, med luthersk tradition',
    population: '5,6 miljoner',
  },
  Island: {
    capital: 'Reykjavík',
    language: 'Isländska',
    religion: 'Sekulärt, med luthersk tradition',
    population: '390 000',
  },
  Storbritannien: {
    capital: 'London',
    language: 'Engelska',
    religion: 'Kristendom, och en stor sekulär andel',
    population: '68 miljoner',
  },
  Irland: {
    capital: 'Dublin',
    language: 'Iriska och engelska',
    religion: 'Katolicism',
    population: '5,2 miljoner',
  },
  Frankrike: {
    capital: 'Paris',
    language: 'Franska',
    religion: 'Sekulärt, med katolsk tradition',
    population: '68 miljoner',
  },
  Nederländerna: {
    capital: 'Amsterdam',
    language: 'Nederländska',
    religion: 'Sekulärt, med protestantisk och katolsk tradition',
    population: '17,8 miljoner',
  },
  Tyskland: {
    capital: 'Berlin',
    language: 'Tyska',
    religion: 'Protestantism och katolicism',
    population: '84 miljoner',
  },
  Tjeckien: {
    capital: 'Prag',
    language: 'Tjeckiska',
    religion: 'Ett av Europas mest sekulära länder',
    population: '10,9 miljoner',
  },
  Italien: {
    capital: 'Rom',
    language: 'Italienska',
    religion: 'Katolicism',
    population: '59 miljoner',
  },
  Spanien: {
    capital: 'Madrid',
    language: 'Spanska, och katalanska i Katalonien',
    religion: 'Katolicism',
    population: '48 miljoner',
  },
  Portugal: {
    capital: 'Lissabon',
    language: 'Portugisiska',
    religion: 'Katolicism',
    population: '10,5 miljoner',
  },
  Grekland: {
    capital: 'Aten',
    language: 'Grekiska',
    religion: 'Grekisk-ortodox kristendom',
    population: '10,4 miljoner',
  },
  Turkiet: {
    capital: 'Ankara',
    language: 'Turkiska',
    religion: 'Islam',
    population: '85 miljoner',
  },
  Ryssland: {
    capital: 'Moskva',
    language: 'Ryska',
    religion: 'Rysk-ortodox kristendom, och islam i flera regioner',
    population: '144 miljoner',
  },
  Egypten: {
    capital: 'Kairo',
    language: 'Arabiska',
    religion: 'Islam, med en koptisk-kristen minoritet',
    population: '110 miljoner',
  },
  Marocko: {
    capital: 'Rabat',
    language: 'Arabiska och berbiska',
    religion: 'Islam',
    population: '37 miljoner',
  },
  Kenya: {
    capital: 'Nairobi',
    language: 'Swahili och engelska',
    religion: 'Kristendom',
    population: '55 miljoner',
  },
  Etiopien: {
    capital: 'Addis Abeba',
    language: 'Amhariska, oromo och tigrinja',
    religion: 'Ortodox kristendom och islam',
    population: '126 miljoner',
  },
  Senegal: {
    capital: 'Dakar',
    language: 'Franska och wolof',
    religion: 'Islam',
    population: '18 miljoner',
  },
  Sydafrika: {
    capital: 'Pretoria, men parlamentet sitter i Kapstaden',
    language: 'Tolv officiella språk, bland dem zulu, engelska och afrikaans',
    religion: 'Kristendom',
    population: '62 miljoner',
  },
  Indien: {
    capital: 'New Delhi',
    language: 'Hindi och engelska, plus ett tjugotal delstatsspråk',
    religion: 'Hinduism, med stora muslimska och sikhiska minoriteter',
    population: '1,43 miljarder',
  },
  Nepal: {
    capital: 'Katmandu',
    language: 'Nepali',
    religion: 'Hinduism och buddhism',
    population: '30 miljoner',
  },
  Thailand: {
    capital: 'Bangkok',
    language: 'Thai',
    religion: 'Theravadabuddhism',
    population: '72 miljoner',
  },
  Vietnam: {
    capital: 'Hanoi',
    language: 'Vietnamesiska',
    religion: 'Folktro och buddhism, med en stor sekulär andel',
    population: '99 miljoner',
  },
  Kina: {
    capital: 'Peking',
    language: 'Mandarin',
    religion: 'Officiellt sekulärt; buddhism, daoism och folktro',
    population: '1,41 miljarder',
  },
  Japan: {
    capital: 'Tokyo',
    language: 'Japanska',
    religion: 'Shinto och buddhism, ofta sida vid sida',
    population: '124 miljoner',
  },
  Sydkorea: {
    capital: 'Seoul',
    language: 'Koreanska',
    religion: 'Kristendom och buddhism, med en stor sekulär andel',
    population: '52 miljoner',
  },
  Singapore: {
    capital: 'Singapore är själv en stadsstat',
    language: 'Engelska, mandarin, malajiska och tamil',
    religion: 'Buddhism, islam, kristendom och hinduism',
    population: '5,9 miljoner',
  },
  'Förenade Arabemiraten': {
    capital: 'Abu Dhabi',
    language: 'Arabiska',
    religion: 'Islam',
    population: '9,5 miljoner',
  },
  Jordanien: {
    capital: 'Amman',
    language: 'Arabiska',
    religion: 'Islam',
    population: '11 miljoner',
  },
  Australien: {
    capital: 'Canberra, varken Sydney eller Melbourne',
    language: 'Engelska',
    religion: 'Kristendom, och en stor sekulär andel',
    population: '27 miljoner',
  },
  'Nya Zeeland': {
    capital: 'Wellington',
    language: 'Engelska och maori',
    religion: 'Kristendom, och en stor sekulär andel',
    population: '5,2 miljoner',
  },
  USA: {
    capital: 'Washington, D.C.',
    language: 'Engelska',
    religion: 'Kristendom, med stor religiös mångfald',
    population: '335 miljoner',
  },
  Serbien: {
    capital: 'Belgrad',
    language: 'Serbiska',
    religion: 'Ortodox kristendom',
    population: '6,6 miljoner',
  },
  Mexiko: {
    capital: 'Mexico City',
    language: 'Spanska, och 68 erkända urfolksspråk',
    religion: 'Katolicism',
    population: '129 miljoner',
  },
  Kuba: {
    capital: 'Havanna',
    language: 'Spanska',
    religion: 'Katolicism och santería',
    population: '11 miljoner',
  },
  Peru: {
    capital: 'Lima',
    language: 'Spanska, quechua och aymara',
    religion: 'Katolicism',
    population: '34 miljoner',
  },
  Brasilien: {
    capital: 'Brasília',
    language: 'Portugisiska',
    religion: 'Katolicism och evangelikal kristendom',
    population: '216 miljoner',
  },
  Argentina: {
    capital: 'Buenos Aires',
    language: 'Spanska',
    religion: 'Katolicism',
    population: '46 miljoner',
  },
};

/**
 * Folkmängd per stad, i tätorten eller storstadsområdet. Talen är avrundade
 * och avser det område en resenär skulle kalla staden, inte kommungränsen -
 * annars ser Köpenhamn ut att vara mindre än Malmö.
 */
export const CITY_POPULATION: Record<string, number> = {
  stockholm: 1_600_000,
  goteborg: 610_000,
  malmo: 360_000,
  vasteras: 130_000,
  koping: 18_000,
  hudiksvall: 17_000,
  belgrad: 1_200_000,
  brescia: 200_000,
  sansebastian: 190_000,
  oaxaca: 270_000,
  reykjavik: 140_000,
  helsingfors: 660_000,
  kopenhamn: 1_370_000,
  oslo: 710_000,
  london: 8_900_000,
  paris: 2_100_000,
  amsterdam: 920_000,
  rom: 2_750_000,
  istanbul: 15_500_000,
  moskva: 13_000_000,
  berlin: 3_800_000,
  barcelona: 1_650_000,
  lissabon: 550_000,
  aten: 640_000,
  prag: 1_350_000,
  dublin: 590_000,
  kairo: 10_000_000,
  marrakech: 1_000_000,
  nairobi: 4_400_000,
  kapstaden: 4_800_000,
  dakar: 1_300_000,
  addisabeba: 3_800_000,
  mumbai: 12_500_000,
  bangkok: 10_700_000,
  peking: 21_900_000,
  tokyo: 14_000_000,
  seoul: 9_400_000,
  singapore: 5_900_000,
  hanoi: 8_400_000,
  kathmandu: 1_000_000,
  dubai: 3_700_000,
  amman: 4_000_000,
  sydney: 5_300_000,
  melbourne: 5_200_000,
  auckland: 1_700_000,
  newyork: 8_300_000,
  sanfrancisco: 810_000,
  mexikocity: 9_200_000,
  cusco: 430_000,
  havanna: 2_100_000,
  rio: 6_700_000,
  buenosaires: 3_100_000,
};

/** Folkmängden skriven som man säger den, inte som en siffra med sju nollor. */
export function populationText(n: number): string {
  if (n >= 1_000_000) {
    const milj = n / 1_000_000;
    const tal = milj >= 10 ? Math.round(milj) : Math.round(milj * 10) / 10;
    return `${tal.toLocaleString('sv-SE')} miljoner invånare`;
  }
  return `${n.toLocaleString('sv-SE')} invånare`;
}

/**
 * Trafikbolagen som kör linjerna, ett per land och färdsätt.
 *
 * Namnen är påhittade men lokalt förankrade, precis som allt annat innehåll i
 * spelet. Poängen är att en tidtabell ska se ut som en tidtabell: en avgång
 * utan bolag och linjenummer är bara en siffra, medan "Nordflyg NF 218" är en
 * flight man kan komma ihåg att man missade.
 *
 * `railSpeed` är medelhastighet i km/h för fjärrtåg i landet, inklusive stopp.
 * Den är det som gör att tåget Paris-Barcelona känns som ett annat fordon än
 * tåget Cusco-Puno, utan att någon behöver skriva in enskilda sträckor.
 */

export interface CountryOperators {
  /** Flygbolag, med tvåbokstavskod till flightnumret */
  air: { name: string; code: string };
  /** Järnvägsbolag. Saknas det finns ingen fjärrtrafik i landet. */
  rail?: { name: string; speed: number };
  /** Bussbolag */
  bus: string;
}

/**
 * Reservbolag per världsdel, för det fall en stad läggs till i ett land som
 * ännu inte står i tabellen. Bättre ett regionalt namn än ett tomt fält.
 */
const REGION_FALLBACK: CountryOperators = {
  air: { name: 'Continental Wings', code: 'CW' },
  rail: { name: 'Regionalbanan', speed: 80 },
  bus: 'Landsvägsbussen',
};

export const OPERATORS: Record<string, CountryOperators> = {
  Sverige: {
    air: { name: 'Nordflyg', code: 'NF' },
    rail: { name: 'Rikstågen', speed: 125 },
    bus: 'Svealandsbussen',
  },
  Norge: {
    air: { name: 'Fjordvind', code: 'FV' },
    rail: { name: 'Norske Spor', speed: 85 },
    bus: 'Kystbussen',
  },
  Danmark: {
    air: { name: 'Sundair', code: 'SD' },
    rail: { name: 'Bæltebanen', speed: 120 },
    bus: 'Jyllandsbus',
  },
  Finland: {
    air: { name: 'Aurora Air', code: 'AR' },
    rail: { name: 'Suomi Raide', speed: 115 },
    bus: 'Karelenbussen',
  },
  Island: {
    air: { name: 'Sagaflug', code: 'SG' },
    bus: 'Hringvegur Coach',
  },
  Storbritannien: {
    air: { name: 'Albion Air', code: 'AB' },
    rail: { name: 'Kingsrail', speed: 130 },
    bus: 'National Coachways',
  },
  Irland: {
    air: { name: 'Shamrock Air', code: 'SH' },
    rail: { name: 'Green Isle Rail', speed: 95 },
    bus: 'Emerald Coaches',
  },
  Frankrike: {
    air: { name: 'Air Hexagone', code: 'HX' },
    rail: { name: 'Grandes Lignes', speed: 185 },
    bus: 'Cars du Midi',
  },
  Nederländerna: {
    air: { name: 'Oranje Air', code: 'OR' },
    rail: { name: 'Nederrail', speed: 115 },
    bus: 'Randstadbus',
  },
  Tyskland: {
    air: { name: 'Rheinflug', code: 'RH' },
    rail: { name: 'Kontinentalbanan', speed: 145 },
    bus: 'Autobus Germania',
  },
  Tjeckien: {
    air: { name: 'Bohemia Air', code: 'BH' },
    rail: { name: 'Bohemia Rail', speed: 100 },
    bus: 'Moravabus',
  },
  Serbien: {
    air: { name: 'Danubia Air', code: 'DU' },
    rail: { name: 'Balkanspåret', speed: 75 },
    bus: 'Beogradbussen',
  },
  Italien: {
    air: { name: 'Volare Italia', code: 'VI' },
    rail: { name: 'Ferrovie del Sole', speed: 155 },
    bus: 'Autolinee Appennino',
  },
  Spanien: {
    air: { name: 'Aire Ibérico', code: 'AI' },
    rail: { name: 'Rieles del Sur', speed: 175 },
    bus: 'Autocares Meseta',
  },
  Portugal: {
    air: { name: 'Atlântico Air', code: 'AT' },
    rail: { name: 'Comboios do Tejo', speed: 110 },
    bus: 'Rodoviária do Sul',
  },
  Grekland: {
    air: { name: 'Hellas Wings', code: 'HW' },
    rail: { name: 'Hellenic Rail', speed: 85 },
    bus: 'Leoforia Attica',
  },
  Turkiet: {
    air: { name: 'Bosphorus Air', code: 'BS' },
    rail: { name: 'Anadolu Rail', speed: 95 },
    bus: 'Anadolu Otobüs',
  },
  Ryssland: {
    air: { name: 'Volga Air', code: 'VG' },
    rail: { name: 'Transsibiriska linjen', speed: 70 },
    bus: 'Rus Avtobus',
  },
  Egypten: {
    air: { name: 'Nile Wings', code: 'NW' },
    rail: { name: 'Nilbanan', speed: 65 },
    bus: 'Delta Coach',
  },
  Marocko: {
    air: { name: 'Atlas Air', code: 'AL' },
    rail: { name: 'Chemins de l’Atlas', speed: 110 },
    bus: 'Cars du Souss',
  },
  Kenya: {
    air: { name: 'Savannah Air', code: 'SV' },
    bus: 'Rift Valley Coaches',
  },
  Etiopien: {
    air: { name: 'Abyssinia Air', code: 'AY' },
    bus: 'Highland Coach',
  },
  Senegal: {
    air: { name: 'Teranga Air', code: 'TG' },
    bus: 'Cars Rapides',
  },
  Sydafrika: {
    air: { name: 'Cape Wings', code: 'CP' },
    rail: { name: 'Karoo Rail', speed: 60 },
    bus: 'Garden Route Coaches',
  },
  Indien: {
    air: { name: 'Monsoon Air', code: 'MN' },
    rail: { name: 'Great Peninsular Railway', speed: 60 },
    bus: 'Deccan Roadways',
  },
  Nepal: {
    air: { name: 'Himalaya Air', code: 'HM' },
    bus: 'Prithvi Highway Bus',
  },
  Thailand: {
    air: { name: 'Siam Air', code: 'SI' },
    rail: { name: 'Royal Siam Railway', speed: 55 },
    bus: 'Isaan Express',
  },
  Vietnam: {
    air: { name: 'Lotus Air', code: 'LT' },
    rail: { name: 'Återföreningslinjen', speed: 45 },
    bus: 'Mekong Express',
  },
  Kina: {
    air: { name: 'Silk Road Air', code: 'SR' },
    rail: { name: 'Höghastighetsbanan', speed: 215 },
    bus: 'Gula flodens buss',
  },
  Japan: {
    air: { name: 'Sakura Air', code: 'SK' },
    rail: { name: 'Hikari-linjen', speed: 200 },
    bus: 'Nippon Kosoku Bus',
  },
  Sydkorea: {
    air: { name: 'Hanguk Air', code: 'HG' },
    rail: { name: 'Hanguk Rail', speed: 195 },
    bus: 'Gyeongbu Express',
  },
  Singapore: {
    air: { name: 'Merlion Air', code: 'ML' },
    rail: { name: 'Malayabanan', speed: 75 },
    bus: 'Causeway Coach',
  },
  'Förenade Arabemiraten': {
    air: { name: 'Gulf Wings', code: 'GW' },
    bus: 'Gulf Coach',
  },
  Jordanien: {
    air: { name: 'Petra Air', code: 'PT' },
    bus: 'Desert Highway Bus',
  },
  Australien: {
    air: { name: 'Southern Cross Airways', code: 'SX' },
    rail: { name: 'Overland Rail', speed: 75 },
    bus: 'Outback Coachlines',
  },
  'Nya Zeeland': {
    air: { name: 'Kiwi Air', code: 'KW' },
    bus: 'Aotearoa Coachlines',
  },
  USA: {
    air: { name: 'Liberty Air', code: 'LB' },
    rail: { name: 'Transcontinental Rail', speed: 90 },
    bus: 'Greyline Coaches',
  },
  Mexiko: {
    air: { name: 'Azteca Air', code: 'AZ' },
    bus: 'Autobuses del Norte',
  },
  Kuba: {
    air: { name: 'Caribe Air', code: 'CB' },
    bus: 'Ómnibus Nacionales',
  },
  Peru: {
    air: { name: 'Andes Air', code: 'AD' },
    rail: { name: 'Ferrocarril del Sur', speed: 40 },
    bus: 'Cruz del Altiplano',
  },
  Brasilien: {
    air: { name: 'Tucano Air', code: 'TC' },
    bus: 'Viação Litoral',
  },
  Argentina: {
    air: { name: 'Pampa Air', code: 'PM' },
    rail: { name: 'Ferrocarril Pampeano', speed: 65 },
    bus: 'Micros del Sur',
  },
};

export function operatorsFor(country: string): CountryOperators {
  return OPERATORS[country] ?? REGION_FALLBACK;
}

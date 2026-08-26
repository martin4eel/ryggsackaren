/**
 * Bilderna som hör till frågorna.
 *
 * Alla är riktiga fotografier (eller avfotograferade konstverk) från Wikimedia
 * Commons - inga ritade eller påhittade bilder. Poängen med en bildfråga är
 * att man ska känna igen något man sett i verkligheten, och då duger inte en
 * illustration av en marulk: det ska vara en marulk.
 *
 * Listan är också hämtskriptets arbetsorder. `node scripts/fetch-quiz-images.mjs`
 * läser den, hämtar det som saknas till public/quiz/ och skriver
 * public/quiz/ATTRIBUTION.md med upphovsman och licens.
 *
 * `article` är en engelsk Wikipedia-artikel vars ledningsbild används. `file`
 * är en namngiven Commons-fil, för de fall ledningsbilden är fel motiv eller
 * för hårt beskuren.
 *
 * Växterna använder genomgående `file`. Wikipedias artiklar om kryddor har
 * ofta en botanisk plansch från 1800-talet som ledningsbild, och en tecknad
 * ingefära duger inte i en fråga som går ut på att känna igen ingefära.
 */

export interface QuizImage {
  id: string;
  /** Vad bilden föreställer. Blir alt-text, och läses upp av skärmläsare. */
  alt: string;
  article?: string;
  file?: string;
  /** Bred vinjett: komprimeringen sparar fler pixlar. */
  bred?: boolean;
}

export const QUIZ_IMAGES: QuizImage[] = [
  // ------------------------------------------------------------------- hav
  { id: 'marulk', alt: 'En marulk på havsbotten', article: 'Lophius piscatorius' },
  { id: 'torsk', alt: 'En atlanttorsk', article: 'Atlantic cod' },
  { id: 'makrill', alt: 'En makrill', article: 'Atlantic mackerel' },
  { id: 'havsabborre', alt: 'En havsabborre', article: 'European bass' },
  { id: 'hummer', alt: 'En hummer', article: 'Homarus gammarus' },
  { id: 'ostron', alt: 'Öppnade ostron på is', article: 'Oyster' },
  { id: 'manet', alt: 'En öronmanet i vattnet', article: 'Aurelia aurita' },
  {
    id: 'sjostjarna',
    alt: 'En sjöstjärna på stranden',
    file: 'Asterias rubens - Heritage Coast East (30861934690).jpg',
  },
  { id: 'knolval', alt: 'En knölval som bryter ytan', article: 'Humpback whale' },
  { id: 'delfin', alt: 'En flasknosdelfin', article: 'Common bottlenose dolphin' },
  { id: 'havsskoldpadda', alt: 'En grön havsskoldpadda', article: 'Green sea turtle' },
  { id: 'blackfisk', alt: 'En bläckfisk bland stenar', article: 'Common octopus' },

  // ------------------------------------------------------------------ djur
  { id: 'elefant', alt: 'En afrikansk savannelefant', article: 'African bush elephant' },
  { id: 'lejon', alt: 'Ett lejon', article: 'Lion' },
  { id: 'leopard', alt: 'En leopard', article: 'Leopard' },
  { id: 'noshorning', alt: 'En noshörning', article: 'Black rhinoceros' },
  { id: 'buffel', alt: 'En afrikansk buffel', article: 'African buffalo' },
  { id: 'giraff', alt: 'En giraff', article: 'Giraffe' },
  { id: 'zebra', alt: 'En stäppzebra', article: 'Plains zebra' },
  { id: 'flodhast', alt: 'En flodhäst i vattnet', article: 'Hippopotamus' },
  { id: 'gnu', alt: 'En gnu på savannen', article: 'Blue wildebeest' },
  { id: 'gepard', alt: 'En gepard', article: 'Cheetah' },

  // ----------------------------------------------------------------- fåglar
  { id: 'flamingo', alt: 'Flamingor i grunt vatten', article: 'Greater flamingo' },
  { id: 'pelikan', alt: 'En pelikan', article: 'Great white pelican' },
  { id: 'pingvin', alt: 'En pingvin på en klippa', article: 'African penguin' },
  { id: 'havsorn', alt: 'En havsörn', article: 'White-tailed eagle' },

  // --------------------------------------------------------------- blommor
  { id: 'solros', alt: 'En solros', article: 'Common sunflower' },
  { id: 'tulpan', alt: 'Tulpaner', article: 'Tulip' },
  { id: 'orkide', alt: 'En orkidé', file: 'Phalaenopsis Cultivar White 01.jpg' },
  { id: 'lotus', alt: 'En lotusblomma', article: 'Nelumbo nucifera' },
  { id: 'protea', alt: 'En kungsprotea', article: 'Protea cynaroides' },
  { id: 'lavendel', alt: 'Ett lavendelfält i blom', file: 'Lavender field in Valensole.jpg' },

  // ------------------------------------------------------- kryddor och mat
  { id: 'saffran', alt: 'Saffranstrådar', article: 'Saffron' },
  { id: 'kanel', alt: 'Kanelstänger', article: 'Cinnamon' },
  { id: 'kardemumma', alt: 'Kardemummakapslar', article: 'Cardamom' },
  { id: 'ingefara', alt: 'Färsk ingefära', file: 'Fresh ginger rhizome 01.jpg' },
  { id: 'chili', alt: 'Chilifrukter', article: 'Chili pepper' },
  { id: 'vitlok', alt: 'Vitlöksklyftor', file: 'Garlic bulbs and cloves.jpg' },
  { id: 'vanilj', alt: 'Vaniljstänger', file: 'Bourbon vanilla beans - extra noire - +20cm.JPG' },
  { id: 'svartpeppar', alt: 'Svartpepparkorn', file: 'Black Peppercorns.jpg' },
  { id: 'durian', alt: 'En durianfrukt', article: 'Durian' },
  { id: 'granatapple', alt: 'Ett granatäpple', article: 'Pomegranate' },
  { id: 'ananas', alt: 'En ananas', article: 'Pineapple' },
  { id: 'kiwifrukt', alt: 'En kiwifrukt i halvor', file: 'Kiwifruit halved.jpg' },

  // ----------------------------------------------------------------- konst
  {
    id: 'monalisa',
    alt: 'Leonardo da Vincis Mona Lisa',
    file: 'Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg',
  },
  { id: 'stjarnenatt', alt: 'Van Goghs Stjärnenatt', article: 'The Starry Night' },
  { id: 'skriet', alt: 'Munchs Skriet', article: 'The Scream' },
  {
    id: 'parlorhange',
    alt: 'Vermeers Flickan med pärlörhänget',
    article: 'Girl with a Pearl Earring',
  },
  {
    id: 'storavagen',
    alt: 'Hokusais Den stora vågen utanför Kanagawa',
    article: 'The Great Wave off Kanagawa',
  },
  { id: 'venusfodelse', alt: 'Botticellis Venus födelse', article: 'The Birth of Venus' },

  /**
   * Stationsmiljöerna. Fyra foton per färdsätt, valda per stad så att inte
   * varje flygplats i spelet ser likadan ut. De ligger i samma manifest som
   * frågebilderna men är breda vinjetter, och `bred` säger åt komprimeringen
   * att spara fler pixlar på dem.
   */
  { id: 'station-flyg-1', alt: 'En avgångshall på en flygplats', bred: true, file: 'Mumbai 03-2016 114 Airport international terminal interior.jpg' },
  { id: 'station-flyg-2', alt: 'Incheckningsdiskarna på en flygplats', bred: true, file: 'CHECK IN HALL INTERNATIONAL TERMINAL HANEDA AIRPORT TOKYO JAPAN JUNE 2012 (7413572948).jpg' },
  { id: 'station-flyg-3', alt: 'En avgångshall med resenärer', bred: true, file: 'Heathrow Airport, Terminal 5, departure hall - geograph.org.uk - 2191951.jpg' },
  { id: 'station-flyg-4', alt: 'En terminalbyggnad inifrån', bred: true, file: 'Narita International Airport, Terminal 1, Departure Hall 14.JPG' },
  { id: 'station-tag-1', alt: 'En stationshall med tavla och resenärer', bred: true, file: 'Grand Central Station Main Concourse Jan 2006.jpg' },
  { id: 'station-tag-2', alt: 'En perrong med resenärer', bred: true, file: 'Hauptbahnhof, 1, Gebiet der DR, Ost, Halle (Saale).jpg' },
  { id: 'station-tag-3', alt: 'En perrong med tåg vid plattformen', bred: true, file: 'Tokyo-Station-2005-7-21 4.jpg' },
  { id: 'station-tag-4', alt: 'En stationshall med välvt tak', bred: true, file: 'The Grand Concourse at Central railway station, Sydney, 2022.jpg' },
  { id: 'station-buss-1', alt: 'En bussterminal med bussar i lägena', bred: true, file: 'Chur Busbahnhof ext 2015 wide.jpg' },
  { id: 'station-buss-2', alt: 'En bussterminal inifrån', bred: true, file: 'Interior de la estación de autobuses Plaza de Armas.JPG' },
  { id: 'station-buss-3', alt: 'Bussar vid en terminal', bred: true, file: 'Bus station at Zurich airport (2019).jpg' },
  { id: 'station-buss-4', alt: 'Bussar vid sina lägen på en terminal', bred: true, file: 'Estación de autobuses de Vitoria 05.JPG' },
  { id: 'station-farja-1', alt: 'En färjeterminal vid kajen', bred: true, file: 'The Irish Ferries Passenger Terminal, Dublin Port - geograph.org.uk - 2198686.jpg' },
  { id: 'station-farja-2', alt: 'Ett fartyg vid passagerarterminalen', bred: true, file: 'Cruise ship at Overseas Passenger Terminal - panoramio.jpg' },
  { id: 'station-farja-3', alt: 'En färjeterminal i hamnen', bred: true, file: 'Ferry Terminal, Port of Hull - geograph.org.uk - 5243839.jpg' },
  { id: 'station-farja-4', alt: 'Terminalbyggnaden i en färjehamn', bred: true, file: 'Passenger services building, Ferry Terminal, Port of Dover - geograph.org.uk - 7562437.jpg' },
];

export const QUIZ_IMAGE_BY_ID: Record<string, QuizImage> = Object.fromEntries(
  QUIZ_IMAGES.map((i) => [i.id, i])
);

/**
 * Sökvägen till en bild. `stad:<id>` pekar på ett stadsfoto som redan finns i
 * public/cities/, så att en fråga om Eiffeltornet kan använda samma bild som
 * stadsskärmen i stället för att ladda ner den en gång till.
 */
export function quizImageUrl(id: string): string {
  if (id.startsWith('stad:')) return `./cities/${id.slice(5)}.jpg`;
  return `./quiz/${id}.jpg`;
}

/** Alt-texten för en bild, oavsett var den kommer ifrån. */
export function quizImageAlt(id: string, cityName?: string): string {
  if (id.startsWith('stad:')) return cityName ? `Foto från ${cityName}` : 'Stadsfoto';
  return QUIZ_IMAGE_BY_ID[id]?.alt ?? '';
}

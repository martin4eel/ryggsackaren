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
  /**
   * Var på bilden ansiktet sitter, i procent av bredd och höjd, och hur brett
   * det är. Dit klistras den utklippta munnen och ögonen när motivet reagerar
   * på svaret. Saknas det hamnar ansiktet mitt på bilden.
   */
  ansikte?: { x: number; y: number; b: number };
  /**
   * Vad motivet säger när man svarat fel, medan det grimaserar. Rätt svar
   * ger bara ett "Bra jobbat!". Saknas det används en allmän replik.
   */
  reaktion?: { fel: string[] };
}

/** Allmänna repliker för bilder utan egna. */
export const ALLMAN_REAKTION: { fel: string[] } = {
  fel: ['Näe.', 'Va?!', 'Hallå, jag står ju här!', 'Pinsamt.', 'Jag såg det komma.'],
};

export const QUIZ_IMAGES: QuizImage[] = [
  // ------------------------------------------------------------------- hav
  { id: 'marulk', alt: 'En marulk på havsbotten', article: 'Lophius piscatorius', reaktion: { fel: ['Marulk. MAR-ULK. Så svårt är det inte.'] } },
  { id: 'torsk', alt: 'En atlanttorsk', article: 'Atlantic cod' },
  { id: 'makrill', alt: 'En makrill', article: 'Atlantic mackerel' },
  { id: 'havsabborre', alt: 'En havsabborre', article: 'European bass' },
  { id: 'hummer', alt: 'En hummer', article: 'Homarus gammarus', reaktion: { fel: ['Nu blir jag röd. Röd av ilska.'] } },
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
  { id: 'blackfisk', alt: 'En bläckfisk bland stenar', article: 'Common octopus', reaktion: { fel: ['Jag kramar dig inte längre.'] } },

  // ------------------------------------------------------------------ djur
  { id: 'elefant', alt: 'En afrikansk savannelefant', article: 'African bush elephant', reaktion: { fel: ['Jag glömmer aldrig. Aldrig.'] } },
  { id: 'lejon', alt: 'Ett lejon', article: 'Lion', reaktion: { fel: ['Så pinsamt att jag ryter.'] } },
  { id: 'leopard', alt: 'En leopard', article: 'Leopard' },
  { id: 'noshorning', alt: 'En noshörning', article: 'Black rhinoceros' },
  { id: 'buffel', alt: 'En afrikansk buffel', article: 'African buffalo' },
  { id: 'giraff', alt: 'En giraff', article: 'Giraffe', reaktion: { fel: ['Jag ser ner på dig. Från högt upp.'] } },
  { id: 'zebra', alt: 'En stäppzebra', article: 'Plains zebra', reaktion: { fel: ['Svart på vitt: fel.'] } },
  { id: 'flodhast', alt: 'En flodhäst i vattnet', article: 'Hippopotamus', reaktion: { fel: ['Jag gäspar åt dig.'] } },
  { id: 'gnu', alt: 'En gnu på savannen', article: 'Blue wildebeest' },
  { id: 'gepard', alt: 'En gepard', article: 'Cheetah', reaktion: { fel: ['Fel. Och jag var ändå snabbare.'] } },

  // ----------------------------------------------------------------- fåglar
  { id: 'flamingo', alt: 'Flamingor i grunt vatten', article: 'Greater flamingo', reaktion: { fel: ['Jag rodnar. Fast det syns inte.'] } },
  { id: 'pelikan', alt: 'En pelikan', article: 'Great white pelican' },
  { id: 'pingvin', alt: 'En pingvin på en klippa', article: 'African penguin', reaktion: { fel: ['Jag vänder ryggen till.'] } },
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
  { id: 'durian', alt: 'En durianfrukt', article: 'Durian', reaktion: { fel: ['Jag luktar i alla fall inte fel.'] } },
  { id: 'granatapple', alt: 'Ett granatäpple', article: 'Pomegranate' },
  { id: 'ananas', alt: 'En ananas', article: 'Pineapple', reaktion: { fel: ['Taggigt svar.'] } },
  { id: 'kiwifrukt', alt: 'En kiwifrukt i halvor', file: 'Kiwifruit halved.jpg' },

  // ----------------------------------------------------------------- konst
  {
    id: 'monalisa',
    alt: 'Leonardo da Vincis Mona Lisa',
    file: 'Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg',   ansikte: { x: 50, y: 30, b: 24 }, reaktion: { fel: ['Leonardo hade gråtit.'] },
  },
  { id: 'stjarnenatt', alt: 'Van Goghs Stjärnenatt', article: 'The Starry Night', ansikte: { x: 88, y: 18, b: 18 }, reaktion: { fel: ['Van Gogh hade skurit av det andra örat.'] } },
  { id: 'skriet', alt: 'Munchs Skriet', article: 'The Scream', ansikte: { x: 55, y: 58, b: 26 }, reaktion: { fel: ['AAAAAAAAH!'] } },
  {
    id: 'parlorhange',
    alt: 'Vermeers Flickan med pärlörhänget',
    article: 'Girl with a Pearl Earring',   ansikte: { x: 52, y: 40, b: 30 }, reaktion: { fel: ['Jag vänder mig bort. Igen.'] },
  },
  {
    id: 'storavagen',
    alt: 'Hokusais Den stora vågen utanför Kanagawa',
    article: 'The Great Wave off Kanagawa',   ansikte: { x: 28, y: 38, b: 30 }, reaktion: { fel: ['Jag sköljer bort det där svaret.'] },
  },
  { id: 'venusfodelse', alt: 'Botticellis Venus födelse', article: 'The Birth of Venus', ansikte: { x: 50, y: 28, b: 20 }, reaktion: { fel: ['Jag kliver tillbaka i snäckan.'] } },


  // ---------------------------------------------- mat, djur, platser, ting
  // Bilder till frågor som tidigare bara var text: motivet ska kännas igen.
  { id: 'dromedar', alt: 'En dromedar i öknen', article: 'Dromedary' },
  { id: 'lama', alt: 'En lama i Anderna', article: 'Llama' },
  { id: 'vikunja', alt: 'En vikunja på högplatån', article: 'Vicuña' },
  { id: 'bordercollie', alt: 'En border collie', article: 'Border Collie' },
  { id: 'merino', alt: 'Ett merinofår', article: 'Merino' },
  { id: 'skordetroska', alt: 'En skördetröska på ett fält', article: 'Combine harvester' },
  { id: 'vespa', alt: 'En klassisk Vespa', article: 'Vespa' },
  { id: 'baguette', alt: 'Baguetter', article: 'Baguette' },
  { id: 'pumpernickel', alt: 'Skivat pumpernickelbröd', article: 'Pumpernickel' },
  { id: 'croissant', alt: 'En croissant', article: 'Croissant' },
  { id: 'prinsesstarta', alt: 'En prinsesstårta med grön marsipan', article: 'Princess cake' },
  { id: 'semla', alt: 'En semla med grädde och mandelmassa', article: 'Semla' },
  { id: 'padthai', alt: 'En tallrik pad thai', article: 'Pad thai' },
  { id: 'ramen', alt: 'En skål ramen', article: 'Ramen' },
  { id: 'bibimbap', alt: 'En skål bibimbap', article: 'Bibimbap' },
  { id: 'doner', alt: 'Kött på lodrätt dönerspett', article: 'Doner kebab' },
  { id: 'calzone', alt: 'En calzone', article: 'Calzone' },
  { id: 'fugu', alt: 'En blåsfisk', article: 'Fugu' },
  { id: 'kryddnejlika', alt: 'Torkade kryddnejlikor', file: 'Cloves.JPG' },
  { id: 'matcha', alt: 'Matchapulver i en skål', article: 'Matcha' },
  { id: 'ros', alt: 'En ros', article: 'Rose' },
  { id: 'ikebana', alt: 'Ett ikebanaarrangemang', file: 'Ikebana Japanese flower arrangement 1, Ikebana- いけばな (465912296).jpg' },
  { id: 'nattvakten', alt: 'Rembrandts Nattvakten', article: 'The Night Watch' },
  { id: 'david', alt: 'Michelangelos David', article: 'David (Michelangelo)' },
  { id: 'nackrosor', alt: 'Monets Näckrosor', article: 'Water Lilies (Monet series)' },
  { id: 'skapelsenavadam', alt: 'Michelangelos Skapelsen av Adam', article: 'The Creation of Adam' },
  { id: 'impression', alt: 'Monets Impression, soluppgång', article: 'Impression, Sunrise' },
  { id: 'londontaxi', alt: 'En svart londontaxi', article: 'Hackney carriage' },
  { id: 'autoriksha', alt: 'En trehjulig autoriksha', article: 'Auto rickshaw' },
  { id: 'felucka', alt: 'En felucka på Nilen', article: 'Felucca' },
  { id: 'spinnaker', alt: 'En segelbåt med spinnaker', article: 'Spinnaker' },
  { id: 'ejder', alt: 'En ejderhane på vattnet', article: 'Common eider' },
  { id: 'blastang', alt: 'Blåstång på en klippa', article: 'Fucus vesiculosus' },
  { id: 'hyena', alt: 'En fläckig hyena', article: 'Spotted hyena' },
  { id: 'okapi', alt: 'En okapi', article: 'Okapi' },
  { id: 'kaskelot', alt: 'En kaskelot med kalv', article: 'Sperm whale' },
  { id: 'atoll', alt: 'En atoll sedd från luften', article: 'Atoll' },
  { id: 'gejser', alt: 'En gejser som sprutar', article: 'Geyser' },
  { id: 'kebnekaise', alt: 'Kebnekaise', article: 'Kebnekaise' },
  { id: 'taskor', alt: 'Ett par tåskor', article: 'Pointe shoe' },
  { id: 'cuica', alt: 'En cuíca', article: 'Cuíca' },
  { id: 'emmentaler', alt: 'En bit emmentaler', article: 'Emmental cheese' },
  { id: 'agave', alt: 'En blå agave', article: 'Agave tequilana' },
  { id: 'kora', alt: 'En koraspelare', file: 'Joueur de kora à Toubab Dialaw.jpg' },
  { id: 'koniskhatt', alt: 'En konisk vietnamesisk hatt', article: 'Asian conical hat' },
  { id: 'usjanka', alt: 'En usjanka', article: 'Ushanka' },
  { id: 'hanbok', alt: 'En kvinna i hanbok', article: 'Hanbok' },
  { id: 'merlion', alt: 'Merlionstatyn i Singapore', article: 'Merlion' },
  { id: 'boudhanath', alt: 'Boudhanathstupan i Katmandu', article: 'Boudhanath' },
  { id: 'petra', alt: 'Skattkammaren i Petra', article: 'Petra' },
  { id: 'hallgrimskirkja', alt: 'Hallgrímskirkja i Reykjavík', article: 'Hallgrímskirkja' },
  { id: 'stpauls', alt: 'St Paul\'s Cathedral i London', article: 'St Paul\'s Cathedral' },
  { id: 'triumfbagen', alt: 'Triumfbågen i Paris', article: 'Arc de Triomphe' },
  { id: 'trevi', alt: 'Fontana di Trevi i Rom', article: 'Trevi Fountain' },
  { id: 'pantheon', alt: 'Pantheon i Rom', article: 'Pantheon, Rome' },
  { id: 'hagiasofia', alt: 'Hagia Sofia i Istanbul', article: 'Hagia Sophia' },
  { id: 'vasilijkatedralen', alt: 'Vasilijkatedralen i Moskva', article: 'Saint Basil\'s Cathedral' },
  { id: 'sfinxen', alt: 'Sfinxen i Giza', article: 'Great Sphinx of Giza' },
  { id: 'tagine', alt: 'En tagine', article: 'Tajine' },
  { id: 'taffelberget', alt: 'Taffelberget över Kapstaden', article: 'Table Mountain' },
  { id: 'watpho', alt: 'Den liggande Buddhan i Wat Pho', article: 'Wat Pho' },
  { id: 'panda', alt: 'En jättepanda', article: 'Giant panda' },
  { id: 'fuji', alt: 'Berget Fuji', article: 'Mount Fuji' },
  { id: 'shibuya', alt: 'Korsningen i Shibuya', article: 'Shibuya Crossing' },
  { id: 'kanguru', alt: 'En känguru', article: 'Kangaroo' },
  { id: 'kiwi', alt: 'En kivi', article: 'Kiwi (bird)' },
  { id: 'sockertoppen', alt: 'Sockertoppen i Rio de Janeiro', article: 'Sugarloaf Mountain' },
  { id: 'pragklockan', alt: 'Den astronomiska klockan i Prag', article: 'Prague astronomical clock' },
  { id: 'castells', alt: 'Ett castell, ett mänskligt torn', article: 'Castell' },
  { id: 'pasteldenata', alt: 'Pastéis de nata', article: 'Pastel de nata' },
  { id: 'azulejos', alt: 'Blåvita azulejos', article: 'Azulejo' },
  { id: 'turningtorso', alt: 'Turning Torso i Malmö', article: 'Turning Torso' },
  { id: 'feskekorka', alt: 'Feskekörka i Göteborg', article: 'Feskekôrka' },

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

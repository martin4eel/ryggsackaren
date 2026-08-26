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

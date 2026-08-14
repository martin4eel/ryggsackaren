import type { Question } from '../types';

/**
 * Frågor på turistbyrån. Resultatet ger ett betyg som avgör vilka jobb du får
 * söka i staden. Första alternativet i varje fråga är det rätta svaret.
 */
export const CITY_QUESTIONS: Record<string, Question[]> = {
  goteborg: [
    {
      q: 'Vilken kung grundade Göteborg år 1621?',
      a: ['Gustav II Adolf', 'Karl XII', 'Gustav Vasa', 'Oskar II'],
      d: 1,
      info: 'Stadens grundare står staty på Gustaf Adolfs torg.',
    },
    {
      q: 'Vilket vatten ligger Göteborg vid?',
      a: ['Kattegatt', 'Bottenhavet', 'Ålands hav', 'Finska viken'],
      d: 1,
    },
    {
      q: 'Vad heter Göteborgs berömda fiskhall i tegel?',
      a: ['Feskekörka', 'Fiskhuset', 'Saluhallen Briggen', 'Havets hus'],
      d: 1,
      info: 'Byggnaden från 1874 fick sitt namn av sin kyrkliknande form.',
    },
    {
      q: 'Vilken flod rinner ut i havet vid Göteborg?',
      a: ['Göta älv', 'Dalälven', 'Klarälven', 'Motala ström'],
      d: 1,
    },
    {
      q: 'Vilken nöjespark i Göteborg öppnade 1923?',
      a: ['Liseberg', 'Gröna Lund', 'Furuvik', 'Skara Sommarland'],
      d: 1,
    },
    {
      q: 'Vad kallas Göteborgs spårvagnar i folkmun?',
      a: ['Spårvagn', 'Metro', 'Tunnelbana', 'Pendeltåg'],
      d: 2,
      info: 'Göteborg har Nordens största spårvägsnät.',
    },
    {
      q: 'Vilken paradgata i Göteborg heter egentligen Kungsportsavenyen?',
      a: ['Avenyn', 'Vasagatan', 'Linnégatan', 'Övre Husargatan'],
      d: 1,
    },
    {
      q: 'Vilket landskap ligger Göteborg huvudsakligen i?',
      a: ['Västergötland', 'Bohuslän', 'Halland', 'Dalsland'],
      d: 2,
      info: 'Staden sträcker sig även in i Bohuslän norr om älven.',
    },
  ],
  reykjavik: [
    {
      q: 'Vad är Reykjavík mest känd för att vara?',
      a: [
        'Världens nordligaste huvudstad',
        'Världens sydligaste huvudstad',
        'Europas största hamn',
        'Världens äldsta stad',
      ],
      d: 1,
    },
    {
      q: 'Vad värmer Reykjavíks hus och simbassänger?',
      a: ['Geotermiskt vatten', 'Kolkraft', 'Kärnkraft', 'Importerad olja'],
      d: 1,
      info: 'Nästan all uppvärmning på Island är geotermisk.',
    },
    {
      q: 'Vad heter Islands parlament, ett av världens äldsta?',
      a: ['Alltinget', 'Folketinget', 'Riksdagen', 'Stortinget'],
      d: 1,
      info: 'Grundat på Tingvalla år 930.',
    },
    {
      q: 'Vilken naturtyp täcker stora delar av Island?',
      a: ['Lavafält och glaciärer', 'Regnskog', 'Savann', 'Lövskog'],
      d: 1,
    },
    {
      q: 'Vad kallas de heta källor som sprutar vatten och som gett namn åt fenomenet?',
      a: ['Gejsrar', 'Fumaroler', 'Kalderor', 'Moräner'],
      d: 1,
      info: 'Ordet kommer från isländska Geysir, "den som forsar".',
    },
    {
      q: 'Vilken är Islands officiella valuta?',
      a: ['Isländsk krona', 'Euro', 'Dansk krona', 'Norsk krona'],
      d: 1,
    },
    {
      q: 'Vad heter Reykjavíks landmärkeskyrka med sin trappstegsfasad?',
      a: ['Hallgrímskirkja', 'Nidarosdomen', 'Uppsala domkyrka', 'Roskilde domkirke'],
      d: 2,
    },
    {
      q: 'Vilken ö-nation ligger Island närmast i väster?',
      a: ['Grönland', 'Irland', 'Färöarna', 'Storbritannien'],
      d: 2,
    },
  ],
  london: [
    {
      q: 'Vilken flod rinner genom London?',
      a: ['Themsen', 'Seine', 'Rhen', 'Donau'],
      d: 1,
    },
    {
      q: 'Vad heter klocktornet vid parlamentet, vars klocka kallas Big Ben?',
      a: ['Elizabeth Tower', 'Victoria Tower', 'Shard Tower', 'Albert Tower'],
      d: 2,
      info: 'Tornet döptes om till Elizabeth Tower 2012.',
    },
    {
      q: 'Vad kallas Londons tunnelbana i folkmun?',
      a: ['The Tube', 'The Metro', 'The Subway', 'The Underland'],
      d: 1,
      info: 'Världens första tunnelbana, öppnad 1863.',
    },
    {
      q: 'Vilket kungligt palats är monarkens officiella residens i London?',
      a: ['Buckingham Palace', 'Windsor Castle', 'Balmoral', 'Hampton Court'],
      d: 1,
    },
    {
      q: 'Vilket museum i London har en av världens största samlingar av antikviteter, inklusive Rosettastenen?',
      a: ['British Museum', 'Tate Modern', 'Louvren', 'Prado'],
      d: 1,
    },
    {
      q: 'Vilken park ligger direkt söder om Buckingham Palace-området och delar namn med en trädgård?',
      a: ['St James\u2019s Park', 'Hyde Park', 'Tiergarten', 'Retiro'],
      d: 2,
    },
    {
      q: 'Vad är Tower Bridge för typ av bro?',
      a: ['Klaffbro', 'Svängbro', 'Akvedukt', 'Pontonbro'],
      d: 2,
      info: 'Bron öppnas fortfarande cirka 800 gånger per år.',
    },
    {
      q: 'Vilken katedral med sin stora kupol ritades av Christopher Wren?',
      a: ['St Paul\u2019s Cathedral', 'Westminster Abbey', 'Canterbury Cathedral', 'York Minster'],
      d: 2,
    },
    {
      q: 'Vilket land är London huvudstad i?',
      a: ['Storbritannien', 'Irland', 'Frankrike', 'Nederländerna'],
      d: 1,
    },
    {
      q: 'Vilken färg har Londons klassiska dubbeldäckarbussar?',
      a: ['Röd', 'Blå', 'Grön', 'Gul'],
      d: 1,
    },
    {
      q: 'Vad kallas det stora pariserhjulet vid Themsen?',
      a: ['London Eye', 'The Shard', 'The Gherkin', 'Millennium Wheel Two'],
      d: 1,
    },
    {
      q: 'Vilket kungligt fängelse och skattkammare ligger vid Themsen?',
      a: ['Towern', 'Buckingham Palace', 'Westminster Abbey', 'Kensington Palace'],
      d: 1,
      info: 'Där förvaras de brittiska kronjuvelerna.',
    },
  ],
  paris: [
    {
      q: 'Till vilken händelse byggdes Eiffeltornet?',
      a: [
        'Världsutställningen 1889',
        'Olympiska spelen 1900',
        'Franska revolutionens utbrott',
        'Napoleons kröning',
      ],
      d: 1,
    },
    {
      q: 'Vilken flod delar Paris i en vänster- och högerbank?',
      a: ['Seine', 'Loire', 'Rhône', 'Garonne'],
      d: 1,
    },
    {
      q: 'Vilket berömt konstverk hänger på Louvren?',
      a: ['Mona Lisa', 'Nattvakten', 'Skriet', 'Guernica'],
      d: 1,
    },
    {
      q: 'Vad heter katedralen på ön Île de la Cité?',
      a: ['Notre-Dame', 'Sacré-Cœur', 'Sainte-Chapelle', 'Panthéon'],
      d: 1,
    },
    {
      q: 'Vilken triumfbåge står vid slutet av Champs-Élysées?',
      a: ['Triumfbågen', 'Brandenburger Tor', 'Titusbågen', 'Porta Nigra'],
      d: 1,
    },
    {
      q: 'Vad kallas den kulle i norra Paris där konstnärerna samlades?',
      a: ['Montmartre', 'Montparnasse', 'Belleville', 'Le Marais'],
      d: 2,
    },
    {
      q: 'Hur många arrondissement är Paris indelat i?',
      a: ['20', '12', '16', '24'],
      d: 2,
      info: 'De ligger i en spiral utåt från centrum.',
    },
    {
      q: 'Vad heter Paris berömda konstmuseum i en ombyggd järnvägsstation?',
      a: ['Musée d\u2019Orsay', 'Centre Pompidou', 'Grand Palais', 'Petit Palais'],
      d: 2,
    },
  ],
  amsterdam: [
    {
      q: 'Vad är Amsterdam mest känt för i stadsbilden?',
      a: ['Sina kanaler', 'Sina vulkaner', 'Sina skyskrapor', 'Sina pyramider'],
      d: 1,
    },
    {
      q: 'Vilken målare har ett eget museum i Amsterdam?',
      a: ['Vincent van Gogh', 'Pablo Picasso', 'Claude Monet', 'Salvador Dalí'],
      d: 1,
    },
    {
      q: 'Vilket transportmedel finns det fler av än invånare i Amsterdam?',
      a: ['Cyklar', 'Bilar', 'Bussar', 'Motorcyklar'],
      d: 1,
    },
    {
      q: 'Vad heter Nederländernas nationalmuseum i Amsterdam?',
      a: ['Rijksmuseum', 'Mauritshuis', 'Stedelijk', 'Hermitage'],
      d: 1,
    },
    {
      q: 'Vilken målning av Rembrandt är Rijksmuseums mest kända?',
      a: ['Nattvakten', 'Mona Lisa', 'Flickan med pärlörhänget', 'Bondbröllop'],
      d: 2,
    },
    {
      q: 'Vad står Amsterdams gamla hus på, eftersom marken är mjuk?',
      a: ['Träpålar', 'Betongplattor', 'Berggrund', 'Flytbryggor'],
      d: 2,
    },
    {
      q: 'Vilken är Nederländernas officiella huvudstad?',
      a: ['Amsterdam', 'Haag', 'Rotterdam', 'Utrecht'],
      d: 1,
      info: 'Regeringen och kungahuset sitter dock i Haag.',
    },
    {
      q: 'Vad kallas den utvunna mark under havsnivån som odlas i Nederländerna?',
      a: ['Polder', 'Fjord', 'Delta', 'Estuarium'],
      d: 2,
    },
  ],
  rom: [
    {
      q: 'Hur många kullar sägs Rom vara byggt på?',
      a: ['Sju', 'Tre', 'Tolv', 'Fem'],
      d: 1,
    },
    {
      q: 'Vad hette den stora arena i Rom där gladiatorspelen hölls?',
      a: ['Colosseum', 'Circus Maximus', 'Pantheon', 'Forum Romanum'],
      d: 1,
    },
    {
      q: 'Vilken stat ligger helt inuti Rom?',
      a: ['Vatikanstaten', 'San Marino', 'Monaco', 'Liechtenstein'],
      d: 1,
      info: 'Världens minsta självständiga stat, cirka 0,44 km².',
    },
    {
      q: 'Vilken flod rinner genom Rom?',
      a: ['Tibern', 'Po', 'Arno', 'Adige'],
      d: 1,
    },
    {
      q: 'Vem målade taket i Sixtinska kapellet?',
      a: ['Michelangelo', 'Rafael', 'Leonardo da Vinci', 'Caravaggio'],
      d: 1,
    },
    {
      q: 'Vad heter den berömda fontänen där man kastar mynt över axeln?',
      a: ['Fontana di Trevi', 'Fontana dei Quattro Fiumi', 'Fontana delle Api', 'Fontana Paola'],
      d: 2,
    },
    {
      q: 'Vilket år sägs Rom ha grundats enligt legenden?',
      a: ['753 f.Kr.', '509 f.Kr.', '44 f.Kr.', '1000 f.Kr.'],
      d: 2,
      info: 'Enligt myten av tvillingarna Romulus och Remus.',
    },
    {
      q: 'Vilken romersk byggnad har världens största oarmerade betongkupol?',
      a: ['Pantheon', 'Colosseum', 'Peterskyrkan', 'Castel Sant\u2019Angelo'],
      d: 2,
    },
  ],
  istanbul: [
    {
      q: 'Vilka två världsdelar ligger Istanbul i?',
      a: ['Europa och Asien', 'Europa och Afrika', 'Asien och Afrika', 'Bara Europa'],
      d: 1,
    },
    {
      q: 'Vilket sund delar Istanbul?',
      a: ['Bosporen', 'Gibraltar sund', 'Öresund', 'Malackasundet'],
      d: 1,
    },
    {
      q: 'Vad hette Istanbul innan 1930?',
      a: ['Konstantinopel', 'Ankara', 'Smyrna', 'Trabzon'],
      d: 1,
    },
    {
      q: 'Vilken byggnad var först kyrka, sedan moské och sedan museum?',
      a: ['Hagia Sofia', 'Blå moskén', 'Topkapipalatset', 'Galatatornet'],
      d: 1,
      info: 'Byggd på 500-talet under kejsar Justinianus.',
    },
    {
      q: 'Vilket rike hade Istanbul som huvudstad fram till 1922?',
      a: ['Ottomanska riket', 'Persiska riket', 'Romerska riket', 'Mongolriket'],
      d: 1,
    },
    {
      q: 'Vilken är Turkiets huvudstad?',
      a: ['Ankara', 'Istanbul', 'Izmir', 'Bursa'],
      d: 1,
    },
    {
      q: 'Vad heter Istanbuls stora täckta marknad med tusentals butiker?',
      a: ['Kapalıçarşı (Stora basaren)', 'Souk al-Zal', 'Chatuchak', 'La Boqueria'],
      d: 2,
    },
    {
      q: 'Vilken vik skiljer Istanbuls gamla stad från Beyoğlu?',
      a: ['Gyllene hornet', 'Marmarabukten', 'Svarta havsviken', 'Egeiska viken'],
      d: 2,
    },
  ],
  moskva: [
    {
      q: 'Vad heter det befästa området i Moskvas centrum?',
      a: ['Kreml', 'Vinterpalatset', 'Peterhof', 'Smolnyj'],
      d: 1,
    },
    {
      q: 'Vilken katedral med färgglada lökkupoler står på Röda torget?',
      a: ['Vasilijkatedralen', 'Kristus Frälsarens katedral', 'Isakskatedralen', 'Uspenskijkatedralen'],
      d: 1,
    },
    {
      q: 'Vilken järnväg går från Moskva till Vladivostok?',
      a: ['Transsibiriska järnvägen', 'Orientexpressen', 'Panamerikanska järnvägen', 'Sibiriska ringen'],
      d: 1,
      info: 'Cirka 9 289 km och sju dygns resa.',
    },
    {
      q: 'Vilken flod rinner genom Moskva?',
      a: ['Moskva', 'Volga', 'Neva', 'Don'],
      d: 2,
    },
    {
      q: 'Vad är Moskvas tunnelbana särskilt känd för?',
      a: ['Palatsliknande stationer', 'Att vara världens kortaste', 'Att gå ovan jord', 'Att bara ha en linje'],
      d: 1,
    },
    {
      q: 'Vilken teater i Moskva är världsberömd för sin balett?',
      a: ['Bolsjojteatern', 'Mariinskijteatern', 'La Scala', 'Operahuset i Sydney'],
      d: 2,
    },
    {
      q: 'Vilket år hölls de olympiska sommarspelen i Moskva?',
      a: ['1980', '1972', '1988', '1996'],
      d: 2,
    },
    {
      q: 'Hur många tidszoner sträcker sig Ryssland över?',
      a: ['11', '5', '8', '15'],
      d: 2,
    },
    {
      q: 'Vilket land är Moskva huvudstad i?',
      a: ['Ryssland', 'Ukraina', 'Belarus', 'Kazakstan'],
      d: 1,
    },
    {
      q: 'Vad heter det stora torget utanför Kreml?',
      a: ['Röda torget', 'Vita torget', 'Frihetstorget', 'Segertorget'],
      d: 1,
    },
    {
      q: 'Vilket alfabet skrivs ryska med?',
      a: ['Kyrilliska', 'Latinska', 'Grekiska', 'Arabiska'],
      d: 1,
    },
    {
      q: 'Vilken vinterhuvudbonad av päls förknippas med Ryssland?',
      a: ['Usjanka', 'Fez', 'Sombrero', 'Basker'],
      d: 1,
    },
  ],
  kairo: [
    {
      q: 'Vilken flod rinner genom Kairo?',
      a: ['Nilen', 'Kongo', 'Niger', 'Eufrat'],
      d: 1,
    },
    {
      q: 'Vilket underverk finns strax utanför Kairo?',
      a: ['Pyramiderna i Giza', 'Hängande trädgårdarna', 'Kolossen på Rhodos', 'Fyren i Alexandria'],
      d: 1,
    },
    {
      q: 'Vilken staty med lejonkropp och människohuvud vaktar Gizaplatån?',
      a: ['Sfinxen', 'Anubis', 'Kolossalstatyn av Ramses', 'Memnonkolosserna'],
      d: 1,
    },
    {
      q: 'Vilket hav förbinder Suezkanalen med Medelhavet?',
      a: ['Röda havet', 'Svarta havet', 'Kaspiska havet', 'Arabiska havet'],
      d: 1,
    },
    {
      q: 'Vilken faraos grav hittades nästan orörd 1922?',
      a: ['Tutankhamons', 'Kleopatras', 'Ramses II:s', 'Cheops'],
      d: 2,
      info: 'Upptäckten gjordes av Howard Carter i Konungarnas dal.',
    },
    {
      q: 'Vad kallas den skrift med bildtecken som de gamla egyptierna använde?',
      a: ['Hieroglyfer', 'Kilskrift', 'Runor', 'Linear B'],
      d: 1,
    },
    {
      q: 'Vilken av Gizapyramiderna är den största?',
      a: ['Cheopspyramiden', 'Chefrenpyramiden', 'Mykerinospyramiden', 'Trappstegspyramiden'],
      d: 2,
    },
    {
      q: 'Vilken damm reglerar Nilen i södra Egypten?',
      a: ['Assuandammen', 'Hooverdammen', 'Itaipú', 'Kariba'],
      d: 2,
    },
  ],
  marrakech: [
    {
      q: 'Vilken bergskedja ligger sydost om Marrakech?',
      a: ['Atlasbergen', 'Alperna', 'Anderna', 'Ural'],
      d: 1,
    },
    {
      q: 'Vad kallas det stora torget i Marrakech som fylls av folkliv varje kväll?',
      a: ['Jemaa el-Fna', 'Röda torget', 'Times Square', 'Zócalo'],
      d: 1,
    },
    {
      q: 'Vad kallas de trånga marknadsgränderna i en marockansk stad?',
      a: ['Souker', 'Kanaler', 'Boulevarder', 'Arkader'],
      d: 1,
    },
    {
      q: 'Vilken ökenregion ligger söder om Marocko?',
      a: ['Sahara', 'Gobi', 'Kalahari', 'Atacama'],
      d: 1,
    },
    {
      q: 'Vilken är Marockos huvudstad?',
      a: ['Rabat', 'Casablanca', 'Marrakech', 'Fès'],
      d: 2,
    },
    {
      q: 'Vad kallas den gamla, murade stadskärnan i marockanska städer?',
      a: ['Medina', 'Agora', 'Forum', 'Kasbahväg'],
      d: 2,
    },
    {
      q: 'Vad heter det marockanska folkslag vars språk är amazigh?',
      a: ['Berberna', 'Tuaregerna enbart', 'Kopterna', 'Nubierna'],
      d: 2,
    },
    {
      q: 'Vilken maträtt lagas i ett koniskt lerkärl med samma namn?',
      a: ['Tagine', 'Paella', 'Tandoori', 'Fondue'],
      d: 1,
    },
  ],
  nairobi: [
    {
      q: 'Vilket land är Nairobi huvudstad i?',
      a: ['Kenya', 'Tanzania', 'Uganda', 'Etiopien'],
      d: 1,
    },
    {
      q: 'Vad är unikt med Nairobi bland världens storstäder?',
      a: [
        'En nationalpark ligger inom stadsgränsen',
        'Staden har inga bilar',
        'Staden ligger under havsnivån',
        'Staden har midnattssol',
      ],
      d: 1,
    },
    {
      q: 'Vad kallas de fem stora djuren som safariturister vill se?',
      a: [
        'Lejon, leopard, elefant, noshörning, buffel',
        'Lejon, giraff, zebra, gnu, gepard',
        'Elefant, flodhäst, krokodil, struts, hyena',
        'Gorilla, schimpans, lejon, elefant, zebra',
      ],
      d: 2,
    },
    {
      q: 'Vilket berg är Afrikas högsta och ligger strax söder om Kenya?',
      a: ['Kilimanjaro', 'Mount Kenya', 'Elgon', 'Ruwenzori'],
      d: 1,
      info: '5 895 meter över havet, i Tanzania.',
    },
    {
      q: 'Vilken stor geologisk formation går genom Östafrika?',
      a: ['Riftvalley', 'Mariannegraven', 'Grand Canyon', 'Atlasklyftan'],
      d: 2,
    },
    {
      q: 'Vilket språk är, tillsammans med engelska, officiellt i Kenya?',
      a: ['Swahili', 'Amhariska', 'Zulu', 'Arabiska'],
      d: 1,
    },
    {
      q: 'Vilken sjö vid Kenyas gräns är Afrikas största?',
      a: ['Victoriasjön', 'Tanganyikasjön', 'Malawisjön', 'Turkanasjön'],
      d: 2,
    },
    {
      q: 'Vilket djur är världens snabbaste landdjur och ses på savannen?',
      a: ['Geparden', 'Lejonet', 'Antilopen', 'Strutsen'],
      d: 1,
    },
  ],
  kapstaden: [
    {
      q: 'Vilket platt berg reser sig över Kapstaden?',
      a: ['Taffelberget', 'Kilimanjaro', 'Mount Cook', 'Sockertoppen'],
      d: 1,
    },
    {
      q: 'Vilken ö utanför Kapstaden var fängelse för Nelson Mandela?',
      a: ['Robben Island', 'Alcatraz', 'Elba', 'Sankt Helena'],
      d: 1,
    },
    {
      q: 'Vilka två oceaner möts nära Sydafrikas sydspets?',
      a: ['Atlanten och Indiska oceanen', 'Stilla havet och Atlanten', 'Norra ishavet och Atlanten', 'Indiska oceanen och Stilla havet'],
      d: 1,
    },
    {
      q: 'Vad kallades Sydafrikas system av rasåtskillnad som avskaffades i början av 1990-talet?',
      a: ['Apartheid', 'Segregation Act', 'Kolonialsystemet', 'Bantustan'],
      d: 1,
    },
    {
      q: 'Hur många huvudstäder har Sydafrika?',
      a: ['Tre', 'En', 'Två', 'Fyra'],
      d: 2,
      info: 'Pretoria (regering), Kapstaden (parlament) och Bloemfontein (domstol).',
    },
    {
      q: 'Vad heter det kap sydväst om Kapstaden som seglare fruktade?',
      a: ['Godahoppsudden', 'Kap Horn', 'Kap Verde', 'Nordkap'],
      d: 1,
    },
    {
      q: 'Vilken vinregion ligger strax öster om Kapstaden?',
      a: ['Stellenbosch', 'Bordeaux', 'Barossa', 'Mendoza'],
      d: 2,
    },
    {
      q: 'Vad kallas den unika vegetationstypen kring Kapstaden?',
      a: ['Fynbos', 'Taiga', 'Tundra', 'Mangrove'],
      d: 2,
    },
  ],
  mumbai: [
    {
      q: 'Vilken filmindustri har sitt centrum i Mumbai?',
      a: ['Bollywood', 'Tollywood', 'Hollywood', 'Nollywood'],
      d: 1,
      info: 'Namnet är en blandning av Bombay och Hollywood.',
    },
    {
      q: 'Vad hette Mumbai tidigare?',
      a: ['Bombay', 'Madras', 'Calcutta', 'Delhi'],
      d: 1,
    },
    {
      q: 'Vid vilket hav ligger Mumbai?',
      a: ['Arabiska sjön', 'Bengaliska bukten', 'Sydkinesiska sjön', 'Röda havet'],
      d: 1,
    },
    {
      q: 'Vilken är Indiens huvudstad?',
      a: ['New Delhi', 'Mumbai', 'Kolkata', 'Bengaluru'],
      d: 1,
    },
    {
      q: 'Vad heter monumentbågen vid Mumbais hamn, rest till minne av ett kungabesök?',
      a: ['Gateway of India', 'India Gate', 'Triumfbågen', 'Porta Nuova'],
      d: 2,
    },
    {
      q: 'Vad kallas den årliga regnperiod som Indien är beroende av?',
      a: ['Monsunen', 'Passaden', 'El Niño', 'Föhnvinden'],
      d: 1,
    },
    {
      q: 'Vad kallas de matleverantörer i Mumbai som distribuerar hemlagad lunch?',
      a: ['Dabbawalas', 'Rickshawalas', 'Chaiwalas', 'Tuk-tuk-förare'],
      d: 2,
    },
    {
      q: 'Vilken religion har flest anhängare i Indien?',
      a: ['Hinduism', 'Islam', 'Buddhism', 'Kristendom'],
      d: 1,
    },
  ],
  bangkok: [
    {
      q: 'Vilket land är Bangkok huvudstad i?',
      a: ['Thailand', 'Vietnam', 'Kambodja', 'Malaysia'],
      d: 1,
    },
    {
      q: 'Vilken flod rinner genom Bangkok?',
      a: ['Chao Phraya', 'Mekong', 'Irrawaddy', 'Ganges'],
      d: 1,
    },
    {
      q: 'Vad hette Thailand fram till 1939?',
      a: ['Siam', 'Burma', 'Malaya', 'Indokina'],
      d: 2,
    },
    {
      q: 'Vilken religion har majoriteten i Thailand?',
      a: ['Buddhism', 'Islam', 'Hinduism', 'Kristendom'],
      d: 1,
    },
    {
      q: 'Vad kallas Thailands motoriserade trehjuliga taxibilar?',
      a: ['Tuk-tuk', 'Gondol', 'Rickshaw utan motor', 'Jeepney'],
      d: 1,
    },
    {
      q: 'Vilken thailändsk kampsport använder knän och armbågar?',
      a: ['Muay thai', 'Taekwondo', 'Judo', 'Capoeira'],
      d: 1,
    },
    {
      q: 'Vad heter tempelanläggningen med den liggande Buddhan i Bangkok?',
      a: ['Wat Pho', 'Wat Arun', 'Angkor Wat', 'Borobudur'],
      d: 2,
    },
    {
      q: 'Vilken thailändsk soppa smaksätts med citrongräs och galangal?',
      a: ['Tom yum', 'Miso', 'Pho', 'Laksa'],
      d: 2,
    },
  ],
  peking: [
    {
      q: 'Vad heter det stora palatskomplexet i Pekings centrum?',
      a: ['Förbjudna staden', 'Sommarpalatset', 'Potala', 'Topkapi'],
      d: 1,
    },
    {
      q: 'Vilket enormt byggnadsverk går genom norra Kina?',
      a: ['Kinesiska muren', 'Hadrianus mur', 'Berlinmuren', 'Klagomuren'],
      d: 1,
    },
    {
      q: 'Vad heter det stora torget i Pekings centrum?',
      a: ['Himmelska fridens torg', 'Röda torget', 'Zócalo', 'Trafalgar Square'],
      d: 1,
    },
    {
      q: 'Vilket är Kinas officiella huvudspråk?',
      a: ['Mandarin', 'Kantonesiska', 'Japanska', 'Koreanska'],
      d: 1,
    },
    {
      q: 'Vilken flod är Kinas längsta?',
      a: ['Yangtze', 'Gula floden', 'Mekong', 'Amur'],
      d: 2,
      info: 'Cirka 6 300 km, Asiens längsta flod.',
    },
    {
      q: 'Vilket djur är en nationalsymbol för Kina?',
      a: ['Jättepandan', 'Tigern', 'Elefanten', 'Kranen'],
      d: 1,
    },
    {
      q: 'Vilket år hölls de olympiska sommarspelen i Peking?',
      a: ['2008', '2000', '2012', '2004'],
      d: 1,
    },
    {
      q: 'Vad kallas den kejserliga tjänstemannaexamen som präglade Kina i århundraden?',
      a: ['Mandarinexamen (keju)', 'Samurajprovet', 'Bakalaureat', 'Diwan'],
      d: 2,
    },
  ],
  tokyo: [
    {
      q: 'Vilket land är Tokyo huvudstad i?',
      a: ['Japan', 'Kina', 'Sydkorea', 'Taiwan'],
      d: 1,
    },
    {
      q: 'Vad kallas Japans snabbtåg?',
      a: ['Shinkansen', 'TGV', 'ICE', 'Maglev Express'],
      d: 1,
    },
    {
      q: 'Vilket berg är Japans högsta och syns från Tokyo på klara dagar?',
      a: ['Fuji', 'Everest', 'Aso', 'Hakusan'],
      d: 1,
      info: '3 776 meter hög vulkan.',
    },
    {
      q: 'Vad hette Tokyo innan 1868?',
      a: ['Edo', 'Kyoto', 'Osaka', 'Nara'],
      d: 2,
    },
    {
      q: 'Vilken korsning i Tokyo är känd för sina folkmassor?',
      a: ['Shibuya', 'Ginza', 'Akihabara', 'Roppongi'],
      d: 1,
    },
    {
      q: 'Vad kallas japanska tecknade serier?',
      a: ['Manga', 'Anime', 'Hanzi', 'Kanji'],
      d: 2,
    },
    {
      q: 'Vilket vatten ligger Tokyo vid?',
      a: ['Stilla havet (Tokyobukten)', 'Indiska oceanen', 'Japanska havet', 'Ochotska havet'],
      d: 2,
    },
    {
      q: 'Vilket naturfenomen är Japan särskilt utsatt för?',
      a: ['Jordbävningar', 'Sandstormar', 'Laviner i tropiken', 'Torka året runt'],
      d: 1,
    },
  ],
  sydney: [
    {
      q: 'Vilken byggnad med segelliknande skal är Sydneys landmärke?',
      a: ['Operahuset', 'Sky Tower', 'Empire State Building', 'Petronas Towers'],
      d: 1,
      info: 'Ritat av danske Jørn Utzon och invigt 1973.',
    },
    {
      q: 'Vilken är Australiens huvudstad?',
      a: ['Canberra', 'Sydney', 'Melbourne', 'Perth'],
      d: 1,
    },
    {
      q: 'Vilket rev utanför Australiens östkust är världens största?',
      a: ['Stora barriärrevet', 'Maldivrevet', 'Belizerevet', 'Röda havsrevet'],
      d: 1,
    },
    {
      q: 'Vad kallas Australiens inland med torr buskmark?',
      a: ['Outback', 'Pampas', 'Prärien', 'Steppen'],
      d: 1,
    },
    {
      q: 'Vilket djur bär sin unge i en pung och är en australisk symbol?',
      a: ['Kängurun', 'Lamadjuret', 'Bisonoxen', 'Tapiren'],
      d: 1,
    },
    {
      q: 'Vad kallas Australiens urbefolkning?',
      a: ['Aboriginer', 'Maorier', 'Inuiter', 'Samer'],
      d: 1,
    },
    {
      q: 'Vilken delstat ligger Sydney i?',
      a: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'],
      d: 2,
    },
    {
      q: 'Vad kallas bron intill Operahuset i folkmun?',
      a: ['The Coathanger', 'The Needle', 'The Gate', 'The Arch of Gold'],
      d: 2,
    },
  ],
  auckland: [
    {
      q: 'Vilket land ligger Auckland i?',
      a: ['Nya Zeeland', 'Australien', 'Fiji', 'Papua Nya Guinea'],
      d: 1,
    },
    {
      q: 'Vad kallas Nya Zeelands urbefolkning?',
      a: ['Maorier', 'Aboriginer', 'Polynesier i allmänhet', 'Inuiter'],
      d: 1,
    },
    {
      q: 'Vilken är Nya Zeelands huvudstad?',
      a: ['Wellington', 'Auckland', 'Christchurch', 'Dunedin'],
      d: 1,
    },
    {
      q: 'Vilken flightlös fågel är Nya Zeelands symbol?',
      a: ['Kiwi', 'Struts', 'Emu', 'Pingvin'],
      d: 1,
    },
    {
      q: 'Vad kallas den maoriska danssång som rugbylandslaget utför före matcher?',
      a: ['Haka', 'Hula', 'Samba', 'Sirtaki'],
      d: 1,
    },
    {
      q: 'Vad står Auckland byggt på?',
      a: ['Ett fält av slocknade vulkaner', 'En korallrevsplatå', 'En glaciärmorän', 'En saltslätt'],
      d: 2,
    },
    {
      q: 'Vilket djur finns det fler av än människor i Nya Zeeland?',
      a: ['Får', 'Kor', 'Hästar', 'Grisar'],
      d: 1,
    },
    {
      q: 'Vad kallas Nya Zeelands rugbylandslag?',
      a: ['All Blacks', 'Wallabies', 'Springboks', 'Pumas'],
      d: 2,
    },
  ],
  newyork: [
    {
      q: 'Vilket land gav Frihetsgudinnan till USA?',
      a: ['Frankrike', 'Storbritannien', 'Spanien', 'Nederländerna'],
      d: 1,
      info: 'Invigd 1886 som gåva till USA:s hundraårsjubileum.',
    },
    {
      q: 'Hur många stadsdelar (boroughs) har New York City?',
      a: ['Fem', 'Tre', 'Sju', 'Tolv'],
      d: 1,
      info: 'Manhattan, Brooklyn, Queens, Bronx och Staten Island.',
    },
    {
      q: 'Vilken stor park ligger mitt på Manhattan?',
      a: ['Central Park', 'Hyde Park', 'Golden Gate Park', 'Prospect Park'],
      d: 1,
    },
    {
      q: 'Vilken organisation har sitt huvudkvarter på Manhattans östsida?',
      a: ['Förenta nationerna', 'Nato', 'Världsbanken', 'WHO'],
      d: 1,
    },
    {
      q: 'Vad hette New York när det var en nederländsk koloni?',
      a: ['Nya Amsterdam', 'Nya Rotterdam', 'Nya Haarlem', 'Nya Antwerpen'],
      d: 2,
    },
    {
      q: 'Vilken gata är centrum för USA:s finansvärld?',
      a: ['Wall Street', 'Broadway', 'Fifth Avenue', 'Bourbon Street'],
      d: 1,
    },
    {
      q: 'Vilken ö tog emot miljontals invandrare till USA fram till 1954?',
      a: ['Ellis Island', 'Roosevelt Island', 'Coney Island', 'Governors Island'],
      d: 2,
    },
    {
      q: 'Vilken skyskrapa var världens högsta 1931-1970?',
      a: ['Empire State Building', 'Chrysler Building', 'Woolworth Building', 'Flatiron Building'],
      d: 2,
    },
  ],
  mexikocity: [
    {
      q: 'Vilken forntida stad låg där Mexico City ligger idag?',
      a: ['Tenochtitlán', 'Machu Picchu', 'Chichén Itzá', 'Teotihuacán'],
      d: 1,
    },
    {
      q: 'Vilket folk härskade i Mexikodalen när spanjorerna kom?',
      a: ['Aztekerna', 'Inkafolket', 'Mayafolket', 'Olmekerna'],
      d: 1,
    },
    {
      q: 'Vad är särskilt utmanande med Mexico Citys läge?',
      a: [
        'Den ligger högt i en uttorkad sjöbotten och sjunker',
        'Den ligger under havsnivån vid kusten',
        'Den är byggd på en glaciär',
        'Den saknar helt grundvatten',
      ],
      d: 2,
    },
    {
      q: 'Vilket språk är officiellt i Mexiko?',
      a: ['Spanska', 'Portugisiska', 'Franska', 'Nahuatl'],
      d: 1,
    },
    {
      q: 'Vad kallas det stora torget i Mexico Citys centrum?',
      a: ['Zócalo', 'Plaza Mayor', 'Times Square', 'Piazza Navona'],
      d: 2,
    },
    {
      q: 'Vilken mexikansk konstnär är känd för sina självporträtt?',
      a: ['Frida Kahlo', 'Diego Rivera', 'Rufino Tamayo', 'Remedios Varo'],
      d: 1,
    },
    {
      q: 'Vad heter den mexikanska högtiden som hedrar de döda i början av november?',
      a: ['Día de los Muertos', 'Cinco de Mayo', 'Las Posadas', 'Carnaval'],
      d: 1,
    },
    {
      q: 'Vilken spansk conquistador erövrade aztekriket?',
      a: ['Hernán Cortés', 'Francisco Pizarro', 'Vasco da Gama', 'Ferdinand Magellan'],
      d: 2,
    },
  ],
  cusco: [
    {
      q: 'Vilket rike hade Cusco som huvudstad?',
      a: ['Inkariket', 'Aztekriket', 'Mayariket', 'Chimú'],
      d: 1,
    },
    {
      q: 'Vilken bergskedja ligger Cusco i?',
      a: ['Anderna', 'Klippiga bergen', 'Alperna', 'Himalaya'],
      d: 1,
    },
    {
      q: 'Vilken berömd ruinstad nås via Inkaleden från Cusco?',
      a: ['Machu Picchu', 'Petra', 'Angkor Wat', 'Tikal'],
      d: 1,
    },
    {
      q: 'Vilket är Perus officiella huvudspråk vid sidan om quechua?',
      a: ['Spanska', 'Portugisiska', 'Engelska', 'Aymara enbart'],
      d: 1,
    },
    {
      q: 'Vilket djur användes som packdjur i Inkariket?',
      a: ['Lamadjuret', 'Kamelen', 'Åsnan', 'Hästen'],
      d: 1,
      info: 'Hästen fanns inte i Amerika före europeernas ankomst.',
    },
    {
      q: 'Vad kallas den höglänta sjön mellan Peru och Bolivia?',
      a: ['Titicacasjön', 'Maracaibo', 'Poopó', 'Nicaraguasjön'],
      d: 2,
    },
    {
      q: 'Ungefär hur högt över havet ligger Cusco?',
      a: ['3 400 meter', '1 200 meter', '800 meter', '5 200 meter'],
      d: 2,
    },
    {
      q: 'Vad heter den stora inkafästningen ovanför Cusco?',
      a: ['Sacsayhuamán', 'Ollantaytambo', 'Choquequirao', 'Pisac'],
      d: 2,
    },
  ],
  rio: [
    {
      q: 'Vilken staty står på berget Corcovado i Rio?',
      a: ['Kristusstatyn', 'Frihetsgudinnan', 'Moderlandet kallar', 'Den lilla sjöjungfrun'],
      d: 1,
    },
    {
      q: 'Vilket språk talas i Brasilien?',
      a: ['Portugisiska', 'Spanska', 'Franska', 'Italienska'],
      d: 1,
    },
    {
      q: 'Vad heter Rios mest berömda strand?',
      a: ['Copacabana', 'Bondi Beach', 'Waikiki', 'Playa del Carmen'],
      d: 1,
    },
    {
      q: 'Vilket berg vid Rios hamninlopp nås med linbana?',
      a: ['Sockertoppen', 'Taffelberget', 'Fuji', 'Mont Blanc'],
      d: 1,
    },
    {
      q: 'Vilken är Brasiliens huvudstad?',
      a: ['Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'],
      d: 1,
      info: 'Huvudstaden flyttades från Rio till Brasília 1960.',
    },
    {
      q: 'Vilken dans och musikstil präglar Rios karneval?',
      a: ['Samba', 'Tango', 'Salsa', 'Flamenco'],
      d: 1,
    },
    {
      q: 'Vilken regnskog täcker norra Brasilien?',
      a: ['Amazonas', 'Kongo', 'Borneo', 'Valdivia'],
      d: 1,
    },
    {
      q: 'Vad kallas Rios stora fotbollsstadion?',
      a: ['Maracanã', 'Camp Nou', 'Wembley', 'Azteca'],
      d: 2,
    },
  ],
};

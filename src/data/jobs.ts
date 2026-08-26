import type { Job } from './types';

/**
 * Jobben återanvänds mellan städer precis som i originalet. Löneklassen styr
 * hur mycket varje rätt svar ger och vilket betyg du behöver från turistbyrån.
 */
export const JOBS: Job[] = [
  // --- Löneklass 1: enkla jobb som alla får ---
  {
    id: 'hotellstadare',
    title: 'Hotellstädare',
    employer: 'Hostel Nomad',
    category: 'geografi',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Vi söker dig som bäddar snabbt och kan svara på gästernas frågor om världen.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera tvätten',
      brief:
        'Dra varje sak till rätt korg innan vagnen rullar förbi.',
      items: ['Lakan', 'Handdukar', 'Örngott'],
      pool: [
        ['Dubbellakan', 'Påslakan', 'Underlakan', 'Bäddmadrasskydd', 'Enkellakan'],
        ['Badlakan', 'Gästhandduk', 'Frottéhandduk', 'Badrumsmatta', 'Tvättlapp'],
        ['Kuddvar med logga', 'Litet örngott', 'Nackkuddsvar', 'Örngott 50x60', 'Extra örngott'],
      ],
    },
    scene:
      'Vagnen är fylld med rena lakan och sjutton rum väntar. Receptionen ringer om en gäst som glömt sin nyckel.',
  },
  {
    id: 'tidningsbud',
    title: 'Tidningsbud',
    employer: 'Morning Herald',
    category: 'historia',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Tidiga mornar, tunga väskor. Du bör känna igen nyheterna du delar ut.',
    minigame: {
      kind: 'sekvens',
      title: 'Kom ihåg rundan',
      brief:
        'Portarna lyser upp i tur och ordning. Upprepa rundan i rätt följd.',
      items: ['Port A', 'Port B', 'Port C', 'Port D'],
    },
    scene:
      'Klockan är fyra på morgonen. Buntarna ligger på trottoaren och portkoderna sitter i minnet.',
  },
  {
    id: 'fikabitrade',
    title: 'Fikabiträde',
    employer: 'Café Kanelbullen',
    category: 'mat',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Servera kaffe och bakverk. Kunskap om fika och matkultur är ett plus.',
    minigame: {
      kind: 'precision',
      title: 'Skumma mjölken',
      brief:
        'Stoppa mätaren när mjölken har rätt temperatur.',
      items: ['Mjölktemperatur'],
      unit: 'grader',
    },
    scene:
      'Ångan väser ur espressomaskinen och kanelbullarna är nygräddade. Kön ringlar mot dörren.',
  },
  {
    id: 'gatukoksbitrade',
    title: 'Gatukäksbiträde',
    employer: 'Street Food Corner',
    category: 'mat',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Woka, grilla, servera. Tempo högt, kryddor starka.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera beställningarna',
      brief:
        'Dra varje ingrediens till rätt wok innan den brinner.',
      items: ['Nudlar', 'Grönsaker', 'Räkor'],
      pool: [
        ['Risnudlar', 'Äggnudlar', 'Glasnudlar', 'Udon', 'Vetenudlar'],
        ['Pak choi', 'Böngroddar', 'Vårlök', 'Morotsstrimlor', 'Paprikaskivor'],
        ['Tigerräkor', 'Skalade räkor', 'Räkspett', 'Jätteräkor', 'Räkfärs'],
      ],
    },
    scene:
      'Woken flammar över gaslågan och ångan står som en vägg. Beställningarna ropas ut på thai.',
  },
  {
    id: 'butiksvard',
    title: 'Butiksvärd',
    employer: 'Konbini 24',
    category: 'ekonomi',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Kassa och kundservice dygnet runt. Du måste kunna räkna växel i huvudet.',
    minigame: {
      kind: 'vaxel',
      title: 'Räkna växeln',
      brief:
        'Slå ihop kundens varor, dra av sedeln och plocka fram rätt växel ur lådan.',
      items: ['Onigiri', 'Iste', 'Tuggummi', 'Batterier', 'Paraply'],
    },
    scene:
      'Neonljuset surrar och kassan piper. Nattens kunder kommer i jämn ström.',
  },
  {
    id: 'hamnarbetare',
    title: 'Hamnarbetare',
    employer: 'Frihamnen AB',
    category: 'hav',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Lossa containrar och håll koll på vilket fartyg som ska vart.',
    minigame: {
      kind: 'sortering',
      title: 'Lasta containrarna',
      brief:
        'Dra varje container till rätt fartyg.',
      items: ['Kylgods', 'Torrgods', 'Farligt gods'],
      pool: [
        ['Fryst fisk', 'Kött i kylcontainer', 'Glasslast', 'Vaccin på is', 'Snittblommor'],
        ['Rissäckar', 'Pappersrullar', 'Kaffesäckar', 'Bildelar', 'Textilbalar'],
        ['Bensinfat', 'Klorgastub', 'Batterisyra', 'Fyrverkerier', 'Ammoniaktank'],
      ],
    },
    scene:
      'Kranarna gnisslar och containrarna svävar in över kajen. Radion sprakar med lastordrar.',
  },
  {
    id: 'kamelforare',
    title: 'Kamelförare',
    employer: 'Ökenkaravanen',
    category: 'djur',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Led turister ut i sanden. Kameler biter den som inte kan sina djur.',
    minigame: {
      kind: 'sekvens',
      title: 'Led karavanen',
      brief:
        'Lär dig ledarens ordning genom dynerna och upprepa den.',
      items: ['Dyn 1', 'Dyn 2', 'Dyn 3', 'Dyn 4'],
    },
    scene:
      'Solen står högt över dynerna. Kamelerna idisslar medan turisterna klättrar upp.',
  },
  {
    id: 'lamaskotare',
    title: 'Lamaskötare',
    employer: 'Andes Trek',
    category: 'djur',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Lasta packdjur för Inkaleden. Spottande djur, härlig utsikt.',
    minigame: {
      kind: 'precision',
      title: 'Väg packningen',
      brief:
        'Stoppa vågen när lasten är precis rätt för djuret.',
      items: ['Packningsvikt'],
      unit: 'kilo',
    },
    scene:
      'Morgondimman ligger kvar i dalen. Lamadjuren stampar otåligt inför dagens klättring.',
  },
  {
    id: 'farmarbetare',
    title: 'Farmarbetare',
    employer: 'Outback Station',
    category: 'natur',
    wageClass: 1,
    shiftLength: 6,
    ad: 'Fårklippning och stängselreparation. Working holiday-klassiker.',
    minigame: {
      kind: 'traffa',
      title: 'Driv in flocken',
      brief:
        'Plocka ut fåren som ska in i fållan. Låt hunden och lammen vara.',
      items: [
        'Oklippt tacka',
        'Bagge med full päls',
        'Får som vandrat utanför stängslet',
        'Tacka märkt med blå fläck',
      ],
      avoid: ['Vallhunden', 'Nyfött lamm', 'Stängselstolpe', 'Vattentråg', 'Kängurun'],
    },
    scene:
      'Dammet yr i fårfållan och klippmaskinen surrar. Tusen får väntar på sin tur.',
  },
  {
    id: 'cykelkurir',
    title: 'Cykelkurir',
    employer: 'Vélo Express',
    category: 'trafik',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Snabba leveranser i innerstaden. Du måste kunna gatorna och reglerna.',
    minigame: {
      kind: 'balans',
      title: 'Genom myllret',
      brief:
        'Väskan väger snett och kullerstenen är hal. Håll cykeln rak hela vägen.',
      items: ['Kurirväskan'],
      unit: 'graders lutning',
    },
    scene:
      'Regnet gör kullerstenen hal. Väskan är full av paket som skulle varit levererade i går.',
  },
  {
    id: 'vespabud',
    title: 'Vespabud',
    employer: 'Rapido Consegne',
    category: 'trafik',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Kör paket genom trånga gränder utan att repa lacken.',
    minigame: {
      kind: 'balans',
      title: 'Genom gränderna',
      brief:
        'Paketen sitter på pakethållaren och gränden lutar. Fånga upp lutningen i tid.',
      items: ['Vespan'],
      unit: 'graders lutning',
    },
    scene:
      'Vespan spinner mellan gränderna. En lastbil blockerar hela gatan framför dig.',
  },
  {
    id: 'ullfabriksarbetare',
    title: 'Ullfabriksarbetare',
    employer: 'Álafoss Ullverk',
    category: 'mode',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Kardning och stickmaskiner. Lär dig allt om fibrer och plagg.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera ullen',
      brief:
        'Dra fibrerna till rätt kvalitetsbunt.',
      items: ['Finull', 'Mellanull', 'Grovull'],
      pool: [
        ['Merinofäll', 'Lammull', 'Kashmirtott', 'Alpackafiber', 'Mjuk underull'],
        ['Crossbredull', 'Höstklippt fårull', 'Blandtott', 'Korsningsull', 'Vinterfäll'],
        ['Ryaull', 'Mattgarnsull', 'Tovull', 'Bogull', 'Svansull'],
      ],
    },
    scene:
      'Kardmaskinerna dånar och luften är full av ulldamm. Garnet löper i tjocka strängar.',
  },
  {
    id: 'basarforsaljare',
    title: 'Basarförsäljare',
    employer: 'Grand Bazaar',
    category: 'ekonomi',
    wageClass: 1,
    shiftLength: 6,
    ad: 'Pruta, charma och sälj. Provision på varje avslut.',
    minigame: {
      kind: 'vaxel',
      title: 'Slut affären',
      brief:
        'Kunden köper flera saker på en gång och betalar med en stor sedel. Räkna rätt.',
      items: ['Mässingslampa', 'Silkessjal', 'Tekanna', 'Kryddpåse', 'Amulett'],
    },
    scene:
      'Mattorna hänger i travar och doften av te ligger tät. En turist tittar nyfiket på en lampa.',
  },
  {
    id: 'perlvavare',
    title: 'Pärlvävare',
    employer: 'Hantverkskollektivet',
    category: 'konst',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Tåliga fingrar och gott färgsinne krävs.',
    minigame: {
      kind: 'sekvens',
      title: 'Följ mönstret',
      brief:
        'Lägg pärlorna i samma ordning som mönstret visar.',
      items: ['Röd', 'Blå', 'Vit', 'Grön'],
    },
    scene:
      'Tusentals glaspärlor glittrar i skålar. Mönstret ska bli exakt som förlagan.',
  },
  {
    id: 'vavare',
    title: 'Vävare',
    employer: 'Textil Andina',
    category: 'konst',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Väv alpackagarn i traditionella mönster.',
    minigame: {
      kind: 'sekvens',
      title: 'Väv mönstret',
      brief:
        'Trampa skaften i rätt ordning för mönstret.',
      items: ['Skaft 1', 'Skaft 2', 'Skaft 3', 'Skaft 4'],
    },
    scene:
      'Vävstolen knäpper i takt. Alpackagarnet är mjukt mellan fingrarna.',
  },

  // --- Löneklass 2: kräver hyggligt betyg från turistbyrån ---
  {
    id: 'museivard',
    title: 'Museivärd',
    employer: 'Nationalmuseet',
    category: 'konst',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Guida besökare och svara på frågor om samlingarna. Konstintresse krävs.',
    minigame: {
      kind: 'instrument',
      title: 'Håll ordning i salen',
      brief:
        'Tryck på rätt åtgärd när något händer i salen.',
      items: ['Be om tystnad', 'Stoppa blixten', 'Visa vägen', 'Larma vakten'],
    },
    scene:
      'Salarna är svala och tysta. En skolklass närmar sig med guiden i spetsen.',
  },
  {
    id: 'konstguide',
    title: 'Konstguide',
    employer: 'Galerie du Monde',
    category: 'konst',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Håll visningar för grupper. Du bör kunna dina konstnärer och epoker.',
    minigame: {
      kind: 'sekvens',
      title: 'Guida rundan',
      brief:
        'Visa verken i den ordning rundan kräver.',
      items: ['Renässans', 'Barock', 'Impressionism', 'Modernism'],
    },
    scene:
      'Gruppen samlas framför en väldig oljemålning. Någon räcker redan upp handen.',
  },
  {
    id: 'pubvard',
    title: 'Pubvärd',
    employer: 'The Crooked Anchor',
    category: 'sport',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Tappa öl och håll ordning under matcherna. Sportkunskap ett måste.',
    minigame: {
      kind: 'precision',
      title: 'Tappa en pint',
      brief:
        'Stoppa tappningen med rätt mängd skum på toppen.',
      items: ['Skumkrona'],
      unit: 'millimeter',
    },
    scene:
      'Matchen går på skärmen och puben är packad. Tappkranarna går varma.',
  },
  {
    id: 'sparvagnsforare',
    title: 'Spårvagnsförare',
    employer: 'Stadstrafiken',
    category: 'trafik',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Håll tidtabellen och kunskap om linjenät och trafikregler.',
    minigame: {
      kind: 'instrument',
      title: 'Kör vagnen',
      brief:
        'Tryck på rätt reglage när trafiken kräver det.',
      items: ['Bromsa', 'Ring signal', 'Öppna dörrar', 'Stäng dörrar'],
    },
    scene:
      'Vagnen är full och tidtabellen är snäv. Nästa hållplats ligger i en kurva.',
  },
  {
    id: 'tunnelbanevard',
    title: 'Tunnelbanevärd',
    employer: 'Tunnelbaneförvaltningen',
    category: 'trafik',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Informera resenärer i rusningstrafik. Lokalkännedom krävs.',
    minigame: {
      kind: 'instrument',
      title: 'Håll flödet igång',
      brief:
        'Tryck på rätt åtgärd när resenärerna behöver hjälp.',
      items: ['Visa vägen', 'Varna för kanten', 'Öppna spärren', 'Larma trafikledning'],
    },
    scene:
      'Rusningstid. Luften rör sig i tunneln när nästa tåg närmar sig.',
  },
  {
    id: 'tagvard',
    title: 'Tågvärd',
    employer: 'Kontinentaltåg',
    category: 'geografi',
    wageClass: 2,
    shiftLength: 7,
    ad: 'Långa sträckor, många gränser. Du måste kunna kartan utan att titta.',
    minigame: {
      kind: 'sortering',
      title: 'Kontrollera biljetterna',
      brief:
        'Dra varje resenär till rätt vagn.',
      items: ['Sittvagn', 'Sovvagn', 'Restaurangvagn'],
      pool: [
        ['Plats 42 vid fönster', 'Andraklassbiljett', 'Pendlarkort', 'Sittplats vid gången', 'Familjekupé'],
        ['Bädd 3, övre', 'Liggvagnsbiljett', 'Kupé för två', 'Nattbiljett Berlin', 'Sovkupé ensam'],
        ['Bordsbokning 19.00', 'Middagskupong', 'Frukostkupong', 'Bord vid fönstret', 'Kaffe och smörgås'],
      ],
    },
    scene:
      'Vagnarna gungar genom natten. Gränskontrollen väntar om två timmar.',
  },
  {
    id: 'taxichauffor',
    title: 'Taxichaufför',
    employer: 'Yellow Cab Co.',
    category: 'geografi',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Kör kunder dit de ska, snabbaste vägen. Kartminne är hela jobbet.',
    minigame: {
      kind: 'instrument',
      title: 'Kör genom staden',
      brief:
        'Tryck på rätt reglage när trafiken kräver det.',
      items: ['Blinkers', 'Tuta', 'Bromsa', 'Starta taxameter'],
    },
    scene:
      'Taxametern tickar och Manhattan står stilla i rusningstrafiken. Kunden har ett flyg att hinna.',
  },
  {
    id: 'bagare',
    title: 'Bagare',
    employer: 'Boulangerie Étoile',
    category: 'mat',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Nattskift vid ugnarna. Degkunskap och matkultur premieras.',
    minigame: {
      kind: 'precision',
      title: 'Grädda brödet',
      brief:
        'Ta ut brödet när skorpan har exakt rätt färg.',
      items: ['Gräddningsgrad'],
      unit: 'procent',
    },
    scene:
      'Ugnarna glöder i nattmörkret. Degen har jäst precis rätt och mjölet ligger som puder.',
  },
  {
    id: 'kock',
    title: 'Kock',
    employer: 'Restaurant Terroir',
    category: 'mat',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Á la carte i högt tempo. Vi frågar om råvaror och kökstermer.',
    minigame: {
      kind: 'sortering',
      title: 'Skicka ut rätterna',
      brief:
        'Dra varje tallrik till rätt bord.',
      items: ['Förrätt', 'Varmrätt', 'Dessert'],
      pool: [
        ['Löksoppa', 'Gravad lax', 'Bruschetta', 'Sallad med chèvre', 'Räkcocktail'],
        ['Fläskkarré med rotfrukter', 'Torsk med potatis', 'Svamprisotto', 'Biff i rödvinssås', 'Currygryta'],
        ['Crème brûlée', 'Chokladfondant', 'Äppelpaj', 'Citronsorbet', 'Ostbricka'],
      ],
    },
    scene:
      'Beställningarna hänger i rad och alla plattor är upptagna. Kökschefen ropar efter bord sju.',
  },
  {
    id: 'pizzabagare',
    title: 'Pizzabagare',
    employer: 'Pizzeria da Nonna',
    category: 'mat',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Vedugn, tunn botten, inga genvägar.',
    minigame: {
      kind: 'precision',
      title: 'Grädda pizzan',
      brief:
        'Dra ut pizzan i exakt rätt sekund.',
      items: ['Gräddningstid'],
      unit: 'sekunder',
    },
    scene:
      'Vedugnen står på 450 grader. Degbollarna vilar under en fuktig duk.',
  },
  {
    id: 'kryddhandlare',
    title: 'Kryddhandlare',
    employer: 'Spice Route Trading',
    category: 'mat',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Blanda, väg och sälj. Du bör känna igen varje krydda på lukten.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera kryddorna',
      brief:
        'Dra varje krydda till rätt säck.',
      items: ['Saffran', 'Kanel', 'Kummin'],
      pool: [
        ['Röda pistiller i glasrör', 'Krokusstånd', 'Trådar i kuvert', 'Ett gram i tenndosa', 'Pulver med djup färg'],
        ['Rullade barkstänger', 'Cassiabark', 'Malen bark', 'Ceylonrulle', 'Bruten stång'],
        ['Halvmånsformade frön', 'Rostade frön i påse', 'Malen spiskummin', 'Frön till brödet', 'Blandning till gryta'],
      ],
    },
    scene:
      'Säckarna står öppna med saffran, kummin och kanel. Doften är överväldigande.',
  },
  {
    id: 'tehandlare',
    title: 'Tehandlare',
    employer: 'Highland Tea House',
    category: 'mat',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Provsmakning och sortering av blad från olika odlingar.',
    minigame: {
      kind: 'precision',
      title: 'Brygg teet',
      brief:
        'Stoppa klockan när teet dragit exakt rätt tid.',
      items: ['Dragtid'],
      unit: 'sekunder',
    },
    scene:
      'Bladen ligger utbredda på bord i långa rader. Vattnet puttrar i kopparkitteln.',
  },
  {
    id: 'kaffeprovare',
    title: 'Kaffeprovare',
    employer: 'Fazenda Aurora',
    category: 'mat',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Cupping av bönor från olika höjdlägen. Känslig näsa krävs.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera bönorna',
      brief:
        'Dra varje parti till rätt kvalitetsklass.',
      items: ['Toppkvalitet', 'Standard', 'Kasseras'],
      pool: [
        ['Jämn storlek, ingen defekt', 'Blank yta och tät doft', 'Handplockad topplott', 'Höglänt böna, hel', '88 poäng i koppen'],
        ['Något ojämn rostning', 'Enstaka småbönor', 'Godkänd men platt doft', 'Liten färgskiftning', '79 poäng i koppen'],
        ['Mögelfläck', 'Insektshål', 'Bränd böna', 'Sten i partiet', 'Sur, jäst doft'],
      ],
    },
    scene:
      'Tolv skålar står uppradade för cupping. Skedarna ligger blankpolerade.',
  },
  {
    id: 'vinodlare',
    title: 'Vinodlare',
    employer: 'Stellenbosch Estate',
    category: 'natur',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Skörd och pressning. Kunskap om druvor och klimat är avgörande.',
    minigame: {
      kind: 'precision',
      title: 'Mät sockerhalten',
      brief:
        'Stoppa mätaren när druvan har rätt sockerhalt för skörd.',
      items: ['Sockerhalt'],
      unit: 'grader Brix',
    },
    scene:
      'Raderna löper mot bergen och druvorna är fulla av sol. Skörden måste in i dag.',
  },
  {
    id: 'blomsterhandlare',
    title: 'Blomsterhandlare',
    employer: 'Bloemenmarkt',
    category: 'natur',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Binda buketter och kunna dina växter på latin om det krävs.',
    minigame: {
      kind: 'sortering',
      title: 'Bind buketterna',
      brief:
        'Dra varje blomma till rätt bukett.',
      items: ['Tulpaner', 'Rosor', 'Solrosor'],
      pool: [
        ['Röd tulpan', 'Papegojtulpan', 'Vit tulpan', 'Fransad tulpan', 'Tulpan med lök kvar'],
        ['Långstjälkad röd ros', 'Buskros', 'Gul te-ros', 'Rosenknopp', 'Ros med törnen'],
        ['Stor solros', 'Solrosknopp', 'Miniatyrsolros', 'Solros med brett blad', 'Solros i kruka'],
      ],
    },
    scene:
      'Hinkarna står fyllda med tulpaner i alla färger. Auktionen börjar om en timme.',
  },
  {
    id: 'cykelmekaniker',
    title: 'Cykelmekaniker',
    employer: 'Fiets & Fix',
    category: 'teknik',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Punkteringar, växlar och vevlager. Skruvsinne krävs.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera verktygen',
      brief:
        'Dra varje verktyg till rätt låda.',
      items: ['Nycklar', 'Insex', 'Däckverktyg'],
      pool: [
        ['Skiftnyckel', 'Fast nyckel 15 mm', 'Pedalnyckel', 'Ekernyckel', 'Kedjepiska'],
        ['Insex 4 mm', 'Insex 5 mm', 'Kulhuvudsinsex', 'T-handtag insex', 'Insexbits'],
        ['Däckavtagare', 'Cykelpump', 'Lagningslapp', 'Ventiladapter', 'Slangkit'],
      ],
    },
    scene:
      'Verkstaden luktar olja och gummi. Sex cyklar väntar på lagning före stängning.',
  },
  {
    id: 'kanalskeppare',
    title: 'Kanalskeppare',
    employer: 'Canal Cruise',
    category: 'hav',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Manövrera under låga broar och berätta samtidigt.',
    minigame: {
      kind: 'precision',
      title: 'Passera bron',
      brief:
        'Stoppa båten med exakt rätt marginal under bron.',
      items: ['Fri höjd'],
      unit: 'centimeter',
    },
    scene:
      'Bron är låg och vattenståndet högt. Trettio passagerare sitter under kapellet.',
  },
  {
    id: 'farjematros',
    title: 'Färjematros',
    employer: 'Bosphorus Lines',
    category: 'hav',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Förtöj, lossa och håll koll på sjövägsreglerna.',
    minigame: {
      kind: 'instrument',
      title: 'Förtöj färjan',
      brief:
        'Tryck på rätt moment i förtöjningen.',
      items: ['Kasta lina', 'Lägg ut fender', 'Öppna landgång', 'Slå på motorn'],
    },
    scene:
      'Bosporen ligger blank och strömmen är stark. Kajen närmar sig fort.',
  },
  {
    id: 'batfarjematros',
    title: 'Flodbåtsmatros',
    employer: 'Chao Phraya Express',
    category: 'hav',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Snabba stopp längs floden. Balans och sjövana.',
    minigame: {
      kind: 'instrument',
      title: 'Klara bryggan',
      brief:
        'Tryck på rätt moment innan båten går igen.',
      items: ['Fender ut', 'Landgång', 'Vissla av', 'Kasta lina'],
    },
    scene:
      'Expressbåten stannar i tio sekunder per brygga. Floden är full av trafik.',
  },
  {
    id: 'nilbatskapten',
    title: 'Nilbåtskapten',
    employer: 'Felucca Tours',
    category: 'hav',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Segla feluccan i motvind och berätta om floden.',
    minigame: {
      kind: 'precision',
      title: 'Trimma seglet',
      brief:
        'Ställ seglet i exakt rätt vinkel mot vinden.',
      items: ['Segelvinkel'],
      unit: 'grader',
    },
    scene:
      'Seglet hänger slakt i eftermiddagshettan. Nordvinden kommer strax.',
  },
  {
    id: 'segelbatsmatros',
    title: 'Segelbåtsmatros',
    employer: 'Hamnens segelsällskap',
    category: 'hav',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Trimma segel under kappsegling. Knopar och termer på plats.',
    minigame: {
      kind: 'sekvens',
      title: 'Genomför vändningen',
      brief:
        'Utför momenten i rätt ordning vid stagvändningen.',
      items: ['Varsko', 'Släpp skot', 'Vänd roder', 'Hala hem'],
    },
    scene:
      'Kappseglingen börjar om tio minuter. Vinden friskar i från nordväst.',
  },
  {
    id: 'skargardsguide',
    title: 'Skärgårdsguide',
    employer: 'Västkustturer',
    category: 'natur',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Visa klippor och sälar. Naturkunskap krävs.',
    minigame: {
      kind: 'sortering',
      title: 'Artbestäm fynden',
      brief:
        'Dra varje art till rätt grupp.',
      items: ['Fågel', 'Säl', 'Växt'],
      pool: [
        ['Ejder', 'Havsörn', 'Tobisgrissla', 'Silltrut', 'Storskarv'],
        ['Gråsäl på skär', 'Vikare', 'Knubbsäl', 'Sälunge', 'Sälspår i tången'],
        ['Strandmalört', 'Blåstång', 'Enbuske', 'Havtorn', 'Strandråg'],
      ],
    },
    scene:
      'Båten glider mellan kobbarna. Sälarna ligger och solar på hällarna.',
  },
  {
    id: 'safariguide',
    title: 'Safariguide',
    employer: 'Savannah Safaris',
    category: 'djur',
    wageClass: 2,
    shiftLength: 7,
    ad: 'Spåra de fem stora och håll gästerna trygga. Djurkunskap avgör lönen.',
    minigame: {
      kind: 'sortering',
      title: 'Spåra de fem stora',
      brief:
        'Dra varje spår till rätt djur.',
      items: ['Lejon', 'Elefant', 'Noshörning'],
      pool: [
        ['Rund tass utan klomärken', 'Rytande i gryningen', 'Fällt gnukadaver', 'Ljus manhårstuss', 'Spårpar vid vattenhålet'],
        ['Fotavtryck stort som ett lock', 'Avbrutna grenar högt upp', 'Dynga full av bark', 'Lerbad vid floden', 'Trumpetande på avstånd'],
        ['Tre tår i avtrycket', 'Dyngplats som gränsmarkering', 'Buske avbetad i rak kant', 'Hornrepor på trädstammen', 'Spår mot leran i skymningen'],
      ],
    },
    scene:
      'Gräset står högt och solen går upp över savannen. Radion viskar om ett leopardspår.',
  },
  {
    id: 'valskadeguide',
    title: 'Valskådningsguide',
    employer: 'North Atlantic Whales',
    category: 'hav',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Hitta valarna och förklara vad gästerna ser.',
    minigame: {
      kind: 'precision',
      title: 'Håll avståndet',
      brief:
        'Stoppa båten på rätt avstånd från valen.',
      items: ['Avstånd'],
      unit: 'meter',
    },
    scene:
      'Nordatlanten går i långa dyningar. Någon ropar och pekar mot styrbord.',
  },
  {
    id: 'dykguide',
    title: 'Dykguide',
    employer: 'Blue Reef Divers',
    category: 'hav',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Led dyk på revet. Säkerhet och marinbiologi i fokus.',
    minigame: {
      kind: 'instrument',
      title: 'Kontrollera utrustningen',
      brief:
        'Tryck på rätt kontroll i säkerhetsrutinen.',
      items: ['Kolla luft', 'Justera väst', 'Tryckutjämna', 'Signalera ok'],
    },
    scene:
      'Revet lyser i turkost. Tolv meter ner väntar en grotta full av fisk.',
  },
  {
    id: 'livraddare',
    title: 'Livräddare',
    employer: 'Beach Patrol',
    category: 'sport',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Håll koll på strömmar och simmare hela dagen.',
    minigame: {
      kind: 'traffa',
      title: 'Håll koll på vattnet',
      brief:
        'Plocka ut dem som är i trubbel. Låt de som simmar tryggt vara i fred.',
      items: [
        'Simmare i strömfåran',
        'Vinkande arm bortom revlarna',
        'Barn utan flytväst',
        'Simmare som drivit förbi flaggan',
      ],
      avoid: [
        'Surfare på brädan',
        'Badgäst på grunt vatten',
        'Boj i vattnet',
        'Måsflock',
        'Simmare innanför flaggorna',
      ],
    },
    scene:
      'Stranden är full och vågorna höga. En simmare har hamnat utanför revlarna.',
  },
  {
    id: 'massageassistent',
    title: 'Massageassistent',
    employer: 'Wat Po Clinic',
    category: 'medicin',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Grundkurs i anatomi ingår, men vi förväntar oss att du kan kroppen.',
    minigame: {
      kind: 'precision',
      title: 'Anpassa trycket',
      brief:
        'Stoppa mätaren på rätt tryck för muskeln.',
      items: ['Tryck'],
      unit: 'procent',
    },
    scene:
      'Klinikens golv är svalt och luften doftar örter. Nästa gäst har ont i skuldrorna.',
  },
  {
    id: 'veterinarassistent',
    title: 'Veterinärassistent',
    employer: 'Wildlife Vet Unit',
    category: 'djur',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Assistera vid fältoperationer på vilda djur.',
    minigame: {
      kind: 'precision',
      title: 'Dosera narkosen',
      brief:
        'Stoppa sprutan vid exakt rätt dos för djurets vikt.',
      items: ['Dos'],
      unit: 'milliliter',
    },
    scene:
      'Noshörningen ligger sövd i skuggan. Klockan tickar innan narkosen släpper.',
  },
  {
    id: 'geologassistent',
    title: 'Geologassistent',
    employer: 'Jarðfræði Institute',
    category: 'natur',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Mät sprickzoner och ta prover vid kratrarna.',
    minigame: {
      kind: 'precision',
      title: 'Mät sprickan',
      brief:
        'Stoppa mätaren på sprickans exakta bredd.',
      items: ['Sprickbredd'],
      unit: 'millimeter',
    },
    scene:
      'Ångan pyser ur sprickorna och marken är varm under stövlarna. Mätaren piper.',
  },
  {
    id: 'mattvavare',
    title: 'Mattknytare',
    employer: 'Atlas Carpets',
    category: 'konst',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Knyt mönster efter mall. Tålamod och mönsterkunskap.',
    minigame: {
      kind: 'sekvens',
      title: 'Knyt mönstret',
      brief:
        'Knyt färgerna i rätt ordning enligt mallen.',
      items: ['Röd', 'Indigo', 'Ockra', 'Elfenben'],
    },
    scene:
      'Varpen är spänd i den höga ramen. Mönstret ska knytas rad för rad.',
  },
  {
    id: 'kalligrafiassistent',
    title: 'Kalligrafiassistent',
    employer: 'Studio Bläckstenen',
    category: 'sprak',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Riv tusch och sortera tecken. Språkintresse krävs.',
    minigame: {
      kind: 'sekvens',
      title: 'Skriv tecknet',
      brief:
        'Följ drageordningen i rätt följd.',
      items: ['Drag 1', 'Drag 2', 'Drag 3', 'Drag 4'],
    },
    scene:
      'Tuschstenen är riven och penseln full. Papperet ligger orört och vitt.',
  },
  {
    id: 'tecknare',
    title: 'Mangatecknare',
    employer: 'Studio Kaze',
    category: 'film',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Assistera med bakgrunder under deadline.',
    minigame: {
      kind: 'sekvens',
      title: 'Bygg sidan',
      brief:
        'Lägg panelerna i rätt läsordning.',
      items: ['Panel 1', 'Panel 2', 'Panel 3', 'Panel 4'],
    },
    scene:
      'Deadline är i morgon och tre sidor saknar bakgrund. Tuschpennorna ligger i rader.',
  },
  {
    id: 'muralmalare',
    title: 'Muralmålare',
    employer: 'Colectivo Mural',
    category: 'konst',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Måla stora väggar i stark sol. Konsthistoria på fingrarna.',
    minigame: {
      kind: 'precision',
      title: 'Måla i rätt tid',
      brief:
        'Måla klart dagens yta innan putsen torkar.',
      items: ['Torkningsgrad'],
      unit: 'procent',
    },
    scene:
      'Väggen är fjorton meter lång och putsen torkar snabbt i solen. Ställningen svajar lätt.',
  },
  {
    id: 'sambatrummis',
    title: 'Sambatrummis',
    employer: 'Escola de Samba',
    category: 'musik',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Håll takten hela paraden. Rytmkänsla och musikkunskap.',
    minigame: {
      kind: 'takt',
      title: 'Håll rytmen',
      brief:
        'Paraden går i en enda puls. Slå an när markören är mitt i fältet, inte före.',
      items: ['Surdo', 'Tamborim', 'Cuíca', 'Agogô'],
    },
    scene:
      'Paraden rör sig framåt och trummorna dånar. Tempot får inte svaja.',
  },
  {
    id: 'jazzmusiker',
    title: 'Jazzmusiker',
    employer: 'Blue Note Cellar',
    category: 'musik',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Sittningar sena kvällar. Standards och historia ska sitta.',
    minigame: {
      kind: 'takt',
      title: 'Komma in på slaget',
      brief:
        'Bandet swingar vidare oavsett vad du gör. Lägg dina insatser exakt på slaget.',
      items: ['Tonika', 'Subdominant', 'Dominant', 'Turnaround'],
    },
    scene:
      'Källarklubben är rökig och basen går varm. Publiken väntar på ditt solo.',
  },
  {
    id: 'teaterinspicient',
    title: 'Teaterinspicient',
    employer: "Queen's Theatre",
    category: 'film',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Håll ordning bakom scenen. Dramatikkunskap krävs.',
    minigame: {
      kind: 'sekvens',
      title: 'Ge cues i ordning',
      brief:
        'Skicka cues i exakt rätt följd.',
      items: ['Ljus upp', 'Ridå upp', 'Ljud in', 'Skådespelare in'],
    },
    scene:
      'Publiken sätter sig och ridån är nere. Regiboken ligger öppen i halvmörkret.',
  },
  {
    id: 'balettinspicient',
    title: 'Balettinspicient',
    employer: 'Bolsjojteatern',
    category: 'musik',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Scenbyten mellan akterna. Repertoarkunskap krävs.',
    minigame: {
      kind: 'takt',
      title: 'Ropa in scenbytet',
      brief:
        'Fjorton sekunder mellan akterna. Varje moment ropas in på exakt rätt taktslag.',
      items: ['Fond ner', 'Kulisser in', 'Ljusbyte', 'Dansare in'],
    },
    scene:
      'Orkestern stämmer i diket. Scenbytet ska ske på fjorton sekunder.',
  },
  {
    id: 'filmstatist',
    title: 'Filmstatist',
    employer: 'Drömfabriken Studios',
    category: 'film',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Långa dagar i massscener. Filmkunskap ger bättre roller.',
    minigame: {
      kind: 'instrument',
      title: 'Följ regin',
      brief:
        'Tryck på rätt handling när regissören ropar.',
      items: ['Gå in i bild', 'Stanna still', 'Vänd dig om', 'Gå ur bild'],
    },
    scene:
      'Strålkastarna är blindande varma. Regissören ropar om ännu en tagning.',
  },
  {
    id: 'fotbollstranare',
    title: 'Assisterande fotbollstränare',
    employer: 'Clube Atlético',
    category: 'sport',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Led ungdomsträning. Du måste kunna spelets historia och regler.',
    minigame: {
      kind: 'instrument',
      title: 'Led träningen',
      brief:
        'Tryck på rätt övning när passet kräver det.',
      items: ['Uppvärmning', 'Passningsövning', 'Avslut', 'Nedvarvning'],
    },
    scene:
      'Ungdomslaget står på uppställning i eftermiddagssolen. Konerna ligger utlagda.',
  },
  {
    id: 'flygplatsvard',
    title: 'Flygplatsvärd',
    employer: 'Jomo Kenyatta Intl',
    category: 'geografi',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Hjälp transferpassagerare hitta rätt. Flygplatskoder och geografi.',
    minigame: {
      kind: 'sortering',
      title: 'Lotsa passagerarna',
      brief:
        'Dra varje passagerare till rätt gate.',
      items: ['Inrikes', 'Utrikes', 'Transfer'],
      pool: [
        ['Boardingkort utan pass', 'Resenär till Umeå', 'Ingen passkontroll', 'Gate 12, samma terminal', 'Väska märkt inrikes'],
        ['Pass och visum i handen', 'Avgång till Bangkok', 'Tullen till höger', 'Gate 44 efter kontrollen', 'Taxfree på vägen'],
        ['Anslutning om 40 minuter', 'Ska aldrig ut ur terminalen', 'Bagaget checkat hela vägen', 'Byter flygbolag i gate C', 'Väntar på nästa plan'],
      ],
    },
    scene:
      'Transferhallen är ett hav av rullväskor. Tre plan har landat samtidigt.',
  },
  {
    id: 'sjukvardsbitrade',
    title: 'Sjukvårdsbiträde',
    employer: 'Stadssjukhuset',
    category: 'medicin',
    wageClass: 2,
    shiftLength: 6,
    ad: 'Assistera på akuten. Grundläggande medicinsk kunskap krävs.',
    minigame: {
      kind: 'sortering',
      title: 'Triagera patienterna',
      brief:
        'Dra varje patient till rätt prioritet.',
      items: ['Akut', 'Brådskande', 'Kan vänta'],
      pool: [
        ['Andningsstopp', 'Kraftig blödning', 'Bröstsmärta och kallsvett', 'Medvetslös vid ankomst', 'Öppen fraktur'],
        ['Hög feber och stel nacke', 'Djup skärskada', 'Bruten handled', 'Svår buksmärta', 'Brännskada på handen'],
        ['Stukad fot', 'Fästingbett', 'Halsont sedan i går', 'Utslag på armen', 'Behöver nytt recept'],
      ],
    },
    scene:
      'Akuten är full och triagebrickan blinkar. En ambulans backar in utanför.',
  },
  {
    id: 'arkeologassistent',
    title: 'Arkeologassistent',
    employer: 'Institutet för antikviteter',
    category: 'historia',
    wageClass: 2,
    shiftLength: 7,
    ad: 'Sålla jord och katalogisera fynd. Historiekunskap är A och O.',
    minigame: {
      kind: 'sortering',
      title: 'Katalogisera fynden',
      brief:
        'Dra varje fynd till rätt låda.',
      items: ['Keramik', 'Metall', 'Ben'],
      pool: [
        ['Krukskärva med mönster', 'Bit av en amfora', 'Glaserad kakelbit', 'Lergodsfot', 'Bränd lerklump'],
        ['Grönärgat bronsspänne', 'Rostig järnspik', 'Silvermynt', 'Blyvikt', 'Kopparnål'],
        ['Käkfragment', 'Benpärla med hål', 'Djurhorn', 'Revbensbit', 'Tand med emalj kvar'],
      ],
    },
    scene:
      'Sållet är fullt av jord och solen står i zenit. Något glimmar i gruset.',
  },
  {
    id: 'bergsguide',
    title: 'Bergsguide',
    employer: 'Alpine Guides',
    category: 'natur',
    wageClass: 2,
    shiftLength: 7,
    ad: 'Led vandringar på höjd. Väder, karta och höjdsjuka.',
    minigame: {
      kind: 'balans',
      title: 'Över glaciären',
      brief:
        'Repet spänner mellan er och isen lutar. Håll gruppens tyngdpunkt mitt på leden.',
      items: ['Replaget'],
      unit: 'graders lutning',
    },
    scene:
      'Luften är tunn på fyra tusen meter. Gruppen andas tungt bakom dig.',
  },

  // --- Löneklass 3: bäst betalt, kräver certifikat eller toppbetyg ---
  {
    id: 'sushikock',
    title: 'Sushikock',
    employer: 'Ginza Sushi Ten',
    category: 'mat',
    wageClass: 3,
    shiftLength: 7,
    ad: 'Mästarens kök. Endast för dig med dokumenterad matkunskap.',
    minigame: {
      kind: 'precision',
      title: 'Skär fisken',
      brief:
        'Stoppa kniven vid exakt rätt tjocklek på skivan.',
      items: ['Skivtjocklek'],
      unit: 'millimeter',
    },
    scene:
      'Fisken ligger blank på isbädden. Kniven är nyslipad och riset håller kroppstemperatur.',
  },
  {
    id: 'borsmaklare',
    title: 'Börsmäklare',
    employer: 'Wall Street Partners',
    category: 'ekonomi',
    wageClass: 3,
    shiftLength: 7,
    ad: 'Handelsgolvet betalar bäst i staden, men bara till den som kan siffrorna.',
    minigame: {
      kind: 'precision',
      title: 'Lägg ordern',
      brief:
        'Stoppa ordern på exakt rätt kurs.',
      items: ['Kurs'],
      unit: 'procent av dagshögsta',
    },
    scene:
      'Skärmarna lyser rött och grönt. Telefonerna ringer utan uppehåll.',
  },
  {
    id: 'robottekniker',
    title: 'Robottekniker',
    employer: 'Kaisei Robotics',
    category: 'teknik',
    wageClass: 3,
    shiftLength: 7,
    ad: 'Kalibrera industrirobotar. Teknisk examen eller motsvarande.',
    minigame: {
      kind: 'precision',
      title: 'Kalibrera armen',
      brief:
        'Stoppa armen på exakt rätt vinkel.',
      items: ['Ledvinkel'],
      unit: 'grader',
    },
    scene:
      'Robotcellen står stilla i väntan på kalibrering. Nödstoppet lyser rött.',
  },
  {
    id: 'rymdtekniker',
    title: 'Rymdtekniker',
    employer: 'Zvezda Kosmodrom',
    category: 'rymden',
    wageClass: 3,
    shiftLength: 7,
    ad: 'Bara för dig som kan din rymdhistoria och dina omloppsbanor.',
    minigame: {
      kind: 'instrument',
      title: 'Förbered uppskjutning',
      brief:
        'Tryck på rätt system i nedräkningen.',
      items: ['Bränsletryck', 'Telemetri', 'Navigation', 'Tändning'],
    },
    scene:
      'Kontrollrummet är svalt och skärmarna fyllda av banparametrar. Uppskjutningsfönstret är kort.',
  },
  {
    id: 'modeassistent',
    title: 'Modeassistent',
    employer: 'Maison Lumière',
    category: 'mode',
    wageClass: 3,
    shiftLength: 6,
    ad: 'Backstage under visningsveckan. Vi kräver koll på modehistoria.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera plaggen',
      brief:
        'Dra varje plagg till rätt modell.',
      items: ['Öppningslook', 'Dagplagg', 'Finalklänning'],
      pool: [
        ['Signaturkappan', 'Första modellens set', 'Looket i husets färg', 'Öppningshatten', 'Plagg nummer ett'],
        ['Trenchcoat', 'Stickad tröja', 'Raka byxor', 'Skjortklänning', 'Kavaj i ull'],
        ['Släp i siden', 'Sista looken i vitt', 'Klänning med tio meter tyll', 'Broderad robe', 'Avslutningsplagget'],
      ],
    },
    scene:
      'Backstage är kaos av tyg och nålar. Visningen börjar om tolv minuter.',
  },
  {
    id: 'olympiavard',
    title: 'Olympiavärd',
    employer: 'Sports Federation',
    category: 'sport',
    wageClass: 3,
    shiftLength: 7,
    ad: 'Kräver dokumenterad sportkunskap. Toppbetalt uppdrag.',
    minigame: {
      kind: 'sortering',
      title: 'Lotsa publiken',
      brief:
        'Dra varje besökare till rätt sektion.',
      items: ['Läktare A', 'Läktare B', 'VIP'],
      pool: [
        ['Biljett A14, rad 3', 'Sektion A, ingång norr', 'A-biljett ståplats', 'Rad 12 i A', 'Familjebiljett A'],
        ['Biljett B7, rad 22', 'Sektion B, ingång syd', 'B-biljett, skolgrupp', 'Rad 30 i B', 'Studentbiljett B'],
        ['Ackrediteringskort', 'Inbjudan från förbundet', 'Loge 2 med lunch', 'Presskort med logeplats', 'Guldarmband'],
      ],
    },
    scene:
      'Arenan fylls av publik från hela världen. Fem språk hörs samtidigt vid ingången.',
  },
  // --- Nya yrken med de fyra tillagda arkadmomenten ---
  {
    id: 'postsorterare',
    title: 'Postsorterare',
    employer: 'Centralposten',
    category: 'geografi',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Nattskift bland säckarna. Du behöver veta vilket land som ligger var.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera posten',
      brief: 'Varje försändelse ska i rätt säck innan bandet matar fram nästa.',
      items: ['Inrikes', 'Europa', 'Övriga världen'],
      pool: [
        ['Brev till Kiruna', 'Paket till grannstaden', 'Vykort inom landet', 'Räkning till huvudkontoret', 'Julklapp till mormor'],
        ['Brev till Lissabon', 'Paket till Warszawa', 'Vykort till Dublin', 'Katalog till Milano', 'Rekbrev till Aten'],
        ['Paket till Nairobi', 'Brev till Melbourne', 'Vykort till Lima', 'Flygpost till Seoul', 'Rekbrev till Havanna'],
      ],
    },
    scene:
      'Facken står i tre rader och bandet matar fram nya buntar snabbare än du hinner läsa adresserna.',
  },
  {
    id: 'pantvard',
    title: 'Pantstationsvärd',
    employer: 'Retur & Pant',
    category: 'natur',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Ta emot returer och håll materialen isär. Kunskap om kretslopp uppskattas.',
    minigame: {
      kind: 'sortering',
      title: 'Sortera returerna',
      brief: 'Varje förpackning har sitt kärl. Ett fel och maskinen larmar.',
      items: ['Glas', 'Metall', 'Plast'],
      pool: [
        ['Vinflaska', 'Syltburk i glas', 'Brun ölflaska', 'Parfymflaska', 'Konservglas med lock av'],
        ['Aluminiumburk', 'Konservburk', 'Kapsyl', 'Sprayflaska av plåt', 'Folieform'],
        ['PET-flaska', 'Schampoflaska', 'Plastlock', 'Yoghurtburk', 'Bärkasse'],
      ],
    },
    scene:
      'Automaten spottar ut kvitton i ett kör och kunderna häller in säckvis utan att titta.',
  },
  {
    id: 'vaxlare',
    title: 'Växlingsbiträde',
    employer: 'Change & Wechsel',
    category: 'ekonomi',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Sitt i luckan, växla valuta och sälj det resenärerna glömt hemma.',
    minigame: {
      kind: 'vaxel',
      title: 'Räkna växeln',
      brief:
        'Slå ihop vad kunden köper, dra av sedeln och välj rätt växel. Kön väntar inte.',
      items: ['Reseförsäkring', 'Kartbok', 'Telefonkort', 'Adapterkontakt', 'Frimärken'],
    },
    scene:
      'Luckan är av pansarglas och kön ringlar ut på gatan. Kursen på tavlan uppdateras var tionde minut.',
  },
  {
    id: 'torghandlare',
    title: 'Torghandlare',
    employer: 'Saluhallens torgstånd',
    category: 'mat',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Sälj dagens skörd. Du ska kunna dina råvaror och räkna i huvudet.',
    minigame: {
      kind: 'vaxel',
      title: 'Slå in på torget',
      brief:
        'Räkna ihop kundens korg, dra av sedeln och räkna fram växeln i huvudet.',
      items: ['Tomater', 'Oliver', 'Ost', 'Bröd', 'Fikon'],
    },
    scene:
      'Presenningen fladdrar och grannståndet ropar ut sina priser högre än du. Kassaskrinet är en cigarrlåda.',
  },
  {
    id: 'cykeltaxiforare',
    title: 'Cykeltaxiförare',
    employer: 'Cyclo Express',
    category: 'trafik',
    wageClass: 1,
    shiftLength: 5,
    ad: 'Kör turister genom gamla stan. Vaderna får jobba, och trafikvettet också.',
    minigame: {
      kind: 'balans',
      title: 'Håll ekipaget rakt',
      brief:
        'Lasten drar åt sidan i varje kurva. Styr tillbaka mot mitten innan du välter.',
      items: ['Cykeltaxin'],
      unit: 'graders lutning',
    },
    scene:
      'Gränderna är två meter breda och mopederna kommer från alla håll samtidigt. Passageraren filmar allt.',
  },
  {
    id: 'servitor',
    title: 'Servitör',
    employer: 'Restaurang Terrassen',
    category: 'mat',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Uteservering i högsäsong. Vi vill ha någon som kan bära och kan sina rätter.',
    minigame: {
      kind: 'balans',
      title: 'Bär brickan',
      brief:
        'Sex glas på en hand och kullersten under fötterna. Fånga upp lutningen i tid.',
      items: ['Brickan'],
      unit: 'graders lutning',
    },
    scene:
      'Fjorton bord ute, alla fulla, och köket ropar upp beställningar som inte hör till någon.',
  },
  {
    id: 'barare',
    title: 'Bärarassistent',
    employer: 'Himalaya Trek',
    category: 'natur',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Följ med expeditionen uppför dalen. Bra kondition och höjdvana krävs.',
    minigame: {
      kind: 'balans',
      title: 'Över hängbron',
      brief:
        'Bron svajar och packningen väger trettio kilo. Håll dig mitt på plankorna.',
      items: ['Bärmesen'],
      unit: 'graders lutning',
    },
    scene:
      'Floden dundrar sjuttio meter under bron. Vajerna gnisslar och en mulåsna vill mötas mitt på.',
  },
  {
    id: 'flamencogitarrist',
    title: 'Flamencogitarrist',
    employer: 'Tablao El Duende',
    category: 'musik',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Vi söker en ackompanjatör som kan hålla compás utan att titta på dansaren.',
    minigame: {
      kind: 'takt',
      title: 'Håll compás',
      brief:
        'Tolvslagstakten går runt och runt. Slå an exakt när markören passerar mitten.',
      items: ['Rasgueado', 'Golpe', 'Picado'],
    },
    scene:
      'Dansaren stampar och publiken sitter en meter bort. Här räknar ingen högt, allt sitter i handleden.',
  },
  {
    id: 'taikotrummis',
    title: 'Taikotrummis',
    employer: 'Taikoensemblen Kaze',
    category: 'musik',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Ensemblen behöver en till vid de stora trummorna inför festivalen.',
    minigame: {
      kind: 'takt',
      title: 'Slå i takt',
      brief:
        'Hela ensemblen håller samma puls. Träffa slaget när markören är mitt i fältet.',
      items: ['Don', 'Ka', 'Doko'],
    },
    scene:
      'Trumman är större än du och står snett framåt. Klubborna heter bachi och väger som två hammare.',
  },
  {
    id: 'klubbdj',
    title: 'Klubb-DJ',
    employer: 'Klubb Kellerloch',
    category: 'musik',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Nattpass i källaren. Vi vill ha någon som kan mixa utan att tappa golvet.',
    minigame: {
      kind: 'takt',
      title: 'Mixa in nästa låt',
      brief:
        'De två låtarna ska gå i samma puls. Tryck exakt på slaget, varken före eller efter.',
      items: ['Kick', 'Snare', 'Hi-hat'],
    },
    scene:
      'Rökmaskinen går och monitorn är för tyst. Fyrahundra personer märker direkt om pulsen glider.',
  },
  {
    id: 'ostronplockare',
    title: 'Ostronplockare',
    employer: 'Kustens ostronbankar',
    category: 'hav',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Arbete på lågvattnet. Du måste kunna skilja fullvuxet från yngel på en sekund.',
    minigame: {
      kind: 'traffa',
      title: 'Plocka på lågvattnet',
      brief:
        'Bara de fullvuxna får följa med upp. Yngel och skräp ska ligga kvar där de ligger.',
      items: [
        'Fullvuxet ostron',
        'Ostron över åtta centimeter',
        'Tungt ostron',
        'Ostron med tät skalkant',
      ],
      avoid: ['Ostronyngel', 'Krossat skal', 'Sjöstjärna', 'Tomt skal', 'Krabba'],
    },
    scene:
      'Vattnet drar sig undan i två timmar, sedan kommer det tillbaka. Stövlarna sjunker en decimeter i taget.',
  },
  {
    id: 'bartender',
    title: 'Bartender',
    employer: 'The Long Hall',
    category: 'mat',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Kvällspass bakom disken. Snabbhet i huvudräkning värderas högre än konststycken.',
    minigame: {
      kind: 'vaxel',
      title: 'Notan i baren',
      brief:
        'Sällskapet beställer i klump och betalar med en stor sedel. Räkna fram växeln.',
      items: ['Stout', 'Cider', 'Läsk', 'Whiskey', 'Nötter'],
    },
    scene:
      'Mahognydisken är trettio meter lång och kranarna droppar. Musiken börjar i hörnet om en kvart.',
  },
  {
    id: 'parkvaktare',
    title: 'Parkvaktare',
    employer: 'Nationalparkens fältstation',
    category: 'djur',
    wageClass: 2,
    shiftLength: 5,
    ad: 'Fältarbete i reservatet. Vi rensar snaror och räknar djur, varje dag året om.',
    minigame: {
      kind: 'traffa',
      title: 'Rensa snaror',
      brief:
        'Plocka bort varenda snara i sektorn. Forskarnas utrustning ska stå kvar orörd.',
      items: ['Vajersnara', 'Nedgrävd fälla', 'Snara vid stigen', 'Fälla vid vattenhålet'],
      avoid: [
        'Viltkamera',
        'Märkt sändarhalsband',
        'Fågelbo',
        'Termitstack',
        'Forskarnas mätsticka',
      ],
    },
    scene:
      'Gräset går till midjan och sikten är tjugo meter. Radion knastrar från stationen var tjugonde minut.',
  },
];

export const JOB_BY_ID: Record<string, Job> = Object.fromEntries(
  JOBS.map((j) => [j.id, j])
);

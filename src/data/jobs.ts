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
      kind: 'precision',
      title: 'Räkna växeln',
      brief:
        'Stoppa mätaren på rätt belopp åt kunden.',
      items: ['Växel'],
      unit: 'kronor',
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
    },
    scene:
      'Kranarna gnisslar och containrarna svävar in över kajen. Radion sprakar med lastordrar.',
  },
  {
    id: 'kamelforare',
    title: 'Kamelförare',
    employer: 'Desert Tours',
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
      kind: 'precision',
      title: 'Klipp fåret',
      brief:
        'Stoppa saxen innan du kommer för nära huden.',
      items: ['Klippdjup'],
      unit: 'millimeter',
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
      kind: 'instrument',
      title: 'Kör i trafiken',
      brief:
        'Tryck på rätt reglage när situationen kräver det.',
      items: ['Ring i klockan', 'Bromsa', 'Teckna vänster', 'Teckna höger'],
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
      kind: 'instrument',
      title: 'Manövrera vespan',
      brief:
        'Tryck på rätt kontroll när ordern kommer.',
      items: ['Gasa', 'Bromsa', 'Blinkers', 'Tuta'],
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
      kind: 'precision',
      title: 'Pruta hem affären',
      brief:
        'Stoppa mätaren på det pris kunden nätt och jämnt accepterar.',
      items: ['Slutpris'],
      unit: 'procent av utpris',
    },
    scene:
      'Mattorna hänger i travar och doften av te ligger tät. En turist tittar nyfiket på en lampa.',
  },
  {
    id: 'perlvavare',
    title: 'Pärlvävare',
    employer: 'Craft Collective',
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
    employer: 'Metro Authority',
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
    employer: 'Continental Rail',
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
    employer: 'Harbour Racing Club',
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
      kind: 'instrument',
      title: 'Rädda simmaren',
      brief:
        'Tryck på rätt åtgärd i rätt ordning.',
      items: ['Larma', 'Ta flythjälp', 'Simma ut', 'Starta HLR'],
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
      kind: 'sekvens',
      title: 'Håll rytmen',
      brief:
        'Slå trummorna i rätt ordning enligt rytmen.',
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
      kind: 'sekvens',
      title: 'Spela ackordföljden',
      brief:
        'Följ ackorden i rätt ordning genom chorusen.',
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
      kind: 'sekvens',
      title: 'Genomför scenbytet',
      brief:
        'Utför bytet i rätt ordning.',
      items: ['Fond ner', 'Kulisser in', 'Ljus byte', 'Dansare in'],
    },
    scene:
      'Orkestern stämmer i diket. Scenbytet ska ske på fjorton sekunder.',
  },
  {
    id: 'filmstatist',
    title: 'Filmstatist',
    employer: 'Dream Factory Studios',
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
    },
    scene:
      'Transferhallen är ett hav av rullväskor. Tre plan har landat samtidigt.',
  },
  {
    id: 'sjukvardsbitrade',
    title: 'Sjukvårdsbiträde',
    employer: 'City General Hospital',
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
      kind: 'precision',
      title: 'Dosera tempot',
      brief:
        'Håll gruppens tempo på rätt nivå för höjden.',
      items: ['Stigtakt'],
      unit: 'meter per timme',
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
    },
    scene:
      'Arenan fylls av publik från hela världen. Fem språk hörs samtidigt vid ingången.',
  },
];

export const JOB_BY_ID: Record<string, Job> = Object.fromEntries(
  JOBS.map((j) => [j.id, j])
);

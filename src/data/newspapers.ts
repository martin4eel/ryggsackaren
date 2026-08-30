/**
 * Lokaltidningen i varje stad. När spelaren slår upp tidningen på vandrarhemmet
 * ska Köping och Kapstaden inte se ut som samma blad med olika namn: varje stad
 * har en egen tidning med namn i landets stil, en devis, ett grundningsår, tre
 * eller fler huvudartiklar och ett gäng korta notiser.
 *
 * Allt är påhittat men lokalt förankrat, i samma anda som rubrikerna i
 * data/headlines.ts: kommunala busskurer, spårvagnar som kör fel och vulkaner
 * som håller sig lugna. Tidningsnamnen följer landets namnkonventioner utan att
 * vara namn på verkliga tidningar, och ingen artikel handlar om verkliga,
 * levande personer. Tjänstemän, butiker och föreningar är uppdiktade.
 */

export interface Artikel {
  rubrik: string;
  text: string;
}

export interface Tidning {
  /** Tidningens namn, i landets språk/stil, t.ex. "Stockholms-Bladet", "Le Courrier de la Seine", "The Cape Chronicle" */
  namn: string;
  /** Undertitel, t.ex. "Oberoende morgontidning sedan 1888" */
  devis: string;
  grundad: number;
  /**
   * Huvudartiklar. Minst 3 per stad. rubrik = stor rubrik (2–6 ord, gärna med
   * humor), text = ingress+brödtext på 3–5 meningar i tidningsprosa, svenska.
   */
  artiklar: Artikel[];
  /** Korta notiser ("I korthet"), minst 4 per stad, en mening var. */
  notiser: string[];
}

export const CITY_PAPERS: Record<string, Tidning> = {
  stockholm: {
    namn: 'Stockholms-Bladet',
    devis: 'Oberoende morgontidning sedan 1888',
    grundad: 1888,
    artiklar: [
      {
        rubrik: 'Slussen klar - om tre år till',
        text:
          'Ombyggnaden av Slussen har fått ännu en ny tidplan, den nionde sedan starten. Enligt stadens projektkontor beror förseningen på att man hittat en äldre sluss under den sluss man höll på att riva. Pendlare uppmanas att fortsätta använda den tillfälliga gångbron, som nu i sin tur ska byggas om. En talesperson beskriver läget som ”i grunden stabilt”.',
      },
      {
        rubrik: 'Vasaskeppet mår bra, säger museet',
        text:
          'Vasamuseet meddelar att regalskeppet inte ruttnar snabbare än väntat. Mätningar gjorda under våren visar att träet rör sig med ungefär en millimeter per år, vilket forskarna kallar ”trivsamt”. Museets besökare får dock fortsatt inte luta sig mot skrovet. Ett nytt räcke i ek, avsett att matcha skeppet, kostade mer än en mindre segelbåt.',
      },
      {
        rubrik: 'Skärgårdsbåt fast på grund i sex timmar',
        text:
          'Waxholmsbåten som trafikerar Vaxholm och Grinda gick på grund utanför Lidingö i går eftermiddag, i stiltje och solsken. Ingen skadades men kaféet ombord sålde slut på bullar redan efter en timme. Passagerarna underhöll sig med att räkna kobbar. Rederiet uppger att grundet ”inte fanns där förra sommaren”.',
      },
    ],
    notiser: [
      'Tunnelbanans gröna linje får nya sittdynor, i grönt.',
      'Kungsträdgården stänger skridskobanan tidigt på grund av plusgrader.',
      'Ett parkeringsgarage i Vasastan har fått pris för sin belysning.',
      'Gamla stans smalaste gränd ska mätas om av stadsmuseet.',
      'Kanelbullens dag firas i förväg av ett bageri på Södermalm som inte kunde vänta.',
    ],
  },
  goteborg: {
    namn: 'Hamnstads-Kuriren',
    devis: 'Göteborgs egen morgontidning, gôtt nog',
    grundad: 1902,
    artiklar: [
      {
        rubrik: 'Räkmackan dyrare än tågbiljetten',
        text:
          'En räkmacka i hamnkaféet vid Stenpiren kostar nu mer än en tågresa till Alingsås, visar Kurirens prisjämförelse. Kaféägaren skyller på räkorna, räkfiskarna skyller på vädret och vädret har inte svarat på tidningens frågor. Stamgästerna har reagerat med att beställa halva mackor. Den andra halvan, uppger kaféet, blir kvar.',
      },
      {
        rubrik: 'Spårvagnen som aldrig kom fram',
        text:
          'Spårvagn 11 mot Saltholmen tog i lördags en tur via Hisingen, enligt förvånade resenärer. Trafikbolaget menar att växeln vid Brunnsparken ”hade en egen uppfattning”. Resan tog en timme och tjugo minuter men bjöd på havsutsikt från fel håll. Ingen ersättning utgår eftersom vagnen till slut nådde Saltholmen.',
      },
      {
        rubrik: 'Feskekörka får ny predikstol',
        text:
          'Fiskhallen vid Rosenlundskanalen har byggt en upphöjd disk som personalen omedelbart döpt till predikstolen. Härifrån ropas dagens fångst ut med en tydlighet som uppskattas av kunderna och mindre av grannarna. Kommunen har fått in tre klagomål och elva beställningar på rödspätta. Ärendet avvaktar.',
      },
    ],
    notiser: [
      'Liseberg testar en ny karusell som bara går moturs.',
      'Avenyn får en extra papperskorg per kvarter efter en lång utredning.',
      'Färjan till Vrångö har fått nytt kafé med tre sorters kaffe.',
      'Ett parti sill från Klädesholmen har återkallats för att den var för god, enligt ett skämt som spritt sig.',
      'Regnet i helgen uppmättes till normalt.',
    ],
  },
  malmo: {
    namn: 'Öresundsbladet',
    devis: 'Skånes rakaste tidning',
    grundad: 1911,
    artiklar: [
      {
        rubrik: 'Turning Torso snurrar inte, bekräftar arkitekt',
        text:
          'Efter flera frågor från turister har fastighetsägaren till Turning Torso gått ut med ett klargörande: byggnaden roterar inte. De nittio graderna är inbyggda i konstruktionen och har varit där sedan invigningen. En grupp besökare från Köping hade väntat i fyrtio minuter vid foten för att ”se ett varv”. De fick i stället en broschyr.',
      },
      {
        rubrik: 'Falafelindex sjunker för tredje månaden',
        text:
          'Öresundsbladets falafelindex, som mäter priset på en rulle med allt vid Möllevångstorget, visar återigen nedgång. Två nya kiosker har öppnat inom hundra meter och konkurrensen beskrivs som hård men hjärtlig. En kioskägare säger att han hellre sänker priset än sänker kvaliteten på sina picklade rovor. Ekonomer varnar för en falafelbubbla.',
      },
      {
        rubrik: 'Bron stängd - för cyklar som ändå inte får köra',
        text:
          'Öresundsbron var stängd i tre timmar på lördagen på grund av kraftig vind. Bland de väntande fanns fyra cyklister som inte kände till att bron saknar cykelbana. De hänvisades till tåget, som också stod stilla. Trafikledningen påpekar att skyltningen är tydlig på båda sidor sundet.',
      },
    ],
    notiser: [
      'Ribersborgs kallbadhus har fått nya trappsteg, lika kalla som de gamla.',
      'Sillamarknaden i Limhamn flyttas en vecka på grund av sillen.',
      'Kommunen inför gratis lån av regnponcho vid Centralstationen.',
      'Möllevångens loppis slog rekord i antal sålda kaffekoppar utan kaffe.',
    ],
  },
  vasteras: {
    namn: 'Mälarstads-Kuriren',
    devis: 'Ärlig, tydlig och tryckt i Västmanland',
    grundad: 1893,
    artiklar: [
      {
        rubrik: 'Gurkan lyser igen',
        text:
          'Det gröna hyreshuset i centrum, av alla kallat Gurkan, har fått ny fasadbelysning efter två år i mörker. Kommunen valde en varm grön ton efter en omröstning där ”gurkgrön” vann över ”ärtgrön” med sextio röster. Ett par grannar tycker det lyser för mycket in i sovrummet. Fastighetsägaren erbjuder gardiner.',
      },
      {
        rubrik: 'Anundshög har fått nya får',
        text:
          'Betesfåren som håller gräset kort vid Sveriges största gravhög har bytts ut mot en yngre flock. De förra fåren gick i pension till en gård utanför Sala. Länsmuseet framhåller att fåren är det mest kostnadseffektiva sättet att sköta ett vikingatida monument. Besökare ombeds inte mata dem, eftersom de har jobb.',
      },
      {
        rubrik: 'Robotfabrik byggde robot som bygger robotar',
        text:
          'Ett teknikföretag vid Finnslätten visade i veckan upp en industrirobot som monterar andra industrirobotar. Enligt företaget kommer roboten att kunna bygga en kopia av sig själv på under en dag. På frågan om var det slutar svarade platschefen att det ”finns begränsat med golvyta”. Kommunen ser positivt på fler arbetstillfällen.',
      },
    ],
    notiser: [
      'Domkyrkans klocka ringer fem minuter för tidigt sedan i söndags och ingen vet varför.',
      'Mälarbanan lovar tåg i tid under hela oktober.',
      'Björnön får en ny grillplats med tak, eftersom det regnar.',
      'Flygplatsen välkomnar sommarens tredje charterplan.',
      'Ett gäng skateboardåkare har rensat Vasaparken och fått tårta av kommunen.',
    ],
  },
  koping: {
    namn: 'Köpingsbladet',
    devis: 'Mälardalens västligaste morgontidning',
    grundad: 1857,
    artiklar: [
      {
        rubrik: 'Busskuren vid torget: nu är den beställd',
        text:
          'Efter elva år av löften har kommunen beställt en ny busskur till Stora torget. Kuren ska ha tak, bänk och en tidtabell, enligt beslutet i tekniska nämnden. Leveransen väntas till våren, förutsatt att leverantören hittar Köping. Föreningen Torgets vänner firade med kaffe under bar himmel.',
      },
      {
        rubrik: 'Första fartyget för säsongen kom med grus',
        text:
          'Köpings hamn tog i måndags emot säsongens första lastfartyg, som visade sig innehålla grus. Hamnkontoret hade hoppats på något mer spektakulärt men konstaterar att grus behövs. Ett trettiotal Köpingsbor stod på kajen och vinkade. Fartyget vinkade tillbaka med mistluren, vilket väckte hundarna i Nyckelberget.',
      },
      {
        rubrik: 'Scheele skulle ha fyllt år, staden bakade',
        text:
          'Köpings mest berömde apotekare, Carl Wilhelm Scheele, uppmärksammades i helgen med en tårta formad som en syrgasmolekyl. Bakverket, som var svårt att skära, ställdes ut på apoteket där han en gång arbetade. Skolklasser fick lära sig att Scheele upptäckte syret men inte fick äran för det. Tårtan gick åt på tjugo minuter.',
      },
    ],
    notiser: [
      'Kanalen får nya räcken efter att de gamla visat sig vara lösa sedan 1970-talet.',
      'Skateparken hålls öppen till klockan tio på helgerna, om det inte regnar.',
      'Ett hjortdjur sågs på Ullvi och rapporterades av fyra olika personer.',
      'Bibliotekets bokcirkel läser en bok om hamnar.',
      'Bussen till Västerås går som vanligt, meddelar bussbolaget utan att någon frågat.',
    ],
  },
  oslo: {
    namn: 'Fjordposten',
    devis: 'Hovedstadens uavhengige morgenavis',
    grundad: 1879,
    artiklar: [
      {
        rubrik: 'Bompengarna höjs - igen',
        text:
          'Trängselavgiften för att köra in i Oslo höjs för fjärde gången på två år. Kommunen menar att pengarna går till spårvagnar, cykelvägar och en ny tunnel som ingen ännu vet var den ska mynna ut. Bilister har svarat med att parkera i Drammen och ta tåget. Drammen har inte tillfrågats.',
      },
      {
        rubrik: 'Operataket: skidor förbjudna, pulka tillåten',
        text:
          'Efter en vinter med flera tillbud har operahuset förtydligat reglerna för sitt sluttande marmortak. Skidor och snowboard är förbjudna, medan pulka tolereras ”i måttlig hastighet”. En jurist påpekar att taket inte är en backe utan en byggnad. Operan svarar att den är båda.',
      },
      {
        rubrik: 'Ubåtsbesök i Oslofjorden var en säl',
        text:
          'Det misstänkta periskop som flera Oslobor rapporterade utanför Bygdøy i tisdags har identifierats som en knubbsäl. Kustbevakningen skickade en båt som efter tjugo minuter konstaterade att periskopet åt fisk. Sälen har sedan dess setts vid Aker Brygge, där den enligt vittnen ”ser ut att trivas”. Något förhör har inte hållits.',
      },
    ],
    notiser: [
      'Holmenkollbacken får nytt snösystem för säsonger utan snö.',
      'En pølse med lompe kostar nu mer än en biobiljett i Grünerløkka.',
      'Vigelandsparken har räknat sina statyer och alla var kvar.',
      'Färjan till Nesodden får wifi, till pendlarnas milda intresse.',
    ],
  },
  helsingfors: {
    namn: 'Helsingin Iltaviesti',
    devis: 'Riippumaton sanomalehti - Oberoende dagstidning',
    grundad: 1921,
    artiklar: [
      {
        rubrik: 'Kaffekonsumtionen slår rekord - igen',
        text:
          'Finländarna dricker återigen mest kaffe i världen, och Helsingforsborna drar upp snittet. En undersökning från Hushållsinstitutet visar att en genomsnittlig invånare dricker 5,2 koppar om dagen, varav en på färjan. Kafé Regatta vid Tölöviken har fått en tredje bryggare. Ingen tycker att det är särskilt anmärkningsvärt.',
      },
      {
        rubrik: 'Sveaborg vill ha lugnare måsar',
        text:
          'Fästningsön Sveaborg har bett besökare att inte mata måsarna, som enligt förvaltningen blivit ”självsäkra”. En mås tog i förra veckan en hel korvbulle ur handen på en turist, som fotograferade händelsen i stället för att försvara sig. Fästningen övervägde skyltar men insåg att måsarna inte läser. Nu satsar man på broschyrer till människorna.',
      },
      {
        rubrik: 'Bastun på Skatudden fick kö runt kvarteret',
        text:
          'Den nya allmänna bastun vid Skatudden hade i lördags en kö som sträckte sig förbi Uspenskijkatedralen. Besökare väntade i snitt en timme och tio minuter på att få svettas i tjugo. Staden överväger en till bastu, vilket enligt kritiker bara flyttar kön. Bastumästaren säger att kön är en del av upplevelsen.',
      },
    ],
    notiser: [
      'Spårvagn 3 kör nu i en åtta, precis som tidigare, men skyltas annorlunda.',
      'Salutorget får uppvärmda fiskdiskar inför vintern.',
      'Domkyrkans trappa har mätts till exakt lika många steg som sist.',
      'Ett rådjur simmade till Högholmen och blev en del av djurparken en eftermiddag.',
      'Bibliotek Ode lånar nu ut symaskiner, sågar och en tuba.',
    ],
  },
  kopenhamn: {
    namn: 'Københavns Morgenavis',
    devis: 'Uafhængig siden 1866 - hygge er ingen undskyldning',
    grundad: 1866,
    artiklar: [
      {
        rubrik: 'Fler cyklar än invånare, visar räkning',
        text:
          'Kommunens årliga cykelräkning visar att staden nu har 1,4 cyklar per invånare, oräknat de som ligger i kanalerna. En tjänsteman förklarar att många har en cykel för vardag, en för helg och en de glömt var de låst. Cykelstölderna vid Nyhavn fortsätter att öka, men de flesta stulna cyklar hittas ett kvarter bort. Polisen kallar det ”omfördelning”.',
      },
      {
        rubrik: 'Tivoli öppnar tidigt - och stänger sent',
        text:
          'Nöjesparken mitt i staden öppnar i år två veckor tidigare än vanligt och förlänger samtidigt säsongen in i november. Ledningen motiverar det med att ”danskarna ändå är här”. Berg-och-dalbanan från 1914 har fått nya bromsar men behåller bromsaren, som åker med i varje tåg. Han uppges vara nöjd.',
      },
      {
        rubrik: 'Smørrebrød får skyddad beteckning?',
        text:
          'En förening för traditionellt smørrebrød har lämnat in en ansökan om att det ska bli förbjudet att kalla en smörgås för smørrebrød om den går att lyfta med en hand. Kravet innefattar rågbröd, smör som syns och pålägg som kräver kniv och gaffel. Motståndarna anser att staten inte ska lägga sig i hur folk lägger sill. Frågan avgörs i höst.',
      },
    ],
    notiser: [
      'Den lilla sjöjungfrun har fått en ny sten att sitta på, efter att den gamla blivit hal.',
      'Strøget testar en tyst zon där gatumusiker bara får mima.',
      'Christiania har målat om entrén, i samma färger.',
      'Hamnbussen får en extra tur på söndagar när vädret tillåter.',
    ],
  },
  reykjavik: {
    namn: 'Reykjavíkurpósturinn',
    devis: 'Óháð dagblað - Oberoende sedan 1934',
    grundad: 1934,
    artiklar: [
      {
        rubrik: 'Vulkanen lugn, geologerna oroliga',
        text:
          'För tredje veckan i rad har vulkanen på Reykjaneshalvön inte gjort någonting, vilket geologerna på Vädertjänsten beskriver som ”misstänkt”. Mätningarna visar att marken höjt sig två centimeter, ungefär lika mycket som en kanelbulle jäser. Turister som köpt vulkanturer erbjuds i stället en lavaklippa. Klippan är mycket stilla.',
      },
      {
        rubrik: 'Hallgrímskirkja får hiss, till slut',
        text:
          'Kyrktornet som dominerar stadens silhuett får ny hiss efter tio år av klagomål på den gamla, som tog tre personer och en hund. Den nya tar sex personer men ingen hund, enligt reglerna. Utsikten uppges vara densamma. Församlingen ber besökare att inte klaga på vinden uppe på toppen, eftersom den inte är kyrkans.',
      },
      {
        rubrik: 'Korvkiosk har nu längre kö än Blå lagunen',
        text:
          'Den berömda korvkiosken vid hamnen hade i lördags en kö på fyrtiofem minuter, vilket är längre än väntetiden till Blå lagunen samma dag. Kiosken serverar en enda rätt och har gjort det sedan 1937. Ägaren säger att hemligheten är att inte ändra någonting. En turist som frågade efter vegansk korv fick en vänlig blick.',
      },
    ],
    notiser: [
      'Norrskenet väntas i natt, moln tillåtet.',
      'Simhallen i Laugardalur höjer temperaturen i varmaste potten med en grad.',
      'Ett fårskiljande i Mosfellsbær samlade fler åskådare än fotbollsmatchen.',
      'Bensinpriset gick upp, vilket är tidningens mest lästa notis varje vecka.',
      'Regnet kom in horisontellt på tisdagen, vilket räknas som normalt.',
    ],
  },
  moskva: {
    namn: 'Vestnik Moskvy',
    devis: 'Morgontidning för huvudstaden och dess förorter',
    grundad: 1908,
    artiklar: [
      {
        rubrik: 'Tunnelbanan: ny station, gammal kristallkrona',
        text:
          'Den fjortonde tunnelbanelinjen invigdes i veckan med en station som är helt klädd i marmor och belyst av kristallkronor som hämtats från ett lager där de stått sedan 1950-talet. Ingenjörerna lovar att tåg går var nittionde sekund. Resenärer klagar på att stationen är så vacker att man missar sitt tåg. Trafikledningen ser det som ett gott betyg.',
      },
      {
        rubrik: 'Kylan kom tidigt: minus tolv i oktober',
        text:
          'Moskva fick sin första riktiga köldknäpp redan i oktober, med minus tolv grader vid Röda torget på morgonen. Pälsmössorna plockades fram två veckor tidigare än vanligt, och stadens värmeverk drog i gång i förtid. Meteorologerna säger att vintern kan bli lång, vilket den brukar. Isglassförsäljningen i GUM påverkades inte alls.',
      },
      {
        rubrik: 'Transsibiriska: ny vagn med bättre te',
        text:
          'Järnvägen presenterade en ny sovvagn för sträckan till Vladivostok, med förbättrad samovar i varje vagn. Resan tar fortfarande sju dagar, men teet är enligt provåkare ”en helt annan sak”. Vagnvärdarna har fått en tvådagarskurs i tebryggning. Den gamla samovaren ställs ut på järnvägsmuseet.',
      },
    ],
    notiser: [
      'Vasilijkatedralens kupoler putsas, en åt gången, under hela hösten.',
      'Gorkijparken har fått skridskobana med belysning i tolv färger.',
      'Bolsjojteatern spelar Nötknäpparen, för sextioåttonde säsongen.',
      'Kremls klockor gick tre sekunder fel och rättades utan kommentar.',
    ],
  },
  london: {
    namn: 'The Thames Herald',
    devis: 'Independent since 1849 - and still printed on paper',
    grundad: 1849,
    artiklar: [
      {
        rubrik: 'Tunnelbanestrejk på torsdag, som vanligt',
        text:
          'Fackföreningen för tunnelbanepersonalen har varslat om strejk på torsdag, den tredje i år. Resenärer uppmanas att gå, cykla eller ”överväga att arbeta hemifrån om det över huvud taget är möjligt”. Bussarna kommer att vara fulla, enligt en prognos som inte behövde göras. Vädret väntas bli grått.',
      },
      {
        rubrik: 'Tower Bridge öppnar för en segelbåt, kön blev en mil',
        text:
          'Bron öppnades i fredags eftermiddag för en liten segelbåt, vilket orsakade trafikkö ända till Whitechapel. Enligt reglementet från 1894 har sjöfarten företräde och båtägaren hade anmält sin passage i tid. Föraren av en dubbeldäckare kommenterade att båten ”kunde ha lagt ner masten”. Bron har öppnat mer än 800 gånger i år.',
      },
      {
        rubrik: 'Te-priset upp på pubarna, öl oförändrat',
        text:
          'En kopp te på pub i centrala London kostar nu i snitt mer än en halvliter av husets öl, visar Heralds undersökning. Krogägarna hänvisar till kostnaden för mjölk, kokande vatten och personal som måste vänta på att teet drar. Ölet, säger de, sköter sig självt. Kunderna har reagerat med att beställa öl.',
      },
    ],
    notiser: [
      'Duvorna på Trafalgar Square har enligt en räkning blivit färre men större.',
      'Big Ben ringer nu igen efter renovering, en halv sekund tidigare än förut.',
      'Hyde Park har fått nya hyrbåtar, blå i stället för gröna.',
      'Portobello Road förbjuder försäljning av antikviteter som är yngre än säljaren.',
      'Regnet i helgen kallades av väderleken för ”lätt, men ihärdigt”.',
    ],
  },
  dublin: {
    namn: 'The Liffey Herald',
    devis: 'Dublin’s morning paper - read it before the rain comes',
    grundad: 1871,
    artiklar: [
      {
        rubrik: 'Ha’penny Bridge målas om - i samma färg',
        text:
          'Stadens berömda gångbro över Liffey stängs i tre veckor för ommålning. Efter en offentlig samrådsprocess valde stadsrådet samma vita färg som tidigare, vilket kostade fyra möten och en konsultrapport. En medborgargrupp hade föreslagit grönt men fick nej med hänvisning till att ”den heter inte Green Bridge”. Bron beräknas se ut som förut i mitten av juni.',
      },
      {
        rubrik: 'Gratis rundtur på bryggeriet lockade tolv tusen',
        text:
          'När det stora bryggeriet firade sin födelsedag med gratis rundtur räckte kön från porten ända ner till floden. Guiderna körde turer fram till midnatt och uppger att de aldrig sett så många ”intresserade av bryggprocessen”. Fyra tusen glas gick åt. Bryggeriet lovar att göra om det ”om ungefär hundra år”.',
      },
      {
        rubrik: 'Pub hittar bok, tror att den är Joyces',
        text:
          'En pub på Duke Street hittade under golvet en sönderläst bok som ägaren är övertygad om tillhörde James Joyce, som ofta satt på puben. Nationalbiblioteket har undersökt boken och konstaterar att det är en busstidtabell från 1962. Puben har ändå ställt ut den bakom glas. Turisterna tar bilder.',
      },
    ],
    notiser: [
      'Temple Bar får ny gatsten, hal som den gamla.',
      'Färjan från Dún Laoghaire tar in en extra tur på söndagar.',
      'Ett rådhusbeslut om att räkna gatumusikanter på Grafton Street gav siffran ”många”.',
      'Trinity College låser Book of Kells i ett nytt skåp, med samma bok i.',
    ],
  },
  amsterdam: {
    namn: 'Het Grachtenblad',
    devis: 'Onafhankelijk ochtendblad sinds 1883',
    grundad: 1883,
    artiklar: [
      {
        rubrik: 'Tvåtusen cyklar upp ur kanalerna, en var ny',
        text:
          'Kommunens årliga uppdragning av cyklar från grachterna gav i år 2 140 cyklar, en soffa och en kanot. Bland cyklarna fanns en som fortfarande hade prislappen kvar, vilket enligt dykarna är ovanligt. De flesta cyklarna skrotas men några ställs ut på cykelmuseet. Museet meddelar att det snart är fullt.',
      },
      {
        rubrik: 'Rijksmuseum förlänger Vermeer - kön också',
        text:
          'Den stora Vermeerutställningen förlängs med två månader efter att biljetterna tagit slut på tre timmar. Museet har infört tidsbokning per kvart, vilket enligt besökare gör att man hinner se ungefär en tavla. Vakterna rapporterar att flest står framför Mjölkflickan. Mjölken är fortfarande inte slut.',
      },
      {
        rubrik: 'Tulpanlökar stals - och planterades',
        text:
          'Ett parti om tre tusen tulpanlökar försvann från blomstermarknaden vid Singel i november. I april upptäcktes de: någon hade planterat dem i rader längs hela Vondelpark. Polisen har lagt ner ärendet med hänvisning till att parken ”ser bra ut”. Marknaden överväger att anmäla gärningsmannen för trädgårdsarbete utan tillstånd.',
      },
    ],
    notiser: [
      'Spårvagn 2 får nya vagnar, som är lika smala som de gamla.',
      'Kanalbåtarnas hastighetsgräns sänks till sex kilometer i timmen, vilket ingen märker.',
      'Anne Frank-huset inför tidsbokning också för kön.',
      'En häger har flyttat in på Dam-torget och matas av stadens turistkontor.',
      'Stroopwafeln får skyddad ursprungsbeteckning i Gouda, till Amsterdams irritation.',
    ],
  },
  berlin: {
    namn: 'Spree-Anzeiger',
    devis: 'Unabhängig, ungeduldig, Berlin',
    grundad: 1919,
    artiklar: [
      {
        rubrik: 'Klubbarna kräver tystare nattbussar',
        text:
          'En sammanslutning av klubbar i Friedrichshain har skrivit till trafikbolaget och bett om tystare nattbussar, eftersom motorljudet ”stör basen”. Trafikbolaget svarar att bussarna är tystare än klubbarna. Frågan går nu till bezirkets utskott för nattliv, som sammanträder klockan tre på natten. Beslut väntas inte.',
      },
      {
        rubrik: 'Currywursten får egen stadsdel',
        text:
          'Efter en omröstning bland läsare har Spree-Anzeiger utsett Kreuzberg till currywurstens officiella hemstadsdel. Charlottenburg har protesterat och hänvisar till att rätten uppfanns där 1949, vilket historikerna instämmer i. Kreuzberg svarar att det viktiga inte är var den uppfanns utan var den äts. Tidningen står fast vid sitt beslut.',
      },
      {
        rubrik: 'Flygplatsen fungerade en hel vecka',
        text:
          'Stadens flygplats rapporterar en vecka utan större incidenter, vilket firas med en notis i personaltidningen. Bagagebanden gick, tavlorna visade rätt tid och kaffemaskinen i terminal 1 fungerade fram till fredag. Ledningen säger att man inte vill ”ropa hej”. Passagerarna beskrivs som förvånade.',
      },
    ],
    notiser: [
      'Brandenburger Tor tvättas i natt, ett tvätt av två.',
      'Museiön inför en gemensam biljett som ingen ännu förstått.',
      'Tempelhofs gamla flygfält får fler grillplatser och färre regler.',
      'Tunnelbanan U8 lovar att lukta bättre efter nyår.',
    ],
  },
  paris: {
    namn: 'Le Courrier de la Seine',
    devis: 'Quotidien indépendant du matin depuis 1867',
    grundad: 1867,
    artiklar: [
      {
        rubrik: 'Bagerierna strejkar mot baguettepriset',
        text:
          'Bagerierna i fyra arrondissement höll stängt på måndagsmorgonen i protest mot ett förslag om ett rekommenderat pris på baguetter. Bagarna anser att en baguette kostar vad den kostar. Parisarna fick i stället äta gårdagens bröd, vilket enligt flera vittnen ”var en förnedring”. Regeringen har lovat att inte lägga sig i.',
      },
      {
        rubrik: 'Eiffeltornet får nytt lager färg, sextio ton',
        text:
          'Tornet målas om för tjugonde gången sedan invigningen, med sextio ton färg i en nyans som kallas ”eiffelbrun”. Målarna arbetar hängande i rep och beräknas vara klara om arton månader. Under tiden är tornet öppet, med undantag för vissa hörn. En besökare frågade om man kunde få tornet i blått, men fick nej.',
      },
      {
        rubrik: 'Metron: ny linje, samma lukt',
        text:
          'Den förlängda linje 14 invigdes med tal och musik, och passagerarna konstaterade genast att det luktar precis som i de andra tunnlarna. Trafikbolaget menar att lukten är en del av Paris. Stationerna är dock så nya att de fortfarande har alla bänkar kvar. Det väntas inte hålla i sig.',
      },
    ],
    notiser: [
      'Louvren flyttar kön till Mona Lisa så att den syns bättre från Mona Lisa.',
      'Bouquinisterna längs Seine har fått nya gröna lådor, som ser äldre ut än de gamla.',
      'Montmartre inför tillstånd för porträttmålare, som får måla tillståndet.',
      'Café-terrasserna vid Saint-Germain höjer priset på espresso med tio cent och kunderna med noll.',
      'Seine bedöms badbar i två dagar i augusti, väder och vatten förbehållet.',
    ],
  },
  prag: {
    namn: 'Pražský Hlasatel',
    devis: 'Nezávislý deník - Oberoende dagblad',
    grundad: 1895,
    artiklar: [
      {
        rubrik: 'Karlsbron: statyerna får semester',
        text:
          'Tre av de trettio barockstatyerna på Karlsbron lyfts bort under sommaren för renovering, och ersätts av trälådor med bild av statyn. Konservatorerna säger att statyerna ”behöver en paus från turisterna”. Turisterna fotograferar lådorna. Broförvaltningen överväger att behålla en låda.',
      },
      {
        rubrik: 'Ölpriset når rekord i gamla stan',
        text:
          'En halvliter öl på Gamla stans torg kostar nu lika mycket som fyra halvlitrar i Žižkov, visar Hlasatels ölindex. Krogägarna vid torget hänvisar till utsikten över den astronomiska klockan, som enligt dem ”ingår i priset”. Pragborna har för länge sedan slutat dricka vid torget. Klockan slår som vanligt.',
      },
      {
        rubrik: 'Det astronomiska uret gick fel i tre minuter',
        text:
          'Det sexhundra år gamla uret på rådhuset spelade upp sitt apostelskådespel tre minuter för tidigt på onsdagen, till bestörtning för en folkmassa som ännu inte hunnit ta fram kamerorna. Urmakaren skyller på fukt. Uret gick rätt igen vid nästa hel timme. Kommunen påpekar att uret överlevt två krig och kan hantera en onsdag.',
      },
    ],
    notiser: [
      'Spårvagn 22 till Pragborgen får ett extra stopp, för utsikten.',
      'Pragborgens vaktbyte får nya uniformer i samma blå färg.',
      'Trdelník-stånden i gamla stan begränsas till ett per gathörn.',
      'Vltava får nya svanar, enligt en frivillig som räknade.',
    ],
  },
  newyork: {
    namn: 'The Hudson Gazette',
    devis: 'All the city, every morning, since 1852',
    grundad: 1852,
    artiklar: [
      {
        rubrik: 'Tunnelbanan höjer priset, sänker inte råttorna',
        text:
          'Trafikmyndigheten höjer priset på en tunnelbaneresa med en kvarts dollar, den fjärde höjningen på sex år. Pengarna går till nya vagnar, bättre signaler och ett program för att minska antalet råttor, som enligt myndigheten är ”ambitiöst”. Resenärerna har reagerat med att fortsätta åka. Råttorna har inte kommenterat.',
      },
      {
        rubrik: 'Frihetsgudinnans krona öppen - 162 trappsteg',
        text:
          'Kronan på Frihetsgudinnan öppnas åter för besökare efter renovering, med en trappa på 162 steg som besökare beskriver som ”en spiral utan slut”. Biljetterna för hela sommaren tog slut på en förmiddag. Uppe i kronan får tio personer plats åt gången, vilket enligt parkvakterna är ”tio mer än vad Bartholdi tänkte sig”. Utsikten går mot Brooklyn.',
      },
      {
        rubrik: 'Pizzaslice under en dollar - i ett gathörn',
        text:
          'En pizzeria i Midtown säljer fortfarande en slice för nittionio cent, vilket har lett till en kö som blockerar en bussfil. Ägaren säger att han lovade sin far att aldrig höja priset och inte tänker börja nu. Stadens trafikkontor har bett kön att stå på trottoaren. Kön står där den står.',
      },
    ],
    notiser: [
      'Central Park har fått nya bänkar, med plaketter till salu.',
      'Taxibolagen målar om tvåhundra bilar i en gulare gul.',
      'Empire State Building lyser grönt i kväll av en anledning som ännu inte kommunicerats.',
      'Brooklyn Bridge stänger en fil för cyklar, som därmed får två.',
      'En kall bagel på Upper West Side kostar nu lika mycket som en varm.',
    ],
  },
  sanfrancisco: {
    namn: 'The Golden Gate Dispatch',
    devis: 'Independent journalism, fog or shine, since 1868',
    grundad: 1868,
    artiklar: [
      {
        rubrik: 'Dimman sjunde dagen: bron finns kvar, lovar staden',
        text:
          'Golden Gate-bron har varit osynlig i dimma sju dagar i rad, vilket fått turistbyrån att publicera ett fotografi som bevis för att den fortfarande står där. Broförvaltningen uppger att bron är orange och 2,7 kilometer lång, som förut. Mistlurarna har gått dygnet runt, till grannarnas vana. Meteorologerna spår sol på torsdag, i Oakland.',
      },
      {
        rubrik: 'Kabelspårvagnarna stannar - för smörjning',
        text:
          'Stadens berömda kabelvagnar står stilla i fyra dagar medan de underjordiska kablarna smörjs och en av vagnarna får nya bromsklossar i trä. Systemet är från 1873 och sköts, enligt underhållschefen, ”med samma metoder och samma tålamod”. Turisterna hänvisas till bussarna, som går uppför backarna men saknar klocka. Gripmännen tar semester.',
      },
      {
        rubrik: 'Sjölejonen på Pier 39 har blivit fler - och högljuddare',
        text:
          'Den årliga räkningen av sjölejon vid piren gav 1 100 djur, det högsta antalet på ett decennium. Hamnkontoret har byggt ut flottarna för att undvika trängsel, vilket sjölejonen svarat på med att ligga på samma flotte ändå. Ljudnivån mäts nu till nittio decibel, i klass med en gräsklippare. Kaféet intill har höjt priset på öronproppar.',
      },
    ],
    notiser: [
      'Alcatraz får kvällsturer med lykta, utan fångar.',
      'Lombard Street stängs för bilar på söndagar och öppnas för fotografer.',
      'Ett kafé i Mission tar tjugo dollar för ett kaffe som beskrivs som ”ärligt”.',
      'Surdegsbrödet vid Fisherman’s Wharf säljs nu med tillhörande fotoställ.',
    ],
  },
  rom: {
    namn: 'Il Corriere del Tevere',
    devis: 'Quotidiano indipendente della capitale',
    grundad: 1876,
    artiklar: [
      {
        rubrik: 'Vespaförbud diskuteras i centrum - igen',
        text:
          'Kommunfullmäktige har för sjätte gången tagit upp ett förslag om att förbjuda mopeder i de trängsta gränderna kring Piazza Navona. Förslaget stöds av fotgängare och motarbetas av alla som äger en Vespa, vilket i Rom är ungefär samma personer. Debatten pågick i fyra timmar och avslutades utan votering. Nästa möte hålls på en Vespa.',
      },
      {
        rubrik: 'Colosseum får nytt golv, gladiatorer saknas',
        text:
          'Arenans nya trägolv är klart och täcker nu de underjordiska gångarna där djur och gladiatorer en gång väntade på sin tur. Golvet kan fällas upp så att besökare ser hissarna från antiken, som byggdes utan el. Kulturministeriet lovar att det inte blir några gladiatorspel. Ett företag har redan ansökt om att få hyra golvet till en modevisning.',
      },
      {
        rubrik: 'Fontana di Trevi: 1,4 miljoner euro i mynt',
        text:
          'Den årliga tömningen av Trevifontänen gav 1,4 miljoner euro i mynt, ett nytt rekord. Pengarna går till stadens välgörenhet, som numera har en egen räknemaskin. Kommunen påminner om att det räcker med ett mynt för att komma tillbaka till Rom; två ger enligt traditionen ett giftermål, vilket många ångrat. En turist kastade av misstag sin nyckel.',
      },
    ],
    notiser: [
      'Pantheon inför inträde på tio euro, taket fortsatt gratis.',
      'Spanska trappan får nya vakter som säger åt folk att inte sitta.',
      'Pizza al taglio-stället vid Campo de’ Fiori har fått pris för sin kö.',
      'Metrolinje C har grävt sig fram till ännu en antik ruin och stannar där en tid.',
      'Katterna vid Largo Argentina har räknats och alla har namn.',
    ],
  },
  aten: {
    namn: 'Athinaïkos Kirykas',
    devis: 'Ανεξάρτητη πρωινή εφημερίδα - Oberoende morgontidning',
    grundad: 1912,
    artiklar: [
      {
        rubrik: 'Akropolis stänger i värmen, klippan öppen',
        text:
          'Vid temperaturer över fyrtio grader stänger Akropolis klockan tolv och öppnar igen klockan fem, meddelar kulturministeriet. Kön bildas ändå klockan elva. Ministeriet förklarar att marmorn blir så varm att den inte går att stå på. En grupp turister försökte i stället klättra på Areopagen, som är lika varm men gratis.',
      },
      {
        rubrik: 'Färjorna inställda: vinden vann',
        text:
          'Alla avgångar från Pireus ställdes in på tisdagen på grund av nordanvinden meltemi, som blåste i tio sekundmeter. Hundratals resenärer fastnade i hamnen, där tavernorna förlängde öppettiderna och höjde priset på grillad bläckfisk. Rederierna ber om ursäkt och skyller på Poseidon. Vinden väntas lägga sig när den vill.',
      },
      {
        rubrik: 'Plaka förbjuder högtalare, bouzouki tillåten',
        text:
          'Stadsdelen Plaka inför förbud mot högtalare på tavernornas uteserveringar, efter klagomål från grannar som inte fått sova sedan 1998. Livemusik med bouzouki är däremot tillåten till midnatt, eftersom den ”är kultur”. Tavernaägarna har svarat med att anställa bouzoukispelare. Grannarna har inte hörts av.',
      },
    ],
    notiser: [
      'Tunnelbanan har grävt fram ännu en antik gata under Syntagma.',
      'Monastiraki-marknaden har fler grammofoner än grammofonskivor, enligt en räkning.',
      'Filopappou-kullen får ny belysning vid solnedgången, när ingen behöver den.',
      'Katterna på Anafiotika har fått en egen vattenskål från kommunen.',
    ],
  },
  barcelona: {
    namn: 'El Diari del Litoral',
    devis: 'Diari independent de Barcelona des de 1899',
    grundad: 1899,
    artiklar: [
      {
        rubrik: 'Sagrada Família klar 2026 - eller inte',
        text:
          'Byggledningen för Sagrada Família upprepar att kyrkan ska stå klar 2026, hundra år efter Gaudís död. Samtidigt meddelar man att den sista trappan till centraltornet ”kan ta något längre tid”. Barcelonaborna, som hört liknande sedan 1882, nickar. Byggkranarna har blivit en så självklar del av silhuetten att en förening vill skydda dem.',
      },
      {
        rubrik: 'Strandförbud mot högtalare från juni',
        text:
          'Stadens stränder blir högtalarfria från och med juni, efter en sommar då Barceloneta enligt mätningar lät mer än Ramblan. Endast hörlurar tillåts, samt ”måttlig sång”. Strandvakterna får en visselpipa som får användas mot högtalare men inte mot sångare. Förbudet gäller inte i vattnet.',
      },
      {
        rubrik: 'Boqueria förbjuder juice i plastglas - kön kvar',
        text:
          'Den stora saluhallen vid Ramblan slutar sälja färskpressad juice i plastglas och går över till papper. Stånden befarar att juicen ska rinna igenom men kommunen är lugn. Kön till juicestånden är enligt marknadsledningen oförändrad, vilket alla tar som ett bevis på att det inte är glaset folk kommer för. Priset är däremot förändrat.',
      },
    ],
    notiser: [
      'Park Güell inför tidsbokning också för utsikten.',
      'Spårvagnen längs Diagonal förlängs med två stationer och en rondell.',
      'Montjuïc-linbanan får nya kabiner i samma röda färg.',
      'Tibidabos nöjespark har fått ett nytt pariserhjul, äldre än det gamla.',
      'Ett bageri i Gràcia bakar en ensaimada stor som ett cykelhjul.',
    ],
  },
  lissabon: {
    namn: 'O Correio do Tejo',
    devis: 'Diário independente da capital desde 1889',
    grundad: 1889,
    artiklar: [
      {
        rubrik: 'Spårvagn 28: nya vagnar, samma kurvor',
        text:
          'Den gula spårvagnslinjen genom Alfama får sex nya vagnar som byggts efter gamla ritningar, så att de får plats i gränderna. Vagnarna är från utsidan omöjliga att skilja från de gamla men har enligt trafikbolaget ”mjukare bromsar”. Passagerarna märker det inte. Kön vid Martim Moniz börjar fortfarande klockan åtta.',
      },
      {
        rubrik: 'Torre de Belém sjunker - långsamt',
        text:
          'Mätningar visar att försvarstornet vid Tejo sjunker med en millimeter om året, vilket kulturmyndigheten kallar ”ingenting att oroa sig för under de närmaste tusen åren”. Tornet byggdes 1519 och var ursprungligen ute i floden, men floden flyttade på sig. Turisterna fortsätter att klättra upp. Tornet fortsätter att sjunka, enligt planen.',
      },
      {
        rubrik: 'Pastel de nata: receptet fortfarande hemligt',
        text:
          'Bageriet i Belém bekräftar att receptet på deras vaniljbakelser fortfarande bara är känt för tre personer, som inte får resa i samma spårvagn. Ett försök av en konkurrent att återskapa receptet med hjälp av kemisk analys gav ”en god men annan bakelse”. Kön utanför bageriet är obruten sedan 1837. Kanel serveras separat.',
      },
    ],
    notiser: [
      'Hissen Santa Justa får nytt räcke, av samma järn som förut.',
      'Färjan till Cacilhas får en extra tur vid solnedgången.',
      'Alfama får en ny fadoklubb, den fjärde på samma gata.',
      'Kommunen lägger nya kullerstenar på Rossio, hala som de gamla.',
    ],
  },
  istanbul: {
    namn: 'Boğaz Postası',
    devis: 'Bağımsız sabah gazetesi - Oberoende morgontidning',
    grundad: 1924,
    artiklar: [
      {
        rubrik: 'Bosporenfärjorna byter till vintertidtabell',
        text:
          'Färjorna mellan Eminönü och Kadıköy går från och med måndag efter vintertidtabellen, vilket innebär en tur mindre i timmen och en kopp te till samma pris. Pendlare som bor i Asien och arbetar i Europa får vänta tio minuter längre på kajen. Måsarna, som följer färjorna för simit, har inte informerats. Teförsäljarna ombord ser fram emot kylan.',
      },
      {
        rubrik: 'Stora basaren höjer hyrorna - mattorna dyrare',
        text:
          'Hyrorna i Stora basarens fyra tusen butiker höjs med tolv procent, vilket enligt handlarna kommer att märkas på mattorna. En mattförsäljare på Halıcılar-gatan säger att han nu måste erbjuda te i tio minuter innan han nämner priset, mot tidigare fem. Basarens styrelse hänvisar till takrenoveringen. Taket är från 1400-talet.',
      },
      {
        rubrik: 'Katterna på Hagia Sofia har fått ny vakt',
        text:
          'De katter som sedan generationer bor i och kring Hagia Sofia har fått en ny heltidsanställd vaktare, efter att den förra gått i pension. Uppdraget är att mata katterna, hålla dem borta från mosaikerna och svara på turisternas frågor om vilken katt som är vilken. Den mest berömda katten, som brukar sitta vid huvudporten, har inte bytt plats. Löneläget är okänt.',
      },
    ],
    notiser: [
      'Galatatornet får ny hiss, kön får ny längd.',
      'Kryddbasaren rapporterar brist på saffran men gott om saffranliknande.',
      'Spårvagnen T1 får en extra vagn på grund av kön till Sultanahmet.',
      'Fiskbrödsbåtarna vid Galatabron målas om i mer guld.',
      'Beyoğlus nostalgispårvagn körs nu av en förare som är yngre än vagnen.',
    ],
  },
  kapstaden: {
    namn: 'The Cape Chronicle',
    devis: 'Independent since 1857 - printed at the foot of the mountain',
    grundad: 1857,
    artiklar: [
      {
        rubrik: 'Linbanan stängd för vind, berget kvar',
        text:
          'Linbanan upp till Taffelberget stod stilla hela onsdagen på grund av sydostvinden, som Kapstadsborna kallar Cape Doctor. Hundratals turister hänvisades till vandringsleden Platteklip Gorge, som tar två timmar och inte har någon kiosk. Linbanebolaget påminner om att berget är kvar och kan beskådas nedifrån. Molntäcket som kallas duken låg på hela dagen.',
      },
      {
        rubrik: 'Pingvinerna på Boulders räknade: fler i år',
        text:
          'Den årliga räkningen av pingvinerna vid Boulders Beach gav 3 100 fåglar, tvåhundra fler än förra året. Parkförvaltningen tillskriver ökningen ett bättre fiskeår och färre hundar på stranden. Pingvinerna har som vanligt inte samarbetat vid räkningen utan promenerat i olika riktningar. En volontär beskriver arbetet som ”meditativt”.',
      },
      {
        rubrik: 'Braai-tävling avgjord på Signal Hill',
        text:
          'Stadens årliga grilltävling vann av ett lag från Woodstock, som grillade boerewors i sju timmar utan att tappa glöden. Juryn bedömde kött, eld och attityd. Tvåan protesterade mot att vinden gynnat vinnarna, vilket avslogs med hänvisning till att vinden var densamma för alla. Röken syntes från Robben Island.',
      },
    ],
    notiser: [
      'Vinfarmarna i Constantia öppnar för skörden med gratis provsmakning för de som hjälper till.',
      'Long Street får nya trottoarer, i väntan på nya bilar.',
      'Bo-Kaaps färgglada hus har fått en ny färg: turkos.',
      'Ett par valar sågs utanför Hermanus en vecka tidigare än väntat.',
    ],
  },
  kairo: {
    namn: 'Sawt al-Nil',
    devis: 'Nilens röst - morgontidning för Kairo och Giza',
    grundad: 1919,
    artiklar: [
      {
        rubrik: 'Pyramiderna får besökscentrum - med luftkonditionering',
        text:
          'Efter många år av planering öppnar ett nytt besökscentrum vid pyramiderna i Giza, med luftkonditionering, toaletter och en modell av Cheopspyramiden som besökare får röra vid. Kamelförarna utanför är skeptiska till centret men positiva till kön, som går förbi deras kameler. Pyramiderna själva är oförändrade sedan 4 500 år. Ingen förväntar sig annat.',
      },
      {
        rubrik: 'Sandstorm väntas till helgen, tvätten in',
        text:
          'Meteorologiska institutet varnar för en khamsin-storm från öknen på lördag, med sand, vind och en himmel som blir orange. Kairoborna uppmanas ta in tvätten, stänga fönstren och vänta. Trafiken väntas bli kaotisk, vilket enligt polisen inte skiljer sig från en vanlig lördag. Bilarna kommer att vara gula på söndagen.',
      },
      {
        rubrik: 'Khan el-Khalili: kryddhandlare stängde för lugn',
        text:
          'En kryddhandlare på basaren Khan el-Khalili har infört en tyst timme varje förmiddag, då han varken prutar eller ropar. Kunderna får handla till fast pris, vilket enligt grannarna är ”onaturligt”. Handlaren säger att han behöver tid att sortera sin kummin. Omsättningen har enligt honom inte förändrats, bara blodtrycket.',
      },
    ],
    notiser: [
      'Nilens vattenstånd är normalt, meddelar ministeriet till lättnad för feluckorna.',
      'Metron får en ny vagn reserverad för dem som vill ha tyst.',
      'Egyptiska museet flyttar ännu en sarkofag till det nya museet, försiktigt.',
      'Ett fikonstånd i Zamalek har fått pris för sina fikon.',
      'Koshari-priset är oförändrat för sjunde året, vilket ekonomerna inte kan förklara.',
    ],
  },
  dubai: {
    namn: 'The Gulf Morning Post',
    devis: 'The Emirates’ independent daily - taller every year',
    grundad: 1978,
    artiklar: [
      {
        rubrik: 'Ny våning på Burj Khalifa - ovanför den gamla',
        text:
          'Världens högsta byggnad öppnar ännu en utsiktsvåning, belägen ovanför den tidigare högsta utsiktsvåningen. Från den nya våningen ser man enligt fastighetsägaren ”ungefär detsamma, fast lite mer”. Hissen tar en minut. Ett kafé på våningen serverar kaffe med guldflingor, vilket ingen frågat efter men många beställer.',
      },
      {
        rubrik: 'Metron förlängs till hamnen, träbåtarna kvar',
        text:
          'Den förarlösa metron får en ny gren till gamla hamnen vid Dubai Creek, där träbåtarna abra fortfarande tar passagerare över vattnet för en dirham. Trafikmyndigheten försäkrar att båtarna blir kvar, som ”kulturarv och transportmedel”. Båtförarna säger att de har kört sedan innan metron fanns och tänker köra efter. Guldsouken ligger fem minuter från den nya stationen.',
      },
      {
        rubrik: 'Skidbacken i köpcentret får mer snö',
        text:
          'Inomhusskidbacken i ett av stadens köpcentrum utökar snöproduktionen inför sommaren, då temperaturen utomhus når fyrtiofem grader. Pingvinerna i anläggningen har fått ett större hägn. Besökare kan nu hyra både skidor och vinterjacka i samma disk. Utanför fönstren skiner solen som vanligt.',
      },
    ],
    notiser: [
      'Palmön får en ny strand på en ny gren.',
      'Kamelkapplöpningen på fredag körs med robotjockeyer, som förra året.',
      'Ett hotell erbjuder frukost på nittiofjärde våningen och hiss ingår.',
      'Fontänen vid Dubai Mall får ett nytt musiknummer, femton minuter långt.',
    ],
  },
  marrakech: {
    namn: 'L’Écho de l’Atlas',
    devis: 'Quotidien indépendant de la ville rouge',
    grundad: 1936,
    artiklar: [
      {
        rubrik: 'Souken stänger tidigare i värmen - pruta snabbare',
        text:
          'Handlarna i medinans souker har kommit överens om att stänga två timmar tidigare under sommaren, då termometern visar fyrtiotvå grader i skuggan av mattorna. Turister uppmanas att göra sina inköp på förmiddagen och ”pruta med större beslutsamhet”. Mattförsäljarna säger att te ändå serveras i samma takt. Torget Jemaa el-Fna påverkas inte, eftersom det vaknar på kvällen.',
      },
      {
        rubrik: 'Kamelrace utanför staden på fredag',
        text:
          'Det årliga kamelloppet vid Palmeraie hålls på fredag med trettio deltagande kameler, varav en enligt ägaren är favorit och resten enligt sina ägare också. Loppet går över tre kilometer sand och avslutas vid ett tält med mynta-te. Förra årets vinnare, en kamel vid namn Rachid, deltar inte på grund av ”attityd”. Publiken väntas bli stor.',
      },
      {
        rubrik: 'Koutoubias minaret: ljuset släckt en natt',
        text:
          'Marrakechs mest berömda minaret var mörk i natt på grund av ett elfel, vilket fick många i medinan att gå fel. Minareten från 1100-talet har använts som riktmärke i åtta hundra år, och en natt utan den räckte för att flera turister hamnade i Gueliz. Elen är återställd. Böneutroparen påverkades inte, eftersom han inte behöver ljus.',
      },
    ],
    notiser: [
      'Ormtjusarna på torget har kommit överens om ett gemensamt fototaxa.',
      'Majorelle-trädgården målar om en bänk i samma blå.',
      'Hästdroskorna får nya vagnar, men samma hästar.',
      'Tagine-tävlingen i Mellah avgjordes med oavgjort mellan två mödrar.',
      'Ett garveri erbjuder mynta till besökarna innan de går in.',
    ],
  },
  amman: {
    namn: 'Sada Amman',
    devis: 'Ammans eko - oberoende morgontidning sedan 1952',
    grundad: 1952,
    artiklar: [
      {
        rubrik: 'Citadellet får kvällsöppet, utsikten ingår',
        text:
          'Ruinkullen mitt i Amman håller från och med juni öppet till klockan tio på kvällen, då staden lyser upp i alla riktningar. Herkulestemplets pelare belyses underifrån, vilket enligt kulturministeriet får dem att ”se ännu mer romerska ut”. Ett kafé på kullen serverar te och kardemummakaffe. Böneutropen från nitton kullar hörs samtidigt vid solnedgången.',
      },
      {
        rubrik: 'Bussarna till Petra fulla hela veckan',
        text:
          'Alla bussar söderut mot Petra är fullbokade till söndag, meddelar bussbolaget, som satt in extra avgångar utan att det hjälpt. Resenärer på vandrarhemmen i Jabal Amman jämför alternativ: hyrbil, taxi eller ”att vänta”. En grupp från Göteborg valde att vänta och besökte i stället den romerska teatern tre gånger. Klippstaden ligger kvar där den ligger.',
      },
      {
        rubrik: 'Falafelstället på trappan firar sjuttio år',
        text:
          'Ett litet falafelkök vid Rainbow Street-trappan har serverat samma rätt sedan 1950-talet och firade i helgen med att inte ändra något. Ägaren säger att hemligheten är kikärtor, tålamod och att inte lyssna på förslag. Kön gick nedför trappan till Första cirkeln. Kommunen skickade en plakett som ägaren hängt bredvid frityren.',
      },
    ],
    notiser: [
      'Trapporna mellan Jabal Amman och centrum har målats i regnbågsfärger, igen.',
      'Kunskapsmätningen visar att Ammanbor kan namnen på sina kullar men inte antalet.',
      'Ett nytt kafé på Rainbow Street serverar kaffe med utsikt över ett annat kafé.',
      'Dagsutflykterna till Döda havet ställs in vid vind, som sällan förekommer.',
    ],
  },
  singapore: {
    namn: 'The Lion City Herald',
    devis: 'Independent, punctual, air-conditioned since 1965',
    grundad: 1965,
    artiklar: [
      {
        rubrik: 'Böter för tuggummi höjs - till 1 100 dollar',
        text:
          'Regeringen höjer böterna för olovlig tuggummiförsäljning och för att fästa tuggummi på tunnelbanedörrar. En talesperson förklarar att den tidigare nivån ”inte hade den avsedda avskräckande effekten på turister”. Tuggummi på recept är fortfarande tillåtet. Tunnelbanan rapporterar att dörrarna stängs som avsett.',
      },
      {
        rubrik: 'Superträden får ny ljusshow - femton minuter',
        text:
          'De konstgjorda träden i Gardens by the Bay får en ny kvällsföreställning med ljus och musik, där de femtio meter höga stålstrukturerna lyser i takt med en orkester. Föreställningen hålls klockan 19.45 och 20.45, exakt. Parkledningen ber besökarna att inte klättra i träden, vilket ännu ingen försökt. Luftfuktigheten är fortsatt hundra procent.',
      },
      {
        rubrik: 'Hawkercentret: kön till kycklingriset över en timme',
        text:
          'Ett stånd på Maxwell Food Centre har fått en kö på över en timme sedan ett omdöme kallat dess hainanesiska kycklingris för ”det enda som betyder något”. Ståndet serverar en rätt för fyra dollar och stänger när kycklingen är slut, vilket sker vid ettiden. Grannstånden, som serverar liknande kyckling, har hälften så lång kö och samma smak enligt lokalbefolkningen. Turisterna står kvar.',
      },
    ],
    notiser: [
      'Merlion-statyn har fått nytt vatten, av samma hamn.',
      'Changi flygplats har fått en ny trädgård, för dem som redan sett de andra fem.',
      'MRT-linjen till Punggol har öppnat tre minuter före utsatt tid, vilket är en avvikelse.',
      'Chinatown säljer durian till rekordpris, med dofttillstånd.',
      'Ett regn klockan fyra på eftermiddagen inträffade som väntat.',
    ],
  },
  rio: {
    namn: 'O Jornal da Baía',
    devis: 'Diário independente da Cidade Maravilhosa',
    grundad: 1891,
    artiklar: [
      {
        rubrik: 'Kristusstatyn belyses i nya färger - grannarna sover inte',
        text:
          'Statyn på Corcovado har fått ett nytt belysningssystem som kan skifta i alla färger, vilket i helgen användes för att visa grönt och gult inför en fotbollsmatch. Boende i Laranjeiras rapporterar att det lyser in i sovrummen. Stiftelsen som förvaltar statyn lovar att den ska vara vit på vardagar. Molnen som brukar dölja statyn har inte tillfrågats.',
      },
      {
        rubrik: 'Sambaskolorna börjar repetera - i juni',
        text:
          'Karnevalens sambaskolor har inlett sina repetitioner ett halvår i förväg, med trumsektioner som hörs över hela zona norte varje söndagskväll. Skolan Mangueira har valt ett tema som handlar om regn, vilket enligt karnevalsexperter är ”modigt”. Kostymerna sys från och med nu. Grannarna har lärt sig rytmen.',
      },
      {
        rubrik: 'Copacabana: solstolarna dyrare än drinken',
        text:
          'Att hyra en solstol på Copacabana kostar nu mer än en caipirinha, visar Jornalens strandindex. Stolsuthyrarna hänvisar till kostnaden för att släpa stolarna fram och tillbaka varje dag, vilket kunderna aldrig tänkt på. Drinken är fortsatt billig eftersom limefrukterna växer. Vågorna är gratis.',
      },
    ],
    notiser: [
      'Sockertoppens linbana får nya kabiner, med samma utsikt.',
      'Maracanã-stadion målar om läktarna i den gula som fanns.',
      'Ett strandfotbollslag från Ipanema har vunnit mot ett från Leblon för tredje gången i rad.',
      'Selarón-trappan har fått nya kakelplattor från tre nya länder.',
    ],
  },
  havanna: {
    namn: 'El Diario del Malecón',
    devis: 'Periódico de la mañana para toda La Habana',
    grundad: 1902,
    artiklar: [
      {
        rubrik: 'Fler gamla bilar på gatorna än på tio år',
        text:
          'En räkning av Chevroleter, Buickar och Fordar från 1950-talet på Havannas gator visar fler bilar i trafik än på ett decennium, sedan flera bilar plockats fram ur garage och lagats med delar från kylskåp. Mekanikerna på Calle Neptuno säger att inget är omöjligt om man har tråd. En turist frågade vad en bil kostar och fick svaret ”mer än huset”. Bilarna går, i olika hastighet.',
      },
      {
        rubrik: 'Kapitolium öppnar kupolen - trappan är lång',
        text:
          'Kupolen på El Capitolio, som stängts för renovering i sju år, öppnas för besök. Trappan har 300 steg och en guide som berättar om varje. Uppe under kupolen ser man hela Havanna, från hamnen till Vedado, och en golvmosaik som återställts med hjälp av ett foto från 1929. Byggnaden är fortfarande något högre än sin förebild i Washington, enligt guiden.',
      },
      {
        rubrik: 'Musiken kommer inifrån husen, inte från högtalare',
        text:
          'Kommunen har konstaterat att Havanna är den stad i Karibien med lägst antal högtalare per gata, eftersom musiken i stället spelas i fönstren. En undersökning i Habana Vieja fann trettio gitarrer, tolv trumset och en kontrabas på ett kvarter. Vaggvisor och son-rytmer blandas efter klockan elva. Ingen har lämnat in klagomål.',
      },
    ],
    notiser: [
      'Malecón stängs för trafik vid högvatten, som inträffar när det blåser norrifrån.',
      'Ett glassstånd på Coppelia har infört tre nya smaker och kön har fördubblats.',
      'Cigarrfabriken på Partagás-gatan får en ny uppläsare som läser romaner för rullarna.',
      'Kanonskottet från fästningen klockan nio ljöd klockan nio, som varje kväll sedan 1700-talet.',
      'Bussen till Varadero har fått luftkonditionering, säger chauffören.',
    ],
  },
  dakar: {
    namn: 'Le Quotidien de la Presqu’île',
    devis: 'Journal indépendant de Dakar et de la côte',
    grundad: 1961,
    artiklar: [
      {
        rubrik: 'Färjan till Gorée får en ny båt - gamla får vila',
        text:
          'Färjelinjen mellan Dakars hamn och ön Gorée tar i drift en ny båt med plats för trehundra passagerare, medan den gamla båten från 1970-talet får en välförtjänt ommålning. Överfarten tar tjugo minuter som förut. Besökare som ska till Slavhuset uppmanas köpa biljett tidigt, eftersom söndagens turer är fulla av Dakarbor med picknick. Måsarna följer båda båtarna.',
      },
      {
        rubrik: 'Brottningsfinal på stadion i kväll',
        text:
          'Säsongens stora final i senegalesisk brottning, lutte, hålls i kväll på stadion i Pikine, med trummor, gris-gris-amuletter och två brottare som tränat i sanden på stranden sedan i februari. Biljetterna såldes slut på en dag. Traditionen kräver att brottarna dansar innan de brottas, vilket tar längre tid än matchen. Vinnaren får en bil, en ko och en gata uppkallad efter sig.',
      },
      {
        rubrik: 'Thieboudienne: rätten som fick en internationell dag',
        text:
          'Senegals nationalrätt, ris med fisk och grönsaker, firades i helgen med en tävling på Place de l’Indépendance där tjugo kockar lagade varsin gryta stor som ett badkar. Juryn bedömde riset, fisken och den brända skorpan i botten, som enligt kännare är det som avgör. Vinnaren kom från Médina och tackade sin mor. Publiken fick äta upp resterna, vilket tog hela eftermiddagen.',
      },
    ],
    notiser: [
      'Monumentet för afrikansk renässans får ny belysning och samma storlek.',
      'Fiskebåtarna i Soumbédioune har målats om inför säsongen.',
      'Trafiken på Route de la Corniche stoppades av en får-flock på väg till Tabaski.',
      'Ett minibussbolag lovar fasta priser, vilket ingen passagerare tror på.',
    ],
  },
  mumbai: {
    namn: 'The Marine Drive Herald',
    devis: 'Independent since 1931 - the city that never stops talking',
    grundad: 1931,
    artiklar: [
      {
        rubrik: 'Monsunen två veckor tidigt, paraplyerna slut',
        text:
          'Den årliga monsunen nådde Mumbai två veckor tidigare än normalt, med sextio millimeter regn under första dagen och en paraplyhandel som tog slut på ett par timmar. Lokaltågen gick med tio minuters försening, vilket räknas som i tid. Marine Drive spolades av vågor som gick över räcket. Barnen på Chowpatty-stranden tyckte det var underbart.',
      },
      {
        rubrik: 'Lokaltågen får nya vagnar - dörrarna kvar öppna',
        text:
          'Järnvägen har tagit i drift trettio nya vagnar på Western Line, med bättre fläktar och bredare dörrar. Dörrarna kommer fortfarande att stå öppna under färd, som traditionen kräver och passagerarna föredrar. Vagnarna rymmer officiellt 200 personer och i praktiken det som får plats. Dabbawalorna, som levererar lunchlådor med tågen, är nöjda med fläktarna.',
      },
      {
        rubrik: 'Vada pav-priset upp en rupie - staden diskuterar',
        text:
          'Mumbais mest sålda gatumat, den friterade potatisbullen i bröd, har blivit en rupie dyrare vid stånden utanför Dadar station. Ståndägarna hänvisar till priset på gas, medan kunderna hänvisar till att det alltid har kostat vad det kostade. Heralds telefonväxel tog emot fler samtal om detta än om valet. Bullen är oförändrad.',
      },
    ],
    notiser: [
      'Gateway of India har fått nytt räcke, eftersom det gamla gick i havet.',
      'En filmstudio i Andheri söker tre tusen statister till en scen med tre tusen statister.',
      'Kråkorna vid Colaba har enligt en räkning blivit fler än duvorna.',
      'Chai-priset på Victoria Terminus är oförändrat, vilket är tidningens mest lästa notis.',
      'Dhobi Ghat-tvätterierna rapporterar rekord i antal skjortor på en dag.',
    ],
  },
  bangkok: {
    namn: 'The Chao Phraya Daily',
    devis: 'Bangkok’s independent morning paper since 1946',
    grundad: 1946,
    artiklar: [
      {
        rubrik: 'Flodbussarna får kvällsturer - och tak',
        text:
          'Expressbåtarna på Chao Phraya kör från och med nu till klockan tio på kvällen, och en ny serie båtar har fått tak som täcker hela däcket. Pendlare som brukade komma hem våta beskriver förändringen som ”livsavgörande”. Båtarna stannar fortfarande i cirka fyra sekunder vid varje brygga. Konduktörerna visslar som förut.',
      },
      {
        rubrik: 'Marknaden vid Wat Arun växer - templet står stilla',
        text:
          'Kvällsmarknaden på andra sidan floden från Wat Arun har vuxit till trehundra stånd, varav ett hundratal säljer mangoris. Templets tinnar av porslinsskärvor lyser upp klockan sju och marknaden fylls på samma minut. Stadsförvaltningen överväger att begränsa antalet stånd men vet inte till vad. Templets abbot ser gärna att marknaden håller sig på sin sida.',
      },
      {
        rubrik: 'Tuk-tuk-förare inför fast pris: gällde i en dag',
        text:
          'En förening för tuk-tuk-förare vid Khao San Road införde i måndags fasta priser med skyltar på varje fordon. På tisdagen var skyltarna borta. Föreningens ordförande säger att systemet ”utvärderas”. Turister som lyckades åka på måndagen betalade enligt uppgift hälften av det normala, och de som åkte på tisdagen dubbelt.',
      },
    ],
    notiser: [
      'Skytrain får nya sittplatser, färre men mjukare.',
      'Chatuchak-marknaden rapporterar en helg med tre miljoner besökare och en borttappad get.',
      'Lumphini-parkens varaner har räknats till fyrtio, plus en som ingen får tag i.',
      'Pad thai-ståndet vid Thip Samai har förlängt sin kö runt hörnet.',
    ],
  },
  hanoi: {
    namn: 'Tin Sáng Hà Nội',
    devis: 'Nhật báo độc lập - Oberoende dagstidning',
    grundad: 1954,
    artiklar: [
      {
        rubrik: 'Gatuköken klarar inspektionen - alla utom ett',
        text:
          'Stadens hälsoinspektion har granskat trehundra gatukök i Gamla kvarteren och godkänt alla utom ett, som saknade plaststolar. Inspektörerna bedömde fond, färskhet och att stolarna är tillräckligt låga för att gästerna ska sitta nära soppan. Ett phở-kök på Bat Dan-gatan fick högsta betyg och en kö som räckte till nästa gata. Ägaren säger att fonden kokat sedan 1979.',
      },
      {
        rubrik: 'Hoan Kiem-sjön rensas - sköldpaddan får stanna',
        text:
          'Sjön mitt i Hanoi töms på skräp och alger under en vecka, men den legendariska jättesköldpaddan i sjön, om den finns, berörs inte. Kommunen påpekar att ingen sett den på flera år men att ”hon kan vara blyg”. Under rensningen hittades två mopeder och en tempelklocka. Pensionärerna som gör morgongymnastik vid stranden fortsatte som vanligt.',
      },
      {
        rubrik: 'Äggkaffet får en dag - och ett pris',
        text:
          'Hanois specialitet, kaffe med vispad äggula, hyllas nu med en egen dag varje mars och ett pris till bästa kafé. Årets vinnare ligger på tredje våningen i ett hus utan skylt, dit man kommer genom en klädaffär. Ägaren säger att receptet kommer från 1946, då mjölken var slut. Kön började före öppning och innehöll enligt ägaren mest folk som redan visste vägen.',
      },
    ],
    notiser: [
      'Tåggatan stängs för besökare, igen, tills nästa gång.',
      'Mopedparkeringen på Hang Bac-gatan har fått en tillsyningsman med visselpipa.',
      'Långa bron över Röda floden målas i samma rost.',
      'Vattendockteatern spelar samma pjäs som i tusen år och biljetterna är slut.',
      'Bánh mì-ståndet vid katedralen har fått en klocka så att kön vet vad klockan är.',
    ],
  },
  kathmandu: {
    namn: 'The Valley Courier',
    devis: 'Independent since 1962 - read at altitude',
    grundad: 1962,
    artiklar: [
      {
        rubrik: 'Trekkingtillstånden dyrare från oktober',
        text:
          'Turismdepartementet höjer avgiften för vandringstillstånd till Annapurna och Everest-regionen från oktober, med hänvisning till kostnaden för att bära ned skräp. Vandrare i Thamel har reagerat med att boka nu. Bärare och guider hoppas att en del av pengarna når dem, vilket departementet ”noterar”. Bergen är oförändrade.',
      },
      {
        rubrik: 'Boudhanath får nytt guld på spiran',
        text:
          'Den stora stupan i Boudha får ny förgyllning på spiran och de tretton trappstegen mot upplysningen, efter att det förra lagret slitits av väder och monsun. Arbetet utförs av hantverkare från Patan som arbetar med tunt bladguld i vindstilla väder, vilket innebär korta pass. Pilgrimerna fortsätter att gå medurs runt stupan medan ställningen står. Ögonen på tornet ser allt.',
      },
      {
        rubrik: 'Momo-tävling i Thamel: 400 dumplings på en timme',
        text:
          'En restaurang i Thamel arrangerade en tävling i att äta momo, den nepalesiska dumplingen, och vinnaren åt fyrtiotvå på en timme. Tvåan gav upp vid trettioåtta med hänvisning till höjden. Restaurangen serverade sammanlagt fyra hundra momo under tävlingen och slut på chilisås efter en halvtimme. Ett lag från Pokhara har utmanat till revansch.',
      },
    ],
    notiser: [
      'Elavbrotten är nu bara tre timmar per dag, vilket firas.',
      'Aporna vid Swayambhunath har stulit en kamera och ett paket kex.',
      'Flygplatsen får en ny bagagevagn, vilket ger totalt fyra.',
      'Durbar Square lyfter en fallen pelare på plats med hjälp av tjugo personer och ett rep.',
    ],
  },
  cusco: {
    namn: 'El Heraldo del Inca',
    devis: 'Diario independiente de la capital imperial',
    grundad: 1908,
    artiklar: [
      {
        rubrik: 'Tågen till Machu Picchu fulla hela månaden',
        text:
          'Alla tågavgångar från Ollantaytambo till Aguas Calientes är fullbokade fram till månadsskiftet, och bolaget uppmanar resenärer att ”planera i god tid”, vilket de som står i kön vid stationen anser är sent påpekat. Alternativet, att vandra Inkaleden i fyra dagar, kräver tillstånd som tog slut i januari. Ett vandrarhem i San Blas rapporterar att gästerna stannar längre än planerat. Kokate serveras gratis.',
      },
      {
        rubrik: 'Inti Raymi-festen förbereds - solen väntas',
        text:
          'Solfesten den 24 juni förbereds på Sacsayhuamán med sju hundra skådespelare i inka-dräkter, en lama och en talare som ska spela inkakejsaren och läsa på quechua. Repetitionerna har pågått sedan april. Läktarna som byggs framför fästningens stenmurar rymmer fyra tusen personer och kullarna runt omkring rymmer alla andra. Meteorologerna spår sol, vilket är en förutsättning.',
      },
      {
        rubrik: 'Lama i katedralen: ”Det var öppet”',
        text:
          'En lama gick i tisdags in genom huvudporten till katedralen vid Plaza de Armas och stod en stund i mittskeppet innan den leddes ut av en vakt. Djuret tillhör en kvinna som säljer fotograferingar på torget och som uppger att laman ”alltid varit nyfiken”. Ingen skada uppstod på tavlorna, inte heller på den berömda nattvardsmålningen med marsvin. Katedralen håller porten stängd tills vidare.',
      },
    ],
    notiser: [
      'Stenen med tolv hörn på Hatunrumiyoc-gatan har enligt en ny räkning fortfarande tolv.',
      'Marknaden San Pedro har fått ett nytt stånd för juice, det fyrtioandra.',
      'Höjdsjukan i Cusco har inte förändrats sedan förra veckan, enligt vandrarhemmen.',
      'Bussarna till Heliga dalen får nya bromsar, vilket välkomnas.',
      'Pisco sour-tävlingen på torget vanns av ett bageri.',
    ],
  },
  addisabeba: {
    namn: 'The Highland Gazette',
    devis: 'Independent since 1941 - printed at 2 400 metres',
    grundad: 1941,
    artiklar: [
      {
        rubrik: 'Lucy får ny sal på museet - hon är 3,2 miljoner',
        text:
          'Nationalmuseets berömda skelett Lucy, som hittades i Afar 1974 och är 3,2 miljoner år gammal, flyttar till en ny sal med bättre ljus och klimatanläggning. Museet framhåller att originalet ligger i ett kassaskåp och att besökare ser en avgjutning, vilket enligt guiden ”inte gör henne mindre viktig”. Salen har också fått en bänk. Lucy uppges inte ha några åsikter om flytten.',
      },
      {
        rubrik: 'Kaffepriset stiger på Merkato',
        text:
          'Priset på råa kaffebönor på Afrikas största marknad har stigit med femton procent på en månad, vilket har fått kaffeceremonierna i staden att bli något kortare. Traditionen kräver tre koppar, rostning på plats och rökelse, och ingen av dessa har övergivits. Handlarna hänvisar till regnet i Kaffa-regionen, där kaffet kom ifrån. Konsumtionen är oförändrad.',
      },
      {
        rubrik: 'Löparna i Entoto-skogen: nu med egen bana',
        text:
          'Skogen på berget ovanför staden, där generationer av maratonlöpare tränat på 3 000 meters höjd, får en anlagd löparslinga med kilometerskyltar. Löparna som brukat gå upp i mörkret klockan fem fortsätter att göra det, men nu med skyltar. Eukalyptusträden är kvar. Tävlingsarrangörer i Europa förväntar sig ännu snabbare tider.',
      },
    ],
    notiser: [
      'Spårvagnen från Meskel-torget har fått en ny vagn i grönt och gult.',
      'Injera-priset är oförändrat, enligt fyra restauranger på Bole.',
      'Regnperioden väntas börja i juni, enligt de som brukar ha rätt.',
      'Meskel-torget får nya trappor inför september-festen.',
    ],
  },
  nairobi: {
    namn: 'The Savannah Daily',
    devis: 'Independent, morning, Nairobi - since 1958',
    grundad: 1958,
    artiklar: [
      {
        rubrik: 'Lejonen i nationalparken fick ungar - tre stycken',
        text:
          'Parkvakterna i Nairobi National Park bekräftar att en av parkens lejonhonor fött tre ungar, som setts vid ett vattenhål med stadens skyskrapor som bakgrund. Parken är världens enda nationalpark inom en huvudstads gränser och ungarna är därmed de enda lejonungar som växer upp med utsikt över ett kontorshus. Besökare uppmanas hålla avstånd. Ungarna uppges hålla avstånd tillbaka.',
      },
      {
        rubrik: 'Matatuförarna strejkar på måndag',
        text:
          'Förarna av stadens minibussar, matatus, har varslat om strejk på måndag i protest mot nya regler om ljudnivå. Reglerna förbjuder musik över 85 decibel ombord, vilket enligt förarna ”tar bort själva anledningen att åka matatu”. Passagerarna är delade: de som sitter fram vill ha tystare, de som sitter bak vill ha bas. Trafiken väntas bli sämre än vanligt, vilket är svårt.',
      },
      {
        rubrik: 'Giraffcenter: giraffen Daisy tog en telefon',
        text:
          'Giraffcentret i Langata rapporterar att en av dess Rothschild-giraffer, Daisy, tagit en mobiltelefon ur handen på en besökare som försökte ta en selfie. Telefonen återfanns, enligt personalen ”i gott skick men fuktig”. Centret påminner om att giraffernas tungor är en halvmeter långa och att man ska hålla telefonen med båda händerna. Daisy fortsätter att äta pellets.',
      },
    ],
    notiser: [
      'Järnvägen till Mombasa får en ny avgång klockan sju, med utsikt över parken.',
      'Ett kafé på Kimathi Street serverar te i samma kanna sedan 1970-talet.',
      'Karen Blixens hus har fått en ny grind, i samma trä.',
      'Elefantbarnhemmet i Langata tar emot en föräldralös elefant som redan fått namn.',
      'Regnet i mars kom på tisdag, vilket är i tid.',
    ],
  },
  mexikocity: {
    namn: 'El Diario del Zócalo',
    devis: 'Periódico independiente de la capital desde 1917',
    grundad: 1917,
    artiklar: [
      {
        rubrik: 'Templo Mayor: ny utgrävning under ett parkeringshus',
        text:
          'Arkeologerna vid Templo Mayor har inlett en ny utgrävning under ett parkeringshus intill katedralen, där en tunnelbyggare i fjol stötte på en ormhuvudskulptur i sten. Föremålen tillhör aztekernas huvudtempel som spanjorerna rev 1521. Parkeringshusets ägare har fått nej på sin begäran om att få behålla två platser. Staden fortsätter att sjunka, arkeologerna att gräva.',
      },
      {
        rubrik: 'Luften sämst sedan i vintras - bilarna stannar',
        text:
          'Miljömyndigheten utlyste luftlarm på måndagen och stoppade hälften av stadens bilar enligt nummerplåtens sista siffra. Metrons vagnar var fullare än vanligt och taco-stånden utanför stationerna rapporterar rekordförsäljning. Vulkanen Popocatépetl, som syns på bra dagar, syntes inte. Regn väntas på onsdag, vilket är den enda lösningen någon tror på.',
      },
      {
        rubrik: 'Lucha libre: maskerad brottare vann med ett handslag',
        text:
          'På Arena México avgjordes i fredags en match där förloraren enligt reglerna måste ta av sig masken inför publiken, vilket är det värsta som kan hända en brottare. Segraren, som kallar sig El Tlacuache, vann med en teknik som juryn kallade ”ett handslag som gick över styr”. Förloraren visade sitt ansikte, som såg förvånat ut. Publiken ropade i tio minuter.',
      },
    ],
    notiser: [
      'Xochimilcos båtar får nya färger, valda av båtägarna själva.',
      'Frida Kahlos hus i Coyoacán inför tidsbokning för det blå.',
      'Metro linje 12 lovar att gå hela vägen i år.',
      'Ett tacostånd i Roma har enligt en räkning sålt en miljon tacos al pastor.',
    ],
  },
  tokyo: {
    namn: 'Edo Shimpo',
    devis: 'Oberoende morgontidning för huvudstaden sedan 1911',
    grundad: 1911,
    artiklar: [
      {
        rubrik: 'Skytree får ny utsiktsvåning - kön går i spiral',
        text:
          'Tokyos 634 meter höga sändartorn öppnar en ny utsiktsgång på 450 meters höjd, med glasgolv och en kö som organiserats i en spiral så att den upptar mindre yta. Biljetterna säljs per tidslucka på tio minuter och besökare får ett kort med en teckning av tornet. Fuji syntes på öppningsdagen, vilket tornet tar åt sig äran för. Hissen tar femtio sekunder.',
      },
      {
        rubrik: 'Körsbärsblomningen väntas tidigt - kalender uppdaterad',
        text:
          'Meteorologiska byrån har flyttat fram prognosen för körsbärsblomningen i Tokyo med fem dagar, till slutet av mars. Ueno-parken förbereder sina blå presenningar, och företag skickar redan sina yngsta anställda att sitta och hålla platser under träden från klockan sex. Byrån följer ett enskilt träd i Yasukuni-helgedomen som officiell mätare. Trädet har inte kommenterat.',
      },
      {
        rubrik: 'Shinkansen tre minuter sen: bolaget ber om ursäkt',
        text:
          'Ett snabbtåg från Osaka anlände till Tokyo tre minuter efter tidtabell på torsdagen på grund av en fågel i en kontaktledning, vilket fick bolaget att utfärda en skriftlig ursäkt och intyg till pendlarna. Under fjolåret var den genomsnittliga förseningen tjugofyra sekunder. Bolaget ser över fågeln. Passagerarna fick sina intyg i en kö som tog längre tid än förseningen.',
      },
    ],
    notiser: [
      'Shibuya-korsningen passerades av 3 000 personer på ett grönt ljus, enligt en räkning.',
      'Tsukijis yttre marknad säljer tonfisk till ett pris som redaktionen inte får plats med.',
      'Katt-kaféet i Ikebukuro har tagit in en till katt, den tjugoförsta.',
      'Kapselhotellen i Shinjuku får bredare kapslar, tre centimeter.',
      'Automaten på Shimbashi station säljer nu varm majssoppa igen inför hösten.',
    ],
  },
  seoul: {
    namn: 'Hangang Ilbo',
    devis: 'Oberoende dagstidning för Seoul och Han-floden',
    grundad: 1946,
    artiklar: [
      {
        rubrik: 'Gyeongbokgung nattöppet - hanbok gratis',
        text:
          'Det stora Joseon-palatset håller nattöppet under helgen med lyktor i alla gångar, och besökare som kommer i hanbok slipper betala inträde. Uthyrningsbutikerna vid porten har lagt om till skift. Vaktbytet vid Gwanghwamun hålls som vanligt, men i mörker och med facklor. Palatset ber besökare att inte springa i trappan till tronsalen, som är från 1395 i andan.',
      },
      {
        rubrik: 'Kimchi-säsongen igång - kål slut i Mapo',
        text:
          'Kimjang, den stora höstliga kimchi-inläggningen, har inletts och tre livsmedelsbutiker i Mapo rapporterar att kinakålen tagit slut redan på förmiddagen. Familjer samlas på balkonger och innergårdar för att gnugga chilipasta i kålblad under en helg. Koreanska kylskåpstillverkare rapporterar rekordförsäljning av kimchikylar. Stadens badhus har fler händer som svider än vanligt.',
      },
      {
        rubrik: 'Bäcken under motorvägen har fått fisk - och besökare',
        text:
          'Cheonggyecheon, bäcken som grävdes fram mitt i staden när en motorväg revs, har enligt miljökontoret nu tjugofem fiskarter, upp från noll. Besökarna är fler än fiskarna: på en söndag räknades femtio tusen personer längs de sex kilometrarna. Ett nytt kafé vid bäcken serverar kaffe i koppar med bäcken på. Motorvägen saknas av ingen.',
      },
    ],
    notiser: [
      'Tunnelbanans linje 2 har fått nya sittplatser i värme, vilket vintern kräver.',
      'Namdaemun-marknaden håller öppet till klockan fyra på natten, som förut.',
      'Ett karaokerum i Hongdae har infört tystare mikrofoner efter klagomål från ett annat karaokerum.',
      'Han-flodens cykelbana får en extra fil för dem som stannar och tar bilder.',
    ],
  },
  peking: {
    namn: 'Jingcheng Ribao',
    devis: 'Huvudstadens dagblad - oberoende och punktligt',
    grundad: 1949,
    artiklar: [
      {
        rubrik: 'Förbjudna staden begränsar besökarna - till 80 000',
        text:
          'Palatsmuseet inför ett tak på 80 000 besökare per dag, vilket enligt förvaltningen är ”det antal som får plats i gårdarna utan att de blir en gård”. Biljetter måste bokas i förväg och kön vid Meridianporten har fått ett tak mot solen. Palatset har 9 999 rum enligt legenden och betydligt färre enligt en räkning. Kejsarna hade färre besökare.',
      },
      {
        rubrik: 'Smoglarm på tisdag - munskydd i tunnelbanan',
        text:
          'Miljömyndigheten utfärdade rött larm för luftföroreningar under tisdagen, vilket stängde skolor och halverade biltrafiken. Tunnelbanan gick fullare än vanligt och munskydden tog slut på apoteken i Chaoyang. Från Jingshan-kullen syntes Förbjudna staden som en suddig fyrkant. Vinden från norr väntas på torsdag och kallas av alla för ”räddningen”.',
      },
      {
        rubrik: 'Pekinganka: restaurang firar 160 år med samma ugn',
        text:
          'En av stadens äldsta ankrestauranger firar 160 år och meddelar att den fortfarande använder samma typ av vedeldad ugn som vid starten, med ved av fruktträd. Ankan skärs i 108 skivor enligt tradition, vilket en kock uppger att han klarar på fyra minuter. Kön på jubileumsdagen sträckte sig till Qianmen-gatan. Pannkakorna tog slut före ankan.',
      },
    ],
    notiser: [
      'Kinesiska muren vid Mutianyu får en ny kabinbana och en rutschkana, som förut.',
      'Hutongerna kring Trumtornet får nya cykelparkeringar för cykeltaxi.',
      'Himmelska fridens torg har fått nytt gräs i en av blomsterrabatterna.',
      'Sommarpalatsets marmorbåt har fortfarande inte lämnat kajen.',
      'Tunnelbanans linje 1 firar sextio år med samma intervall.',
    ],
  },
  sydney: {
    namn: 'The Harbour Herald',
    devis: 'Independent since 1831 - first with the ferry times',
    grundad: 1831,
    artiklar: [
      {
        rubrik: 'Operahuset fyller år - gratis konsert på trappan',
        text:
          'Operahuset firar sin födelsedag med en gratiskonsert på den stora trappan, där symfoniorkestern spelar för alla som får plats mellan taken och kajen. Trappan rymmer enligt arrangörerna 6 000 personer och enligt polisen färre. Kakelplattorna på taken, som är över en miljon, har putsats inför dagen. Måsarna vid Circular Quay väntas bidra.',
      },
      {
        rubrik: 'Hajvarning vid Bondi - surfarna i vattnet ändå',
        text:
          'Strandvakterna vid Bondi hissade hajflaggan på lördagsmorgonen efter att en helikopter siktat en haj hundra meter utanför surfzonen. Badgästerna gick upp ur vattnet, medan surfarna enligt vittnen ”funderade”. Hajen försvann söderut efter en halvtimme. Strandvakterna påpekar att flaggan gäller alla, även de med bräda.',
      },
      {
        rubrik: 'Färjan till Manly: delfiner försenade avgången',
        text:
          'Manlyfärjan avgick tio minuter sent från Circular Quay på söndagen efter att en flock delfiner simmat framför fören vid Bradleys Head. Kaptenen saktade ner enligt reglerna och passagerarna rusade till styrbord, vilket enligt kaptenen inte påverkade båten men gav bra bilder. Delfinerna fortsatte ut mot Heads. Färjebolaget bad inte om ursäkt.',
      },
    ],
    notiser: [
      'Harbour Bridge-klättringen får nya selar, i samma grå.',
      'En kakadua i Botaniska trädgården har lärt sig säga ”ferry”.',
      'Kaffet i Surry Hills är nu dyrare än i Melbourne, vilket Melbourne bestrider.',
      'Bondi till Coogee-promenaden får nya räcken för dem som stannar för utsikten.',
      'Pajen på fotbollsstadion har bytt recept och fansen bytt tillbaka.',
    ],
  },
  melbourne: {
    namn: 'The Yarra Tribune',
    devis: 'Independent since 1854 - four seasons, one edition',
    grundad: 1854,
    artiklar: [
      {
        rubrik: 'Spårvagnarna gratis i centrum - och fulla',
        text:
          'Den avgiftsfria spårvagnszonen i innerstaden har fått fler resenärer än vagnarna klarar, och trafikbolaget har satt in extra vagnar på linje 96. Turister som åker den gamla trävagnen City Circle får ofta stå, vilket bolaget kallar ”en autentisk upplevelse”. Utanför zonen kostar resan som förut, vilket många upptäcker vid Fitzroy. Spårvagnsklockorna ringer som vanligt.',
      },
      {
        rubrik: 'Flinders Street får ny klocka - de andra går rätt',
        text:
          'Stationen har fått en ny klocka på fasaden efter att en av de tretton klockorna över huvudingången stannat i februari. Klockorna visar avgångstider för varje linje och har varit mötesplats för Melbourneborna sedan 1910; ”under klockorna” är fortfarande stadens mest använda adress. Renoveringen av kupolen fortsätter. Färgen är fortsatt gul.',
      },
      {
        rubrik: 'Fyra årstider på en eftermiddag - rekord',
        text:
          'Meteorologerna registrerade i tisdags sol, hagel, regn och sol igen mellan klockan ett och fem, vilket är det snabbaste omslaget hittills i år. Stadens kaféer rapporterar att kunderna flyttade in och ut fyra gånger. En flat white i Degraves Street kostade lika mycket i alla väder. Tribune påminner om att alltid ha en jacka, ett paraply och solkräm.',
      },
    ],
    notiser: [
      'Hosier Lanes väggmålningar har målats över med nya väggmålningar.',
      'Queen Victoria Market håller nattöppet på onsdagar under sommaren, med dumplings.',
      'Pingvinerna vid St Kilda-piren har blivit fler och fotograferna också.',
      'Kricketstadion MCG har fått nytt gräs inför en match som redan är utsåld.',
    ],
  },
  auckland: {
    namn: 'The Waitematā Gazette',
    devis: 'Independent since 1863 - between two harbours',
    grundad: 1863,
    artiklar: [
      {
        rubrik: 'Bungeehoppen från Sky Tower fortsätter - repet klart',
        text:
          'Efter en säkerhetsöversyn får hoppen från 192 meters höjd på Sky Tower fortsätta, med nytt rep och samma utsikt. Tornet är Södra halvklotets högsta fristående byggnad och hoppet går i en styrd vajer, så att man inte studsar in i tornet, vilket besökare från Sverige brukar fråga om. Restaurangen på 190 meter roterar ett varv i timmen. Hoppen tar elva sekunder.',
      },
      {
        rubrik: 'Färjorna till Waiheke förlängs - vinet räcker',
        text:
          'Färjebolaget lägger till kvällsturer till ön Waiheke under sommaren, så att besökare hinner med både vingårdarna och stranden vid Oneroa. Öborna ser gärna att de sista turerna är tysta, vilket bolaget inte kan lova. Överfarten tar fyrtio minuter och passerar Rangitoto, vulkanön som steg ur havet för 600 år sedan. Vulkanen är enligt geologerna ”klar”.',
      },
      {
        rubrik: 'Fårräkningen klar: fler får än folk, fortfarande',
        text:
          'Den nationella statistiken bekräftar att landet fortsatt har fler får än människor, med ungefär fem får per invånare, vilket är färre än på 1980-talet då siffran var tjugo. Aucklandborna, som sällan ser ett får, tar nyheten med ro. En bonde i Waikato säger att fåren ”inte räknar oss”. Ullpriset är oförändrat.',
      },
    ],
    notiser: [
      'Hamnbron får en cykelbana, tio år efter första förslaget.',
      'Segelbåtarna i Viaduct Harbour har räknats till fler än parkeringsplatserna.',
      'Mount Eden-kratern är fortfarande stängd för beträdande, men öppen för utsikt.',
      'Regnet i helgen kom sidledes, vilket kallas ”normalt för Auckland”.',
      'Ett kafé i Ponsonby serverar flat white i en kopp gjord av kaffesump.',
    ],
  },
  buenosaires: {
    namn: 'El Diario del Plata',
    devis: 'Periódico independiente de la mañana desde 1884',
    grundad: 1884,
    artiklar: [
      {
        rubrik: 'Tangofestivalen fyller La Boca - gatan är golv',
        text:
          'Stadens tangofestival har intagit La Boca, där den färgglada gatan Caminito blivit dansgolv från förmiddag till midnatt. Dansare i alla åldrar bjuder upp turister som inte kan stegen, vilket enligt arrangörerna ”är själva idén”. Bandoneonspelarna har fått extra pauser i värmen. Fotbollsstadion La Bombonera ligger ett kvarter bort och är, ovanligt nog, tyst.',
      },
      {
        rubrik: 'Fotbollsderbyt på söndag utsålt - staden håller andan',
        text:
          'Söndagens match mellan stadens två stora klubbar är utsåld sedan en vecka, och polisen förbereder sig på en dag då ”ingenting annat händer”. Kaféerna längs Avenida Corrientes ställer ut extra tv-apparater, och bagerierna bakar medialunas i klubbfärger. Bortalagets fans får som vanligt inte komma. Resultatet väntas diskuteras i en vecka, oavsett resultat.',
      },
      {
        rubrik: 'Bokhandeln i teatern firar: fler böcker än stolar',
        text:
          'Bokhandeln i den gamla teatern på Avenida Santa Fe, som behållit loger, takmålning och ridå, rapporterar att den nu har fler boktitlar än teatern någonsin hade stolar. Kaféet på scenen serverar cortado till läsare som sitter i logerna med böcker de inte betalat för än. Personalen säger att alla brukar betala till slut. Ridån går inte ner.',
      },
    ],
    notiser: [
      'Recoleta-kyrkogårdens katter har fått en ny vaktmästare, som de ignorerar.',
      'Ett grillställe i Palermo serverar en asado i tre timmar, minimum.',
      'Tunnelbanans linje A har bytt ut de gamla trävagnarna, som saknas av alla.',
      'Obelisken på 9 de Julio har fått nytt ljus, i vitt.',
      'Priset på ett paket mate steg på tisdagen och sjönk på onsdagen, vilket är normalt.',
    ],
  },
  belgrad: {
    namn: 'Beogradski List',
    devis: 'Vid flodmötet sedan 1889',
    grundad: 1889,
    artiklar: [
      {
        rubrik: 'Flotten fick nytt förtöjningstillstånd efter tre år',
        text:
          'Klubbflotten vid Sava har fått sitt förtöjningstillstånd förnyat, tre år efter att det gick ut. Hamnkontoret uppger att handläggningen försenats av att ingen kunde enas om vilken myndighet som ansvarar för saker som flyter. Flotten har hållit öppet under hela perioden. Ägaren säger att musiken inte kommer att sänkas.',
      },
      {
        rubrik: 'Spårvagn 2 gick fel väg runt fästningen',
        text:
          'Spårvagnslinje 2, som går i ring, körde på tisdagen ringen åt fel håll i drygt två timmar innan någon anmälde det. Passagerarna uppges ha kommit fram ändå, om än i omvänd ordning. Trafikledningen kallar händelsen ovanlig men inte unik.',
      },
      {
        rubrik: 'Kaféet på Skadarlija stänger klockan fyra - på eftermiddagen',
        text:
          'Ett kafé i bohemkvarteret har infört stängning klockan sexton, vilket väckt uppmärksamhet i ett kvarter där verksamheter i regel öppnar då. Ägaren förklarar att han vill hinna hem och äta middag med sin mor. Grannkrogarna har uttryckt förståelse och fördubblat sina egna öppettider.',
      },
    ],
    notiser: [
      'Fästningsparkens klocka går tolv minuter fel, i vilken riktning har inte fastställts.',
      'Kajen städas på lördag. Föreningen efterlyser folk med stövlar.',
      'Den försvunna katten från Dorćol har hittats i en färja. Färjan var förtöjd.',
      'Vinterns is på Donau har släppt. Flottarna bogseras tillbaka i tur och ordning.',
    ],
  },
  hudiksvall: {
    namn: 'Glada Hudikbladet',
    devis: 'Hälsinglands äldsta stad, sedan 1582',
    grundad: 1846,
    artiklar: [
      {
        rubrik: 'Möljens bodar målas om i exakt samma röda',
        text:
          'Kommunen har beslutat att sjöbodarna vid kanalen ska målas om i falu rödfärg av samma kulör som tidigare. Beslutet föregicks av en remissrunda där tre alternativa kulörer föreslogs och samtliga avstyrktes. Målningen börjar i maj, om vädret tillåter, vilket det sällan gör i maj.',
      },
      {
        rubrik: 'Skärgårdsbåten får en tur till på söndagar',
        text:
          'Trafiken ut mot Hornslandet utökas med en söndagstur från och med midsommar. Rederiet uppger att efterfrågan finns, särskilt bland dem som missat den befintliga turen. Turen går klockan halv elva och tar en och en halv timme, väder och passagerarantal tillåtande.',
      },
      {
        rubrik: 'Hälsingegård öppnar festvåningen två helger extra',
        text:
          'En av världsarvsgårdarna utanför staden håller öppet ytterligare två helger i sommar. Festvåningen, som ägaren beskriver som använd omkring fyra gånger på hundra år, visas mot avgift. Kaffe serveras i köket, där man däremot suttit varje dag.',
      },
    ],
    notiser: [
      'Torgets fontän är igång igen efter att en anka byggt bo i den.',
      'Linberedningens vänner söker någon som kan laga en bråka.',
      'Stadsbussen kör enligt tidtabell igen, sedan vägarbetet blev klart en vecka för tidigt.',
      'Iskiosken vid Möljen öppnar när isen gått, meddelar innehavaren utan att ange datum.',
    ],
  },
  brescia: {
    namn: 'Il Corriere Bresciano',
    devis: 'Fra le Alpi e il lago',
    grundad: 1873,
    artiklar: [
      {
        rubrik: 'Astronomiska uret gick två minuter fel i påsk',
        text:
          'Uret på Piazza della Loggia, i drift sedan 1546, visade under påskhelgen två minuter fel. Urmakaren som sköter verket förklarar att fukten spelar in och att två minuter på fem sekel får anses godtagbart. Stadens kommunfullmäktige har tackat honom.',
      },
      {
        rubrik: 'Veteranbilarna samlas på Viale Venezia',
        text:
          'Startplatsen för det klassiska landsvägsloppet fylls som vanligt av bilar äldre än sina förare. Arrangörerna påminner om att hastighetsbegränsningarna gäller även för dem som betalat startavgift. Kaféerna längs vägen öppnar klockan fem på morgonen.',
      },
      {
        rubrik: 'Franciacortaproducenterna eniga om skördetiden',
        text:
          'Vinodlarna väster om staden har enats om att skörden inleds tredje veckan i augusti. Beslutet fattades efter provsmakning av druvor från åtta gårdar, en process som enligt protokollet tog två dagar längre än planerat.',
      },
    ],
    notiser: [
      'Museets romerska golv är åter framme efter att glaset putsats.',
      'Marknaden på Piazza Rovetta flyttas en dag på grund av helgen.',
      'Vägen upp till Maddalena är avstängd för asfaltering. Vandringsleden är öppen.',
      'Bibliotekets kopia av stadsplanen från 1764 är utlånad. Till vem framgår inte.',
    ],
  },
  sansebastian: {
    namn: 'El Faro Donostiarra',
    devis: 'Entre la Concha y el monte',
    grundad: 1902,
    artiklar: [
      {
        rubrik: 'Pintxosbarerna enades om pinnpriset',
        text:
          'Barerna i gamla stan har kommit överens om ett gemensamt riktpris per pintxo, efter att gäster klagat på att räkningen varierat mellan gator. Överenskommelsen omfattar inte de barer som räknar med tandpetare, vilket är de flesta. Frågan tas upp igen efter sommaren.',
      },
      {
        rubrik: 'Rekordmånga i vattnet vid Zurriola',
        text:
          'Vågorna vid stadens surfstrand lockade i helgen fler än vad livräddarna kunde räkna. Strandvakten uppmanar till hänsyn mellan brädor och simmande, och påminner om att bukten intill är spegelblank för den som föredrar det.',
      },
      {
        rubrik: 'Bergbanan till Igueldo fyller år, vagnarna får ny lack',
        text:
          'Banan från 1912 rustas i vinter. Vagnarna behåller sin form och sitt tempo, som bolaget beskriver som lugnt med avsikt. Utsikten uppges vara oförändrad.',
      },
    ],
    notiser: [
      'Ön i bukten har fått ny brygga. Färjan går varje halvtimme.',
      'Filmfestivalens biljettkassa öppnar i september, kön börjar i augusti.',
      'Stadens äldsta kafé har bytt kaffesort. Stamgästerna har noterat det.',
      'Nästa högvatten sammanfaller med lunchen. Promenaden längs muren avråds.',
    ],
  },
  oaxaca: {
    namn: 'El Zócalo de Oaxaca',
    devis: 'Siete moles, una ciudad',
    grundad: 1912,
    artiklar: [
      {
        rubrik: 'Marknaden vid Zócalo utökar med tre stånd',
        text:
          'Efter två års väntan har marknaden fått tillstånd att öppna tre nya stånd, samtliga för chili. Förvaltningen uppger att ansökningarna om mole avslogs eftersom antalet grytor redan anses tillräckligt. Beslutet överklagas.',
      },
      {
        rubrik: 'Mezcalproducenterna vill ha egen märkning',
        text:
          'Destillerierna i dalen kräver en märkning som skiljer jordugnsrostad agave från industriell produktion. Branschorganisationen stöder förslaget men varnar för att en ny etikett kräver en ny myndighet, och att myndigheten kräver en ny etikett.',
      },
      {
        rubrik: 'Väverierna i Teotitlán färgar med kochenill igen',
        text:
          'Efterfrågan på naturfärgade mattor har fått flera väverier att återgå till kochenill, sköldlusen som ger rött. En vävare uppger att kunderna frågar efter färgen men sällan efter insekten.',
      },
    ],
    notiser: [
      'Kyrkogårdens grindar hålls öppna till gryningen under allhelgonahelgen.',
      'Utgrävningen på berget söker frivilliga med tålamod och egen hatt.',
      'Regnet kom på eftermiddagen, som utlovat, och slutade lika punktligt.',
      'Bussen till Hierve el Agua går igen, sedan vägen skrapats efter regnet.',
    ],
  },
  alicante: {
    namn: 'El Faro de Alacant',
    devis: 'Entre el castillo y el mar',
    grundad: 1898,
    artiklar: [
      {
        rubrik: 'Marmorplattorna på Explanaden läggs om efter vinterns regn',
        text:
          'Sextio kvadratmeter av vågmönstret har satt sig och ska tas upp och läggas om. Arbetet görs för hand, eftersom plattorna är av tre färger och ordningen inte får kastas om. Staden räknar med tre veckor och ber promenerande hålla till höger.',
      },
      {
        rubrik: 'Färjan till Tabarca får en extratur i juli',
        text:
          'Rederiet sätter in en fjärde avgång på eftermiddagen. Ön är marint reservat sedan 1986, och besökarna påminns om att fisket runt den är reglerat och att flaskor tas med hem igen.',
      },
      {
        rubrik: 'Årets benådade figur flyttas till museet',
        text:
          'Efter omröstning fick en av årets hogueras stå kvar när resten brann på Johannesnatten. Figuren bärs nu till museet, där den ställs bland de tidigare benådade. En besökare påpekade att samlingen börjar bli trång.',
      },
    ],
    notiser: [
      'Hissen upp i berget till borgen står stilla mellan ett och tre.',
      'Turrónbagarna i Jijona öppnar för säsongen i nästa vecka.',
      'Vattnet i hamnen håller nitton grader, vilket anses svalt.',
      'Palmerna i Elche beskärs, och gatorna under dem stängs av.',
    ],
  },
  montgomery: {
    namn: 'The Dexter Avenue Herald',
    devis: 'One block from the Capitol',
    grundad: 1889,
    artiklar: [
      {
        rubrik: 'Bussmuseets originalskylt tas ner för konservering',
        text:
          'Skylten som delade bussen i två delar har börjat vittra och skickas till konservator. Museet visar under tiden en kopia, med en lapp om att originalet är på lagning. Personalen uppger att besökare oftast stannar längst framför just den skylten.',
      },
      {
        rubrik: 'Minnesmärket på kullen tar emot fler besökare än väntat',
        text:
          'Sedan öppnandet 2018 har antalet besökare stigit varje år. Stiftelsen bakom platsen uppger att de flesta kommer från andra delstater, och att uppgiften att hitta sitt eget läns pelare tar längre tid än folk räknar med.',
      },
      {
        rubrik: 'Floden står högt efter tre dygns regn',
        text:
          'Alabamafloden ligger över normalvattenstånd och bryggan vid Riverwalk är avspärrad. Kommunen bedömer att nivån sjunker under veckan. Ingen bebyggelse hotas.',
      },
    ],
    notiser: [
      'Gudstjänsten på Dexter Avenue börjar en halvtimme senare i sommar.',
      'Kapitoliets trappa är avstängd för stenarbete till fredag.',
      'Countrykvällen på Commerce Street flyttar inomhus vid åska.',
      'Blomsterläggningen vid Hank Williams grav sker på söndag.',
    ],
  },
  visby: {
    namn: 'Innanför Muren',
    devis: 'Tjugosju marktorn och en domkyrka',
    grundad: 1873,
    artiklar: [
      {
        rubrik: 'Ringmurens torn nummer nitton får nytt tak',
        text:
          'Kalkbruket ska blandas på plats efter gammalt recept, vilket enligt länsstyrelsen är enda sättet att få det att sitta. Arbetet beräknas ta hela sommaren och stängslet står kvar hela tiden. Guiderna leder om sina turer.',
      },
      {
        rubrik: 'Färjan sätter in extratur inför medeltidsveckan',
        text:
          'Rederiet lägger till en avgång från Nynäshamn på fredagen. Biljetterna för fordon är redan slut, och resenärer utan bil uppmanas komma i god tid till terminalen.',
      },
      {
        rubrik: 'Fler ansöker om att gräva än det finns skäl att gräva',
        text:
          'Sedan silverskatten hittades 1999 kommer ansökningar varje vår från privatpersoner med metalldetektor. Länsstyrelsen påminner om att fornfynd tillhör staten och att sökning kräver tillstånd.',
      },
    ],
    notiser: [
      'Domkyrkans klockspel provas klockan nio och kan höras i hela staden.',
      'Salmbären är sena i år och sylten räcker inte till alla kaféer.',
      'Bilar hänvisas till parkeringen utanför Österport under veckan.',
      'Turerna till Lilla Karlsö ställs in vid mer än åtta sekundmeter.',
    ],
  },
  kingston: {
    namn: 'The Harbour Gleaner',
    devis: 'From the mountains to the sea',
    grundad: 1834,
    artiklar: [
      {
        rubrik: 'Kaffeskörden i Blue Mountains börjar två veckor sent',
        text:
          'Regnet kom sent och bären mognade långsammare än vanligt. Odlarna uppger att kvaliteten inte påverkas men att plockningen blir kortare och mer intensiv. Priset sätts först när skörden vägts in.',
      },
      {
        rubrik: 'Ljudsystemet på Hope Road får nytt tillstånd',
        text:
          'Tillståndet gäller till klockan två på natten, en timme längre än förra året. Grannföreningen har begärt att basen vänds bort från bostadskvarteret, vilket arrangören gått med på.',
      },
      {
        rubrik: 'Utgrävningarna vid Port Royal fortsätter under vattnet',
        text:
          'Delar av staden som sjönk 1692 ligger kvar på botten och kartläggs år för år. Dykarna arbetar i grumligt vatten och rapporterar att husgrunderna står kvar i ursprungliga kvarter.',
      },
    ],
    notiser: [
      'Glasskön vid Devon House är kortast före elva på förmiddagen.',
      'Färjan över hamnen till Port Royal går varje hel timme.',
      'Vandringen upp till Blue Mountain Peak startar klockan två på natten.',
      'Marknaden håller stängt på söndag och öppnar tidigt på måndag.',
    ],
  },
  chicago: {
    namn: 'The Loop Ledger',
    devis: 'Built twice, and higher the second time',
    grundad: 1871,
    artiklar: [
      {
        rubrik: 'Broarna över floden öppnas för seglen i morgon bitti',
        text:
          'Vårens första broöppningar börjar klockan åtta och rullar uppströms bro för bro. Biltrafiken i Loopen påverkas i två timmar. Staden påminner om att båtarna har företräde och att tidtabellen finns anslagen vid varje bro.',
      },
      {
        rubrik: 'Blåsten på Lake Shore Drive stänger cykelbanan',
        text:
          'Vågorna slår över kajkanten och spolar grus på banan. Avstängningen gäller tills vinden vänder. Cyklister hänvisas till gatorna innanför, där hastigheten är sänkt.',
      },
      {
        rubrik: 'Bönan poleras inför säsongen',
        text:
          'Cloud Gate tvättas två gånger om året och poleras en gång. Fingeravtryck på undersidan tas bort med samma medel som används på köksbänkar, uppger parkförvaltningen, som avråder från att pröva hemma.',
      },
    ],
    notiser: [
      'Tunnelbanan i Loopen går långsammare i kurvorna vid Wabash.',
      'Floden färgas grön på lördag och färgen är borta på söndag.',
      'Deep dish tar en halvtimme i ugnen, uppger restaurangerna trött.',
      'Glasboxarna på Willis Tower stängs vid åska i området.',
    ],
  },
};

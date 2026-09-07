# Att göra

Det som återstår ur granskningen den 7 september 2026, sedan buggarna,
faktafelen och innehållsarbetet gjorts. Rangordnat inom varje avsnitt
efter värde för spelaren i förhållande till arbetsinsats. Funktioner nämns
vid namn i stället för radnummer, för radnumren flyttar sig.

## Spelidéer

- **Hemlängtan.** En mätare som stiger per dag borta, sjunker vid samtal hem
  utan lån (`callsHome` räknas redan) och vid ett tak tvingar hem. Ger
  tempobonusen ett ansikte, telefonen en roll utöver lån, och är det som
  saknas mest från Backpacker 2. Ett fält i `GameState`, en rad i
  statusraden, ett villkor i `canFinish`.
- **Startkapital efter hemstaden.** 4 000 respektive 6 000 oavsett var man
  föds, fast New York kostar 279 kr natten och Bangkok 72. Skala efter
  `costIndex`, till exempel tjugo nätters boende. `createGame` i `state.ts`.
- **Biljettpris och restid på uppdragskortet**, och belopp som följer
  avståndet. I dag är 2 400 kr för en kaktus till Sydney ett dåligt avtal
  spelaren inte kan se. `lottaUppdrag` har `cheapestRoute` i handen.
- **Löpande effekt av stadsbetyget**, till exempel +0,4 % lön per betygspoäng
  i staden (`wagePerCorrect`), eller billigare boende över 80. I dag är
  provet en förlorad dag för alla som inte siktar på löneklass 3.
- **Certifikat som betyder något**: +10 % lön i ämnets jobb, eller slopat
  betygskrav för klass 3 i den kategorin (`jobRequirement`, `finishQuiz`).
- **Gemensamt resfrö för bröderna.** `pseudoRandom` finns i `rules.ts` men
  `shuffle` och händelserna använder `Math.random`. Samma hemstad, samma
  frågedragning och samma händelser, delat via caféets nummer, ger den
  tävling README lovar.
- **Poängställning i caféet**, inte bara stad och stämplar
  (`game/internetcafe.ts`). En rad i dagboken.
- **Handlarens rykten i en anteckningsbok.** `handlarRykte` har rätt två
  gånger av tre men ingenting minns vad man hört.
- **Panker sist i resedagboken** (`saveHighscore`). En konkurs efter tre
  städer kan i dag rankas över en fullbordad resa.
- **Fler frågor på Turist-nivån.** Många jobb har 9–11 lätta frågor för
  5–7 skiftdagar, så andra skiftet på samma jobb repeterar 30–70 %.
  Kontrollera med `npm run validate` efter påfyllning.
- **Museivärdens och konstguidens gåtfrågor** om samma verk är nästan
  identiska tvärs över jobben. Skriv om den ena poolen med andra verk.

## Prestanda och gränssnitt

- **Koddelning.** Bundlen är 1,86 MB JavaScript, varav nästan allt är data
  som startskärmen inte behöver. `manualChunks` i `vite.config.ts` plus
  `await import()` i `start()` ger 1–2 s snabbare första start på 4G. Kräver
  att service workern förhämtar chunklistan ur `dist/.vite/manifest.json`,
  annars får en gammal flik 404 efter deploy. Billigare delvinst: gör
  `quizImages.ts` och `worldMap.ts` till JSON som hämtas vid behov.
- **Stadsfoton till webp.** 19 MB jpg i `public/cities`; webp på
  kvalitet 75 ger 60–90 kB styck. Förhämta målstadens foto när resefilmen
  börjar (`doTravel`).
- **Mynten.** Träffytan är 40 px, under 44. Glansanimationen
  (`myntglans` i CSS) repaintar varje bildruta på 9–13 mynt; byt till en
  `transform`-animerad remsa eller stäng av under 700 px.
- **Statusraden på 360 px** radbryter till tre rader. Dölj Skuld när den är
  noll och ta bort `backdrop-filter` under 700 px.
- **Speltestets friktion**: provresultatet står längst ner under
  broschyren; tidningen är tolv skärmar och platsannonserna börjar
  halvvägs; låsta jobb kunde sorteras efter de öppna; kartan rullar i
  sidled utan ledtråd och prickarna är 3,5 px; etiketter överlappar på
  kartan och globen; figuren på globen går till fots även på flyg;
  resefilmen är över på två sekunder; brickor kan hamna bakom väderraden;
  butiken sätter FYND-stämpel på en vara som säljs med förlust.
- **Död CSS.** Ett trettiotal klasser utan träff i koden, bland dem hela
  gamla kartan (`.worldmap`, `.graticule`, `.route-*`), `.city-hero`
  definierad fyra gånger och `prefers-reduced-motion`-blocket två gånger.
- **Dela upp `app.ts`** (6 200 rader), i ordningen ryggsäck och pass, start
  och dagbok, Vart är vi på väg, butik, telefon, tidning, och sist
  quiz-familjen. Följ `station.ts`-mönstret med `opts` och `{ node, stop }`.
  Flytta först hjälparna utan `this`-beroenden till `ui/helpers.ts`.

## Kod och robusthet

- **Slå på `noUncheckedIndexedAccess`** och byt de `!` som faktiskt kan
  smälla mot guards.
- **Komplettera `validate-data.mjs`**: löneklass 2 och 3 per stad (19 städer
  saknar klass 3), ledtrådar per stad, `effect.souvenir` på händelser utan
  val, kontaktannonsernas effekter, `peka`- och `avgor`-bilder mot
  manifestet. Ta bort de döda blocken för `sortering` och `traffa` och den
  dubbla bildval-kontrollen; `warnings` fylls aldrig.
- **Enhetstester med vitest**, mest värde först: `migrate` och `loadGame`,
  `prepareQuestion` med `cityQuizQuestions`, `finalScoreBreakdown`,
  `applyEffect` och `chooseEvent`, `availableRoutes`. Alla är DOM-fria.
- **Timerdrivna omritningar** tömmer fält mitt i användning: sökfältet i
  Vart är vi på väg och lånereglaget. Hoppa över omritning när ett fält har
  fokus.
- **`pagaende` sparar hela frågeobjekten**; spara index i stället.
- **Städa exporterna**: `STATUS_LABEL`, `travelMinutes`, `stationDestinations`,
  `makeDeparture`, `eventCity`, `jobRequirementText`, `LOAN_INTEREST`,
  `clearHighscores`, `CAFE_URL`, `localHour`, `dayPeriod`. `canFinish`
  hårdkodar 5 trots `MIN_CITIES_TO_FINISH`. `chooseEvent` saknar spärr mot
  att verkställas två gånger.
- **Caféet**: `las()` i `game/internetcafe.ts` validerar `foljer` men inte
  `cache`, och `folj` tappar äldsta numret utan att ta bort dess cachepost.

## Gjort

Granskningen den 7 september 2026 ledde till commits från `c8af92e` till
`492ca09`: poängen räknar bara städer man gjort något i, skärmbyten städar
efter sig, sparfilen släpper trasiga referenser, alla 57 städer har
ledtrådar, ett tjugotal faktafel, typsnittet i rubrikerna, kvittensen på
telefonen, rullbara överlägg, Globetrotterns påslag, caféets
hastighetsgräns, sjutton buggar ur avsnitt 2, service workerns tidsgräns
och nyversionsnotis, tangentbord i minispelen, kuriosa till 520 frågor,
nio myntfrågor, ledtrådarnas ton, rensade frågebanker, tidningens och
händelsernas språk, och en ny app-ikon.

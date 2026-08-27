# Ryggsäckaren

Ett webbaserat geografi- och frågesportspel på svenska, inspirerat av
_BackPacker 2_ (1997). Res jorden runt, ta jobb, svara på frågor, handla
souvenirer och kom hem igen med pengar kvar.

Spelet fungerar med både mus och touch, och är byggt för att spelas i
webbläsare på telefon såväl som dator.

## Kom igång

```bash
npm install
npm run dev        # utvecklingsserver, öppna adressen som skrivs ut
```

Dev-servern lyssnar på alla nätverksgränssnitt, så du kan öppna adressen
`http://<din-dators-ip>:5173` i telefonen så länge ni är på samma nätverk.

```bash
npm run build      # typkoll + datavalidering + produktionsbygge till dist/
npm run preview    # kör igenom det byggda resultatet lokalt
npm run validate   # kontrollera bara speldatan
npm run typecheck  # kontrollera bara typerna
```

Bygget i `dist/` är helt statiskt och använder relativa sökvägar, så det kan
läggas rakt upp på GitHub Pages, Netlify eller vilken statisk webbserver som
helst utan konfiguration.

## Spelet ligger uppe här

<https://martin4eel.github.io/ryggsackaren/>

### Publicera en uppdatering

Spelet publiceras från branchen `gh-pages`. När du ändrat något:

```bash
git add -A
git commit -m "Beskriv ändringen"
git push                # sparar källkoden på GitHub
npm run deploy          # bygger och publicerar till gh-pages
```

`npm run deploy` kör typkoll och datavalidering först. Hittas ett fel avbryts
allt innan något publiceras, så en trasig version kan inte nå spelarna. Den
nya versionen ligger ute efter ungefär en minut.

Pages är inställt på _Deploy from a branch_, branch `gh-pages`, mapp `/`
(root). Det behöver bara göras en gång och är redan gjort.

Vill du hellre ha automatisk publicering vid varje push kan du lägga tillbaka
ett GitHub Actions-arbetsflöde, men det kräver en token med `workflow`-scope.

### Om en uppdatering inte syns

Kontrollera att Pages fortfarande står på rätt källa. Om _Source_ har hamnat på
`GitHub Actions` väntar Pages på ett arbetsflöde som inte finns, och då byggs
`gh-pages` aldrig om även om branchen har nya filer:

**Settings → Pages → Build and deployment → Source** ska vara
`Deploy from a branch`, branch `gh-pages`, mapp `/ (root)`.

Kom också ihåg att spelet cachas av sin service worker. Ladda om sidan två
gånger, eller hårdladda, om du inte ser ändringen direkt.

### Alternativ: Netlify Drop, utan konto eller repo

```bash
npm run build
```

Dra sedan mappen `dist` till <https://app.netlify.com/drop> i webbläsaren. Du
får en permanent länk direkt. Nackdelen är att du måste dra dit mappen igen
varje gång du ändrat något.

### Alternativ: Bara samma wifi

```bash
npm run dev
```

Vite skriver ut en `Network:`-adress, till exempel
`http://192.168.1.42:5173`. Den kan öppnas i telefonen så länge alla är på
samma nätverk. Kräver att din dator är på och att kommandot körs.

## Spela på telefonen

Spelet är en installerbar webbapp. Öppnar dina bröder länken i telefonen kan de
lägga den på hemskärmen och köra den i helskärm utan adressfält:

- **iPhone, Safari:** Dela-knappen → _Lägg till på hemskärmen_
- **Android, Chrome:** menyn ⋮ → _Installera app_ eller _Lägg till på hemskärmen_

När spelet laddats en gång fungerar det även **offline**, tack vare en service
worker. Bra på tåget eller flyget. Varje spelare har sin egen sparfil i sin egen
webbläsare, så ni kan tävla om vem som får flest poäng på samma antal dagar.

## Så spelas det

Startskärmen frågar i tur och ordning: **vilket läge**, **vem du är** och
**var du är född**. Födelsestaden väljs på en snurrbar och zoombar jordglob
eller i en sökbar lista, och den valda staden visas med foto, sevärdhet,
valuta och prisnivå.

Startskärmen förklarar också spelloopen i fyra steg första gången någon öppnar
spelet. Därefter ligger förklaringen bakom knappen _Hur spelar man?_, så att
den inte tar en halv skärm varje gång. Flaggan sparas för sig själv i
webbläsaren och överlever att sparfilen raderas.

1. **Vem är du, och var är du född?** Namnet trycks i passet och följer med i
   resedagboken. Födelsestaden är där resan börjar, dit du ska ta dig tillbaka,
   och dess valuta är den du räknar i. Varje stad visas med ett foto av sin
   sevärdhet, som ett vykort högst upp på stadsskärmen.
2. **Välj svårighetsgrad.** Lägena delar mekanik, kartor och progression –
   det är kraven som skiljer. Allt som skiljer dem ligger samlat i
   `src/game/difficulty.ts`.

   | | Turist | Globetrotter |
   | --- | --- | --- |
   | Svarsalternativ | 3 | 4 |
   | Frågor | bara de lättare | hela banken |
   | Arkadmomentens marginal | 20 % mer | 8 % mindre |
   | Certifikat vid | 65 % | 75 % |
   | Startkapital | 6 000 | 4 000 |
   | Boende | 20 % billigare | fullpris, men högre lön |

   Det finns ingen livlina och ingen hjälp att få under en fråga. Turisten
   får lättare frågor och färre alternativ, inte färre chanser att tänka.
3. **Stadsbilden.** Valen sitter som skyltar på gatan, ovanpå stadens foto,
   som i förlagan: turistbyrån, tidningen, souvenirbutiken, ryggsäcken,
   kartan, telefonen – och stationerna.

   Resandet är uppdelat i **busstation, tågstation, hamn och flygplats**, och
   varje stad har bara de skyltar som faktiskt tar en någonstans. Alla har
   buss, trettiosex av fyrtiosju har järnväg, sju har färjeläge, och alla utom
   Köping har flygplats. Reykjavík har därför bara en flygplats, och från
   Köping får man ta tåget innan man kan flyga.

   **Första gången du kommer till en stad ligger alla brickor nedvända.** De
   ligger utspridda över stadsbilden som silvermynt och vaggar långsamt; du vet
   inte vilken som är flygplatsen och vilken som är något annat förrän du vänt
   på dem, en och en. Ett mynt har två sidor: vändningen snurrar det två och
   ett halvt varv och landar med baksidan upp – funktionens egen ikon på
   papper, eller en guldbricka med stjärna eller frågetecken – och ligger kvar
   en stund så att man hinner se vad man vände upp innan ikonen slår in i
   raden nedanför. Det gäller även hemstaden, så att en ny resa alltid börjar
   med en ren stadsbild. Ett uppvänt mynt lämnar fotot och lägger sig i
   **ikonraden under bilden**, där allt är lätt att hitta igen; de andra
   mynten ligger kvar där de låg, vart och ett i sin egen takt.

   Några av brickorna är inte funktioner alls. En av dem är en **fråga om
   staden** med stadens eget foto till, och resten är **mystikbrickor** som
   döljer en händelse. Hur många en stad har följer folkmängden: Cusco och
   Reykjavík har en, Stockholm två, Istanbul och Bangkok fyra. Båda sorterna
   finns bara en gång per stad.

   **Ut på stan** och **sevärdheten** går också bara att göra en gång per stad.
   De kostar en dag var och ger garanterat en händelse; när de är förbrukade
   ligger ikonen kvar med en grön bock.

   Ordningen på brickorna lottas per stad och ligger sedan fast. Med en fast
   ordning skulle man lära sig att första brickan alltid är turistbyrån, och då
   fanns det ingen upptäckt kvar att göra.

   **Vädret och tiden på dygnet** färgar fotot. Klockslaget är stadens lokala
   tid just nu – spelar du på kvällen hemma är det morgon i Tokyo – och
   årstiden följer resans startdatum, så en resa som börjar i december har
   vinter i Stockholm och sommar i Sydney. Regn faller, snö singlar, natten
   tonar blått och kvällen varmt. Inget av det påverkar spelet; det finns för
   att Bangkok i monsunregn en kväll och Bangkok i sol en morgon ska vara två
   olika bilder av samma stad. Kommer du tillbaka till en stad står det också
   vilket besök i ordningen det är och när du var här första gången.

   **Ryggsäcken** ligger inte bland skyltarna utan uppe till höger i
   statusraden, på varje skärm, med antalet souvenirer på sig.

   Raden under bilden berättar vad skylten man pekar på gör.
4. **Stationerna.** Bakom varje stationsskylt ligger en egen plats, inte en
   lista. Hallen ritas som en siluett ovanpå stadens foto – glasfasad och
   flygplan på flygplatsen, perrongtak och stationsklocka på järnvägsstationen,
   numrerade lägen vid bussterminalen, skrov och landgång i hamnen – och mitt i
   bilden hänger en **elektronisk avgångstavla**.

   Tavlan visar tid, destination, bolag och linjenummer, gate eller spår eller
   läge eller kaj, pris och status. Den lever medan man står och tittar:
   avgångar rullar bort och nya glider in underifrån, gater byts, turer blir
   försenade eller inställda, och en textremsa längst ner upprepar det
   högtalaren just sagt. Varje ändrad ruta vänder sig som ett fallblad.

   **Tiden på tavlan styr ingenting.** Klockslagen finns för att en station ska
   se ut som en station; en biljett går alltid att köpa, också till en tur som
   redan gått. Priset och restiden kommer däremot alltid ur reselogiken, så
   tavlan kan aldrig skylta med en förbindelse som inte går att boka.

   Tavlan visar **hela linjenätet** härifrån, inte ett urval, och har ett eget
   sökfält – på en storflygplats är det fyrtiofyra rader. En tur som gått
   försvinner inte, den skrivs om till nästa avgång samma dag, precis som
   flyget till Dubai går igen om ett par timmar. Hamnen är undantaget: färjor
   går ett par gånger om dygnet, så där står turlistan med i morgondagens
   avgångar utsatta.

   Trycker man på en rad fälls biljetten upp med avgång, restid, bolag,
   linjenummer, plats och pris, och därifrån genomförs resan som vanligt.

   Orden skiljer sig åt: *gate* på flygplatsen, *spår* på stationen, *läge* vid
   bussterminalen och *kaj* i hamnen. Det gör också anläggningen – Köping har
   en busstation, Stockholm en bussterminal.
5. **Turistbyrån.** Svara på frågor om staden, under en remsa av stadens foto
   – som i förlagan, där man aldrig svarade på en fråga utan att se var man
   stod. Arbetsplatserna har på samma sätt stadens foto bakom sig. Resultatet blir ett stadsbetyg
   (0–100) som avgör vilka jobb du får söka. Du kan göra om provet för att
   höja betyget, men varje besök kostar en dag.
6. **Frågornas former.** De flesta frågor är fyra alternativ att välja mellan,
   men inte alla.

   - **Bildfrågor.** Fyra riktiga fotografier i stället för fyra rader text:
     *"Gästerna vill se en gepard. Vilket av djuren är det?"* Namnen skrivs ut
     först när man svarat, och kuriosan förklarar hur man skiljer dem åt –
     geparden har tårränder och fläckar utan ringar, leoparden har rosetter.
     Fisken i nätet, kryddan i skålen, målningen på väggen och blomman i
     buketten fungerar likadant.
   - **Bilder till vanliga frågor.** Ett foto ovanför frågan när frågan handlar
     om något man kan se: djuret, byggnaden, frukten, konstverket. Städernas
     egna foton återanvänds, så en fråga om Brandenburger Tor visar samma bild
     som stadsskärmen i Berlin.
   - **Reglagefrågor.** Ett tal som dras fram på en skala med en OK-knapp
     under, i stället för alternativ att peka på. Liggande för årtal och
     avstånd, stående för höjd, djup och vikt – riktningen betyder det den
     brukar betyda. *"Vilket år föll Berlinmuren?"* har ingen lista att gissa
     ur; man vet ungefär, och drar dit. Varje fråga har en tolerans: ett årtal
     kräver ofta exakthet, medan höjden på ett berg får slinka igenom på
     åttio meter.

   **Alla bilder är riktiga fotografier** från Wikimedia Commons, aldrig
   teckningar. Hela poängen med en bildfråga är att känna igen något man sett
   i verkligheten, och då duger inte en illustration av en marulk – det ska
   vara en marulk.

   **Bilderna reagerar på svaret**, i Monty Python-anda. Svarar du rätt får
   motivet utklippta ögon och ett brett leende, gungar till och säger något i
   en pratbubbla – Mona Lisa ler på riktigt, Skriet skriker av glädje. Svarar
   du fel blir det en grimas med tungan ute, ett pruttljud, och den stora
   foten dunsar ner från himlen. Replikerna och var ansiktet ska sitta står
   per bild i `src/data/quizImages.ts` (`reaktion` och `ansikte`); bilder
   utan egna repliker får allmänna.
7. **Tidningen.** Dagens lokala rubrik står överst – *Tunnelbanan stänger
   Slussen ännu en helg*, *Monsunen väntas två veckor tidigt* – så att
   tidningen är stadens och inte spelets. Läs platsannonserna och ta ett skift. Varje fråga är en
   arbetsdag: rätt svar ger lön, och boendet dras oavsett. Frågorna är unika
   för varje yrke, så en bagare och en pizzabagare får aldrig samma frågor.
   Ett stämpelkort visar hur dagarna gått.
   - **Svarsserie.** Rätt svar på raken höjer lönemultiplikatorn upp till
     ×2. Ett felsvar nollställer den.
   - **Snabbhetsbonus.** Svarar du inom några sekunder får du ett påslag på
     dagslönen. Efter tolv sekunder ger den ingenting, så det lönar sig att
     kunna svaret, inte att chansa snabbt.
8. **Sista passet.** Varje skift avslutas med ett av åtta arkadmoment:
   sortera på löpande band, utföra order i rätt följd, upprepa en sekvens ur
   minnet, stoppa en mätare i rätt zon, räkna växel i huvudet, plocka rätt
   saker och låta resten vara, hålla balansen eller slå i takt. Det ger upp
   till tre dagslöner i bonus, och ett felfritt moment ett halvt dagsverke
   till. Klarar du 70 procent av skiftet totalt får du ett **certifikat**,
   som öppnar bättre betalda jobb i samma ämne i alla städer.
9. **Souvenirbutiken.** Köp där varan tillverkas och sälj där den är
   eftertraktad. Priserna varierar med region, prisnivå och dag.
10. **Kartan.** En egen skylt på gatan, och en atlas snarare än ett reglage.
   Hela världen på en gång, utan zoom och utan panorering: rutten du rest
   dragen som en linje mellan städerna i besöksordning, en pulserande ring där
   du står, ring runt hemstaden och prickar för allt du ännu inte sett.

   Under kartan står det man annars skulle ha slagit upp: folkmängd,
   koordinater, tidszon, sevärdhet och prisnivå för staden, och huvudstad,
   folkmängd, språk, religion och valuta för landet. Står du i huvudstaden
   syns det på en stämpel. Att Australiens huvudstad varken är Sydney eller
   Melbourne är den sortens sak spelet gärna får lära ut mellan skiften.

   Vilka färdsätt som finns beror på geografin, inte på en fast mall: buss och
   tåg kräver landförbindelse, färja kräver en linje och flyget når allt över
   35 mil. Avståndstaken ligger vid 340 respektive 440 mil, vilket rymmer de
   riktigt långa landresorna – bussen Kairo–Addis, tåget Peking–Hanoi, Amtrak
   tvärs över USA. Bara fyra städer nås enbart med flyg, och tre av dem är öar. Söker du på tavlan efter en stad som inte går att nå därifrån får du
   skälet utskrivet i stället för ett tomt resultat.

   När biljetten är bokad spelas resan upp på en roterande jordglob: klotet
   zoomar ut från avresestaden, fordonet följer storcirkeln medan jorden
   vrider sig under det, och till sist zoomar det in mot målet. Under klotet
   löper en mätare mellan avresa och mål med kilometrarna som är kvar. Flyget
   ses uppifrån och vrids efter kursen; buss, tåg och färja är sidovyer som
   bara speglas när kursen går åt väster. Ett tryck hoppar över filmen.

   Ungefär var tredje resa händer dessutom något på vägen. Se _Händelser_
   nedan.

   | Sträcka | Vad som brukar gå |
   | --- | --- |
   | Stockholm–Göteborg | buss, tåg, flyg |
   | Stockholm–Helsingfors | färja, flyg (ingen räls runt Bottenviken) |
   | Stockholm–Berlin | buss, tåg, flyg |
   | Stockholm–London | bara flyg |
   | Stockholm–Peking | bara flyg |

   Tid är också en resurs eftersom boendet kostar varje dag, så det billigaste
   är sällan självklart bäst. Långa flyg från en stad utan interkontinental
   flygplats går via en hub och kostar en dag extra.
11. **Telefonkiosken.** Du måste ringa innan något händer: myntet ner i
   automaten, signaler i luren, och sedan svarar någon – eller ingen. Mamma
   svarar med en ljus mumlande röst och oroar sig, pappa med en mörk och
   suckar, och båda lånar ut pengar. Ibland är det upptaget, ibland svarar
   ingen, och ibland har du slagit fel och får en pizzeria i Neapel. Då är det
   bara att ringa igen. Första gången svarar alltid mamma – hon har väntat.
   Lånen läggs på skulden, som dras av från slutpoängen, och varje samtal ger
   mindre än det förra. Rösterna är syntetiska (`rostmamma`, `rostpappa` i
   `src/ui/audio.ts`) och replikerna står överst i `src/ui/app.ts`.
12. **Passet.** Under _Ryggsäck och pass_ ligger ett pass med tre sidor.

   Den första är personuppgiftssidan: hemstad, resenärstyp, dag på resan,
   städer, stämplar och flugna kilometer – och ditt **personbästa** ur
   resedagboken, med poäng och titel. Nederst löper en maskinläsbar rad som
   på ett riktigt pass. Sidan finns för att passet ska gå att räcka över till
   någon.

   På sidorna därefter sitter stämplarna tryckta i bläck, snett och lite
   huller om buller, med resdagen i kanten. Nitton finns att jaga: fyra
   kontinenter, tio i rad, perfekt skift, skuldfri, klimatbonus och så vidare. De som ännu
   inte tagits står i en kort lista under uppslaget, som en resplan. Varje
   stämpel är värd poäng på slutet.
13. **Ljud.** Varje station har dessutom en egen ljudbild som ligger och går så
   länge man står kvar: sorl i en hög hall, rullväskor och avlägsna jetmotorer
   på flygplatsen; bromsar, dörrsignaler och hjul över rälsskarvar på
   stationen; tryckluftsbromsar och dieselmotorer vid bussterminalen; vågor,
   vind, trutar och mistlur i hamnen. Ovanpå mattan går utrop i högtalaren –
   pling-plong och sedan ett meddelande man hör men inte förstår orden i,
   precis som på riktigt. Både tidpunkt, tonhöjd och längd lottas, så samma
   ljud kommer aldrig två gånger likadant. Ingen musik.

   Därtill ett trettiotal effekter (rätt och fel svar, lön, avresa, ankomst,
   metronom, trumslag, stämpel och alla arkadmoment) syntetiseras i
   webbläsaren, så inga ljudfiler behövs. Varje färdsätt har sitt eget
   avgångsljud, och i telefonkiosken babblar det redan i luren
   när man kliver in – rösterna är formantsyntes genom ett telefonfilter,
   alltså pladder utan ord. Högtalarknappen i statusraden
   stegar mellan avstängt, dämpat och fullt ljud; valet sparas.
14. **Tangentbord.** Svara med `1`–`4` eller `A`–`D`, gå vidare med `Enter`
   och backa till staden med `Esc`. Ett händelsekort svarar man på med `A`–`C`
   och kvitterar med `Enter`; `Esc` gör ingenting där, eftersom en fråga man
   ställts inför ska besvaras och inte kringgås. Balansmomentet styrs med
   piltangenterna och taktmomentet med mellanslag.
15. **Händelser.** Något kan hända på åtta olika sorters tillfällen: på vägen,
    på vandrarhemmet, på jobbet, vid sevärdheten, ute på gatorna, i butiken, i
    mötet med någon, och i väntan på en avgång. Två av dem har egna knappar på
    stadsskärmen – _Ut på stan_ och _Besök_ vid sevärdheten – och kostar en
    dag var, i utbyte mot att något garanterat händer. De andra sex slår till
    av sig själva när man ändå gör det man gör.

    **Varje händelse inträffar högst en gång per resa.** Att möta samma hund på
    samma gata två gånger får världen att krympa. Priset är att banken måste
    vara djup, och den är 113 händelser stor.

    De flesta händelser ställer en fråga med två eller tre svar, och svaret
    spelar roll: du hittar en plånbok på trottoaren och kan lämna in den,
    behålla pengarna eller leta rätt på ägaren. Vad valet leder till är inte
    givet – varje val har flera möjliga utfall som lottas, så att leta upp
    ägaren kan sluta med hittelön och kaffe eller med en bortkastad dag.

    Följderna är avsiktligt inte bara pengar. Ett utfall kan kosta eller ge
    dagar, höja eller sänka stadsbetyget, ge eller ta en souvenir, ge ett
    certifikat – eller ingenting alls utom en historia. Ungefär var femte
    händelse är helt kosmetisk: hunden som somnar på ditt knä på nattbussen,
    katten som bor i biljetthallen, skyfallet du väntar ut under ett portvalv
    tillsammans med sex främlingar och en cykel.

16. **Anseende.** Hederliga val bygger upp ett anseende och oärliga river ner
    det. Det syns i passet, öppnar och stänger vissa händelser, ger två egna
    stämplar åt var sitt håll, och räknas in i slutpoängen – så att det finns
    ett skäl att lämna in plånboken som inte är pengar.

17. **Vägen tillbaka.** Knappen _Till staden_ sitter i statusraden, som ligger
    fast i överkanten på varje skärm. Under ett arbetsskift finns den inte:
    där ligger pengarna på spel, och skiftet lämnar man genom att sjukanmäla
    sig.
18. **Börja om.** Knappen _Börja om_ i statusraden finns på varje skärm. Den
    frågar först, och visar vad som går förlorat, innan resan raderas.
19. **Kom hem.** Besök minst fem städer och återvänd till startstaden för att
    avsluta resan, få poäng och en titel.
20. **Resedagboken.** De tio bästa avslutade resorna sparas och visas på
    startskärmen, med poäng, titel, dagar, städer och träffsäkerhet. Varje rad
    visar också vilken stad du hade bäst koll på och vilken som avslöjade dig.
    Spelet räknar rätt och fel per stad, både på turistbyrån och på jobben.

    Dagboken ligger i webbläsaren, precis som sparfilen. Ingen server och
    ingen synk mellan enheter – två spelare på var sin telefon har var sin
    lista och får jämföra genom att visa varandra skärmen.

Går kassan under −1 500 är resan över och ambassaden skickar hem dig.

Spelet sparas automatiskt i webbläsarens `localStorage`, så du kan stänga
fliken och fortsätta senare. Vill du börja från början finns _Börja om_ i
statusraden, eller _Radera sparfil_ på startskärmen.

### Poäng

Slutpoängen väger samman kassa, ryggsäckens värde hemma, antal besökta städer,
hur många av världens åtta regioner du hunnit till, stämplarna i passet,
certifikat, träffsäkerhet på frågorna, ditt anseende och hur effektivt du reste
(städer per dag). Skulden dras av. Poängen ger också en titel, från _Hemvändare_ till
_Legendarisk ryggsäckare_.

## Innehåll

- 47 destinationer i 41 länder och alla åtta regioner, var och en med eget
  fotografi
- 80 yrken i tre löneklasser, vart och ett med egen frågeuppsättning
- 1 697 frågor uppdelade i två svårighetsgrader, varav 1 287 jobbfrågor
- 50 fotografier från Wikimedia Commons till bild- och bildvalsfrågorna
- 8 arkadmoment som avslutar arbetsskiften
- 19 stämplar att samla i passet
- 113 händelser med 137 val och 185 möjliga utfall, spridda över åtta
  tillfällen, var och en högst en gång per resa
- 9–15 nedvända brickor per stad, varav 1–4 döljer en händelse eller en fråga
- 47 myntfrågor, en per stad, alla med stadens eget foto
- 64 souvenirer med regional prissättning
- 40 valutor
- 4 stationsmiljöer med egen avgångstavla, egna ord och egen ljudmatta
- En atlas med uppslagssidor om alla 47 städer och 41 länder
- 41 länder med egna flyg-, tåg- och bussbolag, och 7 namngivna färjelinjer
- Ett trettiotal syntetiserade ljudeffekter (WebAudio) med volymknapp i
  statusraden

## Struktur

```
public/
  quiz/                    Ett foto per frågebild + ATTRIBUTION.md
  manifest.webmanifest     Gör spelet installerbart på hemskärmen
  sw.js                    Service worker för offline-spel (cachar även fotona)
  icon*.png, icon.svg      App- och favicon-ikoner
  cities/                  Ett foto per stad (Wikimedia Commons) + ATTRIBUTION.md
src/
  data/
    types.ts               Typer för städer, jobb, souvenirer och frågor
    cities.ts              Destinationer med koordinater, valuta, prisnivå och
                           eventuella lokala arbetsgivarnamn
    jobs.ts                Yrken, löneklasser och ämneskategorier
    souvenirs.ts           Handelsvaror med billiga och eftertraktade regioner
    currencies.ts          Växelkurser och formatering av belopp
    stamps.ts              Passets stämplar och villkoren för dem
    events.ts              Händelserna: texter, val och utfall. Ingen kod.
    climate.ts             Klimattyp och höjd per stad, för vädret
    headlines.ts           Två lokala tidningsrubriker per stad
    facts.ts               Atlasens uppslagsdata: huvudstad, språk, religion
                           och folkmängd per land, folkmängd per stad
    operators.ts           Flyg-, tåg- och bussbolag per land, med
                           flightkoder och landets tåghastighet
    transport.ts           Landregionernas grannskap, färjelinjer med fartyg
                           och turlista, avstånds-
                           tak och priser per färdsätt
    worldMap.ts            Genererad landmassa som SVG-path (Natural Earth)
    quizImages.ts          Frågornas fotografier: id, motiv och Commons-källa
    questions/
      cityQuestions.ts     Frågor till turistbyrån, per stad
      coinQuestions.ts     Myntfrågorna: en per stad, alltid med foto
      jobQuestions.ts      Jobbfrågor, egen uppsättning per yrke
  game/
    state.ts               Speltillstånd, sparning och laddning
    rules.ts               Avstånd, priser, löner, poäng och frågeurval
    weather.ts             Väder ur klimat, årstid och höjd; lokal tid ur
                           tidszonen. Kosmetiskt, påverkar inget.
    events.ts              Händelsemotorn: när något händer, vad som väljs ut,
                           och vad ett val leder till
    travel.ts              Vilka färdsätt som går mellan två städer, och
                           varför de andra inte gör det
    departures.ts          Avgångstavlornas innehåll: linjenummer, gate, spår,
                           status och restid. Presentation, inte speltid.
    difficulty.ts          Allt som skiljer Turist från Globetrotter
    highscores.ts          Resedagboken och statistiken över stadskunskap
  ui/
    app.ts                 Skärmar, spelloop och tangentbordsstyrning
    eventcard.ts           Händelsekortet med sina val och sitt utfall
    station.ts             Stationshallarna: siluetter i SVG, biljettvyn och
                           linjenätet härifrån
    board.ts               Den elektroniska avgångstavlan, som uppdaterar sig
                           cell för cell utan att ritas om
    atlas.ts               Kartskärmen: stillastående världskarta med reserutan,
                           och uppslagssidorna om stad och land
    map.ts                 Resesekvensen mellan två städer, spelad på globen
    globe.ts               Ortografisk jordglob: landmassan omprojicerad från
                           platt karta till klot, storcirklar och horisontklipp
    globepicker.ts         Startskärmens glob: snurra, zooma och välja stad
    minigames.ts           De åtta arkadmomenten
    dom.ts                 Små hjälpare för att bygga element
    audio.ts               Syntetiserade ljudeffekter och ljudstyrning
    icons.ts               Inline SVG-ikoner (högtalare, menyer)
  styles/main.css          All stilsättning
  sw-register.ts           Registrerar service workern i produktionsbygget
scripts/
  validate-data.mjs        Kontrollerar speldatan, körs vid varje bygge
  deploy-pages.mjs         Publicerar bygget till gh-pages-branchen
  fetch-city-photos.mjs    Hämtar stadsfoton från Wikimedia Commons
  fetch-quiz-images.mjs    Hämtar frågornas foton från Wikimedia Commons
  compress-quiz-images.py  Komprimerar frågefotona (Pillow)
  compress-city-photos.py  Komprimerar fotona (Pillow), körs av fetch-skriptet
```

### Att lägga till innehåll

Frågor skrivs med det **rätta svaret först** i `a`-listan; alternativen blandas
när frågan visas.

En **bildfråga** lägger till `bilder` med lika många id:n som `a`, i samma
ordning – blandningen håller ihop bild och etikett. En **bild till en vanlig
fråga** sätts med `bild`, och `stad:<stads-id>` återanvänder ett stadsfoto som
redan finns. En **reglagefråga** sätter `reglage` och har då bara ett svar i
`a`: det rätta, skrivet som det ska läsas.

```ts
{ q: 'Vilket år föll Berlinmuren? Dra reglaget till rätt år.',
  a: ['1989'],
  reglage: { artal: true, min: 1945, max: 2000, steg: 1, svar: 1989,
             tolerans: 1, liggande: true },
  d: 1 }
```

Nya foton läggs i `src/data/quizImages.ts` och hämtas med
`node scripts/fetch-quiz-images.mjs`, som också skriver
`public/quiz/ATTRIBUTION.md`. Ledningsbilden till en Wikipedia-artikel om en
krydda är ofta en botanisk plansch från 1800-talet, så växterna pekar på
namngivna Commons-filer i stället – en tecknad ingefära duger inte i en fråga
som går ut på att känna igen ingefära. Kom ihåg att lägga till bilden i
`public/sw.js`; valideringen kräver det. `d: 1` betyder att frågan används på båda svårighetsgraderna,
`d: 2` att den bara dyker upp på Globetrotter.

```ts
{
  q: 'Vilken flod rinner genom Kairo?',
  a: ['Nilen', 'Kongo', 'Niger', 'Eufrat'],
  d: 1,
  info: 'Visas som kuriosa efter att spelaren svarat.',
}
```

Valideringen letar också efter **nära-dubbletter inom ett jobb**: två frågor
med samma rätta svar och samma ämne, fast olika formulerade. Exakt lika
frågetext fångas av dubblettkontrollen, men "Vad kallas de japanska serierna?"
och "Vad kallas japanska tryckta serier?" slank igenom förut och kunde hamna i
samma skift.

Valideringen kräver också att varje jobb har minst **fyra lätta frågor mer än
skiftet är långt**. Med lika många lätta frågor som arbetsdagar får en Turist
exakt samma frågor varje gång, bara i ny ordning. Samtliga åttio yrken klarar
kravet i dag, med i snitt sexton frågor var, och regeln stoppar bygget om ett
nytt jobb läggs till med för tunn frågebank.

Kör `npm run validate` efter ändringar. Den kontrollerar bland annat att varje
stad har minst fem lätta frågor, att varje jobb har egna frågor och nog många
lätta för hela skiftet, att varje stad har minst ett jobb i löneklass 1 (så att
en spelare utan stadsbetyg alltid kan tjäna pengar), att inga frågor är
dubbletter någonstans i spelet, att varje jobbs arkadmoment är komplett – för
sorteringen att varje korg har egna föremål i `pool`, för träffmomentet att
`avoid` är ifyllt och inte överlappar `items` – och att varje stad har ett
foto i `public/cities/`.

Den kontrollerar också transportnätverket: att landregionernas grannskap är
symmetriskt, att färjelinjerna pekar på städer som finns, och att **varje stad går att nå
från varje annan stad genom nätverket**, med byten. Alla par behöver alltså
inte ha en direktförbindelse – Köping saknar flygplats – men en stad som inte
går att ta sig ifrån skulle låsa fast en spelare utan att något syns.

**Frågeformerna** kontrolleras var för sig: en reglagefråga ska ha exakt ett
svar i `a`, ett svar som ligger inom skalan, en steglängd och en tolerans som
inte täcker en fjärdedel av skalan. En bildfråga ska ha lika många bilder som
alternativ. Varje bild-id som en fråga hänvisar till måste finnas i manifestet,
ha en fil i `public/quiz/` och stå i service workerns lista.

**Händelserna** kontrolleras också: att inga två delar id, att varje händelse
hör till minst ett tillfälle och har antingen val eller en effekt (aldrig
båda), att ingen har fler än tre val eftersom tangenterna räcker till `A`–`C`,
att varje val har minst ett utfall, att souvenirer som delas ut finns, att
inga okända platshållare som `{stad}` står kvar oöversatta, och att varje
tillfälle har minst fem händelser att välja bland – annars ser en spelare
samma sak andra gången hen går ut på stan.

Sedan stationerna kom till kontrolleras också **trafikbolagen**: att varje
stads land finns i `data/operators.ts`, att en stad med fjärrtåg ligger i ett
land som har ett järnvägsbolag, att tåghastigheterna är rimliga och att inga
två länder delar flygbolagskod – annars blir flightnumren på tavlan tvetydiga.
Färjelinjerna måste ha rederi, fartygsnamn och minst en avgångstid inom dygnet,
eftersom hamnens tavla läser turlistan därifrån.

### Nya städer och foton

En ny stad behöver ett foto som heter `public/cities/<stads-id>.jpg`, annars
stoppar valideringen bygget. Fotona hämtas från Wikimedia Commons:

```bash
node scripts/fetch-city-photos.mjs
```

Lägg till staden i `CITY_ARTICLES` i skriptet först – antingen en
Wikipedia-artikel vars ledningsbild används, eller en specifik Commons-fil
(`file:`) om ledningsbilden är stående (bilderna beskärs till liggande format
vid visning). Skriptet komprimerar fotona via `compress-city-photos.py`
(kräver Python 3 med Pillow) och skriver om `public/cities/ATTRIBUTION.md`
med upphovsmän och licenser. Kom också ihåg att lägga till staden i
service workerns fotolista i `public/sw.js`, och att staden behöver ett land
med trafikbolag i `src/data/operators.ts` – valideringen stoppar bygget annars,
så att ingen station kan hamna med ett namnlöst reservbolag på tavlan.

Kartans landmassa är genererad från Natural Earths 110m-dataset (public domain)
och ligger färdig i `src/data/worldMap.ts`, så inga kartberoenden behövs vid
körning. Den används av både atlasen och globerna.

Banan är efterbehandlad två gånger för hand, båda gångerna mot artefakter i den
platta projektionen: två fullbreda ränder på ett par tiondels grads höjd är
bortplockade, och polygoner som korsar datumgränsen är brutna i två delbanor
vid hoppet. En equirektangulär karta kan inte visa att Tjukotka fortsätter på
andra sidan kanten, så utan brytningen drogs en rak linje tillbaka över hela
jorden – det var de streck man såg genom Norra ishavet.

En ny stad behöver också en rad i `CITY_POPULATION` och ett land i
`COUNTRY_FACTS` i `src/data/facts.ts`, annars stoppar valideringen bygget -
atlasen ska inte kunna visa en tom rad för den stad spelaren just rest till.

## Om förlagan

Det här är ett nyskrivet hyllningsspel. All text, alla frågor och all grafik är
egna; ingenting är hämtat från originalspelet.

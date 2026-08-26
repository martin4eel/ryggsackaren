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

1. **Välj svårighetsgrad.** Lägena delar mekanik, kartor och progression –
   det är kraven som skiljer. Allt som skiljer dem ligger samlat i
   `src/game/difficulty.ts`.

   | | Turist | Globetrotter |
   | --- | --- | --- |
   | Svarsalternativ | 3 | 4 |
   | Frågor | bara de lättare | hela banken |
   | Samtal till en lokalbo | 5 | 2 |
   | Arkadmomentens marginal | 20 % mer | 8 % mindre |
   | Certifikat vid | 65 % | 75 % |
   | Startkapital | 6 000 | 4 000 |
   | Boende | 20 % billigare | fullpris, men högre lön |

   _Fråga en lokalbo_ är livlinan i frågorna: den stryker hälften av de
   felaktiga alternativen, men lämnar alltid minst två kvar.
2. **Välj startstad.** Staden blir också ditt slutmål, och dess valuta är den
   som alla belopp visas i under resan. Varje stad visas med ett foto av sin
   sevärdhet, som ett vykort högst upp på stadsskärmen.
3. **Turistbyrån.** Svara på frågor om staden. Resultatet blir ett stadsbetyg
   (0–100) som avgör vilka jobb du får söka. Du kan göra om provet för att
   höja betyget, men varje besök kostar en dag.
4. **Tidningen.** Läs platsannonserna och ta ett skift. Varje fråga är en
   arbetsdag: rätt svar ger lön, och boendet dras oavsett. Frågorna är unika
   för varje yrke, så en bagare och en pizzabagare får aldrig samma frågor.
   Ett stämpelkort visar hur dagarna gått.
   - **Svarsserie.** Rätt svar på raken höjer lönemultiplikatorn upp till
     ×2. Ett felsvar nollställer den.
   - **Snabbhetsbonus.** Svarar du inom några sekunder får du ett påslag på
     dagslönen. Efter tolv sekunder ger den ingenting, så det lönar sig att
     kunna svaret, inte att chansa snabbt.
5. **Sista passet.** Varje skift avslutas med ett av åtta arkadmoment:
   sortera på löpande band, utföra order i rätt följd, upprepa en sekvens ur
   minnet, stoppa en mätare i rätt zon, räkna växel i huvudet, plocka rätt
   saker och låta resten vara, hålla balansen eller slå i takt. Det ger upp
   till tre dagslöner i bonus, och ett felfritt moment ett halvt dagsverke
   till. Klarar du 70 procent av skiftet totalt får du ett **certifikat**,
   som öppnar bättre betalda jobb i samma ämne i alla städer.
6. **Souvenirbutiken.** Köp där varan tillverkas och sälj där den är
   eftertraktad. Priserna varierar med region, prisnivå och dag.
7. **Resebyrån.** Välj destination på kartan eller i listan, som går att
   söka i. Vilka färdsätt som erbjuds beror på geografin, inte på en fast
   mall: buss och tåg kräver landförbindelse, färja kräver en linje och flyget
   når allt över 35 mil. Går ett färdsätt inte, står det utskrivet varför.

   Ungefär var tredje resa händer dessutom något på vägen – bagaget försvinner,
   flyget blir överbokat eller någon bjuder på taxin.

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
8. **Telefonkiosken.** Ringer du hem får du pengar, men skulden växer och dras
   av från slutpoängen. Varje samtal ger dessutom mindre än det förra.
9. **Passet.** Under _Ryggsäck och pass_ ligger ett pass med ett uppslag där
   stämplarna sitter tryckta i bläck, snett och lite huller om buller, med
   resdagen i kanten. Femton finns att jaga: fyra kontinenter, tio i rad,
   perfekt skift, skuldfri och så vidare. De som ännu inte tagits står i en
   kort lista under uppslaget, som en resplan. Varje stämpel är värd poäng
   på slutet.
10. **Ljud.** Ett tjugotal effekter (rätt och fel svar, lön, avresa, ankomst,
   metronom, trumslag, stämpel och alla arkadmoment) syntetiseras i
   webbläsaren, så inga ljudfiler behövs. Högtalarknappen i statusraden
   stegar mellan avstängt, dämpat och fullt ljud; valet sparas.
11. **Tangentbord.** Svara med `1`–`4` eller `A`–`D`, gå vidare med `Enter`
   och backa till staden med `Esc`. Balansmomentet styrs med piltangenterna
   och taktmomentet med mellanslag.
12. **Börja om.** Knappen _Börja om_ i statusraden finns på varje skärm. Den
    frågar först, och visar vad som går förlorat, innan resan raderas.
13. **Kom hem.** Besök minst fem städer och återvänd till startstaden för att
    avsluta resan, få poäng och en titel.
14. **Resedagboken.** De tio bästa avslutade resorna sparas och visas på
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
certifikat, träffsäkerhet på frågorna och hur effektivt du reste (städer per
dag). Skulden dras av. Poängen ger också en titel, från _Hemvändare_ till
_Legendarisk ryggsäckare_.

## Innehåll

- 45 destinationer i 41 länder och alla åtta regioner, var och en med eget
  fotografi
- 77 yrken i tre löneklasser, vart och ett med egen frågeuppsättning
- 986 frågor uppdelade i två svårighetsgrader, varav 616 jobbfrågor
- 8 arkadmoment som avslutar arbetsskiften
- 15 stämplar att samla i passet
- 15 resehändelser som kan slå till på vägen
- 64 souvenirer med regional prissättning
- 40 valutor
- Ett tjugotal syntetiserade ljudeffekter (WebAudio) med volymknapp i
  statusraden

## Struktur

```
public/
  manifest.webmanifest     Gör spelet installerbart på hemskärmen
  sw.js                    Service worker för offline-spel (cachar även fotona)
  icon*.png, icon.svg      App- och favicon-ikoner
  cities/                  Ett foto per stad (Wikimedia Commons) + ATTRIBUTION.md
src/
  data/
    types.ts               Typer för städer, jobb, souvenirer och frågor
    cities.ts              Destinationer med koordinater, valuta och prisnivå
    jobs.ts                Yrken, löneklasser och ämneskategorier
    souvenirs.ts           Handelsvaror med billiga och eftertraktade regioner
    currencies.ts          Växelkurser och formatering av belopp
    stamps.ts              Passets stämplar och villkoren för dem
    events.ts              Resehändelser som kan slå till mellan städerna
    transport.ts           Landregionernas grannskap, färjelinjer, avstånds-
                           tak och priser per färdsätt
    worldMap.ts            Genererad landmassa som SVG-path (Natural Earth)
    questions/
      cityQuestions.ts     Frågor till turistbyrån, per stad
      jobQuestions.ts      Jobbfrågor, egen uppsättning per yrke
  game/
    state.ts               Speltillstånd, sparning och laddning
    rules.ts               Avstånd, priser, löner, poäng och frågeurval
    travel.ts              Vilka färdsätt som går mellan två städer, och
                           varför de andra inte gör det
    difficulty.ts          Allt som skiljer Turist från Globetrotter
    highscores.ts          Resedagboken och statistiken över stadskunskap
  ui/
    app.ts                 Skärmar, spelloop och tangentbordsstyrning
    map.ts                 Världskartan: zoom, panorering och etikettplacering
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
  compress-city-photos.py  Komprimerar fotona (Pillow), körs av fetch-skriptet
```

### Att lägga till innehåll

Frågor skrivs med det **rätta svaret först** i `a`-listan; alternativen blandas
när frågan visas. `d: 1` betyder att frågan används på båda svårighetsgraderna,
`d: 2` att den bara dyker upp på Globetrotter.

```ts
{
  q: 'Vilken flod rinner genom Kairo?',
  a: ['Nilen', 'Kongo', 'Niger', 'Eufrat'],
  d: 1,
  info: 'Visas som kuriosa efter att spelaren svarat.',
}
```

Kör `npm run validate` efter ändringar. Den kontrollerar bland annat att varje
stad har minst fem lätta frågor, att varje jobb har egna frågor och nog många
lätta för hela skiftet, att varje stad har minst ett jobb i löneklass 1 (så att
en spelare utan stadsbetyg alltid kan tjäna pengar), att inga frågor är
dubbletter någonstans i spelet, att varje jobbs arkadmoment är komplett – för
sorteringen att varje korg har egna föremål i `pool`, för träffmomentet att
`avoid` är ifyllt och inte överlappar `items` – och att varje stad har ett
foto i `public/cities/`.

Den kontrollerar också transportnätverket: att landregionernas grannskap är
symmetriskt, att färjelinjerna pekar på städer som finns, och att **alla 1 980
stadspar har minst ett resealternativ i båda svårighetsgraderna**. Det sista är
det viktigaste – ett par utan rutt skulle låsa fast en spelare utan att något
syns i gränssnittet.

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
service workerns fotolista i `public/sw.js`.

Kartans landmassa är genererad från Natural Earths 110m-dataset (public domain)
och ligger färdig i `src/data/worldMap.ts`, så inga kartberoenden behövs vid
körning.

## Om förlagan

Det här är ett nyskrivet hyllningsspel. All text, alla frågor och all grafik är
egna; ingenting är hämtat från originalspelet.

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

1. **Välj svårighetsgrad.** _Turist_ ger lättare frågor, tre svarsalternativ,
   billigare boende och mer startkapital. _Globetrotter_ ger svårare frågor,
   fyra alternativ, högre löner och tuffare ekonomi.
2. **Välj startstad.** Staden blir också ditt slutmål, och dess valuta är den
   som alla belopp visas i under resan.
3. **Turistbyrån.** Svara på frågor om staden. Resultatet blir ett stadsbetyg
   (0–100) som avgör vilka jobb du får söka. Du kan göra om provet för att
   höja betyget, men varje besök kostar en dag.
4. **Tidningen.** Läs platsannonserna och ta ett skift. Varje fråga är en
   arbetsdag: rätt svar ger lön, och boendet dras oavsett. Frågorna är unika
   för varje yrke, så en bagare och en pizzabagare får aldrig samma frågor.
   Ett stämpelkort visar hur dagarna gått.
5. **Sista passet.** Varje skift avslutas med ett arkadmoment: sortera på
   löpande band, träffa rätt reglage, upprepa en sekvens ur minnet eller
   stoppa en mätare i rätt zon. Det ger upp till tre dagslöner i bonus och
   räknas in när certifikatet avgörs. Klarar du 70 procent av skiftet totalt
   får du ett **certifikat**, som öppnar bättre betalda jobb i samma ämne i
   alla städer.
6. **Souvenirbutiken.** Köp där varan tillverkas och sälj där den är
   eftertraktad. Priserna varierar med region, prisnivå och dag.
7. **Resebyrån.** Välj destination på kartan eller i listan. Varje sträcka har
   tre biljetter: billigt och långsamt, mellanting, eller dyrt och snabbt.
   Tid är också en resurs eftersom boendet kostar varje dag.
8. **Telefonkiosken.** Ringer du hem får du pengar, men skulden växer och dras
   av från slutpoängen. Varje samtal ger dessutom mindre än det förra.
9. **Börja om.** Knappen _Börja om_ i statusraden finns på varje skärm. Den
   frågar först, och visar vad som går förlorat, innan resan raderas.
10. **Kom hem.** Besök minst fem städer och återvänd till startstaden för att
   avsluta resan och få poäng.

Går kassan under −1 500 är resan över och ambassaden skickar hem dig.

Spelet sparas automatiskt i webbläsarens `localStorage`, så du kan stänga
fliken och fortsätta senare. Vill du börja från början finns _Börja om_ i
statusraden, eller _Radera sparfil_ på startskärmen.

### Poäng

Slutpoängen väger samman kassa, ryggsäckens värde hemma, antal besökta städer,
certifikat, träffsäkerhet på frågorna och hur effektivt du reste (städer per
dag). Skulden dras av.

## Innehåll

- 24 destinationer på sex kontinenter
- 64 yrken i tre löneklasser, vart och ett med egen frågeuppsättning
- 714 frågor uppdelade i två svårighetsgrader, varav 512 jobbfrågor
- 4 arkadmoment som avslutar arbetsskiften
- 41 souvenirer med regional prissättning
- 24 valutor

## Struktur

```
public/
  manifest.webmanifest     Gör spelet installerbart på hemskärmen
  sw.js                    Service worker för offline-spel
  icon*.png, icon.svg      App- och favicon-ikoner
src/
  data/
    types.ts               Typer för städer, jobb, souvenirer och frågor
    cities.ts              Destinationer med koordinater, valuta och prisnivå
    jobs.ts                Yrken, löneklasser och ämneskategorier
    souvenirs.ts           Handelsvaror med billiga och eftertraktade regioner
    currencies.ts          Växelkurser och formatering av belopp
    worldMap.ts            Genererad landmassa som SVG-path (Natural Earth)
    questions/
      cityQuestions.ts     Frågor till turistbyrån, per stad
      jobQuestions.ts      Jobbfrågor, egen uppsättning per yrke
  game/
    state.ts               Speltillstånd, sparning och laddning
    rules.ts               Avstånd, priser, löner, poäng och frågeurval
  ui/
    app.ts                 Skärmar och spelloop
    map.ts                 Världskartan: zoom, panorering och etikettplacering
    minigames.ts           De fyra arkadmomenten
    dom.ts                 Små hjälpare för att bygga element
  styles/main.css          All stilsättning
  sw-register.ts           Registrerar service workern i produktionsbygget
scripts/
  validate-data.mjs        Kontrollerar speldatan, körs vid varje bygge
  deploy-pages.mjs         Publicerar bygget till gh-pages-branchen
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
dubbletter någonstans i spelet, och att varje jobbs arkadmoment är komplett.

Kartans landmassa är genererad från Natural Earths 110m-dataset (public domain)
och ligger färdig i `src/data/worldMap.ts`, så inga kartberoenden behövs vid
körning.

## Om förlagan

Det här är ett nyskrivet hyllningsspel. All text, alla frågor och all grafik är
egna; ingenting är hämtat från originalspelet.
